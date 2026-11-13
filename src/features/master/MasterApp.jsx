import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import CreatorManagement from "./CreatorManagement";
import AdsModeration from "./AdsModeration";
import BirdsManagement from "./BirdsManagement";
import BillingManagement from "./BillingManagement";
import {
  LayoutDashboard, Users, Bird, Megaphone, CreditCard, LifeBuoy,
  Settings, LogOut, ShieldCheck, RefreshCw, Menu, X, Activity,
  ChevronRight, LockKeyhole, CircleHelp, TrendingUp, Eye, Clock3,
  CheckCircle2, AlertCircle, CalendarDays, ArrowUpRight,
} from "lucide-react";

const navigation = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, description: "Indicadores e situação da plataforma" },
  { id: "creators", label: "Criadores e usuários", icon: Users, description: "Contas, perfis e permissões" },
  { id: "birds", label: "Aves", icon: Bird, description: "Cadastros e consulta de aves" },
  { id: "ads", label: "Anúncios e moderação", icon: Megaphone, description: "Anúncios, denúncias e aprovação" },
  { id: "billing", label: "Planos e pagamentos", icon: CreditCard, description: "Assinaturas e receita da plataforma" },
  { id: "support", label: "Suporte", icon: LifeBuoy, description: "Solicitações e atendimento" },
  { id: "settings", label: "Configurações", icon: Settings, description: "Acessos e parâmetros administrativos" },
];

const metrics = [
  { label: "Contas cadastradas", key: "auth_users", icon: Users, tint: "#eaf1ff", color: "#4169a8", hint: "Usuários registrados na plataforma" },
  { label: "Aves cadastradas", key: "aves", icon: Bird, tint: "#e8f5ee", color: "#27845b", hint: "Registros de aves" },
  { label: "Anúncios publicados", key: "anuncios", icon: Megaphone, tint: "#fff3e5", color: "#b8792b", hint: "Anúncios de aves" },
  { label: "Aves perdidas", key: "anuncios_aves_perdidas", icon: Activity, tint: "#f2edff", color: "#7955b3", hint: "Anúncios de localização" },
];

const comingSoon = {
  creators: { title: "Criadores e usuários", description: "Consulta de contas, situação cadastral, bloqueios e permissões administrativas." },
  birds: { title: "Gestão de aves", description: "Consulta de registros, identificação de duplicidades e suporte aos criadores." },
  ads: { title: "Anúncios e moderação", description: "Fila de aprovação, denúncias, anúncios publicados e anúncios de aves perdidas." },
  billing: { title: "Planos e pagamentos", description: "Planos, assinaturas, pagamentos e indicadores financeiros da plataforma." },
  support: { title: "Central de suporte", description: "Acompanhamento de solicitações e histórico de atendimento." },
  settings: { title: "Configurações Master", description: "Gestão de acessos privilegiados e parâmetros da plataforma." },
};

const number = (value) => new Intl.NumberFormat("pt-BR").format(Number(value || 0));
const dateLabel = (value) => new Date(value + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

function MetricCard({ item, value, loading }) {
  const Icon = item.icon;
  return (
    <article className="group rounded-2xl border bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg" style={{ borderColor: "#e9edf2", boxShadow: "0 2px 10px rgba(21,36,56,.025)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{item.label}</p>
          <p className="mt-3 text-[30px] font-bold tracking-tight text-slate-900 tabular-nums">{loading ? "—" : number(value)}</p>
          <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: item.tint, color: item.color }}><Icon size={20} strokeWidth={1.9} /></span>
      </div>
    </article>
  );
}

function VisitsChart({ visits = [], loading }) {
  const max = Math.max(1, ...visits.map((item) => Number(item.total || 0)));
  const total = visits.reduce((sum, item) => sum + Number(item.total || 0), 0);
  return (
    <article className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "#e9edf2", boxShadow: "0 2px 10px rgba(21,36,56,.025)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-800"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#edf3fb", color: "#42658e" }}><Eye size={18} /></span><h2 className="font-semibold">Acessos ao site</h2></div>
          <p className="mt-2 text-sm text-slate-500">Visitas registradas nos últimos 14 dias</p>
        </div>
        <div className="text-right"><p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{loading ? "—" : number(total)}</p><p className="text-xs text-slate-400">visitas no período</p></div>
      </div>
      {loading ? <div className="mt-8 h-40 animate-pulse rounded-xl bg-slate-100" /> : visits.length ? (
        <div className="mt-7">
          <div className="flex h-40 items-end gap-1.5 sm:gap-2" role="img" aria-label="Gráfico de barras com visitas diárias">
            {visits.map((day) => {
              const height = Math.max(3, (Number(day.total || 0) / max) * 100);
              return <div key={day.date} className="group/bar flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="relative flex h-full items-end">
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white shadow-lg group-hover/bar:block">{number(day.total)} visitas</div>
                  <div className="w-full rounded-t-md transition-all duration-300 hover:opacity-75" style={{ height: height + "%", background: "linear-gradient(180deg,#6d91bd 0%,#345779 100%)" }} />
                </div>
              </div>;
            })}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400 sm:text-xs"><span>{visits[0] ? dateLabel(visits[0].date) : ""}</span><span className="hidden sm:inline">Evolução diária</span><span>{visits[visits.length - 1] ? dateLabel(visits[visits.length - 1].date) : ""}</span></div>
        </div>
      ) : <div className="mt-6 flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">Ainda não há dados de visitas para exibir.</div>}
    </article>
  );
}

function StatusPanel({ title, subtitle, items = [], loading, icon: Icon }) {
  const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const palette = { Pendente: "#d69a37", Aprovado: "#31936b", Rejeitado: "#cf6262", Encerrado: "#8290a2" };
  return (
    <article className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "#e9edf2", boxShadow: "0 2px 10px rgba(21,36,56,.025)" }}>
      <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#f4f1eb", color: "#92713c" }}><Icon size={18} /></span><div><h2 className="font-semibold text-slate-800">{title}</h2><p className="text-xs text-slate-400">{subtitle}</p></div></div>
      {loading ? <div className="mt-6 h-28 animate-pulse rounded-xl bg-slate-100" /> : items.length ? (
        <>
          <div className="mt-6 flex items-end justify-between"><span className="text-sm text-slate-500">Total no painel</span><strong className="text-2xl tabular-nums text-slate-900">{number(total)}</strong></div>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100">{items.map((item) => <span key={item.status} title={item.status + ": " + number(item.total)} style={{ width: (total ? Number(item.total || 0) / total * 100 : 0) + "%", background: palette[item.status] || "#8b9aab" }} />)}</div>
          <div className="mt-5 space-y-3">{items.map((item) => <div key={item.status} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-slate-500"><i className="h-2 w-2 rounded-full" style={{ background: palette[item.status] || "#8b9aab" }} />{item.status}</span><strong className="tabular-nums text-slate-800">{number(item.total)}</strong></div>)}</div>
        </>
      ) : <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-400">Os dados de moderação aparecerão aqui quando a consulta analítica estiver ativa.</p>}
    </article>
  );
}

export default function MasterApp({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const { data, error } = await supabase.functions.invoke("master-dashboard-summary", { body: {} });
      if (error || data?.error) {
        setSummary(null);
        setAnalytics(null);
        setSummaryError(data?.error || "Não foi possível carregar os indicadores.");
      } else {
        setSummary(data?.counts || {});
        setAnalytics(data?.analytics || null);
      }
    } catch {
      setSummary(null);
      setAnalytics(null);
      setSummaryError("Não foi possível carregar os indicadores.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const selected = useMemo(() => navigation.find((item) => item.id === activeSection) || navigation[0], [activeSection]);
  const selectedPlaceholder = comingSoon[activeSection];
  const chooseSection = (id) => { setActiveSection(id); setMobileMenuOpen(false); };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-5 py-6" style={{ borderColor: "#293d55" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#d9b45b", color: "#182b45" }}><ShieldCheck size={22} /></div>
        <div><div className="font-bold tracking-wide text-white">AVESPET <span style={{ color: "#d9b45b" }}>MASTER</span></div><div className="mt-0.5 text-[11px] text-slate-400">Administração da plataforma</div></div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navegação Master">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Painel administrativo</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return <button key={item.id} type="button" onClick={() => chooseSection(item.id)} aria-current={active ? "page" : undefined} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition" style={{ background: active ? "linear-gradient(90deg,#2c4969,#263f5c)" : "transparent", color: active ? "#fff" : "#b9c5d3", boxShadow: active ? "inset 3px 0 #d9b45b" : "none" }}><Icon size={18} /><span className="flex-1">{item.label}</span>{active && <ChevronRight size={15} />}</button>;
        })}
      </nav>
      <div className="border-t p-4" style={{ borderColor: "#293d55" }}>
        <div className="mb-3 flex items-center gap-2 rounded-xl px-2 py-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">{(user?.email || "M").slice(0, 1).toUpperCase()}</span><div className="min-w-0"><div className="text-[11px] text-slate-400">Sessão Master</div><div className="truncate text-xs text-white" title={user?.email}>{user?.email}</div></div></div>
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"><LogOut size={16} /> Sair da conta</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f5f7fa", color: "#182230" }}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] lg:block" style={{ background: "#182b45" }}>{sidebar}</aside>
      {mobileMenuOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/55" onClick={() => setMobileMenuOpen(false)} /><aside className="relative h-full w-[min(19rem,85vw)] shadow-2xl" style={{ background: "#182b45" }}><button aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white"><X size={19} /></button>{sidebar}</aside></div>}

      <div className="min-h-screen lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-4 py-3.5 backdrop-blur-xl sm:px-7" style={{ borderColor: "#e8edf2" }}>
          <div className="flex items-center gap-3"><button className="rounded-lg border border-slate-200 p-2 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={19} /></button><div><p className="text-[11px] text-slate-400">Avespet <span className="px-1">/</span> Master</p><p className="text-sm font-semibold text-slate-800">{selected.label}</p></div></div>
          <div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ambiente restrito</span><button type="button" onClick={loadSummary} disabled={summaryLoading} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={14} className={summaryLoading ? "animate-spin" : ""} /><span className="hidden sm:inline">Atualizar dados</span></button></div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9">
          {activeSection === "creators" ? <CreatorManagement /> : activeSection === "birds" ? <BirdsManagement /> : activeSection === "ads" ? <AdsModeration /> : activeSection === "billing" ? <BillingManagement /> : activeSection === "overview" ? (
            <>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: "#a27b2e" }}>Central de gestão</p><h1 className="mt-2 text-[26px] font-bold tracking-tight text-slate-900 sm:text-[32px]">Visão geral</h1><p className="mt-1.5 max-w-2xl text-sm text-slate-500">Acompanhe o crescimento, a atividade e a saúde operacional do Avespet em um só lugar.</p></div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500"><CalendarDays size={15} /><span>Atualizado {new Date().toLocaleDateString("pt-BR")}</span></div>
              </div>

              {summaryError && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><LockKeyhole size={18} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Indicadores indisponíveis</p><p className="mt-1">{summaryError} A área administrativa permanece protegida enquanto os dados são verificados.</p></div></div>}

              <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                {metrics.map((item) => <MetricCard key={item.key} item={item} value={summary?.[item.key]} loading={summaryLoading} />)}
              </section>

              <section className="mt-5 grid gap-5 2xl:grid-cols-[1.65fr_1fr]">
                <VisitsChart visits={analytics?.visits || []} loading={summaryLoading} />
                <div className="rounded-2xl p-5 sm:p-6" style={{ background: "linear-gradient(135deg,#1b304b 0%,#294766 100%)", boxShadow: "0 8px 24px rgba(24,43,69,.12)" }}>
                  <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#e4c77f]"><Activity size={19} /></span><span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-slate-200">RESUMO DA PLATAFORMA</span></div>
                  <p className="mt-6 text-sm text-slate-300">Visitas registradas no período</p><p className="mt-1 text-4xl font-bold tracking-tight text-white tabular-nums">{summaryLoading ? "—" : number(analytics?.totalVisits)}</p>
                  <div className="my-5 h-px bg-white/15" />
                  <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-300">Contas administrativas</p><p className="mt-1 text-2xl font-bold text-white tabular-nums">{summaryLoading ? "—" : number(summary?.admins)}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[#e4c77f]"><ShieldCheck size={20} /></span></div>
                  <p className="mt-5 flex items-center gap-2 text-[11px] text-slate-300"><LockKeyhole size={13} /> Dados consolidados com acesso administrativo validado.</p>
                </div>
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-2">
                <StatusPanel title="Anúncios de aves" subtitle="Distribuição por situação" items={analytics?.adsByStatus || []} loading={summaryLoading} icon={Megaphone} />
                <StatusPanel title="Aves perdidas" subtitle="Acompanhamento dos anúncios" items={analytics?.lostAdsByStatus || []} loading={summaryLoading} icon={Bird} />
              </section>

              <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <article className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "#e9edf2" }}>
                  <div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-800">Atalhos de gestão</h2><p className="mt-1 text-xs text-slate-400">Acesse as áreas administrativas</p></div><ArrowUpRight size={18} className="text-slate-400" /></div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">{navigation.slice(1, 5).map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => chooseSection(item.id)} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-700">{item.label}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400">{item.description}</span></span><ChevronRight size={15} className="text-slate-300" /></button>; })}</div>
                </article>
                <article className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: "#e9edf2" }}>
                  <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={18} /></span><h2 className="font-semibold text-slate-800">Segurança da plataforma</h2></div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">O acesso Master é validado no servidor por identidade autenticada e autorização própria. A interface não concede privilégios por e-mail ou por dados editáveis do perfil.</p>
                  <div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Sessão atual</p><p className="mt-1 break-all text-xs font-semibold text-slate-700">{user?.email}</p><p className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700"><CheckCircle2 size={12} /> Identidade autenticada</p></div>
                </article>
              </section>
            </>
          ) : (
            <section className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: "#e9edf2" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#eef2f7", color: "#29466b" }}>{React.createElement(selected.icon, { size: 23 })}</div>
              <p className="mt-6 text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: "#a27b2e" }}>Módulo Master</p><h1 className="mt-2 text-2xl font-bold text-slate-900">{selectedPlaceholder?.title || selected.label}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{selectedPlaceholder?.description || selected.description}</p>
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><CircleHelp size={19} className="mt-0.5 shrink-0 text-slate-500" /><div><p className="text-sm font-semibold text-slate-700">Módulo em implementação</p><p className="mt-1 text-sm text-slate-500">A navegação está preparada. Consultas e ações serão ativadas após a implementação das regras de acesso, auditoria e testes específicos.</p></div></div>
              <button type="button" onClick={() => chooseSection("overview")} className="mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "#182b45" }}>Voltar à visão geral</button>
            </section>
          )}
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t py-5 text-[11px] text-slate-400" style={{ borderColor: "#e5e9ef" }}><span>Avespet Master · Área administrativa restrita</span><span className="flex items-center gap-1.5"><Clock3 size={12} /> Painel em evolução contínua</span></footer>
        </main>
      </div>
    </div>
  );
}
