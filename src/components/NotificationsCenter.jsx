import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Bell, CheckCheck, Loader2, RotateCcw, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { ativarPushDoDispositivo } from "../lib/pushNotifications";
import { agruparLembretes,dateSaoPaulo } from "../features/agenda/utils/lembretesSino";

const PAGE_SIZE = 30;
const dataHora = (valor) => valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "nao_lidas", label: "Não lidas" },
  { id: "lidas", label: "Lidas" },
  { id: "arquivadas", label: "Arquivadas" },
];

export default function NotificationsCenter({ userId, isAdmin, onNavigate, aves = [], onRegistrarCuidado, careRefreshToken = 0 }) {
  const [aberto, setAberto] = useState(false);
  const [careRows,setCareRows] = useState([]);
  const [careError,setCareError]=useState("");
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [loading, setLoading] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [temMais, setTemMais] = useState(false);
  const [erro, setErro] = useState("");
  const [naoLidasCount, setNaoLidasCount] = useState(0);
  const [masterNaoLidasCount, setMasterNaoLidasCount] = useState(0);
  const [alerta, setAlerta] = useState(null);
  const [permissao, setPermissao] = useState(() => (typeof Notification !== "undefined" ? Notification.permission : "unsupported"));
  const [ativandoPush, setAtivandoPush] = useState(false);
  const [statusPush, setStatusPush] = useState("");
  // A mesma conta pode ter perfil de criador e acesso Master; cada painel vê somente seu público.
  const audienceScope = isAdmin ? "admin" : "cliente";

  const atualizarCuidados = useCallback(async () => {
    if(!userId)return;
    const {data,error}=await supabase.rpc("agenda_lembretes_cuidados");
    if(error){setCareError("Não foi possível carregar os lembretes de cuidados.");return;}
    setCareRows(data||[]);setCareError("");
  },[userId]);
  useEffect(()=>{
    atualizarCuidados();
    const onFocus=()=>atualizarCuidados();
    window.addEventListener("focus",onFocus);
    const interval=setInterval(onFocus,5*60*1000);
    return ()=>{window.removeEventListener("focus",onFocus);clearInterval(interval)};
  },[atualizarCuidados,careRefreshToken]);
  const gruposCuidados = useMemo(()=>agruparLembretes(careRows,aves,dateSaoPaulo()),[careRows,aves]);
  const totalPendentes = gruposCuidados.reduce((n,g)=>n+g.aves.length,0);
  const atualizarContagem = useCallback(async () => {
    if (!userId) return;
    const { count, error } = await supabase.from("notificacoes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("audience", audienceScope).is("lida_em", null).is("arquivada_em", null);
    if (!error) setNaoLidasCount(count || 0);
    if (isAdmin) {
      const { data: masterData } = await supabase.functions.invoke("master-notifications", { body: { action: "list" } });
      if (masterData?.success) setMasterNaoLidasCount(Number(masterData.unread_count || 0));
    } else setMasterNaoLidasCount(0);
  }, [userId, audienceScope, isAdmin]);

  useEffect(() => {
    atualizarContagem();
    const canal = supabase.channel("notificacoes-" + userId)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "notificacoes",
        filter: "user_id=eq." + userId,
      }, (payload) => {
        const novo = payload.new;
        if (payload.eventType === "INSERT" && novo) {
          if (novo.audience !== audienceScope) return;
          if (!novo.lida_em && !novo.arquivada_em) {
            setNaoLidasCount((n) => n + 1);
            setAlerta(novo);
            // A entrega nativa fica a cargo do push enviado pelo servidor.
          }
          setItens((prev) => [novo, ...prev.filter((n) => n.id !== novo.id)].slice(0, PAGE_SIZE));
        } else {
          if (novo?.audience && novo.audience !== audienceScope) return;
          atualizarContagem();
          if (novo?.id) setItens((prev) => prev.map((n) => n.id === novo.id ? { ...n, ...novo } : n));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(canal); };
  }, [userId, audienceScope, atualizarContagem]);

  useEffect(() => {
    if (!alerta) return undefined;
    const timer = setTimeout(() => setAlerta(null), 9000);
    return () => clearTimeout(timer);
  }, [alerta]);

  async function ativarAlertasDispositivo() {
    setAtivandoPush(true);
    setStatusPush("");
    try {
      await ativarPushDoDispositivo(userId);
      setPermissao("granted");
      setStatusPush("Este dispositivo está inscrito para receber notificações.");
    } catch (e) {
      setPermissao(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
      setStatusPush(e?.message || "Não foi possível ativar as notificações.");
    } finally {
      setAtivandoPush(false);
    }
  }

  const carregar = useCallback(async (reset = true) => {
    if (!userId) return;
    const inicio = reset ? 0 : itens.length;
    reset ? setLoading(true) : setCarregandoMais(true);
    setErro("");
    try {
      let query = supabase.from("notificacoes")
        .select("id,tipo,titulo,mensagem,referencia_tipo,referencia_id,lida_em,arquivada_em,criado_em")
        .eq("user_id", userId).eq("audience", audienceScope).order("criado_em", { ascending: false })
        .range(inicio, inicio + PAGE_SIZE - 1);
      if (filtro === "arquivadas") query = query.not("arquivada_em", "is", null);
      else {
        query = query.is("arquivada_em", null);
        if (filtro === "nao_lidas") query = query.is("lida_em", null);
        if (filtro === "lidas") query = query.not("lida_em", "is", null);
      }
      const { data, error } = await query;
      if (error) throw error;
      let novos = data || [];
      if (isAdmin && filtro !== "arquivadas") {
        const { data: masterData, error: masterError } = await supabase.functions.invoke("master-notifications", { body: { action: "list" } });
        if (masterError || masterData?.error) throw new Error(masterData?.error || "Central Master indisponível.");
        const masterItems = (masterData?.items || []).map((item) => ({
          id: "master:" + item.id, tipo: item.category, titulo: item.title, mensagem: item.message,
          referencia_tipo: "master_notification", referencia_id: item.id, target_section: item.target_section,
          lida_em: item.read_at, arquivada_em: item.archived_at, criado_em: item.source_created_at || item.created_at,
          _master: true,
        })).filter((item) => filtro === "todas" || (filtro === "nao_lidas" ? !item.lida_em : Boolean(item.lida_em)));
        setMasterNaoLidasCount(Number(masterData?.unread_count || 0));
        novos = [...novos, ...masterItems].sort((a,b) => Date.parse(b.criado_em || 0) - Date.parse(a.criado_em || 0));
      } else if (isAdmin) setMasterNaoLidasCount(0);
      setItens((prev) => reset ? novos : [...prev, ...novos]);
      setTemMais((data || []).length === PAGE_SIZE);
    } catch (e) {
      setErro("Não foi possível carregar as notificações. " + (e?.message || ""));
    } finally {
      setLoading(false);
      setCarregandoMais(false);
    }
  }, [userId, audienceScope, filtro, itens.length, isAdmin]);

  useEffect(() => {
    if (aberto) {carregar(true);atualizarCuidados();}
  }, [aberto, filtro, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAdmin) return undefined;
    const timer = window.setInterval(() => {
      atualizarContagem();
      if (aberto) carregar(true);
    }, 45000);
    return () => window.clearInterval(timer);
  }, [isAdmin, aberto, atualizarContagem]);

  const naoLidas = naoLidasCount + masterNaoLidasCount + totalPendentes;

  async function marcarLida(id) {
    const item = itens.find((n) => n.id === id);
    if (item?._master) {
      const { data, error } = await supabase.functions.invoke("master-notifications", { body: { action: "mark_read", id: item.referencia_id } });
      if (error || data?.error) { setErro("Não foi possível marcar como lida."); return false; }
      setItens((prev) => prev.map((n) => n.id === id ? { ...n, lida_em: new Date().toISOString() } : n));
      setMasterNaoLidasCount((n) => Math.max(0, n - 1));
      return true;
    }
    const agora = new Date().toISOString();
    const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).eq("id", id).eq("user_id", userId);
    if (error) { setErro("Não foi possível marcar como lida."); return false; }
    setItens((prev) => prev.map((n) => n.id === id ? { ...n, lida_em: agora } : n));
    setNaoLidasCount((n) => Math.max(0, n - 1));
    return true;
  }

  async function marcarTodas() {
    const ids = itens.filter((n) => !n._master && !n.lida_em && !n.arquivada_em).map((n) => n.id);
    const masterItems = itens.filter((n) => n._master && !n.lida_em && !n.arquivada_em);
    if (!ids.length && !masterItems.length) return;
    const agora = new Date().toISOString();
    if (ids.length) {
      const { error } = await supabase.from("notificacoes").update({ lida_em: agora }).in("id", ids).eq("user_id", userId);
      if (error) { setErro("Não foi possível marcar todas como lidas."); return; }
    }
    const masterResults = await Promise.all(masterItems.map((item) => supabase.functions.invoke("master-notifications", { body: { action: "mark_read", id: item.referencia_id } })));
    if (masterResults.some((result) => result.error || result.data?.error)) { setErro("Algumas notificações Master não puderam ser marcadas como lidas."); return; }
    setItens((prev) => prev.map((n) => ids.includes(n.id) || masterItems.some((item) => item.id === n.id) ? { ...n, lida_em: agora } : n));
    setNaoLidasCount((n) => Math.max(0, n - ids.length));
    setMasterNaoLidasCount((n) => Math.max(0, n - masterItems.length));
  }

  async function arquivar(n) {
    if (n._master) {
      const { data, error } = await supabase.functions.invoke("master-notifications", { body: { action: "archive", id: n.referencia_id } });
      if (error || data?.error) { setErro("Não foi possível arquivar esta notificação."); return; }
      setItens((prev) => prev.filter((item) => item.id !== n.id));
      if (!n.lida_em) setMasterNaoLidasCount((count) => Math.max(0, count - 1));
      return;
    }
    const agora = new Date().toISOString();
    const atualizacao = { arquivada_em: agora, ...(!n.lida_em ? { lida_em: agora } : {}) };
    const { error } = await supabase.from("notificacoes").update(atualizacao).eq("id", n.id).eq("user_id", userId);
    if (error) { setErro("Não foi possível arquivar esta notificação."); return; }
    setItens((prev) => prev.filter((item) => item.id !== n.id));
    if (!n.lida_em) setNaoLidasCount((count) => Math.max(0, count - 1));
  }

  async function restaurar(n) {
    const { error } = await supabase.from("notificacoes").update({ arquivada_em: null }).eq("id", n.id).eq("user_id", userId);
    if (error) { setErro("Não foi possível restaurar esta notificação."); return; }
    setItens((prev) => prev.filter((item) => item.id !== n.id));
  }

  async function abrirNotificacao(n) {
    if (!n.lida_em) await marcarLida(n.id);
    if (n._master) onNavigate?.(n.target_section);
    else if (n.referencia_tipo === "achado_anilha") onNavigate?.(isAdmin ? "achados" : "perdi-uma-ave");
    else if (n.referencia_tipo === "anuncio_ave_perdida") onNavigate?.(isAdmin ? "aves-perdidas-admin" : "perdi-uma-ave");
    else if (n.referencia_tipo === "anuncio") onNavigate?.(isAdmin ? "aprovacoes" : "anuncios");
    else if (n.referencia_tipo === "support_ticket") onNavigate?.(isAdmin ? "support-chat" : "suporte");
    setAberto(false);
  }

  return (
    <div className="relative ui-sans flex justify-end mb-4">
      {alerta && <button onClick={() => { setAberto(true); setAlerta(null); if (alerta.referencia_tipo === "anuncio") onNavigate?.(isAdmin ? "aprovacoes" : "anuncios"); }} className="fixed right-4 top-4 z-[80] max-w-sm rounded-xl p-4 text-left shadow-2xl" style={{ background: "#FAF3E6", color: "#2B241C", border: "2px solid #C69A2E" }}><strong className="block text-sm">{alerta.titulo}</strong><span className="block text-xs mt-1">{alerta.mensagem}</span><span className="block text-[10px] mt-2 underline">Abrir agora</span></button>}
      {permissao !== "unsupported" && permissao !== "denied" && <button onClick={ativarAlertasDispositivo} disabled={ativandoPush} className="mr-2 rounded-lg px-2 py-2 text-xs font-semibold disabled:opacity-60" style={{ background: "#e8d8b9", color: "#2B241C" }}>{ativandoPush ? "Ativando..." : permissao === "granted" ? "Ativar push neste dispositivo" : "Ativar alertas no dispositivo"}</button>}
      {permissao === "denied" && <span className="mr-2 self-center text-[10px]" style={{ color: "#b09a78" }}>Alertas do dispositivo bloqueados</span> }
      {statusPush && <span role="status" className="mr-2 self-center max-w-[220px] text-[10px]" style={{ color: statusPush.startsWith("Este dispositivo") ? "#556b3f" : "#a6402b" }}>{statusPush}</span>}
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
        {permissao === "granted" && <p className="px-3 pt-2 text-[10px]" style={{ color: "#556b3f" }}>Alertas do dispositivo ativados neste navegador.</p>}
        <div className="flex gap-1 overflow-x-auto px-3 py-2" style={{ borderBottom: "1px solid #e3d3b4" }}>
          {FILTROS.map((f) => <button key={f.id} onClick={() => setFiltro(f.id)}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-semibold"
            style={{ background: filtro === f.id ? "#C69A2E" : "#eee2ca", color: "#2B241C" }}>{f.label}</button>)}
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {gruposCuidados.length>0&&filtro!=="arquivadas"&&filtro!=="lidas"&&<section className="border-b p-3" style={{background:"#f0f7ed",borderColor:"#c9dec9"}}>
            <strong className="block text-sm mb-1" style={{color:"#214e35"}}>Lembretes de medicamentos e vitaminas · {totalPendentes} ave(s)</strong>
            <p className="text-xs mb-2" style={{color:"#526A5B"}}>Avisos ao abrir o Avespet: um dia antes, no dia e atrasados. Não são notificações push nem confirmação de aplicação.</p>
            {gruposCuidados.map(g=><article key={g.id} className="rounded-lg border bg-white p-3 mb-2" style={{borderColor:"#d6e5d7"}}>
              <p className="text-sm font-bold" style={{color:"#214e35"}}>{g.tipo==="vitamina"?"Vitamina":"Medicamento"} · {g.produto}</p>
              <p className="text-xs mb-2" style={{color:g.days<0?"#a23a25":"#526A5B"}}>{g.days<0?"Data ultrapassada":g.days===0?"Programado para hoje":"Programado para amanhã"} · {g.dia.split("-").reverse().join("/")}</p>
              <div className="space-y-1">{g.aves.map(a=><div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-2">
                <span className="text-xs font-semibold" style={{color:"#214e35"}}>{a.nome}</span>
                <button type="button" onClick={()=>{onRegistrarCuidado?.({ave_id:a.id,tipo:g.tipo,produto:g.produto});setAberto(false)}} className="rounded border px-2 py-1 text-xs font-semibold" style={{color:"#176B45",borderColor:"#93baa0"}}>Registrar aplicação</button>
              </div>)}</div>
            </article>)}
          </section>}
          {careError&&<p className="px-3 py-2 text-xs text-rose-700" role="alert">{careError}</p>}
          {loading && <div className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}><Loader2 className="animate-spin inline mr-2" size={16} />Carregando...</div>}
          {erro && <p className="p-3 text-xs" style={{ color: "#a6402b" }}>{erro}</p>}
          {!loading && !itens.length && !erro && (!gruposCuidados.length || filtro==="arquivadas" || filtro==="lidas") && <p className="p-5 text-sm text-center" style={{ color: "#8a7a63" }}>Nenhuma notificação nesta categoria.</p>}
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
