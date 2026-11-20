import React from "react";

// Gráfico apenas descritivo: não compara com curvas de referência nem diagnostica.
export function pontosGraficoPesos(pesos, largura = 600, altura = 160) {
  if (!Array.isArray(pesos) || pesos.length < 2) return [];
  const validos = pesos.filter(p => Number.isFinite(Number(p.peso)) && Number(p.peso) > 0);
  if (validos.length < 2) return [];
  const valores = validos.map(p => Number(p.peso));
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  const amplitude = maximo - minimo || 1;
  const margem = 16;
  const disponivelX = largura - 2 * margem;
  const disponivelY = altura - 2 * margem;
  return validos.map((p, i) => ({
    x: margem + i * disponivelX / (validos.length - 1),
    y: margem + (maximo - Number(p.peso)) * disponivelY / amplitude,
    data: p.data,
    peso: Number(p.peso),
  }));
}

export default function GraficoPeso({ pesos = [] }) {
  const pontos = pontosGraficoPesos(pesos);
  if (pontos.length === 0) {
    return <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <h3 className="font-semibold text-emerald-950">Evolução do peso</h3>
      <p className="mt-1 text-sm text-stone-600">Registre pelo menos duas pesagens para visualizar a evolução.</p>
    </div>;
  }
  const caminho = pontos.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  return <figure className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
    <figcaption className="mb-2 text-sm font-semibold text-emerald-950">Evolução de peso registrada</figcaption>
    <svg className="h-auto w-full" viewBox="0 0 600 160" role="img" aria-label="Linha conectando as pesagens registradas, sem faixa de referência clínica">
      <line x1="16" y1="144" x2="584" y2="144" stroke="#bbd7c6" strokeWidth="1" />
      <path d={caminho} fill="none" stroke="#17834c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {pontos.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="#17834c" stroke="#fff" strokeWidth="2"/>)}
    </svg>
    <div className="flex flex-wrap justify-between gap-2 text-xs text-stone-600">
      <span>Primeiro: {pontos[0].peso.toLocaleString("pt-BR")} g · {pontos[0].data.split("-").reverse().join("/")}</span>
      <span>Último: {pontos[pontos.length-1].peso.toLocaleString("pt-BR")} g · {pontos[pontos.length-1].data.split("-").reverse().join("/")}</span>
    </div>
    <p className="mt-2 text-xs text-stone-600">Gráfico descritivo, sem interpretação clínica. Peso isolado ou tendência não define saúde, necessidade de papa ou desmame.</p>
  </figure>;
}
