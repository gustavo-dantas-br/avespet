import React, { useEffect, useState } from "react";
import { Bird, Heart, ChevronLeft, ChevronRight, Play, Pause, MapPin, CheckCircle2, Star } from "lucide-react";

const INTERVALO = 6500;

export default function ReencontrosCarousel({ items = [] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const count = items.length;
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  useEffect(() => {
    if (count < 2 || !playing || hover || focused || reduced) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % count), INTERVALO);
    return () => clearInterval(timer);
  }, [count, playing, hover, focused, reduced]);
  if (!count) return null;
  const current = index % count;
  const { data: d } = items[current];
  const name = d.nomeAve || d.especie || "Ave reencontrada";
  const location = [d.cidade, d.uf].filter(Boolean).join("/");
  const rating = Number(d.avaliacao);
  const move = direction => setIndex(i => ((i % count) + direction + count) % count);
  return (
    <section aria-labelledby="carrossel-reencontros-titulo" aria-roledescription="carrossel" className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50 shadow-sm" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
      <div className="bg-emerald-950 px-5 py-6 text-white sm:px-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-200"><Heart size={18}/> Reencontros registrados</p>
        <h2 id="carrossel-reencontros-titulo" className="mt-2 text-2xl font-extrabold sm:text-3xl">Aves que voltaram para casa</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-100">Conheça aves que já retornaram às suas famílias. Cada reencontro é uma nova esperança.</p>
      </div>
      <div className="p-4 sm:p-6">
        <article aria-live={playing && !hover && !focused && !reduced && count > 1 ? "off" : "polite"} className="grid overflow-hidden rounded-2xl border border-emerald-200 bg-white sm:grid-cols-2">
          {d.foto ? <img src={d.foto} alt={name} loading="lazy" decoding="async" className="h-64 w-full bg-emerald-50 object-contain sm:h-full sm:min-h-[260px]"/> : <div className="flex h-64 items-center justify-center bg-emerald-50 text-emerald-800"><Bird size={58}/></div>}
          <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800"><CheckCircle2 size={18}/> Reencontro registrado pelo tutor</p>
            <h3 className="mt-3 break-words text-3xl font-extrabold text-emerald-950">{name}</h3>
            <p className="mt-1 text-sm text-slate-600">{[d.especie,d.cor].filter(Boolean).join(" · ")}</p>
            {location && <p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><MapPin size={16}/>{location}</p>}
            {Number.isInteger(rating) && rating >= 1 && rating <= 5 && <div className="mt-3 flex gap-1 text-amber-600" aria-label={rating+" de 5 estrelas"}>{Array.from({length:rating},(_,i)=><Star key={i} size={18} fill="currentColor"/>)}</div>}
            {d.depoimento && <blockquote className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap break-words border-l-2 border-emerald-300 pl-3 text-sm leading-6 text-slate-700">“{d.depoimento}”</blockquote>}
          </div>
        </article>
        {count > 1 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Reencontro anterior" onClick={()=>move(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-950"><ChevronLeft/></button>
            <button type="button" aria-label="Próximo reencontro" onClick={()=>move(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300 bg-white text-emerald-950"><ChevronRight/></button>
            <span className="text-sm font-semibold text-emerald-900">{current+1} / {count}</span>
          </div>
          {!reduced && <button type="button" aria-label={playing?"Pausar carrossel":"Reproduzir carrossel"} onClick={()=>setPlaying(p=>!p)} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900">{playing?<Pause size={16}/>:<Play size={16}/>} {playing?"Pausar":"Reproduzir"}</button>}
        </div>}
        <p className="mt-3 text-xs leading-5 text-slate-600">Reencontros registrados não representam garantia de recuperação ou resultado de campanha paga.</p>
      </div>
    </section>
  );
}
