import test from "node:test";
import assert from "node:assert/strict";
import { validarRegistro, dataHojeLocal, historicoPeso } from "../src/features/avespet-ia/diarioValidacao.js";

const exemplo = { data: "2026-11-18", peso: "125.5", observacoes: "" };
const hoje = "2026-11-19";

test("aceita data e peso válidos", () => assert.equal(validarRegistro(exemplo, hoje), null));
test("aceita observação sem peso", () => assert.equal(validarRegistro({...exemplo, peso: "", observacoes: "Ativo"}, hoje), null));
test("rejeita registro vazio", () => assert.match(validarRegistro({...exemplo, peso: "", observacoes: " "}, hoje), /peso ou uma observação/));
test("rejeita peso negativo", () => assert.match(validarRegistro({...exemplo, peso: "-1"}, hoje), /peso válido/));
test("rejeita peso superior ao limite", () => assert.match(validarRegistro({...exemplo, peso: "10001"}, hoje), /peso válido/));
test("rejeita observação longa", () => assert.match(validarRegistro({...exemplo, observacoes: "a".repeat(501)}, hoje), /500/));
test("rejeita data futura", () => assert.match(validarRegistro({...exemplo, data: "2026-11-20"}, hoje), /futura/));
test("rejeita data inexistente (fevereiro)", () => assert.match(validarRegistro({...exemplo, data: "2026-02-30"}, hoje), /válida/));
test("rejeita ano anterior a 2000", () => assert.match(validarRegistro({...exemplo, data: "1999-12-31"}, hoje), /2000/));
test("data local não depende de conversão UTC", () => assert.equal(dataHojeLocal(new Date(2026, 10, 19, 0, 5)), "2026-11-19"));
test("ordena pesagens cronologicamente e ignora registros sem peso", () => assert.deepEqual(historicoPeso([
  {data:"2026-11-19",peso:"130"},
  {data:"2026-11-17",peso:""},
  {data:"2026-11-18",peso:"125.5"}
]), [{data:"2026-11-18",peso:125.5},{data:"2026-11-19",peso:130}]));
