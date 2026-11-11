import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { LayoutDashboard, Users, Bird, Megaphone, CreditCard, LifeBuoy, Settings, LogOut, ShieldCheck } from "lucide-react";

const modules = [
  { title: "Visão geral", description: "Indicadores gerais e saúde da plataforma.", icon: LayoutDashboard, status: "Estrutura inicial" },
  { title: "Usuários e criadores", description: "Contas, permissões e situação dos cadastros.", icon: Users, status: "Em desenvolvimento" },
  { title: "Aves e anúncios", description: "Consulta e gestão dos anúncios publicados.", icon: Bird, status: "Em desenvolvimento" },
  { title: "Moderação", description: "Análises, denúncias e conteúdo da comunidade.", icon: Megaphone, status: "Em desenvolvimento" },
  { title: "Planos e pagamentos", description: "Assinaturas, cobranças e receita da plataforma.", icon: CreditCard, status: "Em desenvolvimento" },
  { title: "Suporte", description: "Atendimento e acompanhamento de solicitações.", icon: LifeBuoy, status: "Em desenvolvimento" },
];

export default function MasterApp({ user, onLogout }) {
  return (
    <div className="min-h-screen" style={{ background: "#f5f6f8", color: "#182230" }}>
      <header className="flex items-center justify-between gap-4 px-5 py-4 border-b bg-white" style={{ borderColor: "#e5e9ef" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#182b45", color: "#d9b45b" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="font-bold tracking-tight">AVESPET <span style={{ color: "#b38a35" }}>MASTER</span></div>
            <div className="text-xs text-slate-500">Administração da plataforma</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-slate-500">{user?.email}</span>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm border hover:bg-slate-50">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#a27b2e" }}>Painel exclusivo</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Central de gestão do Avespet</h1>
          <p className="text-sm text-slate-500 mt-2">Ambiente separado do painel dos criadores. Os módulos serão habilitados após implementação e validação das permissões.</p>
        </div>

        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-semibold">Indicadores da plataforma</h2>
            <button type="button" onClick={loadSummary} className="text-sm rounded-lg border px-3 py-2 hover:bg-slate-50">
              Atualizar
            </button>
          </div>
          {summaryError && (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              {summaryError} Os indicadores só estarão disponíveis após a migration e a função segura serem implantadas.
            </div>
          )}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
            {indicators.map(([label, key]) => (
              <article key={key} className="rounded-xl border bg-white p-4" style={{ borderColor: "#e5e9ef" }}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {summaryLoading ? "—" : (summary?.[key] ?? "—")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ title, description, icon: Icon, status }) => (
            <article key={title} className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e9ef" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#eef2f7", color: "#29466b" }}>
                <Icon size={20} />
              </div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-sm text-slate-500 mt-1 min-h-10">{description}</p>
              <span className="inline-flex mt-4 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "#f3f4f6", color: "#667085" }}>{status}</span>
            </article>
          ))}
        </section>
        <div className="mt-8 flex items-start gap-3 rounded-xl border p-4 text-sm" style={{ borderColor: "#ead9ae", background: "#fffaf0", color: "#735a27" }}>
          <Settings size={18} className="shrink-0 mt-0.5" />
          <p>Este é o esqueleto inicial do painel. Nenhum dado privado de criadores é carregado aqui; os módulos só receberão consultas após suas regras de acesso serem implementadas.</p>
        </div>
      </main>
    </div>
  );
}
