import test from "node:test";import assert from "node:assert/strict";import {fichaMeta} from "../src/features/campanhas/config/fichaMeta.js";
test("orçamento líquido, média diária e alcance",()=>{const f=fichaMeta({code:"cidade",media_cents:14000,price_cents:22990,duration_days:7});assert.equal(f.net,12299);assert.equal(f.daily,1757);assert.equal(f.min,2000);assert.equal(f.max,6800);});
test("alterar verba recalcula",()=>{const f=fichaMeta({code:"bairro",media_cents:12000,duration_days:3});assert.equal(f.net,10542);assert.equal(f.daily,3514);assert.equal(f.max,5800);});
test("destaque não tem mídia",()=>assert.equal(fichaMeta({code:"destaque",media_cents:0,duration_days:7}).paid,false));
