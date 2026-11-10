import React from "react";

export default function DashboardTab({ aves, despesas, clientes = [], indicacoes = [], posturas = [], setTab, goToLista, STATUS_PLANTEL, SectionTitle, StatCard, money, Card }) {
  const total = aves.length;
  const machos = aves.filter((a) => a.sexo === "Macho").length;
  const femeas = aves.filter((a) => a.sexo === "Femea").length;
  const indefinidos = aves.filter((a) => a.sexo === "Indefinido").length;

  const paresPorParceiro = new Set();
  aves.forEach((a) => { if (a.parceiroId) paresPorParceiro.add([a.id, a.parceiroId].sort().join("-")); });
  const casaisSoLabel = aves.filter((a) => !a.parceiroId && a.casalLabel?.trim()).length;
  const casais = paresPorParceiro.size + casaisSoLabel;
  const solteiros = aves.filter((a) => !a.parceiroId && !a.casalLabel?.trim()).length;

  const plantel = aves.filter((a) => STATUS_PLANTEL.includes(a.status)).length;
  const disponiveis = aves.filter((a) => a.status === "A venda").length;
  const vendidas = aves.filter((a) => a.status === "Vendida").length;
  const falecidas = aves.filter((a) => a.status === "Falecida").length;
  const semSexagem = aves.filter((a) => !a.sexado).length;
  const naoSincronizadas = aves.filter((a) => a.synced === false).length;

  const totalClientes = clientes.length;
  const totalIndicacoes = indicacoes.length;
  const rep = resumoReproducao(posturas);
  const posVendasPendentes = aves.filter(
    (a) => a.status === "Vendida" && (a.clienteSatisfeito || "Pendente") === "Pendente"
  ).length;

  const fin = computeFinanceiro(aves, despesas);

  const ultimasCadastradas = [...aves]
    .sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || ""))
    .slice(0, 5);

  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <StatCard label="Total de aves" value={total} onClick={() => goToLista(null)} />
        <StatCard label="Plantel" value={plantel} tone="gold" onClick={() => goToLista("plantel")} />
        <StatCard label="Machos" value={machos} />
        <StatCard label="Femeas" value={femeas} />
        <StatCard label="Sexo indefinido" value={indefinidos} />
        <StatCard label="Casais" value={casais} onClick={() => goToLista("casais")} />
        <StatCard label="Solteiros" value={solteiros} onClick={() => goToLista("solteiros")} />
        <StatCard label="A venda" value={disponiveis} tone="gold" onClick={() => goToLista("A venda")} />
        <StatCard label="Vendidas" value={vendidas} tone="good" onClick={() => goToLista("Vendida")} />
        <StatCard label="Falecidas" value={falecidas} tone="bad" onClick={() => goToLista("Falecida")} />
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard label="Total investido" value={money(fin.totalInvestido)} tone="bad" onClick={() => setTab("financeiro")} />
        <StatCard label="Total vendido" value={money(fin.totalVendas)} tone="good" onClick={() => setTab("financeiro")} />
        <StatCard label={fin.lucro >= 0 ? "Lucro" : "Prejuizo"} value={money(Math.abs(fin.lucro))} tone={fin.lucro >= 0 ? "good" : "bad"} onClick={() => setTab("financeiro")} />
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard label="Clientes" value={totalClientes} onClick={() => setTab("clientes")} />
        <StatCard label="Indicacoes" value={totalIndicacoes} onClick={() => setTab("indicacoes")} />
        <StatCard label="Pos-vendas pendentes" value={posVendasPendentes} tone="gold" onClick={() => setTab("posvenda")} />
        <StatCard label="Ovos incubando" value={rep.incubando} onClick={() => setTab("reproducao")} />
        <StatCard label="Nascimentos em 7 dias" value={rep.previstos7} tone="gold" onClick={() => setTab("reproducao")} />
      </div>

      {(semSexagem > 0 || naoSincronizadas > 0 || rep.atrasados > 0) && (
        <Card className="p-4 mb-6">
          <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>ALERTAS</div>
          <div className="flex flex-col gap-1 ui-sans text-sm" style={{ color: "#2B241C" }}>
            {rep.atrasados > 0 && <div>⚠️ {rep.atrasados} {rep.atrasados === 1 ? "ovo passou" : "ovos passaram"} da data prevista de eclosao.</div>}
            {semSexagem > 0 && <div>⚠️ {semSexagem} {semSexagem === 1 ? "ave esta" : "aves estao"} sem laudo de sexagem.</div>}
            {naoSincronizadas > 0 && <div>⚠️ {naoSincronizadas} {naoSincronizadas === 1 ? "ave nao sincronizou" : "aves nao sincronizaram"} com o banco ainda.</div>}
          </div>
        </Card>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>ULTIMAS CADASTRADAS</div>
      {ultimasCadastradas.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma ave cadastrada ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {ultimasCadastradas.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>{a.especie} - {a.status}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lista
// ---------------------------------------------------------------------------

