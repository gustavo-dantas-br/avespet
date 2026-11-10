import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function MutacoesTab({ mutacoes, onSave, onDelete, emptyMutacao, TIPOS_HERANCA, SectionTitle, Field, inputStyle, Card }) {
  const [nova, setNova] = useState(emptyMutacao());
  const [editId, setEditId] = useState(null);

  function submit() {
    if (!nova.nome.trim()) return;
    onSave({ ...nova, id: editId });
    setNova(emptyMutacao());
    setEditId(null);
  }

  function editar(m) {
    setNova(m);
    setEditId(m.id);
  }

  return (
    <div>
      <SectionTitle>Banco de Genética</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>Cadastro das mutações que você trabalha. Essa base alimenta a calculadora genética.</p>
      <Card className="p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome da mutação"><input style={inputStyle} value={nova.nome} onChange={(e) => setNova((m) => ({ ...m, nome: e.target.value }))} placeholder="ex: Pallid Azul Turquesa" /></Field>
          <Field label="Nome alternativo"><input style={inputStyle} value={nova.nomeAlternativo} onChange={(e) => setNova((m) => ({ ...m, nomeAlternativo: e.target.value }))} placeholder="opcional" /></Field>
          <Field label="Gene (locus)"><input style={inputStyle} value={nova.gene} onChange={(e) => setNova((m) => ({ ...m, gene: e.target.value }))} placeholder="ex: bl (blue)" /></Field>
          <Field label="Série/Cor base"><input style={inputStyle} value={nova.serie} onChange={(e) => setNova((m) => ({ ...m, serie: e.target.value }))} placeholder="ex: série Azul" /></Field>
          <Field label="Tipo de herança">
            <select style={inputStyle} value={nova.tipoHeranca} onChange={(e) => setNova((m) => ({ ...m, tipoHeranca: e.target.value }))}>{TIPOS_HERANCA.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Combina com (outras mutações)"><input style={inputStyle} value={nova.combinaCom} onChange={(e) => setNova((m) => ({ ...m, combinaCom: e.target.value }))} placeholder="ex: Azul, Turquesa, Violeta (possível)" /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Como identificar visualmente"><input style={inputStyle} value={nova.comoIdentificar} onChange={(e) => setNova((m) => ({ ...m, comoIdentificar: e.target.value }))} placeholder="ex: penas com tom diluído, olhos claros" /></Field>
          <Field label="Observações"><input style={inputStyle} value={nova.observacoes} onChange={(e) => setNova((m) => ({ ...m, observacoes: e.target.value }))} placeholder="opcional" /></Field>
        </div>
        <div className="flex gap-3">
          <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={15} /> {editId ? "Salvar edição" : "Adicionar mutação"}
          </button>
          {editId && <button onClick={() => { setNova(emptyMutacao()); setEditId(null); }} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>}
        </div>
      </Card>
      {mutacoes.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma mutação cadastrada ainda.</Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {mutacoes.map((m) => (
            <Card key={m.id} className="p-4 ui-sans">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold" style={{ color: "#2B241C" }}>{m.nome}</div>
                {m.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NÃO SINCRONIZADO</span>}
              </div>
              {m.nomeAlternativo && <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>também chamada: {m.nomeAlternativo}</div>}
              {(m.gene || m.serie) && <div className="text-xs mb-1 ui-mono" style={{ color: "#7a6a52" }}>{m.gene && `Gene: ${m.gene}`}{m.gene && m.serie ? " · " : ""}{m.serie && `Série: ${m.serie}`}</div>}
              <div className="text-xs mb-1 ui-mono" style={{ color: "#a6402b" }}>{m.tipoHeranca}</div>
              {m.combinaCom && <div className="text-xs mb-1" style={{ color: "#556b3f" }}>Combina com: {m.combinaCom}</div>}
              {m.comoIdentificar && <div className="text-xs mb-1" style={{ color: "#7a6a52" }}>{m.comoIdentificar}</div>}
              {m.observacoes && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>{m.observacoes}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => editar(m)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
                <button onClick={() => onDelete(m.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
