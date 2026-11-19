import test from "node:test";
import assert from "node:assert/strict";
import { CONTEUDOS_IA, conteudosAprovados } from "../src/features/avespet-ia/bibliotecaConhecimento.js";
import { buscarGuias, responderComBiblioteca } from "../src/features/avespet-ia/respostasComFontes.js";

const perfil = { especie: "Ring Neck", fase: "incerta", idadeDias: "45" };
const guia = {
  id: "teste", versao: 1, titulo: "Ambiente adequado", especies: ["Ring Neck"],
  temas: ["ambiente", "viveiro"], status: "aprovado", risco: "geral",
  resposta: "Conteúdo editorial fictício para teste de software.",
  fontes: [{ titulo: "Fonte fictícia", url: "https://example.org/source", consultadoEm: "2026-11-19" }],
  revisao: { editorial: "Editor de teste", veterinaria: null, aprovadoEm: "2026-11-19" },
};
test("nenhum conteúdo do catálogo inicial está aprovado", () => assert.equal(conteudosAprovados(CONTEUDOS_IA).length, 0));
test("não usa conteúdo em revisão como resposta", () => {
  const resposta = responderComBiblioteca(perfil, "Como melhorar o ambiente?");
  assert.match(resposta.mensagem, /não vou inventar uma resposta/i);
  assert.deepEqual(resposta.fontes, []);
});
test("guia aprovado com fonte pode responder", () => {
  const resposta = responderComBiblioteca(perfil, "Como melhorar o ambiente?", [guia]);
  assert.equal(resposta.mensagem, guia.resposta);
  assert.deepEqual(resposta.fontes, guia.fontes);
});
test("guia de saúde exige revisão veterinária", () => {
  const clinico = {...guia, risco: "requer_revisao_veterinaria" };
  assert.equal(conteudosAprovados([clinico]).length, 0);
  assert.equal(conteudosAprovados([{...clinico, revisao:{...clinico.revisao, veterinaria:"Veterinário revisor"}}]).length,1);
});
test("não aceita documento sem fonte HTTPS", () => assert.equal(conteudosAprovados([{...guia, fontes:[{url:"http://example.org"}]}]).length, 0));
test("não usa guia de outra espécie", () => assert.equal(buscarGuias("ambiente", "Calopsita", [guia]).length, 0));
test("encaminha relato urgente sem buscar guia", () => {
  const resposta = responderComBiblioteca(perfil, "Tem dificuldade para respirar", [guia]);
  assert.equal(resposta.tipo,"urgente");
  assert.deepEqual(resposta.fontes,[]);
});
test("não fabrica fonte para pergunta sem resultado", () => {
  const resposta = responderComBiblioteca(perfil, "Qual é a previsão do tempo?", [guia]);
  assert.deepEqual(resposta.fontes,[]);
});

test("saudação simples recebe acolhimento e não erro de falta de guia", () => {
  for (const texto of ["Oi", "Olá tudo bem?", "Bom dia!", "Ola tudo bem", "E aí?"]) {
    const resposta = responderComBiblioteca(perfil, texto);
    assert.equal(resposta.tipo, "conversa", texto);
    assert.match(resposta.mensagem, /Avespet|ave/i);
    assert.deepEqual(resposta.fontes, []);
  }
});
test("agradecimento e perguntas sobre o assistente são respondidos", () => {
  for (const texto of ["Obrigado!", "Quem é você?", "Como funciona?"]) {
    assert.equal(responderComBiblioteca(perfil, texto).tipo, "conversa");
  }
});
test("saudação misturada com sintoma não desvia triagem", () => {
  assert.equal(responderComBiblioteca(perfil, "Oi, minha ave tem dificuldade para respirar").tipo, "urgente");
});
test("texto técnico com cumprimento não recebe resposta social genérica", () => {
  assert.notEqual(responderComBiblioteca(perfil, "Olá, como dar papa a um filhote?").tipo, "conversa");
});
