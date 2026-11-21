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

test("não repete perguntas quando usuário diz tenho ring neck de 30 dias", () => {
  const a = conversarLocal(perfil, "Olá tudo bem", contextoInicial());
  const b = conversarLocal(perfil, "Tenho ring neck de 30 dias", a.contexto);
  assert.equal(b.contexto.especie, "Ring Neck");
  assert.equal(b.contexto.idadeDias, 30);
  assert.equal(b.contexto.filhote, true);
  assert.match(b.resposta.mensagem, /30 dias/);
  assert.doesNotMatch(b.resposta.mensagem, /qual é a espécie|filhote ou adulto/i);
  const c = conversarLocal(perfil, "Ring neck", b.contexto);
  assert.match(c.resposta.mensagem, /30 dias/);
  assert.doesNotMatch(c.resposta.mensagem, /filhote ou adulto/i);
  const d = conversarLocal(perfil, "30 Dias", c.contexto);
  assert.equal(d.contexto.idadeDias, 30);
  assert.match(d.resposta.mensagem, /30 dias/);
  assert.doesNotMatch(d.resposta.mensagem, /guia aprovado/i);
});

test("perguntas sugeridas recebem respostas educativas úteis mesmo sem Gemini", () => {
  for (const [pergunta, assunto] of [
    ["Como acompanhar o desenvolvimento?", /diário de desenvolvimento/i],
    ["Como organizar o ambiente da minha ave?", /ventilado/i],
    ["Quando procurar um veterinário de aves?", /avaliações preventivas/i],
  ]) {
    const r = conversarLocal(perfil, pergunta, contextoInicial());
    assert.match(r.resposta.mensagem, assunto);
    assert.doesNotMatch(r.resposta.mensagem, /guia aprovado|modelo de IA depende|estou acompanhando nossa conversa/i);
  }
});
test("recusa alimentar de Ring Neck exige aviso veterinário, não mensagem genérica", () => {
  for (const pergunta of ["meu ring neck nao quer comer", "meu ring neck não quer comer", "minha ave não come"]) {
    const r = conversarLocal(perfil, pergunta, contextoInicial());
    assert.equal(r.resposta.tipo, "atencao");
    assert.match(r.resposta.mensagem, /veterinári|avaliação profissional/i);
  }
});

test("apresentação longa reconhece Ring Neck, 30 dias e papinha sem resposta genérica", () => {
  const resposta = conversarLocal(perfil, "prazer sou o gustavo, tenho um ring neck de 30 dias ele esta na papinha porem eu nao entendo muito", contextoInicial());
  assert.equal(resposta.contexto.especie, "Ring Neck");
  assert.equal(resposta.contexto.idadeDias, 30);
  assert.equal(resposta.contexto.filhote, true);
  assert.equal(resposta.contexto.etapa, "alimentacao_assistida");
  assert.match(resposta.resposta.mensagem, /Ring Neck/);
  assert.match(resposta.resposta.mensagem, /30 dias/);
  assert.match(resposta.resposta.mensagem, /papinha/i);
  assert.doesNotMatch(resposta.resposta.mensagem, /Ainda não tenho informação técnica revisada/);
});

test("cumprimentos não presumem filhotes nem usam cota", () => {
 for (const msg of ["ola", "Olá!", "Olá, tudo bem?", "Boa tarde", "Obrigado"]) {
  const r = conversarLocal(perfil, msg, contextoInicial());
  assert.equal(r.localSomente, true);
  assert.equal(r.contexto.especie, "");
  assert.equal(r.contexto.idadeDias, null);
  assert.doesNotMatch(r.resposta.mensagem, /filhote|papa|peso/i);
 }
});
test("tremor investiga fase e preserva alertas", () => {
 const r = conversarLocal(perfil, "meu ring neck se treme", contextoInicial());
 assert.equal(r.resposta.tipo, "atencao");
 assert.equal(r.localSomente, true);
 assert.match(r.resposta.mensagem, /filhote ou adulto/);
 assert.match(r.resposta.mensagem, /imediatamente/);
});
test("tremor com idade conhecida não repete fase", () => {
 const a = conversarLocal(perfil, "Tenho ring neck de 30 dias", contextoInicial());
 const b = conversarLocal(perfil, "Ele está tremendo", a.contexto);
 assert.equal(b.contexto.idadeDias, 30);
 assert.doesNotMatch(b.resposta.mensagem, /filhote ou adulto/i);
});
test("tremor com dificuldade respiratória é urgente", () => {
 assert.equal(conversarLocal(perfil, "Meu ring neck treme e tem dificuldade para respirar", contextoInicial()).resposta.tipo,"urgente");
});

test("apresentação de casal de 2023 não carrega idade ou fase de filhote anterior", () => {
 const a = conversarLocal(perfil, "Tenho ring neck de 30 dias", contextoInicial());
 const b = conversarLocal(perfil, "tenho um casal macho violeta e femea azul eles saoo 2023", a.contexto);
 assert.equal(b.contexto.assunto, "casal");
 assert.equal(b.contexto.filhote, false);
 assert.equal(b.contexto.idadeDias, null);
 assert.equal(b.contexto.casal.macho, "violeta");
 assert.equal(b.contexto.casal.femea, "azul");
 assert.equal(b.contexto.casal.anoNascimento, 2023);
 assert.equal(b.localSomente, true);
 assert.match(b.resposta.mensagem, /reprodução/);
 assert.doesNotMatch(b.resposta.mensagem, /papinha|desmame|30 dias/);
 const c = conversarLocal(perfil, "quais filhotes podem nascer?", b.contexto);
 assert.equal(c.contexto.filhote, false);
 assert.equal(c.contexto.assunto, "casal");
});
