import React, { useState } from "react";

// MVP sem persistência. Os registros são descartados após recarregar a página.
// Não calcula recomendações clínicas com base no peso.
export function validarRegistro({ data, peso, observacoes }) {
  const ano = Number(String(data).slice(0, 4));
  if (ano < 2000) return "A data deve ser a partir do ano 2000.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "") || Number.isNaN(new Date(data + "T12:00:00").valueOf()) || new Date(data + "T12:00:00").toISOString().slice(0, 10) !== data) return "Informe uma data válida.";
  if (data > new Date().toISOString().slice(0, 10)) return "Não registre data futura.";
  if (peso !== "" && (!Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 10000)) return "Informe um peso válido em gramas.";
  if (String(observacoes || "").length > 500) return "A observação deve ter até 500 caracteres.";
  if (peso === "" && !String(observacoes || "").trim()) return "Informe o peso ou uma observação.";
  return null;
}

export default function DiarioFilhote({ aveNome = "Minha ave" }) {
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState({ data: new Date().toLocaleDateString("en-CA"), peso: "", observacoes: "", alimentacao: "não informado" });
  const [erro, setErro] = useState("");
  const enviar = (event) => {
    event.preventDefault();
    const mensagem = validarRegistro(form);
    if (mensagem) { setErro(mensagem); return; }
    setRegistros((dados) => [{ ...form, id: String(Date.now()) + "-" + dados.length }, ...dados]);
    setForm((atual) => ({ ...atual, peso: "", observacoes: "" }));
    setErro("");
  };
  const input = "mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-stone-900";
  return <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4">
    <div>
      <h2 className="text-lg font-bold text-emerald-950">Diário de desenvolvimento</h2>
      <p className="text-sm text-stone-600">Acompanhe {aveNome} com anotações simples. Dados temporários nesta versão.</p>
    </div>
    <form onSubmit={enviar} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Data<input type="date" className={input} value={form.data} onChange={(e) => setForm((v) => ({ ...v, data: e.target.value }))}/></label>
      <label className="text-sm font-medium">Peso (g), se medido<input type="number" min="0.1" max="10000" step="0.1" className={input} value={form.peso} onChange={(e) => setForm((v) => ({ ...v, peso: e.target.value }))} placeholder="Ex.: 125,5"/></label>
      <label className="text-sm font-medium">Observação alimentar
        <select className={input} value={form.alimentacao} onChange={(e) => setForm((v) => ({ ...v, alimentacao: e.target.value }))}>
          <option value="não informado">Não informado</option>
          <option value="alimentação assistida">Alimentação assistida</option>
          <option value="experimentando sólidos">Experimentando sólidos</option>
          <option value="alimentação independente">Alimentação independente</option>
        </select>
      </label>
      <label className="text-sm font-medium sm:col-span-2">Observações<textarea rows={2} maxLength={500} className={input} value={form.observacoes} onChange={(e) => setForm((v) => ({ ...v, observacoes: e.target.value }))} placeholder="Comportamento, atividade, mudanças observadas..."/></label>
      {erro && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{erro}</p>}
      <button type="submit" className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white sm:col-span-2">Adicionar registro temporário</button>
    </form>
    <div className="space-y-2" aria-live="polite">
      <h3 className="font-semibold">Registros desta sessão ({registros.length})</h3>
      {registros.length === 0 && <p className="text-sm text-stone-600">Nenhum registro ainda.</p>}
      {registros.map((registro) => <div key={registro.id} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{registro.data}</strong><button className="text-xs font-semibold text-red-700 underline" type="button" onClick={() => setRegistros((dados) => dados.filter((item) => item.id !== registro.id))}>Remover</button></div>
        <p>Peso: {registro.peso ? registro.peso + " g" : "não informado"} · {registro.alimentacao}</p>
        {registro.observacoes && <p className="mt-1 whitespace-pre-wrap">{registro.observacoes}</p>}
      </div>)}
    </div>
    <p className="text-xs text-stone-600">Registros não servem para diagnóstico e não definem horários, volumes ou suspensão da papa. Se observar sinais preocupantes, procure veterinário de aves.</p>
  </section>;
}
