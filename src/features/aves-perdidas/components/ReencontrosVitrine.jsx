import React, { useEffect, useState } from "react";
import { Bird, ChevronLeft, ChevronRight, Pause, Play, Heart } from "lucide-react";
import { supabase } from "../../../supabaseClient";
import { listarAvesPerdidas } from "../services/avesPerdidasService";

const BUCKET = "reunion-editorial";
const INTERVAL = 6500;

// As histórias editoriais não são recuperações oficiais e nunca entram nos indicadores.
async function carregarHistorias() {
  const [reais, editoriais] = await Promise.allSettled([
    listarAvesPerdidas(),
    supabase.from("reunion_editorial_stories")
      .select("id,title,bird_name,species,city,story,kind,photo_path,publish_at")
      .eq("state", "scheduled")
      .lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false }).limit(12),
  ]);
  const recuperadas = reais.status === "fulfilled"
    ? reais.value.filter(({data}) => data?.situacao === "reencontrado").map(({id,data}) => ({
        id: "tutor-" + id, name: data.nomeAve || data.especie || "Ave reencontrada",
        title: data.nomeAve || data.especie || "Ave reencontrada",
        description: data.depoimento || "Reencontro registrado na plataforma.",
        species: [data.especie, data.cor].filter(Boolean).join(" · "),
        city: [data.cidade,data.uf].filter(Boolean).join("/"),
        photo: data.foto, type: "tutor"
      }))
    : [];
  const data = editoriais.status === "fulfilled" && !editoriais.value.error
    ? (editoriais.value.data || []) : [];
  const historias = await Promise.all(data.map(async (item) => {
    const { data: signed, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.photo_path, 300);
    return {
      id: "editorial-" + item.id, name: item.bird_name, title: item.title,
      description: item.story, species: item.species, city: item.city,
      photo: error ? null : signed?.signedUrl, type: item.kind
    };
  }));
  return [...recuperadas, ...historias];
}

export default function ReencontrosVitrine({compact = false, variant = "standard"}) {
  const [items, setItems] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [position, setPosition] = useState(0);
  const [pause, setPause] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const result = await carregarHistorias();
        if (alive) { setItems(result); setLoadState("ready"); }
      } catch {
        if (alive) setLoadState("error");
      }
    };
    refresh().catch(() => {});
    const refreshTimer = window.setInterval(() => refresh().catch(() => {}), 120000);
    return () => { alive = false; clearInterval(refreshTimer); };
  }, [retryCount]);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    update(); media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  const count = items.length;
  useEffect(() => {
    if (count <= 1 || pause || engaged || reduced) return;
    const timer = window.setInterval(() => setPosition(v => (v + 1) % count), INTERVAL);
    return () => clearInterval(timer);
  }, [count, pause, engaged, reduced]);
  if (!count) return <section aria-label="Histórias de reencontro" className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
    <div className="bg-emerald-950 px-5 py-5 text-white sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Comunidade Avespet</p>
      <h2 className="mt-1 text-2xl font-extrabold">Histórias de reencontro</h2>
    </div>
    <div className="px-5 py-6 text-sm text-slate-700">
      {loadState === "loading" ? "Carregando histórias..." : loadState === "error" ? "Não foi possível carregar as histórias agora." : "Novas histórias serão exibidas aqui quando estiverem disponíveis."}
      {loadState === "error" && <button type="button" onClick={() => { setLoadState("loading"); setRetryCount(n => n + 1); }} className="ml-3 rounded-lg border border-emerald-500 px-3 py-2 font-semibold text-emerald-900">Tentar novamente</button>}
    </div>
  </section>;
  const activeIndex = position % count;
  // Dimensões específicas por página: preserva a ave inteira sem recorte.
  const photoLayout = {
    home: { columns: "md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]", maxWidth: "max-w-[420px]", maxHeight: "max-h-[525px]" },
    lost: { columns: "md:grid-cols-[minmax(0,310px)_minmax(0,1fr)]", maxWidth: "max-w-[310px]", maxHeight: "max-h-[390px]" },
    campaign: { columns: "md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]", maxWidth: "max-w-[340px]", maxHeight: "max-h-[425px]" },
    standard: { columns: "md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]", maxWidth: "max-w-[340px]", maxHeight: "max-h-[425px]" },
  }[variant] || { columns: "md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]", maxWidth: "max-w-[340px]", maxHeight: "max-h-[425px]" };
  const item = items[activeIndex];
  const ficticia = item.type === "illustrative";
  const real = item.type === "tutor";
  const advance = delta => setPosition(i => ((i % count) + delta + count) % count);
  return <section aria-label="Carrossel de histórias de reencontro"
    onMouseEnter={() => setEngaged(true)} onMouseLeave={() => setEngaged(false)}
    onFocusCapture={() => setEngaged(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setEngaged(false); }}
    className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">
    <div className={"px-5 text-white sm:px-8 " + (compact ? "bg-emerald-900 py-4" : "bg-emerald-950 py-6")}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-200"><Heart size={16}/> Comunidade Avespet</p>
      <h2 className={"mt-1 font-extrabold " + (compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>Histórias de reencontro</h2>
      <p className="mt-1 text-xs leading-5 text-emerald-100">Reencontros registrados e exemplos demonstrativos são apresentados com identificação própria.</p>
    </div>
    <div className="p-4 sm:p-5">
      <article className={"grid min-w-0 overflow-hidden rounded-2xl border border-slate-200 "+photoLayout.columns} aria-live="off">
        <div className="flex min-w-0 items-center justify-center bg-white px-2 py-3 sm:px-3">
          <div className={"flex w-full min-w-0 items-center justify-center "+photoLayout.maxWidth}>
            {item.photo ? <img src={item.photo} alt={item.name} loading={compact ? "eager" : "lazy"} decoding="async" className={"block h-auto w-auto max-w-full object-contain object-center "+photoLayout.maxHeight} /> : <div className="flex aspect-[4/5] w-full items-center justify-center bg-slate-100"><Bird size={60} className="text-slate-400" /></div>}
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center p-5">
          <p className={"text-xs font-extrabold uppercase tracking-wide " + (ficticia ? "text-slate-700" : "text-emerald-800")}>
            {ficticia ? "História de reencontro" : real ? "Reencontro registrado pelo tutor" : "Relato real autorizado"}
          </p>
          <h3 className={"mt-2 break-words font-bold text-slate-950 " + (compact ? "text-lg" : "text-2xl")}>{item.title}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-700">{item.name}</p>
          <p className="text-sm text-slate-600">{[item.species,item.city].filter(Boolean).join(" · ")}</p>
          <p className={"mt-3 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 " + (compact ? "max-h-24" : "max-h-36")}>{item.description}</p>
          {ficticia && <p className="mt-3 text-xs font-semibold text-slate-700">Exemplo demonstrativo: esta narrativa não representa uma recuperação registrada ou depoimento real.</p>}
        </div>
      </article>
      {count > 1 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button aria-label="História anterior" type="button" onClick={() => advance(-1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200"><ChevronLeft/></button>
          <span className="min-w-12 text-center text-sm font-semibold text-emerald-950">{activeIndex + 1} / {count}</span>
          <button aria-label="Próxima história" type="button" onClick={() => advance(1)} className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200"><ChevronRight/></button>
        </div>
        {!reduced && <button type="button" onClick={() => setPause(v => !v)} className="flex min-h-11 items-center gap-2 rounded-lg border border-emerald-200 px-3 text-sm font-semibold text-emerald-900">{pause ? <Play size={16}/> : <Pause size={16}/>} {pause ? "Reproduzir" : "Pausar"}</button>}
      </div>}
      <p className="mt-3 text-xs text-slate-500">Histórias não representam garantia de recuperação ou resultado de campanha paga.</p>
    </div>
  </section>;
}
