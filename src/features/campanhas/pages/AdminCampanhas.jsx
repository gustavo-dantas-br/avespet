import React, { useEffect, useState } from "react";
import { listarCampanhasAdmin, atualizarCampanhaAdmin } from "../services/campanhasService";
import { PACOTES_CAMPANHA, STATUS_CAMPANHA } from "../config/pacotes";

const field = { background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", borderRadius: 7, padding: "8px 10px", fontSize: 13, width: "100%" };
const dinheiro = (v) => v == null || v === "" ? "A definir" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AdminCampanhas() {
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState("solicitada");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");
    try { setItens(await listarCampanhasAdmin()); }
    catch (e) { setErro(e?.message || "Não foi possível carregar as campanhas."); }
    finally { setCarregando(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(item, patch) {
    setSalvando(item.id); setErro("");
    try {
      await atualizarCampanhaAdmin(item.id, patch);
      await carregar();
    } catch (e) { setErro(e?.message || "Não foi possível atualizar a campanha."); }
    finally { setSalvando(""); }
  }

  const filtrados = itens.filter((i) => i.status === filtro);
  return <div>
    <h2 className="mb-2" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>Campanhas regionais</h2>
    <p className="ui-sans text-sm mb-5" style={{ color: "#b09a78" }}>Gerencie solicitações, orçamentos e execução. A campanha não começa antes da confirmação do pagamento.</p>
    <div className="flex flex-wrap gap-2 mb-5">
      {Object.entries(STATUS_CAMPANHA).map(([key, nome]) => <button key={key} onClick={() => setFiltro(key)} className="ui-sans text-xs px-3 py-2 rounded-lg" style={{ background: filtro === key ? "#C69A2E" : "#3a2314", color: filtro === key ? "#2B1D14" : "#b09a78" }}>{nome} ({itens.filter((i) => i.status === key).length})</button>)}
    </div>
    {erro && <p role="alert" className="mb-4 text-sm" style={{ color: "#f0c9c0" }}>{erro}</p>}
    {carregando ? <p className="ui-sans" style={{ color: "#F1E6D2" }}>Carregando...</p> : filtrados.length === 0 ? <div className="rounded-xl p-7 text-center ui-sans" style={{ background: "#FAF3E6", color: "#75664f" }}>Nenhuma campanha neste status.</div> :
      <div className="grid gap-4">
        {filtrados.map((item) => <article key={item.id} className="rounded-xl p-4 ui-sans" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}>
          <div className="flex flex-wrap justify-between gap-2"><strong>{PACOTES_CAMPANHA.find((p) => p.id === item.pacote)?.nome || item.pacote}</strong><span className="text-xs">{new Date(item.created_at).toLocaleString("pt-BR")}</span></div>
          <div className="text-xs mt-1" style={{ color: "#8a7a63" }}>Anúncio vinculado: {item.anuncio_id || "Solicitação sem anúncio vinculado"}</div>
          <div className="text-sm mt-2">{item.nome_contato} • {item.whatsapp} {item.email ? "• "+item.email : ""}</div>
          <div className="text-sm mt-1"><strong>Região:</strong> {item.cidade}/{item.uf} — {item.area_alvo}</div>
          {item.descricao_ave && <p className="text-sm mt-2 whitespace-pre-wrap">{item.descricao_ave}</p>}
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <label className="text-xs font-semibold">ORÇAMENTO (R$)<input type="number" min="0" step="0.01" style={field} defaultValue={item.valor ?? ""} id={`valor-${item.id}`} /></label>
            <label className="text-xs font-semibold">STATUS<select style={field} defaultValue={item.status} id={`status-${item.id}`}>{Object.entries(STATUS_CAMPANHA).map(([key,nome]) => <option key={key} value={key}>{nome}</option>)}</select></label>
            <label className="text-xs font-semibold md:col-span-2">OBSERVAÇÕES INTERNAS<textarea style={{ ...field, minHeight: 70 }} defaultValue={item.observacoes_admin || ""} id={`obs-${item.id}`} /></label>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <button disabled={salvando===item.id} onClick={() => salvar(item, { valor: document.getElementById(`valor-${item.id}`)?.value ?? "", status: document.getElementById(`status-${item.id}`)?.value, observacoes_admin: document.getElementById(`obs-${item.id}`)?.value ?? "" })} className="rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50" style={{ background: "#C69A2E", color: "#2B1D14" }}>{salvando===item.id ? "Salvando..." : "Salvar orçamento e status"}</button>
            <a className="rounded-lg px-4 py-2 text-xs font-bold" style={{ background: "#d9e9d0", color: "#31512a" }} href={`https://wa.me/${(item.whatsapp || "").replace(/\D/g,"")}?text=${encodeURIComponent("Olá! Recebemos sua solicitação de campanha na Avespet. Vamos conversar sobre o orçamento da divulgação.")}`} target="_blank" rel="noreferrer">Conversar no WhatsApp</a>
          </div>
        </article>)}
      </div>}
  </div>;
}
