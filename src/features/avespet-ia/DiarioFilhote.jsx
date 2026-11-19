import React, { useEffect, useState } from "react";

import { validarRegistro, dataHojeLocal, historicoPeso } from "./diarioValidacao";
import { DIARIO_PERSISTENCIA_ATIVA, listarDiario, salvarDiario, excluirRegistroDiario } from "./diarioService";
import GraficoPeso from "./GraficoPeso";

export default function DiarioFilhote({ aveNome = "Minha ave", aveId = "", userId = "" }) {
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState({ data: dataHojeLocal(), peso: "", observacoes: "", alimentacao: "não informado" });
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const persistente = DIARIO_PERSISTENCIA_ATIVA && Boolean(aveId && userId);
  const pesos = historicoPeso(registros);
  useEffect(() => {
    if (!persistente) return;
    let ativo = true;
    setCarregando(true);
    listarDiario(userId, aveId)
      .then((dados) => { if (ativo) setRegistros(dados); })
      .catch(() => { if (ativo) setErro("Não foi possível consultar o diário. Tente novamente."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [persistente, userId, aveId]);
  const enviar = async (event) => {
    event.preventDefault();
    if (salvando || carregando) return;
    const mensagem = validarRegistro(form);
    if (mensagem) { setErro(mensagem); return; }
    setSalvando(true);
    setErro("");
    try {
      const id = persistente
        ? await salvarDiario(userId, aveId, form)
        : String(Date.now()) + "-" + registros.length;
      setRegistros((dados) => [{ ...form, id }, ...dados]);
      setForm((atual) => ({ ...atual, peso: "", observacoes: "" }));
    } catch {
      setErro("Não foi possível salvar. Nenhum registro foi acrescentado.");
    } finally {
      setSalvando(false);
    }
  };
  const remover = async (id) => {
    if (salvando || carregando) return;
    setSalvando(true);
    setErro("");
    try {
      if (persistente) await excluirRegistroDiario(userId, aveId, id);
      setRegistros((dados) => dados.filter((item) => item.id !== id));
    } catch {
      setErro("Não foi possível remover o registro.");
    } finally {
      setSalvando(false);
    }
  };
  const input = "mt-1 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-stone-900";
  return <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4">
    <div>
      <h2 className="text-lg font-bold text-emerald-950">Diário de desenvolvimento</h2>
      <p className="text-sm text-stone-600">Acompanhe {aveNome} com anotações simples. {persistente ? "Registros vinculados à sua ave." : "Dados temporários nesta versão: eles desaparecem ao atualizar a página."}</p>
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
      <button type="submit" disabled={salvando || carregando} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">{salvando ? "Salvando..." : persistente ? "Salvar no diário" : "Adicionar registro temporário"}</button>
    </form>
    <GraficoPeso pesos={pesos} />
    {pesos.length > 0 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><h3 className="font-semibold text-emerald-950">Histórico de peso registrado</h3><p className="mb-2 text-xs text-stone-600">Registro visual, não é uma curva clínica de crescimento.</p><div className="flex flex-wrap items-end gap-2">{pesos.map((item, i) => <div key={item.data + "-" + i} className="rounded-lg bg-white px-3 py-2 text-xs"><strong>{item.peso.toLocaleString("pt-BR")} g</strong><div className="text-stone-500">{item.data.split("-").reverse().join("/")}</div></div>)}</div></div>}
    <div className="space-y-2" aria-live="polite">
      <h3 className="font-semibold">{persistente ? "Registros da ave" : "Registros desta sessão"} ({registros.length})</h3>
      {registros.length === 0 && <p className="text-sm text-stone-600">Nenhum registro ainda.</p>}
      {registros.map((registro) => <div key={registro.id} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{registro.data}</strong><button className="text-xs font-semibold text-red-700 underline" type="button" disabled={salvando || carregando} onClick={() => remover(registro.id)}>Remover</button></div>
        <p>Peso: {registro.peso ? registro.peso + " g" : "não informado"} · {registro.alimentacao}</p>
        {registro.observacoes && <p className="mt-1 whitespace-pre-wrap">{registro.observacoes}</p>}
      </div>)}
    </div>
    <p className="text-xs text-stone-600">Registros não servem para diagnóstico e não definem horários, volumes ou suspensão da papa. Se observar sinais preocupantes, procure veterinário de aves.</p>
  </section>;
}
