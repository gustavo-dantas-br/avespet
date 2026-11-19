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

// Conversa social simples não depende de artigos técnicos.
// Somente frases curtas, isoladas e reconhecidas entram neste fluxo;
// perguntas de manejo ou sintomas continuam passando pela triagem de risco e pelos guias aprovados.
export function responderInteracaoSocial(texto = "") {
  const limpo = normalizarTexto(texto).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const respostas = [
    {
      expressao: /^(oi|ola|opa|e ai|bom dia|boa tarde|boa noite)( tudo bem| como vai| tudo certo| tudo bom)?$/,
      titulo: "Olá! Que bom ter você por aqui 🦜",
      mensagem: "Tudo bem por aqui! Sou o Avespet IA, seu assistente educativo. Você pode me contar qual ave tem, registrar o desenvolvimento dela ou perguntar sobre cuidados gerais. Em assuntos técnicos, consulto somente materiais aprovados.",
    },
    {
      expressao: /^(tudo bem|tudo bom|como vai|como voce esta|como esta)$/,
      titulo: "Tudo bem por aqui! 🦜",
      mensagem: "Obrigado por perguntar! E com você e sua ave, tudo bem? Posso ajudar a conhecer as funcionalidades do Avespet ou consultar conteúdos educativos já aprovados.",
    },
    {
      expressao: /^(obrigado|obrigada|valeu|muito obrigado|muito obrigada|agradecido|agradecida)$/,
      titulo: "Por nada!",
      mensagem: "Conte comigo para organizar informações sobre suas aves. Se precisar de orientação veterinária, procure um profissional especializado.",
    },
    {
      expressao: /^(quem e voce|o que voce faz|como funciona|me ajuda|preciso de ajuda)$/,
      titulo: "Eu sou o Avespet IA!",
      mensagem: "Posso ajudar com o cadastro inicial da sua ave, com o Diário de Desenvolvimento e com a busca de conteúdos educativos revisados. Ainda não sou uma IA generativa de conversa livre, então aviso quando não tenho uma resposta aprovada.",
    },
  ];
  const encontrada = respostas.find((item) => item.expressao.test(limpo));
  if (!encontrada) return null;
  return { tipo: "conversa", titulo: encontrada.titulo, mensagem: encontrada.mensagem, aviso: "", fontes: [] };
}

export function responderComBiblioteca(perfil, pergunta, catalogo) {
  const texto = String(pergunta || "").trim().slice(0, 2000);
  if (!texto) return { tipo: "informativo", titulo: "Escreva sua pergunta", mensagem: "Descreva o que deseja saber sobre sua ave.", aviso: AVISO, fontes: [] };
  const risco = classificarRisco(texto);
  if (risco !== "educativo") return { ...respostaEducativa(perfil, texto), fontes: [] };
  const social = responderInteracaoSocial(texto);
  if (social) return social;
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
