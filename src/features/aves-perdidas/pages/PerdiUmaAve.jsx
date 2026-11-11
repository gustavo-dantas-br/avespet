import React, { useCallback, useEffect, useState } from "react";
import { criarAnuncioPerdida, listarMinhasAvesPerdidas } from "../services/avesPerdidasService";
import { comprimirEEnviarImagemPublica } from "../utils/comprimirImagem";

const input = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #e3d3b4", background: "#fff", color: "#2B241C" };
const STATUS = {
  pendente: { label: "Aguardando aprovação", cor: "#8a5a12", fundo: "#f0dab0" },
  aprovado: { label: "Publicado", cor: "#405331", fundo: "#e4ead9" },
  rejeitado: { label: "Não aprovado", cor: "#a6402b", fundo: "#f0dad4" },
  encerrado: { label: "Busca encerrada", cor: "#6b5638", fundo: "#e3d3b4" },
};

export default function PerdiUmaAve({ userId }) {
  const [form, setForm] = useState({ nomeAve: "", especie: "Ring Neck", cor: "", cidade: "", uf: "SP", dataPerda: "", descricao: "", contatoNome: "", whatsapp: "", autorizaContatoPublico: false, foto: "" });
  const [anuncios, setAnuncios] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [anuncioCriadoId, setAnuncioCriadoId] = useState("");
  const [erro, setErro] = useState("");
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  const carregarAnuncios = useCallback(async () => {
    try {
      const lista = await listarMinhasAvesPerdidas(userId);
      setAnuncios(lista);
    } catch (e) {
      setErro(e?.message || "Não foi possível carregar seus anúncios.");
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { carregarAnuncios(); }, [carregarAnuncios]);

  async function enviar(e) {
    e.preventDefault();
    setErro(""); setMensagem("");
    if (!userId) {
      setErro("Entre na sua conta para cadastrar uma ave perdida.");
      return;
    }
    if (!form.contatoNome.trim() || !form.whatsapp.trim() || !form.cidade.trim()) {
      setErro("Preencha nome, WhatsApp e cidade para publicar.");
      return;
    }
    setEnviando(true);
    try {
      const novoId = globalThis.crypto.randomUUID();
      await criarAnuncioPerdida(userId, { ...form, id: novoId, criadoEm: new Date().toISOString() });
      setAnuncioCriadoId(novoId);
      setMensagem("Recebemos seu anúncio! Ele ficará aguardando análise e só aparecerá na página pública depois da aprovação.");
      setForm({ nomeAve: "", especie: "Ring Neck", cor: "", cidade: "", uf: "SP", dataPerda: "", descricao: "", contatoNome: "", whatsapp: "", autorizaContatoPublico: false, foto: "" });
      await carregarAnuncios();
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

  return <section className="ui-sans max-w-3xl">
    <h1 className="mb-2" style={{ color: "#F1E6D2", fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700 }}>Cadastrar ave perdida</h1>
    <p className="mb-6" style={{ color: "#b09a78" }}>Este cadastro é exclusivo para usuários conectados. Seu anúncio será analisado pela equipe antes de aparecer na página pública.</p>
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
        <label className="flex items-start gap-2 text-sm mt-3" style={{color:"#405331"}}>
          <input type="checkbox" className="mt-1" checked={form.autorizaContatoPublico} onChange={e=>alterar("autorizaContatoPublico",e.target.checked)} />
          <span>Autorizo que meu nome e WhatsApp sejam exibidos publicamente neste anúncio para facilitar o contato de quem encontrar minha ave. Sei que posso pedir a remoção dessas informações.</span>
        </label>
        <p className="text-xs mt-2" style={{color:"#8a7a63"}}>Se não marcar, seu WhatsApp não será exibido. A equipe poderá intermediar o contato.</p>
      </div>
      {erro && <p role="alert" className="text-sm" style={{color:"#a6402b"}}>{erro}</p>}
      {mensagem && <div role="status" className="text-sm p-3 rounded-lg" style={{background:"#e4ead9",color:"#405331"}}><p>{mensagem}</p><a href={anuncioCriadoId ? `/campanha-ave-perdida?anuncio=${anuncioCriadoId}` : "/campanha-ave-perdida"} className="inline-block mt-2 font-semibold underline" style={{color:"#405331"}}>Quero ampliar a divulgação da minha busca</a></div>}
      <button disabled={enviando} className="rounded-lg py-3 font-semibold disabled:opacity-60" style={{background:"#C69A2E",color:"#2B1D14"}}>{enviando ? "Enviando..." : "Enviar para análise"}</button>
      <p className="text-xs" style={{color:"#8a7a63"}}>O anúncio gratuito passa por análise. A divulgação regional ampliada é opcional.</p>
    </form>

    <div className="mt-8">
      <h2 className="text-lg font-bold mb-3" style={{color:"#F1E6D2"}}>Meus anúncios de aves perdidas</h2>
      {carregando ? <p style={{color:"#b09a78"}}>Carregando seus anúncios...</p> : anuncios.length === 0 ? <p style={{color:"#b09a78"}}>Você ainda não cadastrou nenhuma ave perdida.</p> : <div className="grid gap-3">
        {anuncios.map((anuncio) => {
          const dados = anuncio.data || {};
          const status = STATUS[anuncio.status] || STATUS.pendente;
          return <article key={anuncio.id} className="rounded-lg p-3 flex gap-3 items-start" style={{background:"#FAF3E6",color:"#2B241C"}}>
            {dados.foto && <img src={dados.foto} alt="" className="w-20 h-20 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{dados.nomeAve || dados.especie}</div>
              <div className="text-xs mt-1">{dados.cidade}{dados.uf ? "/"+dados.uf : ""}</div>
              <span className="inline-block text-xs rounded px-2 py-1 mt-2" style={{background:status.fundo,color:status.cor}}>{status.label}</span>
            </div>
          </article>;
        })}
      </div>}
    </div>
  </section>;
}
