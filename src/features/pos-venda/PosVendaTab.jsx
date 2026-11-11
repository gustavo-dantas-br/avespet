import React, { useState } from "react";
import { } from "lucide-react";
const POSVENDA_TONS = { "Venda realizada": "default", "Entregue": "gold", "Primeiro contato": "gold", "Acompanhamento": "gold", "Cliente satisfeito": "good" };
function PosVendaCard({ ave, cliente, onUpdate, Card, Field, inputStyle, STATUS_POSVENDA, SATISFACAO_OPCOES }) {
  const tone = POSVENDA_TONS[ave.statusPosVenda] || "default";
  const tones = {
    default: "#e3d3b4",
    gold: "#f0dab0",
    good: "#c8dcb8",
  };
  return (
    <Card className="p-4 ui-sans">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
            {ave.foto ? <img src={ave.foto} className="w-full h-full object-cover" alt="" /> : null}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{ave.nome}</div>
            <div className="text-xs truncate" style={{ color: "#8a7a63" }}>
              {cliente ? cliente.nome : (ave.compradorNome || "comprador nao identificado")}
              {(cliente?.telefone || ave.compradorTelefone) ? ` - ${cliente?.telefone || ave.compradorTelefone}` : ""}
            </div>
            <div className="text-xs" style={{ color: "#8a7a63" }}>Vendida em {ave.dataVenda || "data nao informada"}</div>
          </div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: tones[tone], color: "#2B241C" }}>{ave.statusPosVenda}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Status do pos-venda">
          <select style={inputStyle} value={ave.statusPosVenda} onChange={(e) => onUpdate(ave.id, { statusPosVenda: e.target.value })}>
            {STATUS_POSVENDA.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Cliente satisfeito">
          <select style={inputStyle} value={ave.clienteSatisfeito || "Pendente"} onChange={(e) => onUpdate(ave.id, { clienteSatisfeito: e.target.value })}>
            {SATISFACAO_OPCOES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Data da entrega">
          <input style={inputStyle} type="date" value={ave.dataEntrega || ""} onChange={(e) => onUpdate(ave.id, { dataEntrega: e.target.value })} />
        </Field>
        <Field label="Data do ultimo contato">
          <input style={inputStyle} type="date" value={ave.dataUltimoContato || ""} onChange={(e) => onUpdate(ave.id, { dataUltimoContato: e.target.value })} />
        </Field>
      </div>
      <Field label="Observacoes">
        <input style={inputStyle} value={ave.obsPosVenda || ""} onChange={(e) => onUpdate(ave.id, { obsPosVenda: e.target.value })} placeholder="ex: pediu dica de alimentacao, tudo bem" />
      </Field>
      {ave.synced === false && <div className="text-[10px] mt-2 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
    </Card>
  );
}

export default function PosVendaTab({ aves, clientes, onUpdate, Card, Field, SectionTitle, inputStyle, STATUS_POSVENDA, SATISFACAO_OPCOES }) {
  const [filtroStatus, setFiltroStatus] = useState("");
  const vendidas = aves
    .filter((a) => a.status === "Vendida")
    .filter((a) => !filtroStatus || (a.statusPosVenda || "Venda realizada") === filtroStatus)
    .sort((a, b) => (b.dataVenda || "").localeCompare(a.dataVenda || ""));

  const pendentes = aves.filter((a) => a.status === "Vendida" && (a.clienteSatisfeito || "Pendente") === "Pendente").length;

  return (
    <div>
      <SectionTitle>Pos-venda</SectionTitle>

      {pendentes > 0 && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          {pendentes} {pendentes === 1 ? "venda esta" : "vendas estao"} com acompanhamento pendente.
        </div>
      )}

      <Field label="Filtrar por status">
        <select style={{ ...inputStyle, maxWidth: 280 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">-- todos --</option>
          {STATUS_POSVENDA.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>

      <div className="mt-4">
        {vendidas.length === 0 ? (
          <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma venda encontrada com esse filtro.</Card>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {vendidas.map((a) => (
              <PosVendaCard key={a.id} ave={a} cliente={clientes.find((c) => c.id === a.clienteId)} onUpdate={onUpdate} Card={Card} Field={Field} inputStyle={inputStyle} STATUS_POSVENDA={STATUS_POSVENDA} SATISFACAO_OPCOES={SATISFACAO_OPCOES} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

