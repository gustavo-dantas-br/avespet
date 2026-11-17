import test from "node:test";
import assert from "node:assert/strict";
import {
  genotipoSerieDaAve,
  cruzarSerieCor,
  dosagemFatorDaAve,
  cruzarDosagemFator,
  cruzarAparenciasPadraoRingNeck,
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

// O motor de baixo nível não transforma silêncio em confirmação genética.
// Os padrões simplificados ficam exclusivamente na calculadora rápida.
test("Cobalto e Azul sem dado de Violet continuam desconhecidos no motor técnico", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Cobalto" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor"), null);
});

test("Violeta sem dose informada é desconhecido tecnicamente; DF explícito é respeitado", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Violeta" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({
    corMutacao: "Violeta",
    fatoresGeneticos: { violetFactor: "DF" },
  }, "violetFactor"), 2);
});

test("Violeta SF × Azul simples prevê 50% Violet SF e 50% Azul no modo padrão", () => {
  const resultado = cruzarAparenciasPadraoRingNeck(
    { corMutacao: "Violeta", fatoresGeneticos: {} },
    { corBase: "Blue (Azul)", fatoresGeneticos: {} },
  );
  assert.deepEqual(
    resultado.resultados.map((r) => [r.nome, r.percentual]),
    [["Blue (Azul)", 50], ["Violet SF (Violeta)", 50]],
  );
});

test("Violeta DF × Azul simples prevê 100% Violet SF no modo padrão", () => {
  const resultado = cruzarAparenciasPadraoRingNeck(
    { corMutacao: "Violeta", fatoresGeneticos: { violetFactor: "DF" } },
    { corBase: "Blue (Azul)", fatoresGeneticos: {} },
  );
  assert.deepEqual(
    resultado.resultados.map((r) => [r.nome, r.percentual]),
    [["Violet SF (Violeta)", 100]],
  );
});

test("Violeta SF × Azul simples calcula mesmo sem informar Dark explicitamente", () => {
  const resultado = cruzarAparenciasPadraoRingNeck(
    { corMutacao: "Violeta", fatoresGeneticos: { darkFactor: "", violetFactor: "SF" } },
    { corBase: "Blue (Azul)", fatoresGeneticos: { darkFactor: "" } },
  );
  assert.deepEqual(resultado.resultados.map((r) => r.percentual), [50, 50]);
});

test("Violeta mantém o fator separado e usa a cor-base informada para a série", () => {
  assert.deepEqual(
    genotipoSerieDaAve({ corMutacao: "Violeta", corBase: "Blue (Azul)" }),
    ["B", "B"],
  );
  assert.deepEqual(
    genotipoSerieDaAve({ corMutacao: "Violeta", corBase: "Green (Verde)" }),
    null,
  );
});
