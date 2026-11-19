import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import { LifeBuoy, Search, RefreshCw, Save, ChevronLeft, ChevronRight, AlertCircle, UserCheck, UserX, ClipboardList, Mail, History } from "lucide-react";

const kindLabels = { achado: "Ave encontrada", perdida: "Ave perdida", campanha: "Campanha" };
const states = [["novo", "Novo"], ["em_andamento", "Em andamento"], ["aguardando", "Aguardando retorno"], ["concluido", "Concluído"]];
const priorities = [["normal", "Normal"], ["alta", "Alta"], ["urgente", "Urgente"]];
const formatDate = (value) => {
  if (!value) return "Sem data";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sem data" : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};
const selectClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800";
const empty = { items: [], total: 0, totalPages: 1, page: 1, partial: false };

export default function SupportOperations({ onPrepareEmail }) {
  const [kind, setKind] = useState("all");
  const [state, setState] = useState("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ status: "novo", priority: "normal", note: "", assignment: "keep" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [preparingEmailId, setPreparingEmailId] = useState("");
  const [history, setHistory] = useState({ entries:[], loading:false, error:"", syncNote:"" });
  const listRequestId = useRef(0); // Ignora retornos atrasados de filtros/páginas anteriores.

  const load = useCallback(async () => {
    const requestId = ++listRequestId.current;
    setError("");
    setLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-support-operations", {
        body: { action: "list", type: kind, state, search: appliedSearch, page },
      });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível consultar os atendimentos.");
      if (requestId === listRequestId.current) setResult(data);
    } catch (err) {
      if (requestId === listRequestId.current) setResult(empty);
      if (requestId === listRequestId.current) setError(err?.message || "Falha ao consultar os atendimentos.");
    } finally {
      if (requestId === listRequestId.current) setLoading(false);
    }
  }, [kind, state, appliedSearch, page, reload]);

  useEffect(() => {
    load();
    return () => { listRequestId.current += 1; };
  }, [load]);

  const loadHistory = async (item) => {
    if (item.source !== "perdida") return;
    setHistory((prev)=>({...prev,loading:true,error:"",syncNote:""}));
    try {
      const {data,error:invokeError}=await supabase.functions.invoke("master-support-operations",{
        body:{action:"timeline",source:"perdida",source_id:item.id}
      });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Histórico indisponível.");
      setHistory({entries:data.entries||[],loading:false,error:"",syncNote:data.replySync?.note||""});
    } catch(err) {
      setHistory((prev)=>({...prev,loading:false,error:err?.message||"Não foi possível carregar o histórico."}));
    }
  };
  const startEdit = (item) => {
    setSelected(item);
    setForm({ status: item.status, priority: item.priority, note: item.note || "", assignment: "keep" });
    setError("");
    setNotice("");
    setHistory({entries:[],loading:item.source==="perdida",error:"",syncNote:""});
    loadHistory(item);
  };
  const updateFilter = (setter, value) => { setter(value); setPage(1); setSelected(null); };
  const doSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(search.trim());
    setPage(1);
    setSelected(null);
  };

  const prepareEmail = async (item) => {
    if (item.source !== "perdida" || preparingEmailId) return;
    setError("");
    setNotice("");
    setPreparingEmailId(item.id);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-support-operations", {
        body: { action: "prepare-email", source_id: item.id },
      });
      if (invokeError || data?.error || !data?.success || !data.draft) {
        throw new Error(data?.error || "Não foi possível preparar a solicitação por e-mail.");
      }
      if (typeof onPrepareEmail !== "function") throw new Error("Central de Comunicação indisponível.");
      onPrepareEmail(data.draft);
    } catch (err) {
      setError(err?.message || "Falha ao preparar o atendimento.");
    } finally {
      setPreparingEmailId("");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-support-operations", {
        body: { action: "save", source: selected.source, source_id: selected.id, status: form.status, priority: form.priority, assignment: form.assignment, note: form.note },
      });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível salvar o acompanhamento.");
      setSelected(null);
      setNotice("Acompanhamento salvo no Master. O registro original não foi alterado.");
      setReload((n) => n + 1);
    } catch (err) {
      setError(err?.message || "Falha ao atualizar o caso.");
    } finally {
      setSaving(false);
    }
  };

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Atendimento interno</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]"><LifeBuoy size={25} /> Suporte operacional</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">Acompanhe ocorrências de aves encontradas, anúncios de aves perdidas e solicitações de campanhas. Este módulo permite preparar uma solicitação de informações; o envio exige revisão e confirmação na Central de Comunicação.</p>
      </div>
      <button type="button" onClick={() => setReload((n) => n + 1)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar</button>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <form onSubmit={doSearch} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.3fr_auto] sm:items-end">
        <label className="text-xs font-semibold text-slate-600">Tipo
          <select className={"mt-1.5 " + selectClass} value={kind} onChange={(e) => updateFilter(setKind, e.target.value)}>
            <option value="all">Todos os casos</option><option value="achado">Aves encontradas</option><option value="perdida">Aves perdidas</option><option value="campanha">Campanhas</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Acompanhamento
          <select className={"mt-1.5 " + selectClass} value={state} onChange={(e) => updateFilter(setState, e.target.value)}>
            <option value="all">Todas as situações</option>{states.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Buscar
          <input className={"mt-1.5 " + selectClass} value={search} onChange={(e) => setSearch(e.target.value)} maxLength={80} placeholder="Ave, anilha, contato ou cidade" />
        </label>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs font-semibold text-white"><Search size={15} /> Pesquisar</button>
      </form>
      {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={16} className="shrink-0" /> {error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800"><ClipboardList size={17} /> Fila de atendimento</h2>
        <span className="text-xs text-slate-500">{loading ? "Atualizando…" : result.total + " caso(s)"}</span>
      </div>
      {result.partial && <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Há mais de 250 registros em pelo menos uma origem. Os resultados desta versão podem ser parciais; ampliação da paginação ficará para uma próxima etapa.</p>}
      <div className="mt-3 space-y-2">
        {loading ? <p className="rounded-xl border border-slate-200 p-7 text-center text-xs text-slate-500">Carregando atendimentos…</p>
          : !error && !result.items.length ? <p className="rounded-xl border border-slate-200 p-7 text-center text-sm text-slate-500">Nenhum caso encontrado neste filtro.</p>
          : !error ? result.items.map((item) => <article key={item.source + ":" + item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase text-slate-500">{kindLabels[item.source]} · {formatDate(item.createdAt)}</span>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">Origem: {item.originStatus || "Sem status"} · Acompanhamento: {states.find(([v]) => v === item.status)?.[1] || item.status}</p>
              </div>
              <span className={"rounded-lg px-2.5 py-1 text-[11px] font-semibold " + (item.priority === "urgente" ? "bg-rose-100 text-rose-700" : item.priority === "alta" ? "bg-amber-100 text-amber-800" : "bg-white text-slate-600")}>{priorities.find(([v]) => v === item.priority)?.[1] || item.priority}</span>
            </div>
            <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
              <p><strong>Contato:</strong> {item.contactName || "Não informado"}</p>
              <p><strong>Telefone:</strong> {item.contactPhone || "Não informado"}</p>
              {item.ring && <p><strong>Anilha:</strong> {item.ring}</p>}
              {item.city && <p><strong>Cidade:</strong> {item.city}</p>}
              <p><strong>Responsável:</strong> {item.assigneeLabel}</p>
            </div>
            {item.details && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-500">{item.details}</p>}
            {item.source === "perdida" && item.missingFields?.length > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Faltam para ajudar na busca: {item.missingFields.join(", ")}.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Acompanhar caso</button>
              {item.source === "perdida" && item.missingFields?.length > 0 && item.originStatus !== "encerrado" && item.hasOwner && (
                <button type="button" disabled={Boolean(preparingEmailId)} onClick={() => prepareEmail(item)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  <Mail size={14} /> {preparingEmailId === item.id ? "Preparando..." : "Solicitar dados por e-mail"}
                </button>
              )}
              {item.source === "perdida" && item.missingFields?.length > 0 && !item.hasOwner && (
                <p className="self-center text-xs text-slate-500">Sem conta vinculada: atendimento manual necessário.</p>
              )}
            </div>
          </article>) : null}
      </div>
      {!loading && !error && result.totalPages > 1 && <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">Página {page} de {result.totalPages}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} aria-label="Página anterior" onClick={() => setPage((n) => Math.max(1, n - 1))} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronLeft size={16} /></button>
          <button type="button" disabled={page >= result.totalPages} aria-label="Próxima página" onClick={() => setPage((n) => n + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>}
    </div>

    {selected && <div role="dialog" aria-modal="true" aria-label="Acompanhamento de caso" className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-bold uppercase text-amber-700">Acompanhamento interno</p><h2 className="mt-1 text-lg font-bold text-slate-900">{selected.title}</h2></div>
          <button type="button" onClick={() => setSelected(null)} aria-label="Fechar" className="rounded-xl border border-slate-200 px-3 py-1.5 text-lg text-slate-600">×</button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">As alterações aqui não mudam o status original do anúncio, achado ou campanha e não enviam mensagens.</p>
        {selected.source === "perdida" && (
          <section className="mt-4 rounded-xl border border-slate-200 p-3" aria-label="Histórico da ave">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><History size={16} /> Histórico do atendimento</h3>
              <button type="button" disabled={history.loading} onClick={()=>loadHistory(selected)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 disabled:opacity-50">
                <RefreshCw size={13} /> Conferir respostas
              </button>
            </div>
            {history.loading ? <p className="mt-2 text-xs text-slate-500">Carregando eventos...</p>
              : history.error ? <p role="alert" className="mt-2 text-xs text-rose-700">{history.error}</p>
              : history.entries.length ? (
                <ol className="mt-3 max-h-48 space-y-2 overflow-y-auto border-l border-slate-200 pl-3">
                  {history.entries.map(event => <li key={event.id} className="text-xs text-slate-700">
                    <strong>{event.summary}</strong>
                    <p className="text-slate-400">{formatDate(event.createdAt)}</p>
                  </li>)}
                </ol>
              ) : <p className="mt-2 text-xs text-slate-500">Ainda sem registros adicionais.</p>}
            {history.syncNote && <p className="mt-2 text-[11px] text-slate-500">{history.syncNote}</p>}
            <p className="mt-2 text-[11px] text-slate-500">Somente envios confirmados pelo serviço são marcados como enviados. A conferência de respostas ocorre ao abrir este atendimento e ao clicar em Conferir respostas. São vinculadas apenas conversas verificadas. Nenhum e-mail é enviado automaticamente.</p>
          </section>
        )}
        <form onSubmit={save} className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">Situação do atendimento
            <select className={"mt-1.5 " + selectClass} value={form.status} onChange={(e) => setForm((f) => ({...f, status: e.target.value}))}>
              {states.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">Prioridade
            <select className={"mt-1.5 " + selectClass} value={form.priority} onChange={(e) => setForm((f) => ({...f, priority: e.target.value}))}>
              {priorities.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">Responsável
            <select className={"mt-1.5 " + selectClass} value={form.assignment} onChange={(e) => setForm((f) => ({...f, assignment: e.target.value}))}>
              <option value="keep">Manter atual ({selected.assigneeLabel})</option>
              <option value="self">Assumir atendimento</option>
              <option value="none">Deixar sem responsável</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">Observações internas
            <textarea className={selectClass + " mt-1.5 min-h-[104px]"} value={form.note} onChange={(e) => setForm((f) => ({...f, note: e.target.value}))} maxLength={2000} placeholder="Registre as providências tomadas e os próximos passos. Não insira senhas ou dados bancários." />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Save size={15} /> {saving ? "Salvando…" : "Salvar acompanhamento"}</button>
            <button type="button" disabled={saving} onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancelar</button>
          </div>
        </form>
      </div>
    </div>}
    <p className="text-[11px] leading-5 text-slate-500">Acesso restrito ao Master. Contatos e notas internas não são públicos. Os pedidos de complementação abrem um rascunho na Central de Comunicação; nada é enviado sem confirmação manual.</p>
  </section>;
}
