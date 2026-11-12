import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Search, RefreshCw, Users, Bird, Mail, MapPin, CalendarDays, Clock3, ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle, ShieldOff, ShieldCheck } from "lucide-react";

const fmtDate = (value) => value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Nunca acessou";
const fmtDateTime = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem acesso registrado";

function Status({ blocked, confirmed }) {
  if (blocked) return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700"><ShieldOff size={12} /> Bloqueado</span>;
  if (!confirmed) return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"><AlertCircle size={12} /> E-mail pendente</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={12} /> Ativo</span>;
}

export default function CreatorManagement() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-list-creators", {
        body: { search: query, page },
      });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível consultar os criadores.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Não foi possível consultar os criadores.");
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { load(); }, [load]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Gestão de pessoas</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Criadores e usuários</h1><p className="mt-1.5 text-sm text-slate-500">Consulte contas, perfis, atividade e situação cadastral.</p></div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar</button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Perfis encontrados</span><Users size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{loading ? "—" : new Intl.NumberFormat("pt-BR").format(result.total)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Nesta página</span><Users size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{loading ? "—" : result.items.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-500">Página atual</span><CalendarDays size={17} className="text-slate-400" /></div><p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{page}<span className="text-sm font-medium text-slate-400"> / {result.totalPages}</span></p></div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1"><span className="sr-only">Buscar criador</span><Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, criatório, cidade ou e-mail" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100" /></label>
          <button type="submit" className="rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "#1d3553" }}>Buscar</button>
        </form>
        {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</div>}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-3 font-semibold">Criador</th><th className="px-3 py-3 font-semibold">Localização</th><th className="px-3 py-3 font-semibold">Aves</th><th className="px-3 py-3 font-semibold">Situação</th><th className="px-3 py-3 font-semibold">Cadastro</th><th className="px-3 py-3 font-semibold text-right">Detalhes</th></tr></thead>
            <tbody>
              {loading ? Array.from({ length: 5 }, (_, i) => <tr key={i} className="border-b border-slate-50"><td colSpan="6" className="px-3 py-4"><div className="h-5 animate-pulse rounded bg-slate-100" /></td></tr>) :
              result.items.length ? result.items.map((item) => <tr key={item.userId} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                <td className="px-3 py-4"><div className="font-semibold text-sm text-slate-800">{item.name}</div><div className="mt-1 text-xs text-slate-400">{item.creatorName || item.email || "Sem nome de criatório"}</div></td>
                <td className="px-3 py-4 text-xs text-slate-500">{[item.city, item.state].filter(Boolean).join(" / ") || "Não informado"}</td>
                <td className="px-3 py-4"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700"><Bird size={14} className="text-slate-400" />{item.birdsCount}</span></td>
                <td className="px-3 py-4"><Status blocked={item.blocked} confirmed={item.emailConfirmed} /></td>
                <td className="px-3 py-4 text-xs text-slate-500">{fmtDate(item.createdAt)}</td>
                <td className="px-3 py-4 text-right"><button onClick={() => setSelected(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white">Ver perfil</button></td>
              </tr>) : <tr><td colSpan="6" className="px-3 py-12 text-center"><Users size={26} className="mx-auto text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Nenhum criador encontrado</p><p className="mt-1 text-xs text-slate-400">Tente outro termo de busca.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><p className="text-xs text-slate-400">Mostrando {result.items.length} de {result.total} perfis</p><div className="flex items-center gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronLeft size={16} /></button><span className="min-w-14 text-center text-xs font-semibold text-slate-600">{page} / {result.totalPages}</span><button disabled={page >= result.totalPages || loading} onClick={() => setPage((value) => value + 1)} aria-label="Próxima página" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronRight size={16} /></button></div></div>
      </div>

      {selected && <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40" onClick={() => setSelected(null)}><aside role="dialog" aria-modal="true" aria-label="Detalhes do criador" onClick={(event) => event.stopPropagation()} className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">Ficha do criador</p><h2 className="mt-2 text-xl font-bold text-slate-900">{selected.name}</h2><p className="mt-1 text-sm text-slate-500">{selected.creatorName || "Criatório não informado"}</p></div><button onClick={() => setSelected(null)} aria-label="Fechar detalhes" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div>
        <div className="mt-6"><Status blocked={selected.blocked} confirmed={selected.emailConfirmed} /></div>
        <div className="mt-6 space-y-4">
          <div className="flex gap-3"><Mail size={17} className="mt-0.5 text-slate-400" /><div className="min-w-0"><p className="text-[11px] text-slate-400">E-mail da conta</p><p className="break-all text-sm font-medium text-slate-800">{selected.email || "Não informado"}</p></div></div>
          <div className="flex gap-3"><MapPin size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Localização</p><p className="text-sm font-medium text-slate-800">{[selected.city, selected.state].filter(Boolean).join(" / ") || "Não informado"}</p></div></div>
          <div className="flex gap-3"><Bird size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Aves cadastradas</p><p className="text-sm font-medium text-slate-800">{selected.birdsCount}</p></div></div>
          <div className="flex gap-3"><CalendarDays size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Data de cadastro</p><p className="text-sm font-medium text-slate-800">{fmtDate(selected.createdAt)}</p></div></div>
          <div className="flex gap-3"><Clock3 size={17} className="mt-0.5 text-slate-400" /><div><p className="text-[11px] text-slate-400">Último acesso</p><p className="text-sm font-medium text-slate-800">{fmtDateTime(selected.lastSignInAt)}</p></div></div>
          {selected.blocked && <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">Bloqueio válido até: {fmtDateTime(selected.blockedUntil)}</div>}
        </div>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-700"><ShieldCheck size={16} /><p className="text-xs font-semibold">Consulta administrativa somente leitura</p></div><p className="mt-1.5 text-xs leading-5 text-slate-500">Nenhuma alteração na conta é realizada por esta tela. Ações administrativas terão confirmação e auditoria próprias.</p></div>
      </aside></div>}
    </section>
  );
}
