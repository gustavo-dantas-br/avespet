import test from "node:test";
import assert from "node:assert/strict";
import { lerNascimento, idadeDaAve, sexoVisual } from "../src/features/plantel/utils/resumoAve.js";

const hoje = new Date(2026, 10, 19);
test("nascimento só com ano não inventa data precisa", () => {
  assert.equal(lerNascimento("2024").precisao, "ano");
  assert.equal(idadeDaAve("2024", hoje), "Nascida em 2024 · idade aproximada");
});
test("mês e ano mostram idade aproximada", () => {
  assert.equal(idadeDaAve("Ago/2024", hoje), "Aprox. 2 anos e 3 meses");
  assert.equal(idadeDaAve("07/2024", hoje), "Aprox. 2 anos e 4 meses");
});
test("data completa mostra idade calculada", () => {
  assert.equal(idadeDaAve("12/07/2024", hoje), "2 anos e 4 meses");
  assert.equal(idadeDaAve("2024-07-12", hoje), "2 anos e 4 meses");
});
test("desconhecida, inválida ou futura não inventa idade", () => {
  assert.equal(idadeDaAve("", hoje), null);
  assert.equal(idadeDaAve("31/02/2024", hoje), null);
  assert.equal(idadeDaAve("2028", hoje), null);
});
test("sexo aceita variantes antigas do cadastro", () => {
  assert.equal(sexoVisual("Macho").rotulo, "Macho");
  assert.equal(sexoVisual("Femea").rotulo, "Fêmea");
  assert.equal(sexoVisual("Fêmea").rotulo, "Fêmea");
  assert.equal(sexoVisual("Indefinido").rotulo, "Não informado");
});
