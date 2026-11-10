import React, { useState } from "react";
import { Phone, Trash2, Plus } from "lucide-react";
const INDICACAO_TONS = {
  Nova: "gold",
  "Em atendimento": "gold",
  "Venda realizada": "good",
  "Nao converteu": "bad",
};

function IndicacaoCard({ indicacao, cliente, onUpdate, onDelete, Card, Field, inputStyle, STATUS_INDICACAO }) {
  const tone = INDICACAO_TONS[indicacao.status] || "default";
  const tones = { default: "#e3d3b4", gold: "#f0dab0", good: "#c8dcb8", bad: "#f0c9c0" };
  return (
    <Card className="p-4 ui-sans">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{indicacao.nomeIndicado}</div>
          {indicacao.telefoneIndicado && (
            <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#8a7a63" }}>
              <Phone size={11} /> {indicacao.telefoneIndicado}
            </div>
          )}
          <div className="text-xs mt-0.5" style={{ color: "#8a7a63" }}>
            Indicado por <strong>{cliente ? cliente.nome : "(cliente removido)"}</strong>{indicacao.data ? ` em ${indicacao.data}` : ""}
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: tones[tone], color: "#2B241C" }}>{indicacao.status}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        <Field label="Status">
          <select style={inputStyle} value={indicacao.status} onChange={(e) => onUpdate(indicacao.id, { status: e.target.value })}>
            {STATUS_INDICACAO.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Observacoes">
          <input style={inputStyle} value={indicacao.observacoes || ""} onChange={(e) => onUpdate(indicacao.id, { observacoes: e.target.value })} placeholder="opcional" />
        </Field>
      </div>

      <div className="flex items-center justify-between mt-2">
        {indicacao.synced === false && <div className="text-[10px] font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
        <button onClick={() => onDelete(indicacao.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1 ml-auto" style={{ background: "#f0dad4", color: "#a6402b" }}>
          <Trash2 size={12} /> Remover
        </button>
      </div>
    </Card>
  );
}

function NovaIndicacaoForm({ clientes, onSave, Card, Field, inputStyle, emptyIndicacao, hojeISO }) {
  const [form, setForm] = useState(emptyIndicacao());
  const [error, setError] = useState("");

  function submit() {
    if (!form.clienteIndicouId) { setError("Escolhe quem fez a indicacao."); return; }
    const result = onSave({ ...form, data: form.data || hojeISO() });
    if (result?.ok) {
      setForm(emptyIndicacao());
      setError("");
    } else {
      setError(result?.error || "Nao consegui salvar.");
    }
  }

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Cliente que indicou">
          <select style={inputStyle} value={form.clienteIndicouId} onChange={(e) => setForm((f) => ({ ...f, clienteIndicouId: e.target.value }))}>
            <option value="">-- selecione --</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Data da indicacao">
          <input style={inputStyle} type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Nome da pessoa indicada">
          <input style={inputStyle} value={form.nomeIndicado} onChange={(e) => setForm((f) => ({ ...f, nomeIndicado: e.target.value }))} placeholder="ex: Marcos" />
        </Field>
        <Field label="Telefone da pessoa indicada">
          <input style={inputStyle} value={form.telefoneIndicado} onChange={(e) => setForm((f) => ({ ...f, telefoneIndicado: e.target.value }))} placeholder="opcional" />
        </Field>
      </div>
      <Field label="Observacoes">
        <input style={inputStyle} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} placeholder="opcional" />
      </Field>
      {error && <div className="ui-sans text-sm mt-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold mt-4" style={{ background: "#C69A2E", color: "#2B1D14" }}>
        <Plus size={15} /> Registrar indicacao
      </button>
    </Card>
  );
}

// Ranking e metricas de indicacao - tudo calculado na hora a partir do que
// ja existe em `indicacoes`, sem nenhum campo ou tabela nova.
function metricasIndicacoes(indicacoes, clientes) {
  const total = indicacoes.length;
  const convertidas = indicacoes.filter((i) => i.status === "Venda realizada").length;
  const naoConverteu = indicacoes.filter((i) => i.status === "Nao converteu").length;
  const taxaConversao = total > 0 ? (convertidas / total) * 100 : 0;

  const contagem = new Map(); // clienteId -> count
  indicacoes.forEach((i) => {
    if (!i.clienteIndicouId) return;
    contagem.set(i.clienteIndicouId, (contagem.get(i.clienteIndicouId) || 0) + 1);
  });

  const ranking = Array.from(contagem.entries())
    .map(([clienteId, count]) => ({ cliente: clientes.find((c) => c.id === clienteId), count }))
    .filter((r) => r.cliente)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { total, convertidas, naoConverteu, taxaConversao, ranking };
}

function RankingIndicacoes({ indicacoes, clientes, Card, SummaryCard }) {
  const m = metricasIndicacoes(indicacoes, clientes);
  const medalhas = ["­🏆", "­🥈", "­🥉"];

  return (
    <div className="mb-6">
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <SummaryCard label="Total de indicacoes" value={m.total} />
        <SummaryCard label="Viraram venda" value={m.convertidas} tone="good" />
        <SummaryCard label="Nao converteram" value={m.naoConverteu} tone="bad" />
        <SummaryCard label="Taxa de conversao" value={`${m.taxaConversao.toFixed(0)}%`} />
      </div>

      {m.ranking.length > 0 && (
        <Card className="p-4">
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>QUEM MAIS INDICA</div>
          <div className="flex flex-col gap-2">
            {m.ranking.map((r, i) => (
              <div key={r.cliente.id} className="flex items-center justify-between ui-sans text-sm">
                <span style={{ color: "#2B241C" }}>
                  {medalhas[i] || `${i + 1}º`} {r.cliente.nome}
                </span>
                <span className="ui-mono" style={{ color: "#8a6f2e" }}>{r.count} {r.count === 1 ? "indicacao" : "indicacoes"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function IndicacoesTab({ indicacoes, clientes, onSave, onDelete, Card, Field, SectionTitle, SummaryCard, inputStyle, STATUS_INDICACAO, emptyIndicacao, hojeISO }) {
  const [filtroStatus, setFiltroStatus] = useState("");

  const filtradas = indicacoes.filter((i) => !filtroStatus || i.status === filtroStatus);

  return (
    <div>
      <SectionTitle>Indicacoes</SectionTitle>

      <RankingIndicacoes indicacoes={indicacoes} clientes={clientes} Card={Card} SummaryCard={SummaryCard} />

      <NovaIndicacaoForm clientes={clientes} onSave={onSave} Card={Card} Field={Field} inputStyle={inputStyle} emptyIndicacao={emptyIndicacao} hojeISO={hojeISO} />

      <Field label="Filtrar por status">
        <select style={{ ...inputStyle, maxWidth: 280 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">-- todos --</option>
          {STATUS_INDICACAO.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <div className="mt-4">
        {filtradas.length === 0 ? (
          <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
            {indicacoes.length === 0 ? "Nenhuma indicacao registrada ainda." : "Nenhuma indicacao com esse filtro."}
          </Card>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtradas.map((i) => (
              <IndicacaoCard
                key={i.id}
                indicacao={i}
                cliente={clientes.find((c) => c.id === i.clienteIndicouId)}
                onUpdate={(id, patch) => onSave({ ...indicacoes.find((x) => x.id === id), ...patch })}
                onDelete={onDelete}
                Card={Card} Field={Field} inputStyle={inputStyle} STATUS_INDICACAO={STATUS_INDICACAO}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

