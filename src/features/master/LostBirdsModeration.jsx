import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { RefreshCw, CheckCircle2, XCircle, Clock3, AlertCircle, Bird, Mail, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS = { pendente: "Pendente", aprovado: "Publicado", rejeitado: "Rejeitado", encerrado: "Encerrado", todos: "Todos" };
const MAIL = {
  sent: "Confirmação enviada ao provedor",
  processing: "Envio em andamento",
  failed: "Envio falhou",
  uncertain: "Entrega não confirmada",
};
const ptDate = (value) => {
  try { return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return "Data indisponível"; }
};
function emailResult(status) {
  if (status === "sent") return "Aprovação realizada. A confirmação foi aceita pelo provedor de e-mail.";
  if (status === "no_email") return "Aprovação realizada, mas não há e-mail confirmado para esta ocorrência.";
  if (status === "email_not_configured") return "Aprovação realizada. O serviço de e-mail não está configurado.";
  if (status === "provider_rejected") return "Aprovação realizada, porém o provedor rejeitou o e-mail. Verifique a configuração.";
  if (status === "delivery_uncertain") return "Aprovação realizada. Não foi possível confirmar se o e-mail saiu. Verifique o Resend antes de reenviar.";
  if (status === "error_registering") return "Aprovação realizada, mas houve falha no controle de notificações. Verifique os registros.";
  if (status === "already_approved") return "Esta ave já estava aprovada. Nenhum e-mail novo foi enviado.";
  if (status === "already_processed") return "Aprovação realizada. Esta ocorrência já possui tentativa de envio registrada.";
  return "Aprovação registrada. Atualize os dados para verificar a situação do e-mail.";
}

export default function LostBirdsModeration() {
  const [status, setStatus] = useState("pendente");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-lost-birds", {
        body: { action: "list", status, page },
      });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível consultar as aves perdidas.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.message || "Falha ao carregar as ocorrências.");
    } finally { setLoading(false); }
  }, [status, page]);
  useEffect(() => { load(); }, [load]);

  async function moderate(ad, next) {
    if (busyId) return;
    const bird = ad.data?.nomeAve || ad.data?.especie || "esta ave";
    let reason = "";
    if (next === "rejeitado") {
      const answer = window.prompt("Informe o motivo da rejeição. Essa justificativa será registrada no histórico Master:");
      if (answer === null) return;
      reason = answer.trim();
      if (reason.length < 5) {
        setError("Informe um motivo com pelo menos cinco caracteres.");
        return;
      }
    }
    const label = next === "aprovado" ? "aprovar e publicar" : next === "rejeitado" ? "rejeitar" : next === "encerrado" ? "encerrar" : "voltar à análise";
    if (!window.confirm("Confirma " + label + " o anúncio de " + bird + "?")) return;
    setBusyId(ad.id); setNotice(""); setError("");
    try {
      let data, invokeError;
      if (next === "aprovado") {
        ({ data, error: invokeError } = await supabase.functions.invoke("notify-approved-lost-bird", {
          body: { anuncio_id: ad.id },
        }));
      } else {
        ({ data, error: invokeError } = await supabase.functions.invoke("master-lost-birds", {
          body: { action: "moderate", anuncio_id: ad.id, status: next, reason },
        }));
      }
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Falha ao atualizar o status.");
      setNotice(next === "aprovado" ? emailResult(data?.email_status) : "Ocorrência atualizada para " + STATUS[next] + ".");
      if (page !== 1) setPage(1);
      else await load();
    } catch (err) { setError(err?.message || "Não foi possível concluir a moderação."); }
    finally { setBusyId(""); }
  }

  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">Controle de buscas</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[28px]">Aves perdidas e moderação</h1>
        <p className="mt-1 text-sm text-slate-500">Analise os anúncios, acompanhe o status da busca e verifique o envio de confirmação. Anúncios de venda são gerenciados em outra área.</p>
      </div>
      <button type="button" disabled={loading} onClick={load} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Atualizar</button>
    </div>
    <div className="flex flex-wrap gap-2">
      {Object.entries(STATUS).map(([key, label]) => <button key={key} type="button" aria-pressed={status === key} onClick={() => { setStatus(key); setPage(1); setNotice(""); }}
        className={"rounded-xl px-4 py-2 text-xs font-semibold " + (status === key ? "bg-[#182b45] text-white" : "border bg-white text-slate-600")}>{label}</button>)}
      <span className="ml-auto self-center text-xs text-slate-500">{result.total} ocorrência(s)</span>
    </div>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={17} className="shrink-0"/>{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Carregando ocorrências...</div> :
      result.items.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500"><Bird className="mx-auto mb-3" size={28}/>Nenhum anúncio neste filtro.</div> :
      <div className="grid gap-3">{result.items.map(ad => {
        const data = ad.data || {};
        const label = STATUS[ad.status] || ad.status;
        return <article key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">{data.foto ?
              <img src={data.foto} alt={data.nomeAve || "Ave perdida"} className="h-full w-full object-cover"/> :
              <div className="flex h-full items-center justify-center"><Bird size={32} className="text-slate-300"/></div>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h2 className="font-semibold text-slate-900">{data.nomeAve || data.especie || "Ave sem nome"}</h2>
                  <p className="mt-1 text-xs text-slate-500">{[data.especie, data.cor].filter(Boolean).join(" · ")}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{[data.bairro, data.cidade, data.uf].filter(Boolean).join(" · ") || "Local não informado"}</p>
              <p className="mt-1 text-xs text-slate-500">Cadastrado em {ptDate(ad.created_at)} · {ad.has_owner ? "Conta vinculada" : "Anúncio anterior sem conta"}</p>
              {data.contatoNome && <p className="mt-2 text-sm text-slate-600">Responsável: {data.contatoNome}</p>}
              {data.descricao && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{data.descricao}</p>}
              {ad.email_status ? <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Mail size={15}/>{MAIL[ad.email_status] || "Status do e-mail: " + ad.email_status}{ad.email_sent_at ? " · " + ptDate(ad.email_sent_at) : ""}</p> :
                <p className="mt-3 text-xs text-slate-400">E-mail automático: ainda sem envio registrado.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {ad.status !== "aprovado" && <button disabled={!!busyId} onClick={() => moderate(ad, "aprovado")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15}/>Aprovar e publicar</button>}
                {ad.status !== "rejeitado" && <button disabled={!!busyId} onClick={() => moderate(ad, "rejeitado")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"><XCircle size={15}/>Rejeitar</button>}
                {ad.status !== "encerrado" && <button disabled={!!busyId} onClick={() => moderate(ad, "encerrado")} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"><Clock3 size={15}/>Encerrar</button>}
                {ad.status !== "pendente" && <button disabled={!!busyId} onClick={() => moderate(ad, "pendente")} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">Voltar à análise</button>}
              </div>
            </div>
          </div>
        </article>;
      })}</div>}
    <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
      <span className="text-xs text-slate-500">Página {page} de {result.totalPages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={17}/></button>
        <button type="button" disabled={page >= result.totalPages || loading} onClick={() => setPage(p => p + 1)} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}