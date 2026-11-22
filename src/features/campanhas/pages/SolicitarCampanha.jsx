import React, { useEffect, useState } from "react";
import { Megaphone, CheckCircle2, CalendarDays, MapPin, Users, Heart, ArrowRight, ShieldCheck } from "lucide-react";
import ReencontrosPublicos from "../components/ReencontrosPublicos";
import EditorialStories from "../components/EditorialStories";
import { formatarAlcance } from "../config/alcance";
import { PACOTES_CAMPANHA } from "../config/pacotes";
import { solicitarCampanha, listarPacotesPublicos } from "../services/campanhasService";
import { PaginaPublica, CabecalhoPublico, CartaoPublico, TEMA_PUBLICO } from "../../../publico/ComponentesPublicos";

const input = {
  width: "100%",
  background: "#FFFFFF",
  border: `1px solid ${TEMA_PUBLICO.borda}`,
  color: TEMA_PUBLICO.tinta,
  borderRadius: 10,
  padding: "12px 13px",
  fontSize: 16,
  outlineColor: TEMA_PUBLICO.verde,
};
const label = {
  display: "block",
  color: TEMA_PUBLICO.texto,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  marginBottom: 6,
};

export default function SolicitarCampanha() {
  const anuncioId = new URLSearchParams(window.location.search).get("anuncio") || "";
  const [form, setForm] = useState({ pacote: "cidade", nome: "", whatsapp: "", email: "", cidade: "", uf: "SP", areaAlvo: "", descricaoAve: "" });
  const [pacotes, setPacotes] = useState(null);
  useEffect(()=>{let active=true;listarPacotesPublicos().then(rows=>{if(!active)return;setPacotes(rows);if(rows.length)setForm(f=>({...f,pacote:rows.some(p=>p.code===f.pacote)?f.pacote:rows[0].code}));}).catch(()=>{if(active)setPacotes([]);});return()=>{active=false;};},[]);
  const opcoes = pacotes?.length ? pacotes.map(p=>({id:p.code,nome:p.name,descricao:p.description,alcance:p.reach_label,dias:p.duration_days,preco:p.price_cents,min:p.reach_min,max:p.reach_max})) : PACOTES_CAMPANHA;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await solicitarCampanha({ ...form, anuncioId });
      setEnviado(true);
    } catch (err) {
      setErro(err?.message || "Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background: TEMA_PUBLICO.fundo, minHeight: "70vh" }}>
      <PaginaPublica largura="max-w-4xl">
        <CabecalhoPublico
          etiqueta="Divulgação regional"
          titulo="Sua ave desapareceu? Amplie a busca perto de você."
          descricao="Sabemos como é angustiante perder uma ave. Comece gratuitamente e, se desejar, amplie a divulgação para que mais pessoas da região possam reconhecer seu pet e avisar nossa equipe."
        />

        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-start gap-3"><Heart size={24} className="shrink-0 text-emerald-700"/><div><h2 className="font-bold text-emerald-950">Você não precisa esperar para começar a buscar</h2><p className="mt-1 text-sm leading-6 text-emerald-900">Cadastre sua ave sem custo, compartilhe o anúncio com pessoas próximas e informe o último local em que ela foi vista. Os pacotes pagos são opcionais.</p></div></div>
          <a href="/aves-perdidas" className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Cadastrar ou consultar minha ave <ArrowRight size={16}/></a>
        </div>
        {enviado ? (
          <CartaoPublico className="p-7 text-center md:p-10">
            <CheckCircle2 size={42} className="mx-auto mb-4" color={TEMA_PUBLICO.verde} />
            <h2 className="text-2xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Solicitação recebida!</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6" style={{ color: TEMA_PUBLICO.texto }}>Nossa equipe vai analisar a região e entrar em contato pelo WhatsApp para apresentar o orçamento. Nenhuma cobrança foi feita neste envio.</p>
          </CartaoPublico>
        ) : (
          <CartaoPublico className="p-5 md:p-8">
            <form onSubmit={enviar}>
              <div className="mb-7">
                <div className="mb-4 flex items-center gap-2">
                  <Megaphone size={20} color={TEMA_PUBLICO.verde} />
                  <h2 className="text-xl font-bold" style={{ color: TEMA_PUBLICO.tinta }}>1. Escolha como ampliar sua busca</h2>
                </div>
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><strong>Gratuito — R$ 0,00</strong><p className="text-sm">Cadastre sua ave perdida gratuitamente, sem publicidade paga.</p><a className="mt-2 inline-block font-semibold text-emerald-800 underline" href="/aves-perdidas">Consultar anúncios e buscar minha ave</a></div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {opcoes.map((p) => {
                    const alcance = Number.isInteger(p.min) && Number.isInteger(p.max) && p.max>0 ? {min:p.min,max:p.max} : null;
                    const selecionado = form.pacote === p.id;
                    return <label key={p.id} className={`relative flex cursor-pointer flex-col rounded-2xl border-2 p-5 transition focus-within:ring-2 focus-within:ring-emerald-500 ${selecionado ? "border-emerald-700 bg-emerald-50 shadow-md" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-extrabold text-emerald-950">{p.nome}</h3><input className="mt-1 h-5 w-5 shrink-0 accent-emerald-700" type="radio" name="pacote" value={p.id} checked={selecionado} onChange={() => alterar("pacote", p.id)} /></div>
                      {p.id === "cidade" && p.preco != null && <span className="mt-1 self-start text-xs font-bold text-emerald-800">Equilíbrio entre alcance e duração</span>}
                      <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{p.preco == null ? "Sob consulta" : new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(p.preco/100)}</p>
                      <p className="text-xs text-slate-600">Pagamento único após aprovação do orçamento</p>
                      {alcance && <div className="my-4 rounded-xl border border-emerald-200 bg-white p-3"><p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><Users size={16}/> Pessoas alcançadas (estimativa)</p><p className="mt-1 text-xl font-extrabold text-emerald-950">{formatarAlcance(alcance)}</p><p className="mt-1 text-xs text-slate-600">Faixa de planejamento, não garantia.</p></div>}
                      <div className="mt-3 space-y-2 text-sm text-slate-800">{p.dias && <p className="flex items-center gap-2"><CalendarDays size={17} className="shrink-0 text-emerald-700"/>{p.dias} dias de divulgação</p>}<p className="flex items-center gap-2"><MapPin size={17} className="shrink-0 text-emerald-700"/>{p.alcance}</p><p className="leading-5">{p.descricao}</p></div>
                      <span className={`mt-4 block rounded-xl px-3 py-3 text-center text-sm font-bold ${selecionado ? "bg-emerald-800 text-white" : "bg-emerald-100 text-emerald-900"}`}>{selecionado ? "Pacote selecionado" : "Escolher pacote"}</span>
                    </label>;
                  })}
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">Alcance calculado a partir da verba líquida estimada para mídia, considerando custo por impressões e frequência. O resultado real varia conforme a região, público e leilão de anúncios. Não é a probabilidade de reencontrar a ave.</p>
              </div>

              <div className="mb-7 border-t pt-6" style={{ borderColor: TEMA_PUBLICO.borda }}>
                <h2 className="mb-4 text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>2. Região da divulgação</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span style={label}>Cidade de referência *</span><input style={input} required maxLength={80} value={form.cidade} onChange={(e) => alterar("cidade", e.target.value)} /></label>
                  <label><span style={label}>Estado (UF) *</span><input style={input} required minLength={2} maxLength={2} value={form.uf} onChange={(e) => alterar("uf", e.target.value.toUpperCase())} /></label>
                  <label className="md:col-span-2"><span style={label}>Bairros ou cidades que deseja alcançar *</span><input style={input} required maxLength={240} value={form.areaAlvo} onChange={(e) => alterar("areaAlvo", e.target.value)} placeholder="Ex.: Centro, bairros próximos ou cidades vizinhas" /></label>
                </div>
              </div>

              <div className="mb-6 border-t pt-6" style={{ borderColor: TEMA_PUBLICO.borda }}>
                <h2 className="mb-4 text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>3. Dados para contato</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <label><span style={label}>Seu nome *</span><input style={input} required maxLength={100} value={form.nome} onChange={(e) => alterar("nome", e.target.value)} /></label>
                  <label><span style={label}>WhatsApp *</span><input style={input} required type="tel" maxLength={20} value={form.whatsapp} onChange={(e) => alterar("whatsapp", e.target.value)} /></label>
                  <label className="md:col-span-2"><span style={label}>E-mail (opcional)</span><input style={input} type="email" maxLength={150} value={form.email} onChange={(e) => alterar("email", e.target.value)} /></label>
                  <label className="md:col-span-2"><span style={label}>Descrição da ave (opcional)</span><textarea style={{ ...input, minHeight: 100, resize: "vertical" }} maxLength={1000} value={form.descricaoAve} onChange={(e) => alterar("descricaoAve", e.target.value)} placeholder="Espécie, cor, data em que desapareceu e outras informações úteis." /></label>
                </div>
              </div>

              {erro && <p role="alert" className="mb-4 rounded-lg p-3 text-sm" style={{ background: "#FCEFEB", color: "#9A3D2C" }}>{erro}</p>}
              <p className="mb-4 text-xs leading-5" style={{ color: TEMA_PUBLICO.texto }}>Esta etapa é apenas uma solicitação de orçamento. A campanha só será iniciada após aprovação do orçamento e confirmação do pagamento. Não há garantia de localização ou recuperação da ave.</p>
              <button disabled={loading} className="w-full rounded-xl py-3.5 font-bold text-white transition disabled:opacity-60" style={{ background: TEMA_PUBLICO.verde }}>{loading ? "Enviando..." : "Solicitar orçamento da campanha"}</button>
            </form>
          </CartaoPublico>
        )}
        <ReencontrosPublicos />
        <EditorialStories />
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold text-emerald-950"><ShieldCheck size={21}/> Como funciona a divulgação?</h2><p className="mt-2 text-sm leading-6 text-slate-700">Após receber sua solicitação, nossa equipe avalia a área da busca, confirma os detalhes e o orçamento antes de iniciar a divulgação. Nos pacotes com mídia, os anúncios podem aparecer no Facebook e Instagram para pessoas da região que talvez não tenham visto sua postagem original. Não há garantia de recuperação, e o anúncio gratuito continua disponível.</p></section>
      </PaginaPublica>
    </div>
  );
}
