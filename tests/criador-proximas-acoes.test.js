import test from "node:test";
import assert from "node:assert/strict";
import {buildCreatorActions} from "../src/features/dashboard/utils/proximasAcoes.js";
test("onboarding guides new breeders to first bird",()=>{const a=buildCreatorActions();assert.equal(a[0].tab,"form");assert.equal(a[0].id,"first-bird");});
test("real pending tasks are prioritized without inventing data",()=>{const a=buildCreatorActions({aves:[{id:"1",synced:false,sexado:false,status:"No plantel"}],rep:{atrasados:1,previstos7:1},posVendasPendentes:1});assert.deepEqual(a.map(x=>x.id),["sync","eggs-late","eggs-due","followup","sexing"]);});
test("no pending card when all records are complete",()=>{const a=buildCreatorActions({aves:[{id:"1",synced:true,sexado:true}],clientes:[{id:"x"}]});assert.deepEqual(a,[]);});
