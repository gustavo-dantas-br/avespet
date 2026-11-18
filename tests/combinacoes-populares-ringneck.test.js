import test from "node:test";
import assert from "node:assert/strict";
import { COMBINACOES_POPULARES_RING_NECK, mostrarNomePopularRingNeck } from "../src/features/genetica/data/nomenclaturaRingNeck.js";
import { calcularCriasRingNeck, criarSelecaoDeAve, CORES_RAPIDAS_RING_NECK } from "../src/features/genetica/utils/previsaoSimplesRingNeck.js";

const ave=(cor, extras={})=>({cor,extras});
const soma=(lista)=>lista.reduce((v,x)=>v+x.percentual,0);

test("as cinco combinações estão cadastradas sem duplicar cor-base", () => {
  assert.deepEqual(COMBINACOES_POPULARES_RING_NECK.map(x=>x.id), [
    "blue-cinnamon","violet-cinnamon","turquoise-violet","cobalt-cinnamon","turquoise-cobalt",
  ]);
  for(const combo of COMBINACOES_POPULARES_RING_NECK)
    assert.ok(CORES_RAPIDAS_RING_NECK.some(x=>x.id===combo.id && x.label===combo.label));
});

test("Azul Canela macho × Azul: ambos os sexos azul; machos portadores e fêmeas canela", () => {
  const r=calcularCriasRingNeck(ave("blue-cinnamon"),ave("blue"));
  assert.equal(r.status,"completo");
  assert.equal(r.machos.length,1);
  assert.equal(r.femeas.length,1);
  assert.equal(soma(r.machos),100);
  assert.equal(soma(r.femeas),100);
  assert.match(r.machos[0].nome,/portador de Canela/);
  assert.match(r.femeas[0].nome,/Azul Canela/);
});

test("Pai Azul × mãe Azul Canela: nenhum canela visual, machos portadores", () => {
  const r=calcularCriasRingNeck(ave("blue"),ave("blue-cinnamon"));
  assert.equal(r.status,"completo");
  assert.match(r.machos[0].nome,/portador de Canela/);
  assert.doesNotMatch(r.femeas[0].nome,/Canela/);
});

test("Canela macho portador × Azul: 50% canela e 50% sem entre fêmeas", () => {
  const r=calcularCriasRingNeck(ave("blue",{cinnamon:"split"}),ave("blue"));
  assert.equal(r.status,"completo");
  assert.equal(soma(r.femeas),100);
  assert.deepEqual(r.femeas.map(x=>x.percentual).sort(),[50,50]);
});

test("Fêmeas não podem ser portadoras ocultas de Cinnamon", () => {
  const r=calcularCriasRingNeck(ave("blue"),ave("blue",{cinnamon:"split"}));
  assert.equal(r.status,"incompleto");
});

test("Violeta Canela e Cobalto Canela preservam o nome no resultado", () => {
  const r=calcularCriasRingNeck(ave("violet-cinnamon"),ave("blue"));
  assert.equal(r.status,"completo");
  assert.ok(r.femeas.some(x=>x.nome.includes("Violeta Canela")));
  const r2=calcularCriasRingNeck(ave("cobalt-cinnamon"),ave("blue"));
  assert.equal(r2.status,"completo");
  assert.ok(r2.femeas.some(x=>x.nome.includes("Cobalto Canela")));
});

test("Cinnamon + Ino exige fase genética antes de combinar probabilidades", () => {
  const r=calcularCriasRingNeck(ave("blue-cinnamon"),ave("albino"));
  assert.equal(r.status,"parcial");
  assert.equal(r.machos.length,0);
  assert.match(r.mensagem,/fase genética/);
});

test("Cobalto Turquesa com segregação da série impede falsa precisão", () => {
  const r=calcularCriasRingNeck(ave("turquoise-cobalt"),ave("blue"));
  assert.equal(r.status,"parcial");
});

test("O plantel reconhece combinações salvas com nomes brasileiros", () => {
  const r=criarSelecaoDeAve({corMutacao:"Violeta Canela",corBase:"Blue (Azul)",mutacoesVisuais:["Cinnamon (Canela)"]},"Femea");
  assert.equal(r.cor,"violet-cinnamon");
  assert.equal(r.extras.cinnamon,"visual");
});

test("A nomenclatura apresenta os rótulos populares", () => {
  assert.equal(mostrarNomePopularRingNeck("Azul Canela"),"Azul Canela (Skyblue / Blue Cinnamon)");
});
