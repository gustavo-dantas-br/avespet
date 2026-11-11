import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import {
  LayoutDashboard, Users, Bird, Megaphone, CreditCard, LifeBuoy,
  Settings, LogOut, ShieldCheck, RefreshCw, Menu, X, Activity,
  ChevronRight, LockKeyhole, CircleHelp,
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
  { label: "Criadores cadastrados", key: "perfil_criador", icon: Users },
  { label: "Aves cadastradas", key: "aves", icon: Bird },
  { label: "Anúncios", key: "anuncios", icon: Megaphone },
  { label: "Anúncios de aves perdidas", key: "anuncios_aves_perdidas", icon: Activity },
  { label: "Administradores", key: "admins", icon: ShieldCheck },
];

const comingSoon = {
  creators: { title: "Criadores e usuários", description: "Consulta de contas, situação cadastral, bloqueios e permissões administrativas." },
  birds: { title: "Gestão de aves", description: "Consulta de registros, identificação de duplicidades e suporte aos criadores." },
  ads: { title: "Anúncios e moderação", description: "Fila de aprovação, denúncias, anúncios publicados e anúncios de aves perdidas." },
  billing: { title: "Planos e pagamentos", description: "Planos, assinaturas, pagamentos e indicadores financeiros da plataforma." },
  support: { title: "Central de suporte", description: "Acompanhamento de solicitações e histórico de atendimento." },
  settings: { title: "Configurações Master", description: "Gestão de acessos privilegiados e parâmetros da plataforma." },
};

function MetricCard({ item, value, loading }) {
  const Icon = item.icon;
  return (
    <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e9ef" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{item.label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#eef2f7", color: "#29466b" }}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums">{loading ? "—" : (value ?? "—")}</p>
      <p className="mt-1 text-xs text-slate-400">Dados consultados no Avespet</p>
    </article>
  );
}

export default function MasterApp({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [summary, setSummary] = useState(null);
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
        setSummaryError(data?.error || "Não foi possível carregar os indicadores.");
      } else {
        setSummary(data?.counts || {});
      }
    } catch {
      setSummary(null);
      setSummaryError("Não foi possível carregar os indicadores.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const selected = useMemo(
    () => navigation.find((item) => item.id === activeSection) || navigation[0],
    [activeSection],
  );
  const selectedPlaceholder = comingSoon[activeSection];

  const chooseSection = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-5 py-5" style={{ borderColor: "#263b55" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#d9b45b", color: "#182b45" }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="font-bold tracking-wide text-white">AVESPET <span style={{ color: "#d9b45b" }}>MASTER</span></div>
          <div className="text-xs text-slate-400">Administração da plataforma</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navegação Master">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Gestão</p>
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button key={item.id} type="button" onClick={() => chooseSection(item.id)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition"
              style={{ background: active ? "#29415e" : "transparent", color: active ? "#ffffff" : "#b9c5d3" }}>
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight size={15} />}
            </button>
          );
        })}
      </nav>
      <div className="border-t p-4" style={{ borderColor: "#263b55" }}>
        <div className="mb-3 truncate text-xs text-slate-400" title={user?.email}>{user?.email}</div>
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800">
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f4f6f9", color: "#182230" }}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block" style={{ background: "#182b45" }}>
        {sidebar}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Fechar menu" className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative h-full w-[min(19rem,85vw)]" style={{ background: "#182b45" }}>
            <button aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="absolute right-3 top-4 z-10 rounded-lg p-2 text-white"><X size={19} /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-6" style={{ borderColor: "#e5e9ef" }}>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border p-2 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu"><Menu size={19} /></button>
            <div>
              <p className="text-xs text-slate-500">Avespet / Master</p>
              <p className="font-semibold">{selected.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex" style={{ background: "#edf7f1", color: "#26734d" }}>
              <span className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" /> Área restrita
            </span>
            <button type="button" onClick={loadSummary} disabled={summaryLoading} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50" style={{ borderColor: "#dce2ea" }}>
              <RefreshCw size={15} className={summaryLoading ? "animate-spin" : ""} /> <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          {activeSection === "overview" ? (
            <>
              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#a27b2e" }}>Central de gestão</p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Visão geral da plataforma</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">Acompanhamento administrativo do Avespet, separado dos dados operacionais do criatório.</p>
              </div>

              {summaryError && (
                <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border p-4 text-sm" style={{ borderColor: "#f0d9a8", background: "#fff9eb", color: "#795b22" }}>
                  <LockKeyhole size={18} className="mt-0.5 shrink-0" />
                  <div><p className="font-semibold">Indicadores indisponíveis</p><p className="mt-1">{summaryError} A consulta depende da migration Master e da Edge Function segura.</p></div>
                </div>
              )}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metrics.map((item) => <MetricCard key={item.key} item={item} value={summary?.[item.key]} loading={summaryLoading} />)}
              </section>

              <section className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e9ef" }}>
                  <div className="flex items-center gap-2"><Activity size={18} style={{ color: "#a27b2e" }} /><h2 className="font-semibold">Acompanhamento operacional</h2></div>
                  <p className="mt-2 text-sm text-slate-500">Os próximos módulos permitirão consultar usuários, aves, anúncios, pagamentos e suporte sem misturar as informações privadas do criador com a administração da plataforma.</p>
                  <div className="mt-5 space-y-3">
                    {navigation.slice(1, 6).map((item) => {
                      const Icon = item.icon;
                      return <button key={item.id} onClick={() => chooseSection(item.id)} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:bg-slate-50" style={{ borderColor: "#edf0f4" }}><Icon size={17} className="text-slate-500" /><span className="flex-1 text-sm font-medium">{item.label}</span><ChevronRight size={16} className="text-slate-400" /></button>;
                    })}
                  </div>
                </article>
                <article className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e9ef" }}>
                  <div className="flex items-center gap-2"><ShieldCheck size={18} style={{ color: "#a27b2e" }} /><h2 className="font-semibold">Segurança e acesso</h2></div>
                  <p className="mt-2 text-sm text-slate-500">O painel exige autorização Master validada no servidor. A interface não concede privilégios por e-mail ou por dados editáveis do perfil.</p>
                  <div className="mt-5 rounded-xl p-4" style={{ background: "#f5f7fa" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sessão atual</p>
                    <p className="mt-2 break-all text-sm font-medium">{user?.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Permissão consultada por identidade autenticada.</p>
                  </div>
                </article>
              </section>
            </>
          ) : (
            <section className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8" style={{ borderColor: "#e5e9ef" }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#eef2f7", color: "#29466b" }}>
                {React.createElement(selected.icon, { size: 23 })}
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "#a27b2e" }}>Módulo Master</p>
              <h1 className="mt-2 text-2xl font-bold">{selectedPlaceholder?.title || selected.label}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">{selectedPlaceholder?.description || selected.description}</p>
              <div className="mt-6 flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "#e5e9ef", background: "#f8fafc" }}>
                <CircleHelp size={19} className="mt-0.5 shrink-0 text-slate-500" />
                <div><p className="text-sm font-semibold">Módulo em implementação</p><p className="mt-1 text-sm text-slate-500">A tela já está organizada na navegação, mas as consultas e ações administrativas só serão ativadas depois das regras de acesso, auditoria e testes específicos deste módulo.</p></div>
              </div>
              <button type="button" onClick={() => chooseSection("overview")} className="mt-6 rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: "#182b45" }}>Voltar à visão geral</button>
            </section>
          )}
          <footer className="mt-10 border-t py-5 text-xs text-slate-400" style={{ borderColor: "#e5e9ef" }}>Avespet Master · Área administrativa restrita</footer>
        </main>
      </div>
    </div>
  );
}
