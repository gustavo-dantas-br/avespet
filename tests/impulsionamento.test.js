import test from "node:test";
import assert from "node:assert/strict";
import { PLANOS_IMPULSIONAMENTO, STATUS_PEDIDO, validarPlano } from "../src/features/impulsionamento/planos.js";

test("catálogo tem cinco planos com IDs únicos e valores seguros", () => {
  assert.equal(PLANOS_IMPULSIONAMENTO.length, 5);
  assert.equal(new Set(PLANOS_IMPULSIONAMENTO.map((p) => p.id)).size, 5);
  for (const plano of PLANOS_IMPULSIONAMENTO) assert.equal(validarPlano(plano), true);
});

test("gratuito é realmente gratuito e plano interno não contém verba Meta", () => {
  const gratuito = PLANOS_IMPULSIONAMENTO.find((p) => p.id === "gratuito");
  const destaque = PLANOS_IMPULSIONAMENTO.find((p) => p.id === "destaque");
  assert.equal(gratuito.precoCentavos, 0);
  assert.equal(gratuito.midiaCentavos, 0);
  assert.equal(destaque.midiaCentavos, 0);
});

test("planos Meta possuem duração e verba de mídia", () => {
  const pagosMeta = PLANOS_IMPULSIONAMENTO.filter((p) => p.categoria === "meta");
  assert.equal(pagosMeta.length, 3);
  assert.ok(pagosMeta.every((p) => p.dias > 0 && p.midiaCentavos > 0 && p.raioKm > 0));
});

test("validação rejeita custo de mídia maior que preço ou valores fracionários", () => {
  assert.equal(validarPlano({ precoCentavos: 1000, midiaCentavos: 1100 }), false);
  assert.equal(validarPlano({ precoCentavos: -100, midiaCentavos: 0 }), false);
  assert.equal(validarPlano({ precoCentavos: 100.5, midiaCentavos: 0 }), false);
});

test("estados de pedido incluem rascunho e reembolso", () => {
  assert.ok(STATUS_PEDIDO.includes("rascunho"));
  assert.ok(STATUS_PEDIDO.includes("reembolsado"));
});
