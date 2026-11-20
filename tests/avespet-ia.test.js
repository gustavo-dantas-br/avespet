import test from "node:test";
import assert from "node:assert/strict";
import { validarPerfil, classificarRisco, respostaEducativa } from "../src/features/avespet-ia/motorEducativo.js";

const base = { nivel: "iniciante", especie: "Ring Neck", fase: "papa", idadeDias: "45" };
test("aceita cadastro básico de filhote", () => assert.equal(validarPerfil(base), null));
test("rejeita idade negativa", () => assert.ok(validarPerfil({ ...base, idadeDias: "-2" })));
test("rejeita espécie inválida", () => assert.ok(validarPerfil({ ...base, especie: "Não cadastrada" })));
test("classifica dificuldade respiratória como urgente", () => assert.equal(classificarRisco("Tem dificuldade para respirar"), "urgente"));
test("classifica alterações do papo como atenção", () => assert.equal(classificarRisco("O papo não esvazia"), "atencao"));
test("não recomenda alimentar só porque papo está vazio", () => {
  const texto = respostaEducativa(base, "papo vazio posso dar papa?").mensagem;
  assert.match(texto, /não autorizam uma nova alimentação/);
});
test("não autoriza desmame por idade", () => {
  const texto = respostaEducativa({ ...base, idadeDias: "60", fase: "transicao" }, "Posso parar a papa?").mensagem;
  assert.match(texto, /Não suspenda a papa com base somente na idade/);
});
test("encaminha situações urgentes", () => {
  const texto = respostaEducativa(base, "alimento saiu pelo nariz");
  assert.equal(texto.tipo, "urgente");
  assert.match(texto.mensagem, /veterinário/);
});
