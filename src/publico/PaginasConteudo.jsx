import React, { useEffect, useState } from "react";
import { Loader2, Play, Share2, Link2, ArrowLeft } from "lucide-react";
import { listArtigosPublicos, getArtigoPorSlug } from "../lib/db";
import { youtubeId, resumoAutomatico, minutosLeitura, ESPECIES_CONTEUDO } from "./conteudo";
import { Link } from "./roteador";
import { PaginaPublica, CabecalhoPublico, CartaoPublico, TEMA_PUBLICO } from "./ComponentesPublicos";
import { useSEO } from "./seo";
import CorpoArtigo from "./CorpoArtigo";

const CLARO = { background: "#FFFFFF", border: "1px solid #E1E9E2" };

function useArtigos() {
  const [estado, setEstado] = useState({ carregando: true, lista: [], erro: false });
  useEffect(() => {
    let vivo = true;
    listArtigosPublicos()
      .then((lista) => vivo && setEstado({ carregando: false, lista, erro: false }))
      .catch(() => vivo && setEstado({ carregando: false, lista: [], erro: true }));
    return () => { vivo = false; };
  }, []);
  return estado;
}

function Carregando() {
  return <div className="flex justify-center py-12"><Loader2 className="animate-spin" color="#C69A2E" size={28} /></div>;
}

function Etiqueta({ children, cor = "#f0e6d2" }) {
  return <span className="text-[10px] px-2 py-0.5 rounded ui-mono" style={{ background: cor, color: "#5a4a30" }}>{children}</span>;
}

function CartaoGuia({ artigo }) {
  const vid = youtubeId(artigo.videoUrl);
  return (
    <Link para={`/guias/${artigo.slug}`} className="block rounded-xl overflow-hidden ui-sans" style={CLARO}>
      {vid && (
        <div className="relative aspect-video" style={{ background: "#3a2a1c" }}>
          <img src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full p-3" style={{ background: "rgba(43,29,20,0.75)" }}><Play size={22} color="#F1E6D2" /></span>
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Etiqueta cor={artigo.especie === "Calopsita" ? "#f5e3b0" : artigo.especie === "Ring Neck" ? "#cfe3c4" : "#f0e6d2"}>{artigo.especie}</Etiqueta>
          {artigo.categoria && <Etiqueta>{artigo.categoria}</Etiqueta>}
        </div>
        <div className="font-semibold mb-1" style={{ color: "#2B241C", fontSize: 17, lineHeight: 1.3 }}>{artigo.titulo}</div>
        {artigo.resumo && <div className="text-sm" style={{ color: "#7a6a52" }}>{artigo.resumo}</div>}
      </div>
    </Link>
  );
}

export function GuiasEmDestaque() {
  const { lista } = useArtigos();
  if (!lista.length) return null;
  return (
    <section className="w-full">
      <h2 className="ui-sans mb-2 text-2xl font-bold" style={{ color: "#1D2B25" }}>Guias e vídeos para cuidar melhor</h2>
      <p className="ui-sans mb-6 text-sm" style={{ color: "#63736A" }}>Conteúdo prático sobre reprodução, filhotes e manejo de diferentes espécies.</p>
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {lista.slice(0, 3).map((a) => <CartaoGuia key={a.id} artigo={a} />)}
      </div>
      <div className="flex flex-wrap gap-4 ui-sans text-sm">
        <Link para="/guias" style={{ color: "#174B3B", fontWeight: 700 }}>Ver todos os guias →</Link>
        <Link para="/videos" style={{ color: "#174B3B", fontWeight: 700 }}>Ver vídeos →</Link>
      </div>
    </section>
  );
}

export function PaginaGuias() {
  const { carregando, lista, erro } = useArtigos();
  const [filtro, setFiltro] = useState("Todas");
  useSEO({ titulo: "Guias para criadores de Ring Neck e Calopsita", descricao: "Guias práticos sobre reprodução, incubação, filhotes e manejo de aves.", caminho: "/guias" });
  const visiveis = lista.filter((a) => filtro === "Todas" || a.especie === filtro || a.especie === "Geral");

  return (
    <div style={{ background: TEMA_PUBLICO.fundo, minHeight: "70vh" }}>
      <PaginaPublica>
        <CabecalhoPublico etiqueta="Aprendizado e cuidado" titulo="Guias para cuidar melhor das suas aves" descricao="Conteúdo prático sobre reprodução, incubação, filhotes e manejo." />
        <div className="mb-6 flex flex-wrap gap-2">
          {["Todas", ...ESPECIES_CONTEUDO.filter((e) => e !== "Geral")].map((e) => (
            <button key={e} onClick={() => setFiltro(e)} className="rounded-full px-4 py-2 text-xs font-semibold transition"
              style={{ background: filtro === e ? TEMA_PUBLICO.verde : "#FFFFFF", color: filtro === e ? "#FFFFFF" : TEMA_PUBLICO.texto, border: `1px solid ${filtro === e ? TEMA_PUBLICO.verde : TEMA_PUBLICO.borda}` }}>{e}</button>
          ))}
        </div>
        {carregando ? <div className="py-10"><Carregando /></div> : visiveis.length === 0 ? (
          <CartaoPublico className="p-8 text-center">
            <p className="text-sm" style={{ color: TEMA_PUBLICO.texto }}>{erro ? "Não foi possível carregar os guias agora." : "Ainda não publicamos guias nessa categoria. Volte em breve!"}</p>
          </CartaoPublico>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((a) => <CartaoGuia key={a.id} artigo={a} />)}
          </div>
        )}
      </PaginaPublica>
    </div>
  );
}

export function PaginaVideos() {
  const { carregando, lista } = useArtigos();
  useSEO({ titulo: "Vídeos para criadores de aves", descricao: "Vídeos sobre cuidados com filhotes, época de criação e manejo de aves.", caminho: "/videos" });
  const comVideo = lista.filter((a) => youtubeId(a.videoUrl));
  return (
    <div style={{ background: TEMA_PUBLICO.fundo, minHeight: "70vh" }}>
      <PaginaPublica>
        <CabecalhoPublico etiqueta="Conteúdo em vídeo" titulo="Vídeos sobre o universo das aves" descricao="Orientações e demonstrações sobre cuidados com filhotes, época de criação e manejo." />
        {carregando ? <div className="py-10"><Carregando /></div> : comVideo.length === 0 ? (
          <CartaoPublico className="p-8 text-center">
            <p className="text-sm" style={{ color: TEMA_PUBLICO.texto }}>Ainda não publicamos vídeos. Volte em breve!</p>
          </CartaoPublico>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {comVideo.map((a) => <CartaoGuia key={a.id} artigo={a} />)}
          </div>
        )}
      </PaginaPublica>
    </div>
  );
}

export function PaginaGuia({ slug, onEntrar }) {
  const [estado, setEstado] = useState({ carregando: true, artigo: null, erro: false });
  const [outros, setOutros] = useState([]);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    setEstado({ carregando: true, artigo: null, erro: false });
    getArtigoPorSlug(slug)
      .then((artigo) => vivo && setEstado({ carregando: false, artigo, erro: false }))
      .catch(() => vivo && setEstado({ carregando: false, artigo: null, erro: true }));
    listArtigosPublicos().then((l) => vivo && setOutros(l.filter((x) => x.slug !== slug).slice(0, 3))).catch(() => {});
    return () => { vivo = false; };
  }, [slug]);

  const a = estado.artigo;
  useSEO({
    titulo: a ? a.titulo : "Guia",
    descricao: a ? a.resumo || resumoAutomatico(a.corpo) : "",
    caminho: `/guias/${slug}`,
    tipo: "article",
  });

  if (estado.carregando) return <Carregando />;
  if (!a) {
    return (
      <section className="px-5 pb-16 max-w-3xl mx-auto text-center ui-sans">
        <h1 className="mb-3" style={{ color: "#F1E6D2", fontSize: 26, fontWeight: 700 }}>{estado.erro ? "Nao foi possivel carregar" : "Guia nao encontrado"}</h1>
        <p className="text-sm mb-5" style={{ color: "#b09a78" }}>{estado.erro ? "Tente de novo em instantes." : "Esse guia nao existe ou ainda nao foi publicado."}</p>
        <Link para="/guias" style={{ color: "#C69A2E", textDecoration: "underline" }}>Ver todos os guias</Link>
      </section>
    );
  }

  const vid = youtubeId(a.videoUrl);
  const url = `${window.location.origin}/guias/${a.slug}`;
  const data = a.publicadoEm ? new Date(a.publicadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "";
  function copiar() {
    try { navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2500); } catch { /* sem permissao: ignora */ }
  }

  return (
    <article className="px-5 pb-16 max-w-3xl mx-auto">
      <Link para="/guias" className="ui-sans inline-flex items-center gap-1 text-sm mb-4" style={{ color: "#b09a78" }}><ArrowLeft size={14} /> Todos os guias</Link>
      <div className="rounded-xl p-5 sm:p-8" style={CLARO}>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Etiqueta>{a.especie}</Etiqueta>
          {a.categoria && <Etiqueta>{a.categoria}</Etiqueta>}
        </div>
        <h1 style={{ color: "#2B241C", fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>{a.titulo}</h1>
        <div className="ui-sans text-xs mt-2 mb-5" style={{ color: "#8a7a63" }}>{data}{data ? " - " : ""}{minutosLeitura(a.corpo)} min de leitura</div>

        {vid && (
          <div className="aspect-video mb-6 rounded-lg overflow-hidden" style={{ background: "#000" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${vid}`} title={a.titulo} loading="lazy"
              className="w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        )}

        <CorpoArtigo corpo={a.corpo} />

        <div className="flex flex-wrap gap-2 mt-8 pt-5 ui-sans" style={{ borderTop: "1px solid #e3d3b4" }}>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${a.titulo} - ${url}`)}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "#556b3f", color: "#F1E6D2" }}>
            <Share2 size={14} /> Compartilhar no WhatsApp
          </a>
          <button onClick={copiar} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Link2 size={14} /> {copiado ? "Link copiado!" : "Copiar link"}
          </button>
        </div>
      </div>

      <div className="rounded-xl p-5 mt-6 text-center ui-sans" style={{ background: "#3a2314", border: "1px solid #4b3523" }}>
        <div className="font-semibold mb-1" style={{ color: "#F1E6D2" }}>Cria Ring Neck ou Calopsita?</div>
        <div className="text-sm mb-3" style={{ color: "#b09a78" }}>Organize cadastro, genealogia, ovos, filhotes e financeiro do seu plantel, de graca.</div>
        <button onClick={onEntrar} className="text-sm font-semibold px-5 py-2.5 rounded-lg" style={{ background: "#C69A2E", color: "#2B1D14" }}>Criar conta gratuita</button>
      </div>

      {outros.length > 0 && (
        <div className="mt-8">
          <div className="ui-sans font-semibold mb-3" style={{ color: "#F1E6D2" }}>Continue lendo</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {outros.map((o) => <CartaoGuia key={o.id} artigo={o} />)}
          </div>
        </div>
      )}
    </article>
  );
}
