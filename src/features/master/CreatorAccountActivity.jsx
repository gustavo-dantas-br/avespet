import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Bird, History, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Não informado"
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};

const actionLabels = {
  account_profile_updated: "Cadastro atualizado pelo Master",
  creator_account_blocked: "Conta bloqueada",
  creator_account_unblocked: "Conta desbloqueada",
  creator_account_block_requested: "Bloqueio solicitado",
  creator_account_unblock_requested: "Desbloqueio solicitado",
  account_password_reset_requested: "Ação de acesso solicitada",
  account_password_reset: "Ação de acesso concluída",
  master_invitation_created: "Convite administrativo criado",
  master_password_reset_requested: "Solicitação de acesso registrada",
  master_password_reset_completed: "Solicitação de acesso concluída",
};

const initialResult = { items: [], total: 0, totalPages: 1 };

export default function CreatorAccountActivity({ userId }) {
  const [section, setSection] = useState("birds");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setResult(initialResult);

    async function load() {
      try {
        const { data, error: requestError } = await supabase.functions.invoke("master-creator-details", {
          body: { action: section, user_id: userId, page },
        });
        if (requestError || data?.error) throw new Error(data?.error || "Não foi possível carregar a consulta administrativa.");
        if (active) setResult(data || initialResult);
      } catch (err) {
        if (active) setError(err?.message || "Falha ao consultar o histórico.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [userId, section, page, refreshKey]);

  const chooseSection = (next) => {
    if (next !== section) {
      setSection(next);
      setPage(1);
    }
  };

  return (
    <section className="mt-7 border-t border-slate-100 pt-6" aria-label="Histórico e aves da conta">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Informações vinculadas</h3>
          <p className="mt-1 text-xs text-slate-500">Consultas administrativas, sem alteração de dados.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          aria-label="Atualizar informações vinculadas"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      <div role="tablist" aria-label="Informações do criador" className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={section === "birds"}
          onClick={() => chooseSection("birds")}
          className={"inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold " + (section === "birds" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600")}
        >
          <Bird size={15} /> Aves vinculadas
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "history"}
          onClick={() => chooseSection("history")}
          className={"inline-flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-xs font-semibold " + (section === "history" ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600")}
        >
          <History size={15} /> Histórico Master
        </button>
      </div>

      <div role="tabpanel" className="mt-3">
        {error && <p role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={15} className="shrink-0" />{error}</p>}
        {loading ? (
          <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">Carregando informações…</div>
        ) : !error && !result.items.length ? (
          <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            {section === "birds" ? "Este usuário ainda não possui aves cadastradas." : "Nenhuma ação administrativa encontrada para esta conta."}
          </div>
        ) : !error ? (
          <div className="space-y-2">
            <p className="text-[11px] text-slate-500">{result.total} {section === "birds" ? "ave(s) vinculada(s)" : "evento(s) administrativo(s)"}</p>
            {section === "birds"
              ? result.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <strong className="text-xs text-slate-800">{item.name || "Ave sem nome"}</strong>
                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-slate-700">{item.status || "Sem status"}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">{[item.species, item.mutation, item.sex].filter(Boolean).join(" · ") || "Dados da ave não informados"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Anilha: {item.ring || "Não informada"}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Atualizada em {formatDate(item.updatedAt)}</p>
                </article>
              ))
              : result.items.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <strong className="text-xs text-slate-800">{actionLabels[item.action] || "Ação administrativa: " + item.action}</strong>
                  <p className="mt-1 text-[11px] text-slate-500">{formatDate(item.createdAt)} · {item.performedBy}</p>
                  {item.reason && <p className="mt-2 whitespace-pre-wrap break-words text-[11px] text-slate-600">Motivo registrado: {item.reason}</p>}
                </article>
              ))
            }
          </div>
        ) : null}
      </div>

      {!loading && !error && result.totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500">Página {page} de {result.totalPages}</span>
          <div className="flex gap-2">
            <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronLeft size={15} /></button>
            <button type="button" aria-label="Próxima página" disabled={page >= result.totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-30"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] leading-4 text-slate-400">Não são exibidos dados financeiros, compradores, fotos, anotações privadas ou outros campos internos das aves.</p>
    </section>
  );
}
