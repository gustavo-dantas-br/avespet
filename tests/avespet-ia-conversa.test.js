import test from "node:test";
import assert from "node:assert/strict";
import { contextoInicial, conversarLocal } from "../src/features/avespet-ia/conversaLocal.js";
const perfil = { especie:"Ring Neck", fase:"incerta", idadeDias:"" };
test("lembra que usuário tem filhote e descobre a espécie em outra mensagem", () => {
  const primeira = conversarLocal(perfil, "tenho um filhote", contextoInicial());
  assert.match(primeira.resposta.mensagem, /qual é a espécie/i);
  const segunda = conversarLocal(perfil, "é um ring neck", primeira.contexto);
  assert.equal(segunda.contexto.especie, "Ring Neck");
  assert.equal(segunda.contexto.filhote, true);
  assert.match(segunda.resposta.mensagem, /idade/i);
});
test("lembra idade informada depois de saber que é filhote", () => {
  const a = conversarLocal(perfil, "tenho um filhote", contextoInicial());
  const b = conversarLocal(perfil, "é um ring neck", a.contexto);
  const c = conversarLocal(perfil, "tem 30 dias", b.contexto);
  assert.equal(c.contexto.idadeDias, 30);
  assert.match(c.resposta.mensagem, /30 dias/i);
});
test("prioriza sinais urgentes mesmo com contexto prévio", () => {
  const a = conversarLocal(perfil, "tenho um filhote", contextoInicial());
  const b = conversarLocal(perfil, "minha ave tem dificuldade para respirar", a.contexto);
  assert.equal(b.resposta.tipo, "urgente");
});
test("não inventa dose de papa na conversa", () => {
  const a = conversarLocal(perfil, "tenho um filhote", contextoInicial());
  const b = conversarLocal(perfil, "é um ring neck", a.contexto);
  const c = conversarLocal(perfil, "quantos ml de papa devo dar?", b.contexto);
  assert.doesNotMatch(c.resposta.mensagem, /\b\d+\s*(?:ml|mL)\b/);
});
test("não usa espécie padrão do formulário como fato narrado", () => {
  const a = conversarLocal(perfil, "tenho um filhote", contextoInicial());
  assert.equal(a.contexto.especie, "");
});

test("entende 'só papinha' depois de filhote, espécie e idade", () => {
  const a = conversarLocal(perfil, "tenho um filhote ring neck", contextoInicial());
  const b = conversarLocal(perfil, "50 dias", a.contexto);
  const c = conversarLocal(perfil, "Só papinha", b.contexto);
  assert.equal(c.contexto.etapa, "alimentacao_assistida");
  assert.match(c.resposta.mensagem, /Ring Neck/);
  assert.match(c.resposta.mensagem, /50 dias/);
  assert.match(c.resposta.mensagem, /alimentos sólidos/);
  assert.equal(c.resposta.tipo, "conversa");
});

test("conversa natural mantém intenção de alimentação no filhote de 10 dias", () => {
  const a = conversarLocal(perfil, "Como alimentar um filhote de 10 dias", contextoInicial());
  assert.equal(a.contexto.idadeDias, 10);
  assert.equal(a.contexto.filhote, true);
  assert.match(a.resposta.mensagem, /como alimentar/i);
  assert.doesNotMatch(a.resposta.mensagem, /quantidade de papa:|\\b[0-9]+\\s*ml\\b/i);
  const b = conversarLocal(perfil, "Na papa", a.contexto);
  assert.equal(b.contexto.etapa, "alimentacao_assistida");
  assert.match(b.resposta.mensagem, /espécie/i);
  const c = conversarLocal(perfil, "Um ring neck", b.contexto);
  assert.equal(c.contexto.especie, "Ring Neck");
  assert.match(c.resposta.mensagem, /10 dias/i);
  assert.match(c.resposta.mensagem, /alimentação/i);
  assert.doesNotMatch(c.resposta.mensagem, /guia aprovado|modelo de IA depende/i);
});
