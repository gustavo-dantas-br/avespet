import React, { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { supabase } from "../supabaseClient";

const dataHora = (valor) => valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";

export default function NotificationsCenter({ userId, isAdmin, onNavigate }) {
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setErro("");
    try {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("id,tipo,titulo,mensagem,referencia_tipo,referencia_id,lida_em,criado_em")
        .eq("user_id", userId)
        .order("criado_em", { ascending: false })
        .limit(50);
      if (error) throw error;
      setItens(data || []);
    } catch (e) {
      setErro("Não foi possível carregar as notificações. " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase.channel("notificacoes-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: "user_id=eq." + userId }, () => carregar())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, carregar]);

  const naoLidas = itens.filter((n) => !n.lida_em).length;

  async function marcarLida(id) {
    const agora = new Date().toISOString();
    const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).eq("id", id).eq("user_id", userId);
    if (error) { setErro("Não foi possível marcar como lida."); return; }
    setItens((prev) => prev.map((n) => n.id === id ? { ...n, lida_em: agora } : n));
  }

  async function marcarTodas() {
    const ids = itens.filter((n) => !n.lida_em).map((n) => n.id);
    if (!ids.length) return;
    const agora = new Date().toISOString();
    const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).in("id", ids).eq("user_id", userId);
    if (error) { setErro("Não foi possível marcar todas como lidas."); return; }
    setItens((prev) => prev.map((n) => ids.includes(n.id) ? { ...n, lida_em: agora } : n));
  }

  function abrirNotificacao(n) {
    if (!n.lida_em) marcarLida(n.id);
    if (n.referencia_tipo === "achado_anilha") onNavigate?.(isAdmin ? "achados" : "perdi-uma-ave");
    else if (n.referencia_tipo === "anuncio_ave_perdida") onNavigate?.(isAdmin ? "aves-perdidas-admin" : "perdi-uma-ave");
    setAberto(false);
  }

  return (
    <div className="relative ui-sans flex justify-end mb-4">
      <button onClick={() => { setAberto((v) => !v); if (!aberto) carregar(); }}
        className="relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
        style={{ background: "#3a2314", color: "#F1E6D2", border: "1px solid #6b4b25" }}>
        <Bell size={17} /> Notificações
        {naoLidas > 0 && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "#C69A2E", color: "#2B1D14" }}>{naoLidas > 99 ? "99+" : naoLidas}</span>}
      </button>

      {aberto && <div className="absolute right-0 top-12 z-50 w-full max-w-md rounded-xl shadow-2xl overflow-hidden" style={{ background: "#FAF3E6", border: "1px solid #c8ad7d" }}>
        <div className="flex items-center justify-between gap-2 px-4 py-3" style={{ borderBottom: "1px solid #e3d3b4" }}>
          <strong style={{ color: "#2B241C" }}>Central de notificações</strong>
          <div className="flex items-center gap-2">
            {naoLidas > 0 && <button onClick={marcarTodas} title="Marcar todas como lidas" style={{ color: "#556b3f" }}><CheckCheck size={18} /></button>}
            <button onClick={() => setAberto(false)} style={{ color: "#8a7a63" }}><X size={18} /></button>
          </div>
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {loading && <div className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}><Loader2 className="animate-spin inline mr-2" size={16} />Carregando...</div>}
          {erro && <p className="p-3 text-xs" style={{ color: "#a6402b" }}>{erro}</p>}
          {!loading && !itens.length && !erro && <p className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}>Você ainda não tem notificações.</p>}
          {itens.map((n) => <button key={n.id} onClick={() => abrirNotificacao(n)} className="w-full text-left px-4 py-3" style={{ background: n.lida_em ? "#FAF3E6" : "#f2e7d1", borderBottom: "1px solid #e3d3b4" }}>
            <div className="flex items-start gap-2">
              {!n.lida_em && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#b27a19" }} />}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: "#2B241C" }}>{n.titulo}</div>
                <p className="text-xs mt-1" style={{ color: "#655744" }}>{n.mensagem}</p>
                <span className="text-[10px] mt-2 block" style={{ color: "#8a7a63" }}>{dataHora(n.criado_em)}</span>
              </div>
            </div>
          </button>)}
        </div>
      </div>}
    </div>
  );
}
