import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { RefreshCw, CheckCircle2, XCircle, Clock3, ChevronLeft, ChevronRight, AlertCircle, Megaphone } from "lucide-react";

const labels = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado" };
const money = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdsModeration() {
  const [status, setStatus] = useState("pendente");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-ads", { body: { action: "list", status, page } });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível carregar os anúncios.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) { setError(err.message || "Falha ao carregar anúncios."); }
    finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  async function moderate(item, nextStatus) {
    const name = item.data?.nomeAve || "este anúncio";
    const action = nextStatus === "aprovado" ? "aprovar e publicar" : nextStatus === "rejeitado" ? "rejeitar" : "retornar para análise";
    if (!window.confirm(`Confirma ${action} ${name}?`)) return;
    setBusyId(item.id); setError(""); setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-ads", { body: { action: "moderate", ad_id: item.id, status: nextStatus } });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível moderar.");
      setNotice(`Anúncio atualizado: ${labels[nextStatus]}.`); await load();
    } catch (err) { setError(err.message || "Falha na moderação."); }
    finally { setBusyId(""); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Controle da plataforma</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Anúncios e moderação</h1><p className="mt-1.5 text-sm text-slate-500">Analise os anúncios enviados pelos criadores e controle sua publicação.</p></div>
      <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Atualizar</button>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {["pendente","aprovado","rejeitado","todos"].map(v => <button key={v} onClick={() => {setStatus(v);setPage(1);}} className={`rounded-xl px-3.5 py-2 text-xs font-semibold ${status===v?"bg-[#182b45] text-white":"border border-slate-200 bg-white text-slate-600"}`}>{v==="todos"?"Todos":labels[v]}</button>)}
      <span className="ml-auto text-xs text-slate-500">{loading?"Carregando…":`${result.total.toLocaleString("pt-BR")} anúncios`}</span>
    </div>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle size={17}/>{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    {loading ? <div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">Carregando anúncios…</div> : result.items.length===0 ? <div className="rounded-2xl border bg-white p-10 text-center"><Megaphone size={28} className="mx-auto text-slate-300"/><p className="mt-3 text-sm text-slate-600">Nenhum anúncio neste filtro.</p></div> :
      <div className="grid gap-3">{result.items.map(item => { const ad=item.data||{}; const creator=item.criador||{}; return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">{ad.foto?<img src={ad.foto} alt={ad.nomeAve||"Ave anunciada"} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-slate-300"><Megaphone size={28}/></div>}</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap justify-between gap-2"><div><h2 className="font-semibold text-slate-900">{ad.nomeAve||"Ave sem nome"}</h2><p className="mt-1 text-xs text-slate-500">{ad.especie||"Espécie não informada"} · {ad.corMutacao||"Mutação não informada"} · {ad.sexo||"Sexo não informado"}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{labels[item.status]||"Pendente"}</span></div>
            <p className="mt-3 text-lg font-bold text-emerald-700">{money(ad.preco)}</p>
            {ad.descricao&&<p className="mt-2 line-clamp-2 text-sm text-slate-500">{ad.descricao}</p>}
            <p className="mt-2 text-xs text-slate-500">{creator.nomeCriatorio||creator.nomeCompleto||"Criador sem nome"} · {[creator.cidade,creator.uf].filter(Boolean).join("/")}</p>
            {item.ativo===false&&<p className="mt-1 text-xs text-amber-700">Anúncio desativado pelo criador.</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {item.status!=="aprovado"&&<button disabled={busyId===item.id} onClick={()=>moderate(item,"aprovado")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={14}/> Aprovar e publicar</button>}
              {item.status!=="rejeitado"&&<button disabled={busyId===item.id} onClick={()=>moderate(item,"rejeitado")} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"><XCircle size={14}/> Rejeitar</button>}
              {item.status!=="pendente"&&<button disabled={busyId===item.id} onClick={()=>moderate(item,"pendente")} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"><Clock3 size={14}/> Voltar para análise</button>}
            </div>
          </div>
        </div>
      </article>;})}</div>}
    <div className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5"><span className="text-xs text-slate-500">Página {page} de {result.totalPages}</span><div className="flex gap-2"><button disabled={page<=1||loading} onClick={()=>setPage(v=>v-1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button disabled={page>=result.totalPages||loading} onClick={()=>setPage(v=>v+1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
    <p className="text-[11px] leading-5 text-slate-400">Ações validadas no servidor e registradas no histórico administrativo. Os filtros exibem 20 anúncios por página.</p>
  </section>;
}
