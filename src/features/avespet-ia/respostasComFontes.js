import { conteudosAprovados } from "./bibliotecaConhecimento.js";
import { classificarRisco, respostaEducativa } from "./motorEducativo.js";

export function normalizarTexto(texto = "") {
  return String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function buscarGuias(pergunta, especie, catalogo) {
  const texto = normalizarTexto(pergunta);
  if (!texto) return [];
  const palavras = texto.split(/[^a-z0-9]+/).filter(p => p.length >= 4);
  const base = conteudosAprovados(catalogo);
  return base
    .filter(guia => guia.especies?.includes(especie))
    .map(guia => {
      const termos = [...(guia.temas || []), guia.titulo || ""].map(normalizarTexto);
      const pontuacao = palavras.filter(p => termos.some(t => t.split(/[^a-z0-9]+/).includes(p))).length;
      return { guia, pontuacao };
    })
    .filter(item => item.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, 3)
    .map(item => item.guia);
}

const AVISO = "O Avespet IA oferece informações educativas. Não realiza diagnóstico nem substitui atendimento veterinário especializado em aves.";

export function responderComBiblioteca(perfil, pergunta, catalogo) {
  const texto = String(pergunta || "").trim().slice(0, 2000);
  if (!texto) return { tipo: "informativo", titulo: "Escreva sua pergunta", mensagem: "Descreva o que deseja saber sobre sua ave.", aviso: AVISO, fontes: [] };
  const risco = classificarRisco(texto);
  if (risco !== "educativo") return { ...respostaEducativa(perfil, texto), fontes: [] };
  const guias = buscarGuias(texto, perfil.especie, catalogo);
  if (guias.length === 0) return {
    tipo: "informativo",
    titulo: "Ainda não tenho um guia aprovado para essa pergunta",
    mensagem: "Estamos preparando uma biblioteca de conhecimento revisada. Para orientações sobre cuidados de saúde, alimentação manual ou dúvidas específicas, procure um veterinário de aves. Não vou inventar uma resposta.",
    aviso: AVISO,
    fontes: [],
  };
  const guia = guias[0];
  return {
    tipo: "educativo",
    titulo: guia.titulo,
    mensagem: guia.resposta,
    aviso: AVISO,
    fontes: guia.fontes.map(f => ({ titulo: f.titulo, url: f.url, consultadoEm: f.consultadoEm })),
    versao: guia.versao,
  };
}
