import test from "node:test";
import assert from "node:assert/strict";
import { criarSelecaoDeAve, calcularCriasRingNeck } from "../src/features/genetica/utils/previsaoSimplesRingNeck.js";
import { mostrarNomePopularRingNeck } from "../src/features/genetica/data/nomenclaturaRingNeck.js";

test("Plantel antigo Ino azul é Albino, não Azul comum",()=>{
  const selecionada=criarSelecaoDeAve({
    nome:"Mãe",corMutacao:"Ino",corBase:"Blue (Azul)",
    fatoresGeneticos:{darkFactor:"",violetFactor:""},portadores:[],mutacoesVisuais:[]
  },"Femea");
  assert.equal(selecionada.cor,"albino");
  const cruzamento=calcularCriasRingNeck({cor:"green",extras:{}},selecionada);
  assert.equal(cruzamento.status,"completo");
  assert.ok(cruzamento.machos[0].nome.includes("portador de Ino"));
  assert.ok(!cruzamento.femeas[0].nome.includes("portador de Ino"));
});

test("Plantel antigo Ino verde é Lutino",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Ino",corBase:"Green (Verde)"},"Femea");
  assert.equal(selecionada.cor,"lutino");
});

test("Plantel Ino turquesa sem base genética completa não é classificado como Azul",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Ino",corBase:"Turquoise Blue (Azul Turquesa)"},"Femea");
  assert.equal(selecionada.cor,"");
});

test("Cremino antigo não é interpretado como Azul ou Turquesa sem dados",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Cremino",corBase:"Turquoise (Turquesa)"},"Femea");
  assert.equal(selecionada.cor,"");
});

test("Azul x Cinza SF exibe Azul e Cinza, sem nome duplicado",()=>{
  const r=calcularCriasRingNeck({cor:"blue",extras:{}},{cor:"grey",extras:{}});
  assert.equal(r.status,"completo");
  for (const lista of [r.machos,r.femeas]){
    const exibidos=lista.map(x=>mostrarNomePopularRingNeck(x.nome));
    assert.deepEqual(new Set(exibidos),new Set(["Azul (Blue)","Cinza (Grey SF)"]));
    assert.ok(lista.every(x=>x.percentual===50));
  }
});

test("Série verde com Grey SF vira Cinza-verde",()=>{
  assert.equal(mostrarNomePopularRingNeck("Green (Verde) · Grey SF"),"Cinza-verde (Grey SF)");
});
