import React, { useState } from "react";
import { BookOpen, ChevronDown, MessageCircle, Search } from "lucide-react";
import { GUIA_INICIANTE, PERGUNTAS_INICIANTE } from "./guiaIniciante.js";
import { normalizarTexto } from "./respostasComFontes.js";

export default function GuiaIniciante({ onPergunta, disabled = false }) {
  const [aberto, setAberto] = useState(true);
  const [categoria, setCategoria] = useState("todos");
  const [busca, setBusca] = useState("");
  const termo = normalizarTexto(busca);
  const grupos = GUIA_INICIANTE.filter(g => categoria === "todos" || g.id === categoria)
    .map(g => ({ ...g, perguntas: g.perguntas.filter(p => !termo || normalizarTexto(p.pergunta + " " + p.resposta).includes(termo)) }))
    .filter(g => g.perguntas.length);
  return <section className="min-w-0 rounded-2xl border border-[#DEE7DF] bg-white shadow-sm" aria-label="Guia para iniciantes">
    <button type="button" aria-expanded={aberto} onClick={() => setAberto(v => !v)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
      <span className="flex items-center gap-3"><BookOpen size={24} className="shrink-0 text-emerald-700"/><span><strong className="block text-base">Guia para iniciantes</strong><span className="block text-xs text-[#607366]">{PERGUNTAS_INICIANTE.length} perguntas com respostas prontas · escolha por assunto</span></span></span>
      <ChevronDown size={20} className={aberto ? "rotate-180" : ""}/>
    </button>
    {aberto && <div className="space-y-3 border-t border-[#E7EDE8] p-4">
      <label className="flex items-center gap-2 rounded-xl border border-[#D7E6DA] px-3 py-2"><Search size={18} className="shrink-0 text-emerald-700"/><input value={busca} onChange={e => setBusca(e.target.value)} className="min-w-0 w-full bg-transparent text-sm outline-none" placeholder="Buscar: gaiola, alimentação, banho..." aria-label="Buscar perguntas do guia"/></label>
      <div className="flex flex-wrap gap-2" aria-label="Categorias do guia">{[{id:"todos",titulo:"Todas"},...GUIA_INICIANTE].map(g => <button key={g.id} type="button" aria-pressed={categoria===g.id} onClick={() => setCategoria(g.id)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold "+(categoria===g.id ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-[#DEE7DF] text-[#586B5F]")}>{g.titulo}</button>)}</div>
      <div className="max-h-[360px] space-y-3 overflow-y-auto overscroll-contain pr-1">
      {grupos.map(g => <div key={g.id}><h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#607366]">{g.titulo}</h3><div className="grid gap-2 sm:grid-cols-2">{g.perguntas.map(p => <button type="button" key={p.id} disabled={disabled} onClick={() => onPergunta(p.id)} className="flex items-center gap-2 rounded-xl border border-[#D7E6DA] bg-[#F9FCF9] px-3 py-3 text-left text-sm font-medium text-[#234332] hover:bg-emerald-50 disabled:opacity-50"><MessageCircle size={16} className="shrink-0 text-emerald-700"/><span>{p.pergunta}</span></button>)}</div></div>)}
      {!grupos.length && <p className="text-sm text-[#607366]">Nenhuma pergunta encontrada. Tente outro termo ou categoria.</p>}
      </div>
      <p className="text-xs text-[#607366]">Respostas gerais imediatas, sem consumir o Gemini. Conteúdo introdutório em revisão editorial; dúvidas individuais de saúde exigem avaliação veterinária.</p>
    </div>}
  </section>;
}
