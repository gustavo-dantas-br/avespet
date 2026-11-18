import test from "node:test";
import assert from "node:assert/strict";
import {
  APARENCIAS_COMUNS_RING_NECK,
  mostrarNomePopularRingNeck,
  ordenarMutacoesRingNeck,
} from "../src/features/genetica/data/nomenclaturaRingNeck.js";
import {
  CORES_RAPIDAS_RING_NECK,
  calcularCriasRingNeck,
} from "../src/features/genetica/utils/previsaoSimplesRingNeck.js";

test("prioriza cores básicas e depois os fatores no cadastro", () => {
  assert.deepEqual(APARENCIAS_COMUNS_RING_NECK.slice(0,4).map(x => x.label),
    ["Verde (Green)", "Azul (Blue)", "Turquesa (Turquoise)", "Azul-turquesa (Turquoise Blue)"]);
  assert.equal(APARENCIAS_COMUNS_RING_NECK.find(x=>x.value==="Cobalto").label, "Cobalto (Dark SF)");
  assert.equal(APARENCIAS_COMUNS_RING_NECK.find(x=>x.value==="Mauve").label, "Malva (Dark DF)");
});

test("cores da calculadora usam a mesma ordem e a nomenclatura popular", () => {
  assert.deepEqual(CORES_RAPIDAS_RING_NECK.slice(0,4).map(x=>x.label),
    ["Verde (Green)", "Azul (Blue)", "Turquesa (Turquoise)", "Azul-turquesa (Turquoise Blue)"]);
  assert.equal(CORES_RAPIDAS_RING_NECK.find(x=>x.id==="cobalt").label, "Cobalto (Dark SF)");
});

test("nomes do motor não mudam; apresentação troca apenas o rótulo", () => {
  assert.equal(mostrarNomePopularRingNeck("Cobalt (Cobalto)"), "Cobalto (Dark SF)");
  assert.equal(mostrarNomePopularRingNeck("Mauve (Malva)"), "Malva (Dark DF)");
  assert.equal(mostrarNomePopularRingNeck("Violet SF (Violeta)"), "Violeta (Violet SF)");
  assert.equal(mostrarNomePopularRingNeck("Violet Cobalt (Violeta cobalto)"),
    "Violeta Cobalto (Violet SF + Dark SF)");
  assert.equal(mostrarNomePopularRingNeck("Cleartail (Cauda clara)"), "Cauda clara (Cleartail)");
});

test("mutações extras são ordenadas de básicas para avançadas", () => {
  const originais=["Dun Fallow (Fallow dun)","Cleartail (Cauda clara)","Cinnamon (Canela)"];
  assert.deepEqual(ordenarMutacoesRingNeck(originais),
    ["Cinnamon (Canela)","Cleartail (Cauda clara)","Dun Fallow (Fallow dun)"]);
  assert.equal(originais[0],"Dun Fallow (Fallow dun)");
});

test("Violeta SF × Cobalto: 4 classes de 25%, nomes populares no resultado", () => {
  const r=calcularCriasRingNeck({cor:"violet",extras:{}},{cor:"cobalt",extras:{}});
  assert.equal(r.status,"completo");
  for(const lista of [r.machos,r.femeas]) {
    assert.deepEqual(lista.map(x=>x.percentual),[25,25,25,25]);
    const exibidos=lista.map(x=>mostrarNomePopularRingNeck(x.nome));
    assert.ok(exibidos.includes("Azul (Blue)"));
    assert.ok(exibidos.includes("Cobalto (Dark SF)"));
    assert.ok(exibidos.includes("Violeta (Violet SF)"));
    assert.ok(exibidos.includes("Violeta Cobalto (Violet SF + Dark SF)"));
  }
});
