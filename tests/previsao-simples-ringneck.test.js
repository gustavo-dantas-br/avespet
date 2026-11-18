import test from "node:test";
import assert from "node:assert/strict";
import { calcularCriasRingNeck, criarSelecaoDeAve } from "../src/features/genetica/utils/previsaoSimplesRingNeck.js";

const ave = (cor, extras = {}) => ({ cor, extras });

function mapa(lista) {
  return Object.fromEntries(lista.map((r) => [r.nome, r.percentual]));
}
function total(lista) {
  return lista.reduce((s,r)=>s+r.percentual,0);
}

test("Green × Albino: machos split Azul e Ino, fêmeas só split Azul", () => {
  const r = calcularCriasRingNeck(ave("green"), ave("albino"));
  assert.equal(r.status, "completo");
  assert.equal(r.machos.length, 1);
  assert.equal(r.femeas.length, 1);
  assert.match(r.machos[0].nome, /portador de Ino/);
  assert.match(r.machos[0].nome, /Blue \(Azul\)/);
  assert.doesNotMatch(r.femeas[0].nome, /portador de Ino/);
  assert.equal(r.machos[0].percentual, 100);
  assert.equal(r.femeas[0].percentual, 100);
});

test("Violeta SF × Azul: ambos os sexos apresentam 50/50", () => {
  const r = calcularCriasRingNeck(ave("violet"), ave("blue"));
  for(const lista of [r.machos,r.femeas]) {
    assert.equal(lista.length,2);
    assert.deepEqual(lista.map(x=>x.percentual).sort(),[50,50]);
    assert.equal(total(lista),100);
  }
});

test("Pai PallidIno × mãe Ino: machos PallidIno ou Ino; fêmeas Pallid ou Ino", () => {
  const r=calcularCriasRingNeck(ave("pallidino"),ave("lutino"));
  assert.equal(r.status,"completo");
  assert.equal(total(r.machos),100);
  assert.equal(total(r.femeas),100);
  assert.ok(r.machos.some(x=>x.nome.includes("PallidIno")));
  assert.ok(r.machos.some(x=>x.nome.includes("Lutino")));
  assert.ok(r.femeas.some(x=>x.nome.includes("Pallid")));
  assert.ok(r.femeas.some(x=>x.nome.includes("Lutino")));
});

test("Pai PallidIno × mãe Lutino com Violet SF e Grey SF: quatro resultados em cada sexo", () => {
  const r = calcularCriasRingNeck(ave("pallidino"),ave("lutino",{violet:1,grey:1}));
  assert.equal(r.status,"completo");
  for(const filhos of [r.machos,r.femeas]) {
    assert.equal(filhos.length,8); // duas classes no locus Z × dois fatores independentes
    assert.equal(total(filhos),100);
    assert.ok(filhos.every(x=>x.percentual===12.5));
  }
});

test("PallidIno não pode ser selecionado para fêmea", () => {
  const r=calcularCriasRingNeck(ave("blue"),ave("pallidino"));
  assert.equal(r.status,"incompleto");
  assert.match(r.mensagem,/não pode ser selecionada para uma fêmea/i);
});

test("Fatores SF/DF geram percentuais por sexo fechando em 100", () => {
  const r=calcularCriasRingNeck(ave("blue",{violet:1,grey:1}),ave("blue"));
  for(const filhos of [r.machos,r.femeas]) {
    assert.equal(filhos.length,4);
    assert.equal(total(filhos),100);
    assert.ok(filhos.every(x=>x.percentual===25));
  }
});

test("Cores simples do plantel respeitam a escolha de Violeta", () => {
  const selecionada=criarSelecaoDeAve({corMutacao:"Violeta",corBase:"",fatoresGeneticos:{violetFactor:""}}, "Macho");
  assert.equal(selecionada.cor,"violet");
  assert.equal(calcularCriasRingNeck(selecionada,ave("blue")).machos.length,2);
});

test("Dark misturado com alelos de série variáveis não apresenta falsa precisão", () => {
  const r=calcularCriasRingNeck(ave("cobalt"),ave("green",{split:"blue"}));
  assert.equal(r.status,"parcial");
  assert.equal(r.machos.length,0);
  assert.equal(r.femeas.length,0);
});

test("Fêmea não admite portadora de Ino/Pallid", () => {
  const r=calcularCriasRingNeck(ave("green"),ave("blue",{ino:"split_ino"}));
  assert.equal(r.status,"incompleto");
});
