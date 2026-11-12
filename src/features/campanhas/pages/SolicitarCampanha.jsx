import React, { useState } from "react";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { PACOTES_CAMPANHA } from "../config/pacotes";
import { solicitarCampanha } from "../services/campanhasService";
import { PaginaPublica, CabecalhoPublico, CartaoPublico, TEMA_PUBLICO } from "../../../publico/ComponentesPublicos";

const input = {
  width: "100%",
  background: "#FFFFFF",
  border: `1px solid ${TEMA_PUBLICO.borda}`,
  color: TEMA_PUBLICO.tinta,
  borderRadius: 10,
  padding: "12px 13px",
  fontSize: 14,
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
          titulo="Amplie a divulgação da sua ave perdida"
          descricao="Além do anúncio gratuito, você pode solicitar uma campanha regional. Nossa equipe avalia a região, apresenta o orçamento e orienta sobre o pagamento antes de iniciar a divulgação."
        />

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
                  <h2 className="text-lg font-bold" style={{ color: TEMA_PUBLICO.tinta }}>1. Escolha o alcance</h2>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {PACOTES_CAMPANHA.map((p) => (
                    <label key={p.id} className="cursor-pointer rounded-xl p-4 transition" style={{ border: form.pacote === p.id ? `2px solid ${TEMA_PUBLICO.verde}` : `1px solid ${TEMA_PUBLICO.borda}`, background: form.pacote === p.id ? TEMA_PUBLICO.verdeClaro : "#FFFFFF" }}>
                      <input type="radio" name="pacote" value={p.id} checked={form.pacote === p.id} onChange={() => alterar("pacote", p.id)} />
                      <div className="mt-2 font-bold" style={{ color: TEMA_PUBLICO.tinta }}>{p.nome}</div>
                      <div className="mt-1 text-xs font-semibold" style={{ color: TEMA_PUBLICO.verde }}>{p.alcance}</div>
                      <p className="mt-2 text-xs leading-5" style={{ color: TEMA_PUBLICO.texto }}>{p.descricao}</p>
                      <div className="mt-3 text-xs font-bold" style={{ color: TEMA_PUBLICO.tinta }}>Orçamento sob consulta</div>
                    </label>
                  ))}
                </div>
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
      </PaginaPublica>
    </div>
  );
}
