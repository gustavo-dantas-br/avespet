import React from "react";

// Referências para consulta editorial. Não equivalem a guias clínicos aprovados.
export const FONTES_REFERENCIA = Object.freeze([
  { id: "aav", nome: "Association of Avian Veterinarians", url: "https://www.aav.org/", area: "Medicina e bem-estar de aves" },
  { id: "merck", nome: "Merck Veterinary Manual", url: "https://www.merckvetmanual.com/", area: "Referência veterinária técnica" },
  { id: "wpt", nome: "World Parrot Trust", url: "https://parrots.org/", area: "Bem-estar e conservação de psitacídeos" },
  { id: "vca", nome: "VCA Animal Hospitals", url: "https://vcahospitals.com/", area: "Educação veterinária para tutores" },
]);

export default function FontesEducativas() {
  return <section className="rounded-2xl border border-emerald-100 bg-white p-4" aria-labelledby="fontes-ia">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 id="fontes-ia" className="text-lg font-bold text-emerald-950">Biblioteca de fontes confiáveis</h2>
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">Em curadoria</span>
    </div>
    <p className="mb-3 text-sm text-stone-600">Referências selecionadas para a equipe consultar. Os guias práticos do Avespet IA ainda precisam de validação editorial e, quando envolvem saúde e alimentação manual, revisão por veterinário de aves.</p>
    <div className="grid gap-2 sm:grid-cols-2">
      {FONTES_REFERENCIA.map(fonte => <a key={fonte.id} href={fonte.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-100 p-3 transition hover:bg-emerald-50">
        <span className="block text-sm font-semibold text-emerald-800">{fonte.nome} ↗</span>
        <span className="mt-1 block text-xs text-stone-600">{fonte.area}</span>
      </a>)}
    </div>
    <p className="mt-3 text-xs text-stone-600">Esta lista não é uma recomendação de tratamento individual e não significa que cada artigo dessas instituições tenha sido revisado pelo Avespet.</p>
  </section>;
}
