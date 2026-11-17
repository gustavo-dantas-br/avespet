import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { ShieldCheck, History, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Eye } from "lucide-react";

const actionNames = {
  dashboard_summary_viewed: "Visualização do painel geral",
  accounts_list_viewed: "Consulta de contas",
  creators_list_viewed: "Consulta de criadores",
  master_ads_list_viewed: "Consulta de anúncios",
  master_birds_list_viewed: "Consulta de aves",
  platform_plans_list_viewed: "Consulta de planos",
  master_creator_activity_viewed: "Consulta de detalhes do criador",
  master_audit_log_viewed: "Consulta ao histórico administrativo",
  creator_profile_update_requested: "Solicitação de edição do perfil",
  account_profile_updated: "Perfil de criador atualizado",
  creator_account_block_requested: "Solicitação de bloqueio",
  creator_account_blocked: "Conta bloqueada",
  creator_account_unblock_requested: "Solicitação de desbloqueio",
  creator_account_unblocked: "Conta desbloqueada",
  master_ads_moderated: "Moderação de anúncio",
  platform_plan_created: "Plano cadastrado",
  platform_plan_updated: "Plano atualizado",
  creator_entitlements_overridden: "Permissões individuais alteradas",
  creator_entitlements_cleared: "Permissões individuais removidas",
  account_password_reset_requested: "Operação de acesso solicitada",
  account_password_reset: "Operação de acesso concluída",
  master_password_reset_requested: "Solicitação de acesso Master",
  master_password_reset_completed: "Conclusão de acesso Master",
  master_invitation_created: "Convite Master criado",
};
const resourceNames = {
  account: "Conta", creator: "Criador", auth_user: "Usuário",
  bird: "Ave", ad: "Anúncio", platform: "Plataforma",
  platform_plan: "Plano", creator_subscription: "Assinatura",
  creator_entitlement_override: "Permissão individual",
};
const resources = [
  ["", "Todas as áreas"], ["account", "Contas"], ["creator", "Criadores"],
  ["bird", "Aves"], ["ad", "Anúncios"], ["platform", "Plataforma"],
  ["platform_plan", "Planos"], ["creator_entitlement_override", "Permissões individuais"],
  ["creator_subscription", "Assinaturas"], ["auth_user", "Usuários"],
];
const dateTime = (date) => {
  if (!date) return "Sem data";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "Sem data" : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
};
const empty = { items: [], page: 1, total: 0, totalPages: 1 };

export default function MasterAudit() {
  const [scope, setScope] = useState("changes");
  const [resourceType, setResourceType] = useState("");
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(empty);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const { data, error: requestError } = await supabase.functions.invoke("master-audit-events", {
          body: { scope, resource_type: resourceType, days, page },
        });
        if (requestError || data?.error) throw new Error(data?.error || "Não foi possível consultar o histórico administrativo.");
        if (active) setResult(data || empty);
      } catch (err) {
        if (active) {
          setError(err?.message || "Não foi possível carregar os registros.");
          setResult(empty);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [scope, resourceType, days, page, reload]);

  const applyFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Administração segura</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Auditoria e segurança</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Histórico de atividades do Master. Nenhum cadastro ou permissão é alterado nesta tela.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setReload((x) => x + 1)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500"><History size={16} /> Eventos encontrados</div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{loading ? "—" : new Intl.NumberFormat("pt-BR").format(result.total)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={16} /> Acesso</div>
          <p className="mt-2 text-sm font-semibold text-slate-800">Exclusivo Master</p>
          <p className="mt-1 text-[11px] text-slate-500">Autorização conferida no servidor</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-semibold text-slate-600">Tipo de atividade
            <select value={scope} onChange={(e) => applyFilter(setScope, e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
              <option value="changes">Ações e alterações</option>
              <option value="all">Todas, inclusive consultas</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Área
            <select value={resourceType} onChange={(e) => applyFilter(setResourceType, e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
              {resources.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">Período
            <select value={days} onChange={(e) => applyFilter(setDays, e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="all">Todo o histórico</option>
            </select>
          </label>
        </div>
        {error && <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle size={15} className="shrink-0" /> {error}</p>}

        <div className="mt-5 space-y-2" aria-live="polite">
          {loading ? <div className="rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">Carregando registros…</div>
            : !error && result.items.length ? result.items.map((item) => (
              <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <strong className="text-sm text-slate-800">{actionNames[item.action] || item.action.replace(/_/g, " ")}</strong>
                  <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{resourceNames[item.resourceType] || "Outra área"}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{dateTime(item.createdAt)} · {item.actorLabel}</p>
                {item.resourceRef && <p className="mt-1 text-[10px] text-slate-500">Referência: {item.resourceRef}</p>}
              </article>
            ))
              : !error ? <div className="rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">Nenhum registro encontrado para os filtros selecionados.</div> : null}
        </div>

        {!loading && !error && result.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">Página {page} de {result.totalPages}</span>
            <div className="flex gap-2">
              <button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button type="button" aria-label="Próxima página" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
          <Eye size={15} className="mt-0.5 shrink-0" /> Dados sensíveis, conteúdo de mensagens, motivos privados e detalhes completos dos registros não são enviados ao navegador.
        </div>
      </div>
    </section>
  );
}
