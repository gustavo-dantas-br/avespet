import React, { useState } from "react";
import { PLANOS_IMPULSIONAMENTO, dinheiro } from "./planos";
import { demonstrativoPlano, calcularReembolsoSimulado } from "./financeiro";

const moedaInput = "w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-900";
const toCentavos = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && Number.isSafeInteger(Math.round(number * 100))
    ? Math.round(number * 100) : NaN;
};
const formatar = (centavos) => dinheiro(centavos);

export default function SimuladorFinanceiro() {
  const [planoId, setPlanoId] = useState("regional");
  const [gasto, setGasto] = useState("60");
  const [taxas, setTaxas] = useState("8");
  const [custos, setCustos] = useState("12");
  const [reembolso, setReembolso] = useState("0");
  const plano = PLANOS_IMPULSIONAMENTO.find((p) => p.id === planoId) || PLANOS_IMPULSIONAMENTO[0];
  let calculo = null;
  let erro = "";
  let simulacaoReembolso = null;
  try {
    calculo = demonstrativoPlano(plano, {
      gastoMidiaCentavos: toCentavos(gasto),
      taxasCentavos: toCentavos(taxas),
      custosOperacionaisCentavos: toCentavos(custos),
    });
    simulacaoReembolso = calcularReembolsoSimulado({
      totalPagoCentavos: calculo.precoCentavos,
      valorSolicitadoCentavos: toCentavos(reembolso),
    });
  } catch (e) {
    erro = e?.message || "Confira os valores.";
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Simulador financeiro de campanhas">
    <h2 className="text-lg font-semibold text-slate-900">Simulador financeiro de campanhas</h2>
    <p className="mt-1 text-xs text-slate-600">Exemplo de planejamento, sem consultar transações reais. Alterar números aqui não movimenta dinheiro nem confirma pagamentos.</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <label className="grid gap-1 text-xs font-semibold text-slate-700">Plano
        <select className={moedaInput} value={planoId} onChange={(e) => { setPlanoId(e.target.value); setGasto("0"); setReembolso("0"); }}>
          {PLANOS_IMPULSIONAMENTO.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">Mídia já utilizada (R$)
        <input className={moedaInput} type="number" step="0.01" min="0" max={plano.midiaCentavos / 100} value={gasto} onChange={(e) => setGasto(e.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">Taxas de pagamento estimadas (R$)
        <input className={moedaInput} type="number" step="0.01" min="0" value={taxas} onChange={(e) => setTaxas(e.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">Outros custos estimados (R$)
        <input className={moedaInput} type="number" step="0.01" min="0" value={custos} onChange={(e) => setCustos(e.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-700">Reembolso hipotético (R$)
        <input className={moedaInput} type="number" step="0.01" min="0" max={plano.precoCentavos / 100} value={reembolso} onChange={(e) => setReembolso(e.target.value)} />
      </label>
    </div>
    {erro ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="alert">{erro}</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Preço total proposto", calculo.precoCentavos],
        ["Orçamento para Meta", calculo.midiaCentavos],
        ["Criação e gestão", calculo.gestaoCentavos],
        ["Mídia utilizada", calculo.gastoMidiaCentavos],
        ["Mídia ainda não utilizada", calculo.midiaRestanteCentavos],
        ["Contribuição antes de tributos e custos fixos", calculo.contribuicaoCentavos],
        ["Saldo após reembolso hipotético", simulacaoReembolso.saldoAposReembolsoCentavos],
      ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3">
        <p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatar(value)}</p>
      </div>)}
    </div>}
    <p className="mt-4 text-xs leading-5 text-slate-600">A mídia ainda não utilizada não determina, por si só, o valor a ser restituído. Reembolsos dependem de conferência dos pagamentos efetivos, custos, contrato e direitos do consumidor. Nenhum lançamento ou estorno é feito aqui.</p>
  </section>;
}
