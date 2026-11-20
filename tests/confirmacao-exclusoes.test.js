import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const app = read("../src/App.jsx");

test("todas as oito exclusões do criador exigem confirmação antes de alterar estado", () => {
  for (const nome of ["handleDelete", "handleDeleteDespesa", "handleDeleteMutacao", "handleDeleteCliente", "handleDeleteFornecedor", "handleDeleteIndicacao", "handleDeletePostura", "handleDeleteAnuncio"]) {
    const inicio = app.indexOf(`async function ${nome}(id) {`);
    assert.ok(inicio !== -1, `Função ${nome} ausente`);
    const bloco = app.slice(inicio, app.indexOf("  async function ", inicio + 10) === -1 ? inicio + 1000 : app.indexOf("  async function ", inicio + 10));
    const confirma = bloco.indexOf("window.confirm(");
    const remove = bloco.indexOf("prev.filter(");
    assert.ok(confirma !== -1, `${nome} sem confirmação`);
    assert.ok(remove > confirma, `${nome} remove antes de confirmar`);
    assert.ok(bloco.includes("return false"), `${nome} não cancela`);
  }
});

test("o cadastro mantém detalhes abertos quando exclusão é cancelada", () => {
  for (const path of ["../src/features/clientes/ClientesTab.jsx", "../src/features/fornecedores/FornecedoresTab.jsx"]) {
    assert.ok(read(path).includes("if (await onDelete(id)) setDetalheId(null)"));
  }
});

test("ovos, fotos e pesagens também exigem confirmação", () => {
  assert.ok(read("../src/features/reproducao/components/ReproducaoTab.jsx").includes("window.confirm(nasceu"));
  assert.ok(read("../src/features/plantel/FormTab.jsx").includes("window.confirm(\"Deseja realmente remover a foto"));
  assert.ok(read("../src/features/plantel/PesoHistorico.jsx").includes("window.confirm(`Deseja realmente remover a pesagem"));
});
