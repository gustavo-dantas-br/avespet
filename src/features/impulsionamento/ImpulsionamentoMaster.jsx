import React, { useEffect, useState } from "react";
import { listarCampanhasAdmin } from "../campanhas/services/campanhasService";
import { PACOTES_CAMPANHA, STATUS_CAMPANHA } from "../campanhas/config/pacotes";
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
  const [pedidos, setPedidos] = useState([]);
  const [pedidosErro, setPedidosErro] = useState("");
  const [pedidosLoading, setPedidosLoading] = useState(true);
  useEffect(() => {
    let active = true;
    listarCampanhasAdmin().then((itens) => { if (active) setPedidos(itens); })
      .catch(() => { if (active) setPedidosErro("Não foi possível carregar as solicitações. Confira as permissões de acesso à tabela de campanhas."); })
      .finally(() => { if (active) setPedidosLoading(false); });
    return () => { active = false; };
  }, []);
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
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Solicitações de campanhas existentes</h2>
        <p className="mt-1 text-xs text-slate-500">Leitura administrativa da operação atual. Esta seção não altera pedidos, valores ou status e não confirma pagamentos.</p>
        {pedidosLoading ? <p className="mt-4 text-sm text-slate-600">Carregando solicitações...</p> : pedidosErro ? <p role="alert" className="mt-4 text-sm text-amber-800">{pedidosErro}</p> : pedidos.length === 0 ? <p className="mt-4 text-sm text-slate-600">Nenhuma solicitação encontrada.</p> : (
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="py-2">Criada em</th><th>Contato</th><th>Região</th><th>Pacote solicitado</th><th>Status</th></tr></thead><tbody>{pedidos.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3">{item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : "—"}</td><td className="pr-3">{item.nome_contato || "—"}</td><td className="pr-3">{item.cidade}/{item.uf}</td><td className="pr-3">{PACOTES_CAMPANHA.find((p) => p.id === item.pacote)?.nome || item.pacote || "—"}</td><td>{STATUS_CAMPANHA[item.status] || item.status || "—"}</td></tr>)}</tbody></table></div>
        )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Etapas para a operação</h2>
        <ul className="mt-3 space-y-2">{status.map(([name, detail]) => <li key={name} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><strong>{name}</strong><span className="text-slate-600">{detail}</span></li>)}</ul>
        <p className="mt-4 text-sm text-slate-600">Antes de publicar um caso como reencontrado, solicitar confirmação do tutor. Evitar exposição pública de WhatsApp, endereço exato e dados pessoais.</p>
      </section>
    </div>
  );
}
