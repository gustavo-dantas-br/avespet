import React, { useState } from "react";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { PACOTES_CAMPANHA } from "../config/pacotes";
import { solicitarCampanha } from "../services/campanhasService";

const input = { width: "100%", background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", borderRadius: 8, padding: "11px 12px", fontSize: 14 };
const label = { display: "block", color: "#8a7a63", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 };

export default function SolicitarCampanha() {
  const [form, setForm] = useState({ pacote: "cidade", nome: "", whatsapp: "", email: "", cidade: "", uf: "SP", areaAlvo: "", descricaoAve: "" });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await solicitarCampanha(form);
      setEnviado(true);
    } catch (err) {
      setErro(err?.message || "Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="px-5 pb-14 max-w-4xl mx-auto ui-sans">
    <div className="text-center mb-8">
      <Megaphone size={34} color="#C69A2E" className="mx-auto mb-3" />
      <h1 style={{ color: "#F1E6D2", fontFamily: "'Fraunces',serif", fontSize: 34, fontWeight: 700 }}>Amplie a divulgação da sua ave perdida</h1>
      <p className="mt-3 max-w-2xl mx-auto" style={{ color: "#b09a78" }}>Além do anúncio gratuito, você pode solicitar uma campanha regional. Nossa equipe combina o alcance, apresenta o orçamento e orienta sobre o pagamento antes de iniciar a divulgação.</p>
    </div>

    {enviado ? <div className="rounded-xl p-7 text-center" style={{ background: "#e4ead9", color: "#2B241C" }}>
      <CheckCircle2 size={38} className="mx-auto mb-3" />
      <h2 className="text-xl font-bold">Solicitação recebida!</h2>
      <p className="mt-2 text-sm">Nossa equipe vai analisar a região e entrar em contato pelo WhatsApp para apresentar o orçamento. Nenhuma cobrança foi feita neste envio.</p>
    </div> : <form onSubmit={enviar} className="rounded-xl p-5 md:p-7" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      <h2 className="font-bold text-lg mb-4" style={{ color: "#2B241C" }}>1. Escolha o alcance</h2>
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {PACOTES_CAMPANHA.map((p) => <label key={p.id} className="rounded-lg p-4 cursor-pointer" style={{ border: form.pacote === p.id ? "2px solid #C69A2E" : "1px solid #d8c7a7", background: form.pacote === p.id ? "#f5e9c9" : "#fff" }}>
          <input type="radio" name="pacote" value={p.id} checked={form.pacote === p.id} onChange={() => alterar("pacote", p.id)} />
          <div className="font-bold mt-2" style={{ color: "#2B241C" }}>{p.nome}</div>
          <div className="text-xs mt-1 font-semibold" style={{ color: "#8a6a2c" }}>{p.alcance}</div>
          <p className="text-xs mt-2" style={{ color: "#75664f" }}>{p.descricao}</p>
          <div className="text-xs mt-3 font-semibold" style={{ color: "#2B241C" }}>Orçamento sob consulta</div>
        </label>)}
      </div>
      <h2 className="font-bold text-lg mb-4" style={{ color: "#2B241C" }}>2. Região da divulgação</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <label><span style={label}>Cidade de referência *</span><input style={input} required maxLength={80} value={form.cidade} onChange={(e) => alterar("cidade", e.target.value)} /></label>
        <label><span style={label}>Estado (UF) *</span><input style={input} required minLength={2} maxLength={2} value={form.uf} onChange={(e) => alterar("uf", e.target.value.toUpperCase())} /></label>
        <label className="md:col-span-2"><span style={label}>Bairros ou cidades que deseja alcançar *</span><input style={input} required maxLength={240} value={form.areaAlvo} onChange={(e) => alterar("areaAlvo", e.target.value)} placeholder="Ex.: Centro, bairros próximos ou cidades vizinhas" /></label>
      </div>
      <h2 className="font-bold text-lg mb-4" style={{ color: "#2B241C" }}>3. Dados para contato</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <label><span style={label}>Seu nome *</span><input style={input} required maxLength={100} value={form.nome} onChange={(e) => alterar("nome", e.target.value)} /></label>
        <label><span style={label}>WhatsApp *</span><input style={input} required type="tel" maxLength={20} value={form.whatsapp} onChange={(e) => alterar("whatsapp", e.target.value)} /></label>
        <label className="md:col-span-2"><span style={label}>E-mail (opcional)</span><input style={input} type="email" maxLength={150} value={form.email} onChange={(e) => alterar("email", e.target.value)} /></label>
        <label className="md:col-span-2"><span style={label}>Descrição da ave (opcional)</span><textarea style={{ ...input, minHeight: 90 }} maxLength={1000} value={form.descricaoAve} onChange={(e) => alterar("descricaoAve", e.target.value)} placeholder="Espécie, cor, data em que desapareceu e outras informações úteis." /></label>
      </div>
      {erro && <p role="alert" className="text-sm mb-3" style={{ color: "#a6402b" }}>{erro}</p>}
      <p className="text-xs mb-4" style={{ color: "#75664f" }}>Esta etapa é apenas uma solicitação de orçamento. A campanha só será iniciada após aprovação do orçamento e confirmação do pagamento. Não há garantia de localização ou recuperação da ave.</p>
      <button disabled={loading} className="w-full rounded-lg py-3 font-bold disabled:opacity-60" style={{ background: "#C69A2E", color: "#2B1D14" }}>{loading ? "Enviando..." : "Solicitar orçamento da campanha"}</button>
    </form>}
  </section>;
}
