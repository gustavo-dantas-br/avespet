import test from "node:test";
import assert from "node:assert/strict";
import { demonstrativoPlano, calcularReembolsoSimulado } from "../src/features/impulsionamento/financeiro.js";
import { PLANOS_IMPULSIONAMENTO } from "../src/features/impulsionamento/planos.js";

const regional = PLANOS_IMPULSIONAMENTO.find((p) => p.id === "regional");

test("separa verba de mídia, gestão e gasto já realizado", () => {
  const r = demonstrativoPlano(regional, { gastoMidiaCentavos: 6000, taxasCentavos: 800, custosOperacionaisCentavos: 1200 });
  assert.equal(r.precoCentavos, 22990);
  assert.equal(r.midiaCentavos, 14000);
  assert.equal(r.gestaoCentavos, 8990);
  assert.equal(r.midiaRestanteCentavos, 8000);
  assert.equal(r.contribuicaoCentavos, 14990);
});

test("não permite gasto de anúncios maior que a verba contratada", () => {
  assert.throws(() => demonstrativoPlano(regional, { gastoMidiaCentavos: 14001 }), RangeError);
});

test("rejeita centavos fracionários e custos negativos", () => {
  assert.throws(() => demonstrativoPlano(regional, { taxasCentavos: -1 }), RangeError);
  assert.throws(() => demonstrativoPlano(regional, { taxasCentavos: 100.5 }), RangeError);
});

test("reembolso hipotético não pode ultrapassar saldo disponível", () => {
  assert.deepEqual(calcularReembolsoSimulado({ totalPagoCentavos: 22990, valorSolicitadoCentavos: 4990, valorJaReembolsadoCentavos: 1000 }), {
    valorSolicitadoCentavos: 4990, saldoAposReembolsoCentavos: 17000, precisaRevisaoHumana: true,
  });
  assert.throws(() => calcularReembolsoSimulado({ totalPagoCentavos: 10000, valorSolicitadoCentavos: 9001, valorJaReembolsadoCentavos: 1000 }), RangeError);
});

test("plano gratuito não gera margem artificial", () => {
  const r = demonstrativoPlano(PLANOS_IMPULSIONAMENTO[0]);
  assert.equal(r.precoCentavos, 0);
  assert.equal(r.contribuicaoCentavos, 0);
});
