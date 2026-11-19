import React, { useState } from "react";
import SolicitacoesMaster from "./SolicitacoesMaster";
import SimuladorFinanceiro from "./SimuladorFinanceiro";
import { situacaoAsaas } from "./asaasConfig";
import { PLANOS_IMPULSIONAMENTO, dinheiro, validarPlano } from "./planos";

const valor = "font-bold tabular-nums text-slate-900";
const status = [
  ["Catálogo", "Preços em proposta; sem integração de cobrança"],
  ["Pagamentos", "Desabilitados até aprovação e homologação"],
  ["Meta Ads", "Operação manual a validar antes das vendas"],
  ["Pedidos e relatórios", "Necessitam banco, autorização e auditoria"],
];

export default function ImpulsionamentoMaster() {
  const [volume, setVolume] = useState(10);
  const [planoId, setPlanoId] = useState("regional");
  const plano = PLANOS_IMPULSIONAMENTO.find((p) => p.id === planoId) || PLANOS_IMPULSIONAMENTO[0];
  const total = plano.precoCentavos * volume;
  const midia = plano.midiaCentavos * volume;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Projeto em preparação</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Impulsionamento de aves perdidas</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Catálogo preliminar de campanhas. Nenhuma cobrança ou campanha é ativada nesta tela. A divulgação gratuita permanece disponível.</p>
      </header>
      <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Vendas ainda não liberadas.</strong> Os valores abaixo são sugestões e precisam de aprovação comercial, integração de pagamentos e homologação das campanhas antes de aparecerem para o público.
      </div>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Catálogo proposto">
        {PLANOS_IMPULSIONAMENTO.map((p) => (
          <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{p.nome}</h2>
            <p className={`${valor} mt-3 text-2xl`}>{dinheiro(p.precoCentavos)}</p>
            <p className="mt-1 text-xs text-slate-500">{p.dias ? `${p.dias} dias` : "Sem prazo fixo"}{p.raioKm ? ` · referência de até ${p.raioKm} km` : ""}</p>
            <p className="mt-3 text-sm text-slate-600">{p.descricao}</p>
            <dl className="mt-4 space-y-1 border-t pt-3 text-xs text-slate-600">
              <div className="flex justify-between gap-2"><dt>Verba de mídia</dt><dd>{dinheiro(p.midiaCentavos)}</dd></div>
              <div className="flex justify-between gap-2"><dt>Criação/gestão</dt><dd>{dinheiro(p.precoCentavos - p.midiaCentavos)}</dd></div>
            </dl>
            {!validarPlano(p) && <p role="alert" className="mt-2 text-xs text-red-700">Plano com valores inválidos.</p>}
          </article>
        ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Simulador comercial</h2>
        <p className="mt-1 text-xs text-slate-500">Valores brutos, antes de impostos, taxas de pagamento e outros custos. Não é previsão de vendas.</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="grid gap-1 text-sm font-medium text-slate-700">Plano
            <select value={planoId} onChange={(e) => setPlanoId(e.target.value)} className="rounded-lg border p-2">{PLANOS_IMPULSIONAMENTO.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">Campanhas/mês
            <input type="number" min="0" max="10000" value={volume} onChange={(e) => setVolume(Math.max(0, Math.min(10000, Number(e.target.value) || 0)))} className="w-32 rounded-lg border p-2" />
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Receita bruta</p><p className={valor}>{dinheiro(total)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Verba de mídia</p><p className={valor}>{dinheiro(midia)}</p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Antes de demais custos</p><p className={valor}>{dinheiro(total - midia)}</p></div>
        </div>
      </section>
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-lg font-semibold text-blue-950">Integração Asaas — preparada, não ativa</h2>
        <p className="mt-2 text-sm text-blue-900">Ambiente previsto: {situacaoAsaas().ambiente}. O checkout e as cobranças reais continuam desativados até a regularização do CNPJ, configuração de credenciais privadas e testes de webhook.</p>
        <p className="mt-2 text-xs text-blue-800">Nenhuma chave de API é armazenada no frontend. Nenhum pagamento será confirmado manualmente pelo simulador.</p>
      </section>
      <SimuladorFinanceiro />
      <SolicitacoesMaster />
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Etapas para a operação</h2>
        <ul className="mt-3 space-y-2">{status.map(([name, detail]) => <li key={name} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><strong>{name}</strong><span className="text-slate-600">{detail}</span></li>)}</ul>
        <p className="mt-4 text-sm text-slate-600">Antes de publicar um caso como reencontrado, solicitar confirmação do tutor. Evitar exposição pública de WhatsApp, endereço exato e dados pessoais.</p>
      </section>
    </div>
  );
}
