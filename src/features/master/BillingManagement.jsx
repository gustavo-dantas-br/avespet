import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  BadgeCheck, Bird, Check, CircleDollarSign, Crown, Edit3, Infinity,
  Loader2, Plus, RefreshCw, Save, ShieldCheck, ToggleLeft, ToggleRight, X,
} from "lucide-react";

const FEATURE_LABELS = [
  ["basic_profile", "Perfil básico", "Cadastro e apresentação do criador"],
  ["basic_bird_management", "Gestão básica do plantel", "Cadastro e consulta das aves"],
  ["basic_ads", "Anúncios básicos", "Acesso aos recursos básicos de anúncios"],
  ["advanced_genetics", "Genética avançada", "Calculadora e recursos avançados de genética"],
  ["reproduction_management", "Gestão de reprodução", "Casais, posturas e acompanhamento reprodutivo"],
  ["financial_management", "Gestão financeira", "Controle financeiro do criatório"],
  ["campaigns", "Campanhas", "Ferramentas de campanhas e divulgação"],
  ["after_sales", "Pós-venda", "Acompanhamento de clientes e vendas"],
];
const emptyPlan = () => ({
  code: "", name: "", description: "", price_reais: "0",
  billing_interval: "monthly", max_birds: "10",
  is_free: false, is_active: true, sort_order: 10,
  features: Object.fromEntries(FEATURE_LABELS.map(([key]) => [key, false])),
});
const money = (cents) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((Number(cents) || 0) / 100);
const intervalLabel = (value) => ({ monthly: "Mensal", yearly: "Anual", one_time: "Pagamento único" }[value] || value);
const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#58799e] focus:ring-2 focus:ring-blue-50";

export default function BillingManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyPlan);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-billing", { body: { action: "list_plans" } });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível carregar os planos.");
      setPlans(data.plans || []);
    } catch (err) {
      setError(err.message || "Não foi possível carregar os planos.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = useMemo(() => plans.filter((plan) => plan.is_active).length, [plans]);
  const freeCount = useMemo(() => plans.filter((plan) => plan.is_free).length, [plans]);

  function startNew() { setEditingId(null); setForm(emptyPlan()); setError(""); setNotice(""); }
  function startEdit(plan) {
    setEditingId(plan.id);
    setForm({
      code: plan.code || "", name: plan.name || "", description: plan.description || "",
      price_reais: (Number(plan.price_cents || 0) / 100).toFixed(2).replace(".", ","),
      billing_interval: plan.billing_interval || "monthly",
      max_birds: plan.max_birds == null ? "" : String(plan.max_birds),
      is_free: Boolean(plan.is_free), is_active: Boolean(plan.is_active), sort_order: Number(plan.sort_order || 0),
      features: Object.fromEntries(FEATURE_LABELS.map(([key]) => [key, plan.features?.[key] === true])),
    });
    setError(""); setNotice("");
    document.getElementById("billing-plan-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function updateFeature(key, checked) {
    setForm((current) => ({ ...current, features: { ...current.features, [key]: checked } }));
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError(""); setNotice("");
    const normalizedPrice = String(form.price_reais).trim().replace(/\./g, "").replace(",", ".");
    const price = Number(normalizedPrice);
    if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(Math.round(price * 100))) {
      setError("Informe um preço válido em reais."); setSaving(false); return;
    }
    const maxBirds = form.max_birds.trim() === "" ? null : Number(form.max_birds);
    if (maxBirds !== null && (!Number.isSafeInteger(maxBirds) || maxBirds < 0)) {
      setError("O limite de aves deve ser um número inteiro positivo ou ficar vazio para ilimitado."); setSaving(false); return;
    }
    try {
      const payload = {
        action: "save_plan", ...(editingId ? { id: editingId } : {}),
        code: form.code, name: form.name, description: form.description,
        price_cents: Math.round(price * 100), billing_interval: form.billing_interval,
        max_birds: maxBirds, is_free: form.is_free, is_active: form.is_active,
        sort_order: Number(form.sort_order), features: form.features,
      };
      const { data, error: invokeError } = await supabase.functions.invoke("master-manage-billing", { body: payload });
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Não foi possível salvar o plano.");
      setNotice(editingId ? "Plano atualizado com sucesso." : "Plano criado com sucesso.");
      setEditingId(null); setForm(emptyPlan());
      await load();
    } catch (err) { setError(err.message || "Não foi possível salvar o plano."); }
    finally { setSaving(false); }
  }

  async function toggle(plan) {
    setError(""); setNotice("");
    const { data, error: invokeError } = await supabase.functions.invoke("master-manage-billing", {
      body: { action: "toggle_plan", id: plan.id, is_active: !plan.is_active },
    });
    if (invokeError || data?.error || !data?.success) {
      setError(data?.error || "Não foi possível alterar a situação do plano."); return;
    }
    setNotice(plan.is_active ? "Plano desativado." : "Plano ativado.");
    await load();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Gestão comercial</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Planos e pagamentos</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">Configure os planos do AvesPet, limites de aves e recursos liberados para cada modalidade.</p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar</button>
      </div>

      {(error || notice) && <div role={error ? "alert" : "status"} className={`rounded-xl border p-3.5 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || notice}</div>}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs text-slate-500">Planos cadastrados <BadgeCheck size={17} /></div><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "—" : plans.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs text-slate-500">Planos ativos <Check size={17} /></div><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "—" : activeCount}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between text-xs text-slate-500">Planos gratuitos <Crown size={17} /></div><p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "—" : freeCount}</p></div>
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-800">Catálogo de planos</h2><p className="mt-1 text-xs text-slate-400">Planos cadastrados para a plataforma</p></div><button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white hover:opacity-90" style={{ background: "#1d3553" }}><Plus size={15} /> Novo plano</button></div>
          {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400"><Loader2 className="mx-auto mb-2 animate-spin" />Carregando planos...</div> :
            plans.length ? plans.map((plan) => <article key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{plan.name}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${plan.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{plan.is_active ? "Ativo" : "Inativo"}</span>{plan.is_free && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">Gratuito</span>}</div><p className="mt-1 text-xs text-slate-400">{plan.code} · {intervalLabel(plan.billing_interval)}</p></div>
                <div className="text-right"><p className="text-lg font-bold tabular-nums text-slate-900">{money(plan.price_cents)}</p><p className="text-[10px] text-slate-400">{plan.max_birds == null ? "Aves ilimitadas" : `Até ${plan.max_birds} aves`}</p></div>
              </div>
              {plan.description && <p className="mt-3 text-sm leading-5 text-slate-500">{plan.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Edit3 size={13} /> Editar</button><button type="button" onClick={() => toggle(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">{plan.is_active ? <><ToggleRight size={15} /> Desativar</> : <><ToggleLeft size={15} /> Ativar</>}</button></div>
            </article>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhum plano retornado. Verifique se a migração foi aplicada no banco.</div>}
        </div>

        <form id="billing-plan-form" onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">Configuração</p><h2 className="mt-1 text-lg font-bold text-slate-900">{editingId ? "Editar plano" : "Cadastrar plano"}</h2><p className="mt-1 text-xs text-slate-400">Os recursos podem ser alterados pelo Master.</p></div>{editingId && <button type="button" onClick={startNew} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cancelar edição"><X size={17} /></button>}</div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Nome do plano<input className={inputClass} value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Ex.: Essencial" maxLength={80} required /></label>
            <label className="text-xs font-semibold text-slate-600">Código interno<input className={inputClass} value={form.code} onChange={(e) => updateField("code", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="ex.: essencial" maxLength={40} required /></label>
            <label className="text-xs font-semibold text-slate-600">Preço (R$)<input className={inputClass} value={form.price_reais} onChange={(e) => updateField("price_reais", e.target.value.replace(/[^0-9,.]/g, ""))} placeholder="0,00" inputMode="decimal" required /></label>
            <label className="text-xs font-semibold text-slate-600">Periodicidade<select className={inputClass} value={form.billing_interval} onChange={(e) => updateField("billing_interval", e.target.value)}><option value="monthly">Mensal</option><option value="yearly">Anual</option><option value="one_time">Pagamento único</option></select></label>
            <label className="text-xs font-semibold text-slate-600">Limite de aves<input className={inputClass} value={form.max_birds} onChange={(e) => updateField("max_birds", e.target.value.replace(/[^0-9]/g, ""))} placeholder="Vazio = ilimitado" inputMode="numeric" /><span className="mt-1 block text-[10px] font-normal text-slate-400">Deixe vazio para não limitar a quantidade.</span></label>
            <label className="text-xs font-semibold text-slate-600">Ordem de exibição<input className={inputClass} type="number" value={form.sort_order} onChange={(e) => updateField("sort_order", e.target.value)} /></label>
          </div>

          <label className="mt-4 block text-xs font-semibold text-slate-600">Descrição<textarea className={inputClass} rows={2} maxLength={500} value={form.description} onChange={(e) => updateField("description", e.target.value)} placeholder="Explique o que este plano oferece." /></label>

          <div className="mt-5 rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-slate-500" /><h3 className="text-sm font-semibold text-slate-800">Recursos liberados</h3></div>
            <div className="space-y-3">{FEATURE_LABELS.map(([key, label, description]) => <label key={key} className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={Boolean(form.features[key])} onChange={(e) => updateFeature(key, e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1d3553]" /><span className="min-w-0"><span className="block text-xs font-semibold text-slate-700">{label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-400">{description}</span></span></label>)}</div>
          </div>

          <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={form.is_free} onChange={(e) => { updateField("is_free", e.target.checked); if (e.target.checked) updateField("price_reais", "0"); }} className="h-4 w-4 accent-[#1d3553]" /> Este é um plano gratuito</label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField("is_active", e.target.checked)} className="h-4 w-4 accent-[#1d3553]" /> Plano ativo e disponível</label>
          </div>

          <button type="submit" disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60" style={{ background: "#1d3553" }}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar plano"}</button>
        </form>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-5 text-blue-900"><p className="font-semibold">Importante nesta etapa</p><p className="mt-1">Esta tela administra o catálogo de planos. Atribuição de assinaturas, cobrança, integração com gateway e bloqueio efetivo de recursos/limites ainda serão implementados em etapas próprias. Nenhum pagamento é processado por esta tela.</p></div>
    </section>
  );
}
