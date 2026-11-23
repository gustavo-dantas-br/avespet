import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { estaNoPlantel, ehCasalDoPlantel, ehSolteiroDoPlantel, agruparCasaisDoPlantel } from "../src/features/plantel/utils/filtrosPlantel.js";

const aves = [
  {id:"1",status:"No plantel",parceiroId:"2"},
  {id:"2",status:"Reservada",parceiroId:"1"},
  {id:"3",status:"A venda"},
  {id:"4",status:"Vendida",parceiroId:"5"},
  {id:"5",status:"No plantel",parceiroId:"4"},
  {id:"6",status:"Falecida",casalLabel:"Casal antigo"},
  {id:"7",status:"Perdida"},
  {id:"8",status:"No plantel",casalLabel:"Casal do criatório"},
  {id:"9",status:"Vendida"},
];

test("meu plantel só inclui aves atuais, à venda e reservadas",()=>{
  assert.deepEqual(aves.filter(estaNoPlantel).map(a=>a.id),["1","2","3","5","8"]);
});

test("casais não incluem aves vendidas nem parceiros que saíram do plantel",()=>{
  const grupos=agruparCasaisDoPlantel(aves);
  assert.equal(grupos.length,2);
  assert.deepEqual(grupos.map(g=>[g.a.id,g.b?.id||null]),[["1","2"],["8",null]]);
  assert.equal(ehCasalDoPlantel(aves[3],aves),false);
  assert.equal(ehSolteiroDoPlantel(aves[4],aves),true);
});

test("solteiros são somente aves atuais sem parceiro elegível",()=>{
  assert.deepEqual(aves.filter(a=>ehSolteiroDoPlantel(a,aves)).map(a=>a.id),["3","5"]);
});

test("blocos de casais e solteiros abrem filtros correspondentes",()=>{
  const lista=readFileSync(new URL("../src/features/plantel/components/ListaTab.jsx",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
  const dash=readFileSync(new URL("../src/features/dashboard/components/DashboardTab.jsx",import.meta.url),"utf8");
  assert.ok(lista.includes('id: "casais", label: "Casais"'));
  assert.ok(lista.includes('id: "solteiros", label: "Solteiros"'));
  assert.ok(lista.includes("onClick={() => setStatusFilter(aba.id)}"));
  assert.ok(app.includes('if (statusFilter === "casais") return ehCasalDoPlantel(a, aves);'));
  assert.ok(app.includes('if (statusFilter === "solteiros") return ehSolteiroDoPlantel(a, aves);'));
  assert.ok(dash.includes('goToLista("casais")'));
  assert.ok(dash.includes('goToLista("solteiros")'));
});
