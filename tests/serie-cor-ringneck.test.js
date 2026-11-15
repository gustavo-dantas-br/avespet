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

test("Violet Factor não é presumido pela aparência Cobalto", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Cobalto" }, "violetFactor"), null);
});
