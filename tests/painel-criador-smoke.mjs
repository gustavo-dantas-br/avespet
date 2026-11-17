import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

// O teste não acessa dados reais nem grava informações no Supabase.
process.env.VITE_SUPABASE_URL = "https://smoke-test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "smoke-test-public-anon-key";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "error",
});

let checked = 0;
const load = async (path) => (await server.ssrLoadModule(path)).default;
const render = (label, Component, props, expected) => {
  const markup = renderToString(React.createElement(Component, props));
  assert.ok(markup.includes(expected), label + ": conteúdo principal não encontrado");
  console.log("OK:", label);
  checked += 1;
};

try {
  const { Card, Field, SectionTitle, inputStyle } = await server.ssrLoadModule("/src/components/ui/SharedUI.jsx");
  const { emptyAve, emptyCliente, emptyFornecedor, emptyIndicacao, emptyMutacao, emptyAnuncio } =
    await server.ssrLoadModule("/src/lib/modelos.js");
  const { money, hojeISO, primeiroDiaMesISO, ultimoDiaMesISO, primeiroDiaAnoISO } =
    await server.ssrLoadModule("/src/lib/formatadores.js");
  const { computeFinanceiro, computeFinanceiroPeriodo } =
    await server.ssrLoadModule("/src/lib/financeiro-utils-unused.js").catch(() => server.ssrLoadModule("/src/features/financeiro/utils/calcularFinanceiro.js"));
  const noop = () => {};
  const ave = { ...emptyAve(), id: "ave-teste", nome: "Ave teste", anilha: "ABC123", status: "No plantel", especie: "Ring Neck" };
  const aves = [ave];
  const cliente = { ...emptyCliente(), id: "cliente-teste", nome: "Cliente teste", telefone: "11999998888" };
  const shared = { Card, Field, SectionTitle, inputStyle, money, noop };

  const AveCard = await load("/src/features/plantel/components/AveCard.jsx");
  const ListaTab = await load("/src/features/plantel/components/ListaTab.jsx");
  const filterLabels = { plantel: "Plantel", "A venda": "À venda", Reservada: "Reservadas", Vendida: "Vendidas", Falecida: "Falecidas", Perdida: "Perdidas", casais: "Casais", solteiros: "Solteiros" };
  for (const statusFilter of ["plantel", "A venda", "Reservada", "Vendida", "Falecida", "Perdida", "casais", "solteiros"]) {
    render("Meu Plantel / " + statusFilter, ListaTab, {
      ...shared, AveCard, aves: statusFilter === "plantel" ? aves : [],
      todasAves: aves, statusFilter, setStatusFilter: noop, casaisAgrupados: [],
      search: "", setSearch: noop, onEdit: noop, onDelete: noop, onNew: noop,
      onSync: noop, onExport: noop, onImport: noop, FILTER_LABELS: filterLabels,
    }, "Meu plantel");
  }
  const ClienteTab = await load("/src/features/clientes/ClientesTab.jsx");
  render("Clientes", ClienteTab, {
    ...shared, clientes: [cliente], aves, onSave: noop, onDelete: noop, onImportar: noop,
    emptyCliente, SummaryCard: Card, whatsappUrl: noop,
  }, "Clientes");
  const ReservasTab = await load("/src/features/reservas/ReservasTab.jsx");
  render("Reservas", ReservasTab, {
    ...shared, userId: "00000000-0000-4000-8000-000000000001",
    perfil: {}, clientes: [cliente], aves, posturas: [], emptyCliente,
    onCreateCliente: async () => ({ ok: true, id: cliente.id }),
  }, "Reservas");
  const ReproducaoTab = await load("/src/features/reproducao/components/ReproducaoTab.jsx");
  render("Reprodução", ReproducaoTab, { ...shared, aves, posturas: [], onSave: noop, onDelete: noop, onNascimento: noop }, "Reprodução");
  const FinanceiroTab = await load("/src/features/financeiro/components/FinanceiroTab.jsx");
  render("Financeiro", FinanceiroTab, {
    ...shared, aves, despesas: [], reservasFinanceiro: [], pagamentosReservasFinanceiro: [],
    clientes: [cliente], onSaveDespesa: noop, onDeleteDespesa: noop,
    emptyDespesa: () => ({ tipo: "Racao", descricao: "", valor: "", data: "" }),
    primeiroDiaMesISO, hojeISO, ultimoDiaMesISO, primeiroDiaAnoISO,
    computeFinanceiro, computeFinanceiroPeriodo, DESPESA_TIPOS: ["Racao"],
  }, "Financeiro");
  const FornecedoresTab = await load("/src/features/fornecedores/FornecedoresTab.jsx");
  render("Fornecedores", FornecedoresTab, {
    ...shared, fornecedores: [{...emptyFornecedor(), id: "fornecedor", nome: "Fornecedor teste"}],
    aves, onSave: noop, onDelete: noop, onImportar: noop,
    emptyFornecedor, SummaryCard: Card, whatsappUrl: noop,
  }, "Fornecedores");
  const PosVendaTab = await load("/src/features/pos-venda/PosVendaTab.jsx");
  render("Pós-venda", PosVendaTab, {
    ...shared, aves, clientes: [cliente], onUpdate: noop,
    STATUS_POSVENDA: ["Venda realizada"], SATISFACAO_OPCOES: ["Pendente"],
  }, "Pós-venda");
  const IndicacoesTab = await load("/src/features/indicacoes/IndicacoesTab.jsx");
  render("Indicações", IndicacoesTab, {
    ...shared, indicacoes: [], clientes: [cliente], onSave: noop, onDelete: noop,
    emptyIndicacao, hojeISO, SummaryCard: Card, STATUS_INDICACAO: ["Nova"],
  }, "Indicações");
  const MutacoesTab = await load("/src/features/genetica/MutacoesTab.jsx");
  render("Genética", MutacoesTab, {
    ...shared, mutacoes: [], onSave: noop, onDelete: noop,
    emptyMutacao, TIPOS_HERANCA: ["Autossomica recessiva"],
  }, "Mutações");
  const AnunciosTab = await load("/src/features/anuncios/AnunciosTab.jsx");
  render("Anúncios", AnunciosTab, {
    ...shared, aves, anuncios: [], perfil: {}, onSave: noop, onToggleAtivo: noop,
    onDelete: noop, setTab: noop, emptyAnuncio,
  }, "Anúncios");
  const PerfilTab = await load("/src/features/perfil/PerfilTab.jsx");
  render("Meu perfil", PerfilTab, {
    ...shared, perfil: {}, privado: {}, email: "test@example.com",
    onSave: noop, onSavePrivado: noop, onUpdateEmail: noop,
  }, "perfil");

  console.log("Verificações SSR concluídas:", checked);
} finally {
  await server.close();
}
