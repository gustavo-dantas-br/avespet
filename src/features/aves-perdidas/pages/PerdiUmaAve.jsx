import React, { useState } from "react";
import { Link } from "../../../publico/roteador";
import { criarAnuncioPerdida } from "../services/avesPerdidasService";
import { comprimirEEnviarImagemPublica } from "../utils/comprimirImagem";

const input = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #e3d3b4", background: "#fff", color: "#2B241C" };

export default function PerdiUmaAve() {
  const [form, setForm] = useState({ nomeAve: "", especie: "Ring Neck", cor: "", cidade: "", uf: "SP", dataPerda: "", descricao: "", contatoNome: "", whatsapp: "", foto: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [anuncioCriadoId, setAnuncioCriadoId] = useState("");
  const [erro, setErro] = useState("");
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  async function enviar(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    if (!form.contatoNome.trim() || !form.whatsapp.trim() || !form.cidade.trim()) {
      setErro("Preencha nome, WhatsApp e cidade para publicar.");
      return;
    }
    setEnviando(true);
    try {
      const novoId = await criarAnuncioPerdida({ ...form, criadoEm: new Date().toISOString() });
      setAnuncioCriadoId(novoId);
      setMensagem("Recebemos seu anúncio! Ele será analisado antes de aparecer publicamente. A publicação gratuita não exige assinatura.");
      setForm({ nomeAve: "", especie: "Ring Neck", cor: "", cidade: "", uf: "SP", dataPerda: "", descricao: "", contatoNome: "", whatsapp: "", foto: "" });
    } catch (e) {
      setErro(e?.message || "Não foi possível enviar. Tente novamente.");
    } finally { setEnviando(false); }
  }

  async function fotoSelecionada(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro("");
    try {
      const foto = await comprimirEEnviarImagemPublica(arquivo, "perdidas", 160 * 1024);
      alterar("foto", foto);
    } catch (err) {
      setErro(err?.message || "Não foi possível processar essa foto.");
      e.target.value = "";
    }
  }

  return <section className="px-5 py-8 max-w-2xl mx-auto ui-sans">
    <Link para="/" style={{ color: "#C69A2E" }}>← Voltar</Link>
    <h1 className="mt-4 mb-2" style={{ color: "#F1E6D2", fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 700 }}>Perdi minha ave</h1>
    <p className="mb-6" style={{ color: "#b09a78" }}>Publique gratuitamente para divulgar o desaparecimento. Não precisa ter cadastro ou assinatura no Avespet.</p>
    <form onSubmit={enviar} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "#FAF3E6" }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">Nome da ave<input style={input} value={form.nomeAve} onChange={e=>alterar("nomeAve",e.target.value)} placeholder="Ex.: Mel" /></label>
        <label className="text-sm">Espécie<select style={input} value={form.especie} onChange={e=>alterar("especie",e.target.value)}><option>Ring Neck</option><option>Calopsita</option><option>Agapornis</option><option>Papagaio</option><option>Outra</option></select></label>
        <label className="text-sm">Cor / mutação<input style={input} value={form.cor} onChange={e=>alterar("cor",e.target.value)} /></label>
        <label className="text-sm">Data em que desapareceu<input type="date" style={input} value={form.dataPerda} onChange={e=>alterar("dataPerda",e.target.value)} /></label>
        <label className="text-sm">Cidade<input required style={input} value={form.cidade} onChange={e=>alterar("cidade",e.target.value)} /></label>
        <label className="text-sm">Estado<input maxLength="2" style={input} value={form.uf} onChange={e=>alterar("uf",e.target.value.toUpperCase())} /></label>
      </div>
      <label className="text-sm">Conte como e onde desapareceu<textarea style={input} rows="3" value={form.descricao} onChange={e=>alterar("descricao",e.target.value)} /></label>
      <label className="text-sm">Foto da ave (opcional)<input className="block w-full mt-1 text-sm" type="file" accept="image/*" onChange={fotoSelecionada} /></label>
      {form.foto && <img src={form.foto} alt="Prévia da ave" className="w-28 h-28 rounded-lg object-cover" />}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "#e3d3b4" }}>
        <p className="font-semibold mb-2">Seus dados para contato</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Seu nome<input required style={input} value={form.contatoNome} onChange={e=>alterar("contatoNome",e.target.value)} /></label>
          <label className="text-sm">WhatsApp<input required style={input} value={form.whatsapp} onChange={e=>alterar("whatsapp",e.target.value)} placeholder="DDD + número" /></label>
        </div>
      </div>
      {erro && <p role="alert" className="text-sm" style={{color:"#a6402b"}}>{erro}</p>}
      {mensagem && <div role="status" className="text-sm p-3 rounded-lg" style={{background:"#e4ead9",color:"#405331"}}><p>{mensagem}</p><a href={anuncioCriadoId ? `/campanha-ave-perdida?anuncio=${anuncioCriadoId}` : "/campanha-ave-perdida"} className="inline-block mt-2 font-semibold underline" style={{color:"#405331"}}>Quero ampliar a divulgação da minha busca</a></div>}
      <button disabled={enviando} className="rounded-lg py-3 font-semibold disabled:opacity-60" style={{background:"#C69A2E",color:"#2B1D14"}}>{enviando ? "Enviando..." : "Publicar anúncio gratuito"}</button>
      <p className="text-xs" style={{color:"#8a7a63"}}>Seu anúncio passará por análise. O impulsionamento regional será opcional e contratado separadamente.</p>
    </form>
  </section>;
}
