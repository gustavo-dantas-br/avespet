import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { RefreshCw, Search, Bird, ChevronLeft, ChevronRight, AlertCircle, ShieldCheck } from "lucide-react";

const dateLabel = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function BirdsManagement() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState("");
  const [sex, setSex] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-list-birds", {
        body: { page, search, species, sex },
      });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível carregar os registros.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "Falha ao carregar aves.");
    } finally {
      setLoading(false);
    }
  }, [page, search, species, sex]);

  useEffect(() => { load(); }, [load]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function changeSpecies(value) { setPage(1); setSpecies(value); }
  function changeSex(value) { setPage(1); setSex(value); }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Controle da plataforma</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Gestão de aves</h1><p className="mt-1.5 text-sm text-slate-500">Consulte os registros cadastrados pelos criadores. Esta área é somente leitura.</p></div>
      <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Atualizar</button>
    </div>

    <form onSubmit={applySearch} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_auto]">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Buscar por nome, anilha ou mutação</span><div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3"><Search size={16} className="shrink-0 text-slate-400"/><input value={searchInput} onChange={(event)=>setSearchInput(event.target.value)} placeholder="Digite para buscar..." className="min-w-0 flex-1 py-2.5 text-sm outline-none"/></div></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Espécie</span><select value={species} onChange={(event)=>changeSpecies(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Todas</option><option value="Ring Neck">Ring Neck</option><option value="Calopsita">Calopsita</option></select></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Sexo</span><select value={sex} onChange={(event)=>changeSex(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Todos</option><option value="Macho">Macho</option><option value="Femea">Fêmea</option><option value="Indefinido">Indefinido</option></select></label>
        <div className="flex items-end"><button type="submit" className="w-full rounded-xl bg-[#182b45] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90">Buscar</button></div>
      </div>
    </form>

    {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17}/>{error}</div>}
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-700">{loading ? "Consultando registros…" : `${Number(result.total || 0).toLocaleString("pt-BR")} aves encontradas`}</span><span className="flex items-center gap-1.5 text-[11px] text-emerald-700"><ShieldCheck size={14}/> Consulta protegida · somente leitura</span></div>

    {loading ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Carregando registros…</div> : result.items.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><Bird size={28} className="mx-auto text-slate-300"/><p className="mt-3 text-sm text-slate-600">Nenhuma ave encontrada com esses filtros.</p></div> :
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_minmax(0,1fr)_140px] gap-3 border-b bg-slate-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid"><span>Ave</span><span>Espécie / mutação</span><span>Sexo</span><span>Criador</span><span>Atualização</span></div>
        <div className="divide-y divide-slate-100">{result.items.map((item)=> <article key={item.id} className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_110px_minmax(0,1fr)_140px] md:items-center md:gap-3">
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.name || "Ave sem nome"}</p><p className="mt-1 text-[11px] text-slate-400">Anilha: {item.ring || "Não informada"}</p></div>
          <div className="min-w-0"><p className="text-xs text-slate-700">{item.species || "Espécie não informada"}</p><p className="mt-1 truncate text-[11px] text-slate-400">{item.mutation || "Mutação não informada"}</p></div>
          <div><span className="text-xs text-slate-600">{item.sex || "Indefinido"}</span></div>
          <div className="min-w-0"><p className="truncate text-xs text-slate-600">{item.creator}</p></div>
          <div><p className="text-xs text-slate-600">{dateLabel(item.updatedAt)}</p></div>
        </article>)}</div>
      </div>}

    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5"><span className="text-xs text-slate-500">Página {page} de {result.totalPages || 1} · 25 registros por página</span><div className="flex gap-2"><button type="button" disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)} aria-label="Página anterior" className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button type="button" disabled={page>=(result.totalPages||1)||loading} onClick={()=>setPage(v=>v+1)} aria-label="Próxima página" className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
    <p className="text-[11px] leading-5 text-slate-400">A consulta não exibe fotos, telefones, dados de compradores ou outros campos privados. O acesso administrativo é validado no servidor e cada consulta é registrada no histórico Master.</p>
  </section>;
}
