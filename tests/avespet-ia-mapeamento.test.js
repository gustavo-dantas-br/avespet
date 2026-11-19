import test from "node:test";
import assert from "node:assert/strict";
import { validarVinculo, paraBanco, doBanco } from "../src/features/avespet-ia/diarioMapeamento.js";

const userId="123e4567-e89b-42d3-a456-426614174000";
const aveId="123e4567-e89b-42d3-a456-426614174001";
test("aceita IDs UUID para o vínculo",()=>assert.equal(validarVinculo({userId,aveId}),null));
test("rejeita vínculo sem ave",()=>assert.match(validarVinculo({userId,aveId:""}),/ave cadastrada/));
test("rejeita user_id inválido",()=>assert.match(validarVinculo({userId:"outro",aveId}),/Usuário inválido/));
test("converte os quatro estados de alimentação",()=>{
  for(const [origem,esperado] of [["não informado","nao_informada"],["alimentação assistida","assistida"],["experimentando sólidos","transicao"],["alimentação independente","independente"]]){
    const row=paraBanco({data:"2026-11-19",peso:"120.5",alimentacao:origem,observacoes:"  ok  "});
    assert.equal(row.fase_alimentar,esperado);
    assert.equal(row.peso_gramas,120.5);
    assert.equal(row.observacoes,"ok");
    assert.equal(doBanco({...row,id:"a"}).alimentacao,origem);
  }
});
test("não transforma peso vazio em zero",()=>{
  const row=paraBanco({data:"2026-11-19",peso:"",alimentacao:"não informado",observacoes:"Ativa"});
  assert.equal(row.peso_gramas,null);
  assert.equal(doBanco({...row,id:"a"}).peso,"");
});
test("rejeita fases alimentares desconhecidas",()=>assert.throws(()=>paraBanco({data:"2026-11-19",peso:"50",alimentacao:"invasiva",observacoes:""}),/inválida/));
