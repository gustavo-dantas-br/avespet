import test from "node:test";
import assert from "node:assert/strict";
import { PERFIL_VAZIO, idadeEmDias, idadeLegivel, perfilDaAve, contextoDoPerfil, salvarPerfilLocal, lerPerfilLocal, lerPerfilPorAve, validarEdicao } from "../src/features/avespet-ia/perfilAve.js";
test("idade calculada por calendário sem aceitar datas inválidas",()=>{assert.equal(idadeEmDias("2026-11-01",new Date(2026,10,21)),20);assert.equal(idadeEmDias("2026-02-30"),null);assert.equal(idadeEmDias("2999-01-01"),null);});
test("perfil de ave usa dados do plantel sem presumir estágio",()=>{const p=perfilDaAve({nome:"Luna",especie:"Ring Neck",sexo:"Fêmea",corMutacao:"Azul",nascimento:"2023-01-01"});assert.equal(p.nome,"Luna");assert.equal(p.mutacao,"Azul");assert.equal(p.etapaVida,"");assert.equal(contextoDoPerfil(p).filhote,false);});
test("gravação local separada por conta e recuperação sem misturar aves",()=>{const m=new Map();const s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};salvarPerfilLocal("a",{...PERFIL_VAZIO,especie:"Calopsita",nome:"Pingo"},"ave-1",s);assert.equal(lerPerfilLocal("a",s).perfil.nome,"Pingo");assert.equal(lerPerfilLocal("b",s),null);});
test("perfil vazio não presume ave e mantém sessão geral",()=>{assert.equal(contextoDoPerfil(PERFIL_VAZIO).especie,"");assert.equal(contextoDoPerfil(PERFIL_VAZIO).idadeDias,null);assert.ok(validarEdicao({...PERFIL_VAZIO,idadeDias:"-1"}));});

test("ao alternar aves restaura os dados educativos de cada cadastro",()=>{const m=new Map();const s={getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};salvarPerfilLocal("a",{...PERFIL_VAZIO,especie:"Calopsita",fase:"papa"},"ave-1",s);salvarPerfilLocal("a",{...PERFIL_VAZIO,especie:"Ring Neck",fase:"desmamada"},"ave-2",s);assert.equal(lerPerfilPorAve("a","ave-1",s).fase,"papa");assert.equal(lerPerfilPorAve("a","ave-2",s).fase,"desmamada");assert.equal(lerPerfilLocal("a",s).aveId,"ave-2");assert.deepEqual(lerPerfilPorAve("b","ave-1",s),{});});

test("plantel com nascimento no formato brasileiro preenche data e idade",()=>{const p=perfilDaAve({nome:"Ave teste",especie:"Ring Neck",sexo:"Macho",corMutacao:"Azul",nascimento:"10/06/2023"});assert.equal(p.nascimento,"2023-06-10");assert.equal(idadeLegivel(p,new Date(2026,10,22)),"3 anos e 5 meses");assert.ok(contextoDoPerfil(p).idadeDias>1000);assert.equal(idadeEmDias("31/02/2023"),null);});

import { conversarLocal } from "../src/features/avespet-ia/conversaLocal.js";
test("consulta idade, nascimento, sexo e mutação da ave selecionada sem Gemini",()=>{
 const p=perfilDaAve({nome:"Ave teste",especie:"Ring Neck",sexo:"Macho",corMutacao:"Azul",nascimento:"10/06/2023"});
 const c=contextoDoPerfil(p);
 for(const [q,esperado] of [["Qual é a idade?",String(c.idadeDias)],["Quando nasceu?","10/06/2023"],["Qual é o sexo?","Macho"],["Qual é a mutação?","Azul"]]){
  const r=conversarLocal(p,q,c);assert.equal(r.localSomente,true);assert.ok(r.resposta.mensagem.includes(esperado));
 }
});
