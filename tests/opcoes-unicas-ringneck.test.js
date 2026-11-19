import test from "node:test";
import assert from "node:assert/strict";
import { CATALOGO_MUTACOES_RING_NECK } from "../src/features/genetica/data/catalogoRingNeck.js";
import { chaveAparenciaRingNeck, deduplicarMutacoesRingNeck, removerAparenciasRepetidasRingNeck, removerOpcoesRepetidasPorId } from "../src/features/genetica/data/opcoesUnicasRingNeck.js";
import { CORES_RAPIDAS_RING_NECK } from "../src/features/genetica/utils/previsaoSimplesRingNeck.js";

test("nomes populares e técnicos de Azul compartilham a mesma chave", () => {
  assert.equal(chaveAparenciaRingNeck("Blue (Azul)"), "blue");
  assert.equal(chaveAparenciaRingNeck("Azul (Blue)"), "blue");
});
test("Lutino, Albino, Cremino e Ino não voltam à lista de outras mutações", () => {
  const lista = removerAparenciasRepetidasRingNeck([
    { nome: "Azul" }, { nome: "Blue (Azul)" }, { nome: "Lutino" },
    { nome: "Albino" }, { nome: "Ino (Lutino / Albino conforme a serie)" },
    { nome: "Cremino" }, { nome: "Cinnamon (Canela)" },
  ]);
  assert.deepEqual(lista.map((i) => i.nome), ["Cinnamon (Canela)"]);
});
test("catálogo e registro de usuário não duplicam a mutação", () => {
  const lista = removerAparenciasRepetidasRingNeck([
    ...CATALOGO_MUTACOES_RING_NECK,
    { nome: "Cinnamon (Canela)", id: "usuario" },
    { nome: "Canela (Cinnamon)", id: "outro" },
  ]);
  assert.equal(lista.filter((i) => chaveAparenciaRingNeck(i.nome) === "cinnamon").length, 1);
});
test("combinações próprias não são removidas como cores básicas", () => {
  const lista = removerAparenciasRepetidasRingNeck([
    { nome: "Azul Canela" }, { nome: "Violeta Canela" },
    { nome: "Cobalto Turquesa" },
  ]);
  assert.equal(lista.length, 3);
});
test("calculadora não repete ids mesmo se a origem repetir opções", () => {
  assert.deepEqual(removerOpcoesRepetidasPorId([{id:"blue"},{id:"blue"},{id:"lutino"}]).map(x=>x.id), ["blue","lutino"]);
  assert.equal(new Set(CORES_RAPIDAS_RING_NECK.map(x => x.id)).size, CORES_RAPIDAS_RING_NECK.length);
});

test("Ino continua disponível em portadores sem repetir na cor principal", () => {
  const fontes = [{ nome: "Ino (Lutino / Albino conforme a serie)" }, { nome: "Cinnamon (Canela)" }];
  assert.ok(deduplicarMutacoesRingNeck(fontes).some(x => chaveAparenciaRingNeck(x.nome) === "ino"));
  assert.ok(!removerAparenciasRepetidasRingNeck(fontes).some(x => chaveAparenciaRingNeck(x.nome) === "ino"));
});
