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

test("Legado Violeta em corMutacao com base Turquesa reconhece combinação",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Violeta",corBase:"Turquoise Blue (Azul Turquesa)"},"Macho");
  assert.equal(selecionada.cor,"turquoise-violet");
  assert.equal(calcularCriasRingNeck(selecionada,{cor:"blue",extras:{}}).status,"completo");
});

test("Legado Cobalto com cor-base Turquesa não esconde ambiguidade de ligação",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Cobalto",corBase:"Turquoise Blue (Azul Turquesa)"},"Femea");
  assert.equal(selecionada.cor,"turquoise-cobalt");
  const resultado=calcularCriasRingNeck({cor:"blue",extras:{}},selecionada);
  assert.equal(resultado.status,"parcial");
  assert.equal(resultado.machos.length,0);
  assert.equal(resultado.femeas.length,0);
  assert.ok(Array.isArray(resultado.fatoresParciais.dark));
  assert.deepEqual(resultado.fatoresParciais.dark.map(x=>x.percentual),[50,50]);
  assert.equal(resultado.fatoresParciais.dark.reduce((s,x)=>s+x.percentual,0),100);
  assert.equal(resultado.fatoresParciais.violet.reduce((s,x)=>s+x.percentual,0),100);
});

test("Pallid com série Azul do plantel mantém o fenótipo Pallid azul",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Pallid",corBase:"Blue (Azul)"},"Femea");
  assert.equal(selecionada.cor,"pallid-blue");
  const resultado=calcularCriasRingNeck({cor:"green",extras:{}},selecionada);
  assert.equal(resultado.status,"completo");
  assert.match(resultado.machos[0].nome,/portador de Pallid/);
});

test("Pallid com série Turquesa incerta não é reclassificado como Pallid verde",()=>{
  const selecionada=criarSelecaoDeAve({corMutacao:"Pallid",corBase:"Turquoise Blue (Azul Turquesa)"},"Femea");
  assert.equal(selecionada.cor,"");
});
