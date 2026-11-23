import test from "node:test";
import assert from "node:assert/strict";
import {diaLocal,addDiasISO,eventosReproducao,eventosTarefas,diasDoMes} from "../src/features/agenda/utils/agenda.js";
test("respeita datas de calendário e fevereiro",()=>{assert.equal(addDiasISO("2027-02-25",4),"2027-03-01");assert.equal(diasDoMes("2028-02").length,29);assert.equal(diaLocal(new Date(2026,10,23,12)),"2026-11-23");});
test("só projeta ovos ativos e usa dias cadastrados",()=>{const posturas=[{id:"p1",casalLabel:"Léo x Luna",diasIncubacao:24,ovos:[{n:1,dataPostura:"2026-11-01",status:"Fertil"},{n:2,dataPostura:"2026-11-02",status:"Nasceu"},{n:3,dataPostura:"2026-11-03",status:"Infertil"}]}];const e=eventosReproducao(posturas);assert.equal(e.length,1);assert.equal(e[0].dia,"2026-11-25");assert.match(e[0].titulo,/Léo x Luna/);});
test("tarefas mantêm categoria e estado",()=>{const e=eventosTarefas([{id:"a",dia:"2026-11-23",titulo:"Conferir material",categoria:"manejo",concluida:true}]);assert.equal(e[0].concluida,true);assert.equal(e[0].tipo,"manejo");});
