import test from "node:test";
import assert from "node:assert/strict";
import { cruzarSerieCor, fenotipoSerieCor, normalizarGenotipoSerie } from "../src/features/genetica/utils/serieCorRingNeck.js";

test("classifica os seis genotipos da serie de cor", () => {
  assert.equal(fenotipoSerieCor(["G", "G"]).visual, "Green");
  assert.equal(fenotipoSerieCor(["G", "T"]).portador, "Turquoise");
  assert.equal(fenotipoSerieCor(["G", "B"]).portador, "Blue");
  assert.equal(fenotipoSerieCor(["T", "T"]).visual, "Turquoise");
  assert.equal(fenotipoSerieCor(["T", "B"]).visual, "Turquoise Blue");
  assert.equal(fenotipoSerieCor(["B", "B"]).visual, "Blue");
});

test("normaliza a ordem dos alelos e rejeita genotipos invalidos", () => {
  assert.deepEqual(normalizarGenotipoSerie(["B", "G"]), ["G", "B"]);
  assert.throws(() => normalizarGenotipoSerie(["G"]));
  assert.throws(() => normalizarGenotipoSerie(["G", "X"]));
});

test("G/G x B/B produz 100% G/B (verde split azul)", () => {
  assert.deepEqual(cruzarSerieCor(["G", "G"], ["B", "B"]).map((r) => [r.genotipo, r.percentual]), [["G/B", 100]]);
});

test("T/B x T/B produz 25% T/T, 50% T/B e 25% B/B", () => {
  const resultado = cruzarSerieCor(["T", "B"], ["T", "B"]);
  assert.deepEqual(resultado.map((r) => [r.genotipo, r.percentual]), [["T/B", 50], ["B/B", 25], ["T/T", 25]]);
});

test("G/T x B/B produz 50% G/B e 50% T/B", () => {
  const resultado = cruzarSerieCor(["G", "T"], ["B", "B"]);
  assert.deepEqual(resultado.map((r) => [r.genotipo, r.percentual]), [["G/B", 50], ["T/B", 50]]);
});

import { genotipoSerieDaAve, dosagemFator, cruzarDosagemFator, dosagemFatorDaAve } from "../src/features/genetica/utils/serieCorRingNeck.js";

test("nao presume genotipo verde quando portadores nao foram informados", () => {
  assert.equal(genotipoSerieDaAve({ corBase: "Green (Verde)", portadores: [] }), null);
  assert.deepEqual(genotipoSerieDaAve({ corBase: "Green (Verde)", portadores: ["Blue"] }), ["G", "B"]);
  assert.deepEqual(genotipoSerieDaAve({ corBase: "Green (Verde)", portadores: ["Turquoise"] }), ["G", "T"]);
});

test("converte dosagem explicita e preserva informacao desconhecida", () => {
  assert.equal(dosagemFator(""), null);
  assert.equal(dosagemFator("NONE"), 0);
  assert.equal(dosagemFator("SF"), 1);
  assert.equal(dosagemFator("DF"), 2);
});

test("cruza fatores escuros/violetas por dosagem mendeliana", () => {
  assert.deepEqual(cruzarDosagemFator(1, 1, "Dark Factor").map((r) => [r.dosagem, r.percentual]), [[0, 25], [1, 50], [2, 25]]);
  assert.deepEqual(cruzarDosagemFator(2, 0, "Violet Factor").map((r) => [r.dosagem, r.percentual]), [[1, 100]]);
  assert.deepEqual(cruzarDosagemFator(null, 0, "Dark Factor"), []);
});

test("não presume SF ou DF apenas pela aparência Violeta", () => {
  assert.equal(dosagemFatorDaAve({ corMutacao: "Violeta" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({ corMutacao: "Violeta", fatoresGeneticos: { violetFactor: "SF" } }, "violetFactor"), 1);
  assert.equal(dosagemFatorDaAve({ corMutacao: "Violeta", fatoresGeneticos: { violetFactor: "DF" } }, "violetFactor"), 2);
});

test("todas as combinações válidas da série de cor somam 100%", () => {
  const genotipos = [["G","G"], ["G","T"], ["G","B"], ["T","T"], ["T","B"], ["B","B"]];
  for (const pai of genotipos) {
    for (const mae of genotipos) {
      const resultado = cruzarSerieCor(pai, mae);
      assert.equal(resultado.reduce((total, item) => total + item.percentual, 0), 100);
    }
  }
});

test("Azul sem informação adicional não prova ausência do fator Violeta", () => {
  assert.equal(dosagemFatorDaAve({ corBase: "Blue (Azul)" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({ corMutacao: "Azul" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({ corBase: "Green (Verde)" }, "violetFactor"), null);
  assert.equal(dosagemFatorDaAve({ corBase: "Turquoise (Turquesa)" }, "violetFactor"), null);
});

test("somente NONE explícito comprova ausência do fator Violeta", () => {
  assert.equal(dosagemFatorDaAve({
    corBase: "Blue (Azul)", fatoresGeneticos: { violetFactor: "NONE" },
  }, "violetFactor"), 0);
  assert.deepEqual(cruzarDosagemFator(1, 0, "Violet Factor").map((item) => [item.dosagem, item.percentual]), [
    [0, 50], [1, 50],
  ]);
});

test("Violeta visível com NONE contraditório permanece indeterminado", () => {
  assert.equal(dosagemFatorDaAve({
    corMutacao: "Violeta", fatoresGeneticos: { violetFactor: "NONE" },
  }, "violetFactor"), null);
});
