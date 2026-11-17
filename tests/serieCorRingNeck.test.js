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

import { cruzarAparenciasPadraoRingNeck } from "../src/features/genetica/utils/serieCorRingNeck.js";

const aveSimples = (cor) => ({
  corMutacao: cor === "Violeta" || cor === "Cobalto" || cor === "Mauve" ? cor : "",
  corBase: cor === "Violeta" || cor === "Cobalto" || cor === "Mauve" ? "" : cor,
  fatoresGeneticos: { darkFactor: "", violetFactor: "" },
  mutacoesVisuais: [],
  portadores: [],
  especie: "Ring Neck",
});

test("Violeta simples x Azul simples: 50% Violet SF e 50% Blue", () => {
  const r = cruzarAparenciasPadraoRingNeck(aveSimples("Violeta"), aveSimples("Blue (Azul)"));
  assert.equal(r.tipo, "completo");
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]),
    [["Blue (Azul)", 50], ["Violet SF (Violeta)", 50]]);
});

test("Violeta DF x Azul simples: 100% Violet SF", () => {
  const pai = { ...aveSimples("Violeta"), fatoresGeneticos: { violetFactor: "DF" } };
  const r = cruzarAparenciasPadraoRingNeck(pai, aveSimples("Blue (Azul)"));
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]), [["Violet SF (Violeta)", 100]]);
});

test("Azul simples x Azul simples produz 100% azul", () => {
  const r = cruzarAparenciasPadraoRingNeck(aveSimples("Blue (Azul)"), aveSimples("Blue (Azul)"));
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]), [["Blue (Azul)", 100]]);
});

test("Verde padrão x Azul padrão produz 100% verde portador de azul", () => {
  const r = cruzarAparenciasPadraoRingNeck(aveSimples("Green (Verde)"), aveSimples("Blue (Azul)"));
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]), [["Verde portador de azul", 100]]);
});

test("Turquesa padrão x Azul padrão produz 100% azul-turquesa", () => {
  const r = cruzarAparenciasPadraoRingNeck(aveSimples("Turquoise (Turquesa)"), aveSimples("Blue (Azul)"));
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]), [["Azul-turquesa", 100]]);
});

test("Cobalto x Azul apresenta Dark SF em metade e Azul na outra metade", () => {
  const r = cruzarAparenciasPadraoRingNeck(aveSimples("Cobalto"), aveSimples("Blue (Azul)"));
  assert.deepEqual(r.resultados.map((x) => [x.nome, x.percentual]), [["Blue (Azul)", 50], ["Cobalt (Cobalto)", 50]]);
});

test("não usa preset com informações de portadores, mutações extras ou série conflitante", () => {
  const azul = aveSimples("Blue (Azul)");
  assert.equal(cruzarAparenciasPadraoRingNeck({ ...aveSimples("Violeta"), portadores: ["Ino"] }, azul), null);
  assert.equal(cruzarAparenciasPadraoRingNeck({ ...aveSimples("Violeta"), corBase: "Green (Verde)" }, azul), null);
  assert.equal(cruzarAparenciasPadraoRingNeck({ ...aveSimples("Violeta"), fatoresGeneticos: { violetFactor: "NONE" } }, azul), null);
});

import { prepararResultadoPadraoRingNeck } from "../src/features/genetica/utils/serieCorRingNeck.js";

test("UI recebe discriminador padrao para Violeta SF x Azul sem tela branca", () => {
  const pai = { ...aveSimples("Violeta"), nome: "Pai" };
  const mae = { ...aveSimples("Blue (Azul)"), nome: "Mãe" };
  const resultado = prepararResultadoPadraoRingNeck(pai, mae);
  assert.equal(resultado.tipo, "padrao");
  assert.equal(resultado.modoCalculo, "completo");
  assert.equal(resultado.cruzamento, "Pai × Mãe");
  assert.deepEqual(resultado.resultados.map((r) => [r.nome, r.percentual]), [
    ["Blue (Azul)", 50], ["Violet SF (Violeta)", 50],
  ]);
  assert.equal(resultado.premissas.length > 0, true);
});

test("resultado parcial também mantém discriminador renderizável", () => {
  const resultado = prepararResultadoPadraoRingNeck(aveSimples("Cobalto"), aveSimples("Green (Verde)"));
  assert.equal(resultado.tipo, "padrao");
  assert.equal(resultado.modoCalculo, "parcial");
  assert.ok(Array.isArray(resultado.serie));
  assert.ok(Array.isArray(resultado.premissas));
});

test("combinação não coberta não finge ser resultado padrão", () => {
  const resultado = prepararResultadoPadraoRingNeck(
    { ...aveSimples("Violeta"), portadores: ["Cleartail (Cauda clara)"] },
    aveSimples("Blue (Azul)")
  );
  assert.equal(resultado, null);
});
