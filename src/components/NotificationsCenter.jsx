import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Bell, CheckCheck, Loader2, RotateCcw, X } from "lucide-react";
import { supabase } from "../supabaseClient";

const PAGE_SIZE = 30;
const dataHora = (valor) => valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "nao_lidas", label: "Não lidas" },
  { id: "lidas", label: "Lidas" },
  { id: "arquivadas", label: "Arquivadas" },
];

export default function NotificationsCenter({ userId, isAdmin, onNavigate }) {
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [loading, setLoading] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (reset = true) => {
    if (!userId) return;
    const inicio = reset ? 0 : itens.length;
    reset ? setLoading(true) : setCarregandoMais(true);
    setErro("");
    try {
      let query = supabase.from("notificacoes")
        .select("id,tipo,titulo,mensagem,referencia_tipo,referencia_id,lida_em,arquivada_em,criado_em")
        .eq("user_id", userId).order("criado_em", { ascending: false })
        .range(inicio, inicio + PAGE_SIZE - 1);
      if (filtro === "arquivadas") query = query.not("arquivada_em", "is", null);
      else {
        query = query.is("arquivada_em", null);
        if (filtro === "nao_lidas") query = query.is("lida_em", null);
        if (filtro === "lidas") query = query.not("lida_em", "is", null);
      }
      const { data, error } = await query;
      if (error) throw error;
      const novos = data || [];
      setItens((prev) => reset ? novos : [...prev, ...novos]);
      setTemMais(novos.length === PAGE_SIZE);
    } catch (e) {
      setErro("Não foi possível carregar as notificações. " + (e?.message || ""));
    } finally {
      setLoading(false);
      setCarregandoMais(false);
    }
  }, [userId, filtro, itens.length]);

  useEffect(() => {
    if (aberto) carregar(true);
  }, [aberto, filtro, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const naoLidas = useMemo(() => itens.filter((n) => !n.lida_em && !n.arquivada_em).length, [itens]);

  async function marcarLida(id) {
    const agora = new Date().toISOString();
    const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).eq("id", id).eq("user_id", userId);
    if (error) { setErro("Não foi possível marcar como lida."); return false; }
    setItens((prev) => prev.map((n) => n.id === id ? { ...n, lida_em: agora } : n));
    return true;
  }

  async function marcarTodas() {
    const ids = itens.filter((n) => !n.lida_em && !n.arquivada_em).map((n) => n.id);
    if (!ids.length) return;
    const agora = new Date().toISOString();
    const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).in("id", ids).eq("user_id", userId);
    if (error) { setErro("Não foi possível marcar todas como lidas."); return; }
    setItens((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, lida_em: agora } : n));
  }

  async function arquivar(n) {
    const agora = new Date().toISOString();
    const atualizacao = { arquivada_em: agora, ...(!n.lida_em ? { lida_em: agora } : {}) };
    const { error } = await supabase.from("notificacoes").update(atualizacao).eq("id", n.id).eq("user_id", userId);
    if (error) { setErro("Não foi possível arquivar esta notificação."); return; }
    setItens((prev) => prev.filter((item) => item.id !== n.id));
  }

  async function restaurar(n) {
    const { error } = await supabase.from("notificacoes").update({ arquivada_em: null }).eq("id", n.id).eq("user_id", userId);
    if (error) { setErro("Não foi possível restaurar esta notificação."); return; }
    setItens((prev) => prev.filter((item) => item.id !== n.id));
  }

  async function abrirNotificacao(n) {
    if (!n.lida_em) await marcarLida(n.id);
    if (n.referencia_tipo === "achado_anilha") onNavigate?.(isAdmin ? "achados" : "perdi-uma-ave");
    else if (n.referencia_tipo === "anuncio_ave_perdida") onNavigate?.(isAdmin ? "aves-perdidas-admin" : "perdi-uma-ave");
    setAberto(false);
  }

  return (
    <div className="relative ui-sans flex justify-end mb-4">
      <button onClick={() => setAberto((v) => !v)}
        className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
        style={{ background: "#3a2314", color: "#F1E6D2", border: "1px solid #6b4b25" }}>
        <Bell size={17} /> Notificações
        {naoLidas > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "#C69A2E", color: "#2B1D14" }}>{naoLidas > 99 ? "99+" : naoLidas}</span>}
      </button>
      {aberto && <div className="absolute right-0 top-12 z-50 w-full max-w-md rounded-xl shadow-2xl overflow-hidden" style={{ background: "#FAF3E6", border: "1px solid #c8ad7d" }}>
        <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: "1px solid #e3d3b4" }}>
          <strong style={{ color: "#2B241C" }}>Central de notificações</strong>
          <div className="flex items-center gap-2">
            {naoLidas > 0 && <button onClick={marcarTodas} title="Marcar notificações carregadas como lidas" style={{ color: "#556b3f" }}><CheckCheck size={18} /></button>}
            <button onClick={() => setAberto(false)} style={{ color: "#8a7a63" }}><X size={18} /></button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto px-3 py-2" style={{ borderBottom: "1px solid #e3d3b4" }}>
          {FILTROS.map((f) => <button key={f.id} onClick={() => setFiltro(f.id)}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold"
            style={{ background: filtro === f.id ? "#C69A2E" : "#eee2ca", color: "#2B241C" }}>{f.label}</button>)}
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {loading && <div className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}><Loader2 className="animate-spin inline mr-2" size={16} />Carregando...</div>}
          {erro && <p className="p-3 text-xs" style={{ color: "#a6402b" }}>{erro}</p>}
          {!loading && !itens.length && !erro && <p className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}>Nenhuma notificação nesta categoria.</p>}
          {itens.map((n) => <div key={n.id} className="px-4 py-3" style={{ background: n.lida_em ? "#FAF3E6" : "#f2e7d1", borderBottom: "1px solid #e3d3b4" }}>
            <div className="flex items-start gap-2">
              {!n.lida_em && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#b27a19" }} />}
              <button onClick={() => abrirNotificacao(n)} className="min-w-0 flex-1 text-left">
                <div className="text-sm font-semibold" style={{ color: "#2B241C" }}>{n.titulo}</div>
                <p className="text-xs mt-1" style={{ color: "#655744" }}>{n.mensagem}</p>
                <span className="text-[10px] mt-2 block" style={{ color: "#8a7a63" }}>{dataHora(n.criado_em)}</span>
              </button>
              {filtro === "arquivadas"
                ? <button onClick={() => restaurar(n)} title="Restaurar notificação" className="p-1" style={{ color: "#556b3f" }}><RotateCcw size={16} /></button>
                : <button onClick={() => arquivar(n)} title="Arquivar notificação" className="p-1" style={{ color: "#8a7a63" }}><Archive size={16} /></button>}
            </div>
          </div>)}
          {!loading && temMais && <div className="p-3 text-center">
            <button onClick={() => carregar(false)} disabled={carregandoMais} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "#e8d8b9", color: "#2B241C" }}>
              {carregandoMais ? "Carregando..." : "Carregar mais antigas"}
            </button>
          </div>}
        </div>
      </div>}
    </div>
  );
}
