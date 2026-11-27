import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => store.has(key) ? store.get(key) : null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
};

const {
  guardarCadastroPendente,
  lerCadastroPendente,
  marcarConfirmacaoSolicitada,
  finalizarCadastroPendente,
} = await import("../src/features/aves-perdidas/services/cadastroPendenteAvePerdida.js");

const KEY = "avespet:cadastro-ave-perdida:v1";
const ID = "123e4567-e89b-12d3-a456-426614174000";
const email = "tutor@example.com";
const consentimento = {
  aceito: true,
  versao: "2026-11-27",
  registradoEm: "2026-11-27T13:00:00.000Z",
};

function novoAnuncio(extra = {}) {
  return {
    id: ID,
    nomeAve: "Mel",
    especie: "Ring Neck",
    foto: "https://storage.example/mel.jpg",
    consentimentoPublicacao: consentimento,
    senha: "nao-deve-ser-salva",
    access_token: "nao-deve-ser-salvo",
    ...extra,
  };
}

function limpar() {
  store.clear();
}

test("preserva autorização de publicação no rascunho e descarta credenciais", () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio());
  const item = lerCadastroPendente();

  assert.equal(item.anuncio.consentimentoPublicacao.aceito, true);
  assert.equal(item.anuncio.consentimentoPublicacao.versao, "2026-11-27");
  assert.equal("senha" in item.anuncio, false);
  assert.equal("access_token" in item.anuncio, false);
});

test("mantém a autorização ao marcar confirmação de e-mail", () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio());
  marcarConfirmacaoSolicitada(email);

  const item = lerCadastroPendente();
  assert.equal(item.confirmacaoSolicitada, true);
  assert.deepEqual(item.anuncio.consentimentoPublicacao, consentimento);
});

test("não finaliza rascunho sem autorização válida", async () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio({ consentimentoPublicacao: undefined }));
  let chamadas = 0;

  const resultado = await finalizarCadastroPendente(
    { id: "user-1", email },
    async () => { chamadas += 1; },
  );

  assert.equal(resultado.status, "consentimento_ausente");
  assert.equal(chamadas, 0);
  assert.ok(lerCadastroPendente(), "rascunho deve permanecer disponível para correção");
});

test("não entrega o rascunho a uma conta com outro e-mail", async () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio());
  let chamadas = 0;

  const resultado = await finalizarCadastroPendente(
    { id: "user-2", email: "outra@example.com" },
    async () => { chamadas += 1; },
  );

  assert.equal(resultado.status, "outra_conta");
  assert.equal(chamadas, 0);
  assert.ok(lerCadastroPendente());
});

test("envia anúncio uma vez para a conta correta e remove o rascunho", async () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio());
  let payload;

  const resultado = await finalizarCadastroPendente(
    { id: "user-1", email: " TUTOR@example.com " },
    async (userId, anuncio) => { payload = { userId, anuncio }; },
  );

  assert.equal(resultado.status, "salvo");
  assert.equal(resultado.id, ID);
  assert.equal(payload.userId, "user-1");
  assert.deepEqual(payload.anuncio.consentimentoPublicacao, consentimento);
  assert.equal(lerCadastroPendente(), null);
});

test("mantém rascunho quando a gravação falha para permitir nova tentativa", async () => {
  limpar();
  guardarCadastroPendente(email, novoAnuncio());

  await assert.rejects(
    finalizarCadastroPendente(
      { id: "user-1", email },
      async () => { throw new Error("falha simulada"); },
    ),
    /falha simulada/,
  );

  assert.ok(lerCadastroPendente());
});
