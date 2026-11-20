import test from "node:test";
import assert from "node:assert/strict";
import {alcanceEstimado,formatarAlcance} from "../src/features/campanhas/config/alcance.js";
test("alcance estima os três pacotes de referência",()=>{assert.deepEqual(alcanceEstimado("bairro",11990),{min:800,max:2900});assert.deepEqual(alcanceEstimado("cidade",22990),{min:2000,max:6800});assert.deepEqual(alcanceEstimado("regional",39990),{min:3900,max:13100});});
test("não atribui alcance pago a destaque, pacote desconhecido ou preço alterado",()=>{assert.equal(alcanceEstimado("destaque",2990),null);assert.equal(alcanceEstimado("cidade",24990),null);assert.equal(alcanceEstimado("x",0),null);});
test("formata alcance brasileiro",()=>assert.equal(formatarAlcance({min:800,max:2900}),"800 a 2.900"));
