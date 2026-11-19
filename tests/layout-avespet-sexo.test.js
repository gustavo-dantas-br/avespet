import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const codigo = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const arvore = codigo("../src/features/plantel/ArvoreTab.jsx");
const reproducao = codigo("../src/features/reproducao/components/ReproducaoTab.jsx");
const genetica = codigo("../src/features/genetica/components/CalculadoraGeneticaRapida.jsx");

test("Árvore: mantém pais, parceiro, filhotes e sexo não informado", () => {
  for (const chave of ["paiExterno", "maeExterno", "parceiro &&", "filhos.map", "PALETA.neutro"]) {
    assert.ok(arvore.includes(chave), `Ausente: ${chave}`);
  }
});
test("Árvore: cores identificam sexo e não alteram foto ou mutação", () => {
  assert.match(arvore, /Macho/);
  assert.match(arvore, /Fêmea/);
  assert.ok(!arvore.includes("<img"));
});
test("Reprodução: mantém fluxos de postura, ovos e nascimento", () => {
  for (const chave of [
    'escolherAve("paiId"', 'escolherAve("maeId"',
    "onNascimento(postura, ovo.n", "onSave({ ...postura, ovos:",
    "resumoReproducao(posturas)", "CORES_CASAL.macho", "CORES_CASAL.femea"
  ]) assert.ok(reproducao.includes(chave), `Ausente: ${chave}`);
});
test("Genética: separa resultados por sexo e só mostra foto do plantel", () => {
  assert.ok(genetica.includes('sexo="Macho" lista={calculo.machos}'));
  assert.ok(genetica.includes('sexo="Femea" lista={calculo.femeas}'));
  assert.ok(genetica.includes("aveDoPlantel?.foto"));
  assert.ok(genetica.includes('role="meter"'));
});
