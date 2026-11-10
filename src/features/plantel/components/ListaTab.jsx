import React from "react";
import { Plus, Download, Upload, Search } from "lucide-react";

export default function ListaTab({ aves, search, setSearch, onEdit, onDelete, onNew, onSync, onExport, onImport, statusFilter, setStatusFilter, casaisAgrupados, Card, SectionTitle, AveCard, FILTER_LABELS }) {
  const pendentes = aves.filter((a) => a.synced === false).length;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Minhas Aves</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <button onClick={onNew} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shrink-0" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={16} /> Nova ave
          </button>
          <button onClick={onExport} className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Download size={15} /> Backup
          </button>
          <label className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm shrink-0 cursor-pointer" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Upload size={15} /> Importar
            <input type="file" accept="application/json" className="hidden" onChange={onImport} />
          </label>
        </div>
      </div>

      {statusFilter && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm flex items-center justify-between gap-3" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          <span>Filtrando por: <strong>{FILTER_LABELS[statusFilter] || statusFilter}</strong> ({statusFilter === "casais" ? casaisAgrupados.length : aves.length})</span>
          <button onClick={() => setStatusFilter(null)} className="ui-sans px-2 py-1 rounded text-xs font-semibold" style={{ background: "#2B1D14", color: "#F1E6D2" }}>Limpar filtro</button>
        </div>
      )}

      {pendentes > 0 && (
        <div className="ui-sans mb-4 px-4 py-2 rounded-lg text-sm" style={{ background: "#f0e6d2", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          {pendentes} {pendentes === 1 ? "ave salva so neste aparelho" : "aves salvas so neste aparelho"} (nao sincronizou na nuvem ainda). Use "Sincronizar" no card, ou baixe o backup pra guardar num lugar seguro.
        </div>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a63" }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, anilha ou especie..."
          className="ui-sans w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
        />
      </div>

      {aves.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          {statusFilter ? "Nenhuma ave nesse filtro." : "Nenhuma ave encontrada. Cadastre a primeira pra comecar a preencher a arvore genealogica e gerar placas."}
        </Card>
      ) : statusFilter === "casais" ? (
        <div className="flex flex-col gap-4">
          {casaisAgrupados.map(({ a, b, label: casalLabel }) => (
            <Card key={a.id} className="p-4">
              {casalLabel && <div className="ui-mono text-xs mb-2" style={{ color: "#8a6f2e" }}>{casalLabel}</div>}
              <div className="grid gap-3" style={{ gridTemplateColumns: b ? "1fr 1fr" : "1fr" }}>
                <AveCard a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />
                {b && <AveCard a={b} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />}
                {!b && <div className="ui-sans text-xs flex items-center justify-center" style={{ color: "#8a7a63" }}>Parceiro nao identificado no sistema</div>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {aves.map((a) => <AveCard key={a.id} a={a} onEdit={onEdit} onDelete={onDelete} onSync={onSync} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulario de ave
// ---------------------------------------------------------------------------

