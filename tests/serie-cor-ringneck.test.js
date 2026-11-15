import test from "node:test";
import assert from "node:assert/strict";
import {
  genotipoSerieDaAve,
  cruzarSerieCor,
  dosagemFatorDaAve,
  cruzarDosagemFator,
} from "../src/features/genetica/utils/serieCorRingNeck.js";

test("Cobalto é reconhecido como série azul", () => {
  assert.deepEqual(genotipoSerieDaAve({ corMutacao: "Cobalto" }), ["B", "B"]);
});

test("Azul × Cobalto mantém 100% da série azul", () => {
  const pai = genotipoSerieDaAve({ corMutacao: "Cobalto" });
  const mae = genotipoSerieDaAve({ corMutacao: "Azul" });
  assert.deepEqual(cruzarSerieCor(pai, mae).map((r) => [r.nome, r.percentual]), [["Azul", 100]]);
});

test("Cobalto × Azul prevê 50% Cobalto e 50% Azul", () => {
  const pai = dosagemFatorDaAve({ corMutacao: "Cobalto" }, "darkFactor");
  const mae = dosagemFatorDaAve({ corMutacao: "Azul" }, "darkFactor");
  assert.equal(pai, 1);
  assert.equal(mae, 0);
  const resultado = cruzarDosagemFator(pai, mae, "Dark Factor");
  assert.deepEqual(resultado.map((r) => [r.dosagem, r.percentual]), [[0, 50], [1, 50]]);
});

test("Cobalto × Cobalto prevê 25% Azul, 50% Cobalto e 25% Mauve", () => {
  const pai = dosagemFatorDaAve({ corMutacao: "Cobalto" }, "darkFactor");
  const mae = dosagemFatorDaAve({ corMutacao: "Cobalto" }, "darkFactor");
  const resultado = cruzarDosagemFator(pai, mae, "Dark Factor");
  assert.deepEqual(resultado.map((r) => [r.dosagem, r.percentual]), [[0, 25], [1, 50], [2, 25]]);
});

test("informação genética explícita tem prioridade sobre inferência visual", () => {
  assert.equal(dosagemFatorDaAve({
    corMutacao: "Cobalto",
    fatoresGeneticos: { darkFactor: "NONE" },
  }, "darkFactor"), 0);
});

test("Cobalto sem indicação de violeta é considerado sem Violet Factor", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Cobalto" }, "violetFactor"), 0);
});

test("Violeta sem dosagem informada assume SF; DF explícito é respeitado", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Violeta" }, "violetFactor"), 1);
  assert.equal(dosagemFatorDaAve({
    corMutacao: "Violeta",
    fatoresGeneticos: { violetFactor: "DF" },
  }, "violetFactor"), 2);
});

test("ave azul sem indicação de violeta é considerada sem Violet Factor", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor"), 0);
});

test("Violeta SF x Azul sem Violet prevê 50% SF e 50% sem fator", () => {
  const pai = dosagemFatorDaAve({ corMutacao: "Violeta" }, "violetFactor");
  const mae = dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor");
  assert.deepEqual(
    cruzarDosagemFator(pai, mae, "Violet Factor").map((r) => [r.dosagem, r.percentual]),
    [[0, 50], [1, 50]],
  );
});

test("Violeta DF x Azul sem Violet transmite 100% Violet SF", () => {
  const pai = dosagemFatorDaAve({
    corMutacao: "Violeta",
    fatoresGeneticos: { violetFactor: "DF" },
  }, "violetFactor");
  const mae = dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor");
  assert.deepEqual(
    cruzarDosagemFator(pai, mae, "Violet Factor").map((r) => [r.dosagem, r.percentual]),
    [[1, 100]],
  );
});

test("Violeta SF × Azul mantém a previsão de Violet mesmo com Dark desconhecido", () => {
  const pai = dosagemFatorDaAve({ corMutacao: "Violeta" }, "violetFactor");
  const mae = dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor");
  assert.equal(pai, 1);
  assert.equal(mae, 0);
  assert.deepEqual(
    cruzarDosagemFator(pai, mae, "Violet Factor").map((r) => [r.dosagem, r.percentual]),
    [[0, 50], [1, 50]],
  );
});
