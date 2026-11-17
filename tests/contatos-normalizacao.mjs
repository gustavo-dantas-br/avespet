import assert from "node:assert/strict";
import { createServer } from "vite";
import { normalizeTelefone } from "../src/lib/telefone.js";

const phoneA = "(11) 98888-7777";
const phoneB = "11 98888 7777";
assert.equal(normalizeTelefone(phoneA), "11988887777");
assert.equal(normalizeTelefone(phoneB), "11988887777");
assert.equal(normalizeTelefone("+55 (11) 98888-7777"), "5511988887777");
assert.equal(normalizeTelefone(""), "");

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});
try {
  const { historicoCliente, clientesCandidatosDeVendas } =
    await server.ssrLoadModule("/src/features/clientes/ClientesTab.jsx");
  const { historicoFornecedor, fornecedoresCandidatosDeCompras } =
    await server.ssrLoadModule("/src/features/fornecedores/FornecedoresTab.jsx");

  const cliente = { id: "cliente-1", nome: "Maria", telefone: phoneA };
  const aveVendida = {
    id: "ave-vendida", status: "Vendida", clienteId: null,
    compradorNome: "Maria", compradorTelefone: phoneB,
    valorVenda: "1500", dataVenda: "2026-11-14",
  };
  const compra = historicoCliente(cliente, [aveVendida]);
  assert.equal(compra.totalAves, 1, "Venda legada deve aparecer no historico do cliente com telefone formatado.");
  assert.equal(compra.totalGasto, 1500);
  assert.equal(clientesCandidatosDeVendas([aveVendida], [cliente]).length, 0,
    "Importacao nao deve sugerir comprador que ja existe com outra formatacao.");
  assert.equal(clientesCandidatosDeVendas([aveVendida], []).length, 1,
    "Importacao deve sugerir comprador ainda nao cadastrado.");
  assert.equal(historicoCliente({ id: "outro", nome: "Outro", telefone: "(11) 90000-1111" }, [aveVendida]).totalAves, 0,
    "Nao associar vendas a outro numero.");
  const vendaVinculada = { ...aveVendida, clienteId: "outro" };
  assert.equal(historicoCliente(cliente, [vendaVinculada]).totalAves, 0,
    "Nao atribuir venda vinculada a outro cliente pelo fallback.");

  const fornecedor = { id: "fornecedor-1", nome: "Joao", telefone: phoneA };
  const aveComprada = {
    id: "ave-comprada", origemTipo: "Comprada", fornecedorId: null,
    fornecedorNome: "Joao", fornecedorTelefone: phoneB,
    valorCompra: "700", dataCompra: "2026-11-10",
  };
  const historico = historicoFornecedor(fornecedor, [aveComprada]);
  assert.equal(historico.totalAves, 1, "Compra legada deve aparecer no historico do fornecedor.");
  assert.equal(historico.totalGasto, 700);
  assert.equal(fornecedoresCandidatosDeCompras([aveComprada], [fornecedor]).length, 0,
    "Importacao nao deve duplicar fornecedor com telefone em outra formatacao.");
  assert.equal(fornecedoresCandidatosDeCompras([aveComprada], []).length, 1,
    "Importacao deve sugerir fornecedor ainda nao cadastrado.");
  assert.equal(historicoFornecedor({ id: "outro", nome: "Outro", telefone: "11900001111" }, [aveComprada]).totalAves, 0,
    "Nao associar compra a numero diferente.");
  const compraVinculada = { ...aveComprada, fornecedorId: "outro" };
  assert.equal(historicoFornecedor(fornecedor, [compraVinculada]).totalAves, 0,
    "Nao atribuir compra vinculada a outro fornecedor pelo fallback.");
  console.log("OK: telefone padronizado e historico/importacao de clientes/fornecedores (14 verificacoes)");
} finally {
  await server.close();
}
