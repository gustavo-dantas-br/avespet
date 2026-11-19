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
