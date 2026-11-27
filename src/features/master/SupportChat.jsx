import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LifeBuoy, MessageCircle, Plus, Send, RefreshCw, Loader2, ArrowLeft,
  CheckCircle2, Clock3, AlertCircle, UserRound, Headphones,
} from "lucide-react";
import { supabase } from "../../supabaseClient";

const CATEGORIES = [
  ["tecnico", "Problema técnico"],
  ["financeiro", "Financeiro e planos"],
  ["cadastro", "Cadastro e minha conta"],
  ["anuncios", "Anúncios e aves perdidas"],
  ["outro", "Outro assunto"],
];
const STATUSES = [
  ["aberto", "Aberto"],
  ["em_atendimento", "Em atendimento"],
  ["aguardando_criador", "Aguardando criador"],
  ["resolvido", "Resolvido"],
];
const STATUS_TONES = {
  aberto: "bg-blue-50 text-blue-700",
  em_atendimento: "bg-emerald-50 text-emerald-700",
  aguardando_criador: "bg-amber-50 text-amber-800",
  resolvido: "bg-slate-100 text-slate-600",
};
const dateTime = (value) => value
  ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
  : "—";
const categoryLabel = (value) => CATEGORIES.find(([key]) => key === value)?.[1] || "Outro assunto";
const statusLabel = (value) => STATUSES.find(([key]) => key === value)?.[1] || value;

export default function SupportChat({ user, mode = "creator", onUnreadCountChange }) {
  const isMaster = mode === "master";
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("todos");
  const [draft, setDraft] = useState("");
  const [form, setForm] = useState({ subject: "", category: "tecnico", body: "" });

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      let query = supabase.from("support_tickets")
        .select("id,protocol,user_id,creator_name,creator_email,subject,category,status,created_at,updated_at,last_message_at,last_message_by,creator_unread,support_unread")
        .order("updated_at", { ascending: false }).limit(100);
      if (!isMaster) query = query.eq("user_id", user.id);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      const rows = data || [];
      setTickets(rows);
      onUnreadCountChange?.(rows.filter((item) => isMaster ? item.support_unread : item.creator_unread).length);
      setSelected((current) => current ? rows.find((item) => item.id === current.id) || current : null);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar os chamados.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, isMaster, onUnreadCountChange]);

  const loadMessages = useCallback(async (ticket) => {
    if (!ticket?.id) return;
    setLoadingMessages(true);
    setError("");
    try {
      const { data, error: queryError } = await supabase.from("support_ticket_messages")
        .select("id,ticket_id,author_user_id,author_type,body,created_at")
        .eq("ticket_id", ticket.id).order("created_at", { ascending: true }).limit(300);
      if (queryError) throw queryError;
      setMessages(data || []);
    } catch (err) {
      setError(err?.message || "Não foi possível carregar as mensagens.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const channel = supabase.channel("support-chat-" + (isMaster ? "master" : user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => {
        loadTickets();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_ticket_messages" }, (payload) => {
        if (selected?.id && payload.new?.ticket_id === selected.id) loadMessages(selected);
        loadTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, isMaster, selected, loadTickets, loadMessages]);

  async function openTicket(ticket) {
    setSelected(ticket);
    setNotice("");
    setDraft("");
    await loadMessages(ticket);
    const { error: readError } = await supabase.rpc("support_ticket_mark_read", { p_ticket_id: ticket.id });
    if (!readError) {
      setTickets((current) => current.map((item) => item.id === ticket.id
        ? { ...item, [isMaster ? "support_unread" : "creator_unread"]: false }
        : item));
      await loadTickets();
    }
  }

  async function createTicket(event) {
    event.preventDefault();
    if (creating || !form.subject.trim() || !form.body.trim()) return;
    setCreating(true);
    setError("");
    setNotice("");
    try {
      const { data, error: rpcError } = await supabase.rpc("support_ticket_create", {
        p_subject: form.subject.trim(),
        p_category: form.category,
        p_body: form.body.trim(),
        p_creator_name: user?.user_metadata?.name || user?.user_metadata?.full_name || "",
        p_creator_email: user?.email || "",
      });
      if (rpcError) throw rpcError;
      setForm({ subject: "", category: "tecnico", body: "" });
      await loadTickets();
      const { data: ticket, error: ticketError } = await supabase.from("support_tickets")
        .select("id,protocol,user_id,creator_name,creator_email,subject,category,status,created_at,updated_at,last_message_at,last_message_by,creator_unread,support_unread")
        .eq("id", data).single();
      if (ticketError) throw ticketError;
      setCreating(false);
      await openTicket(ticket);
      setNotice("Chamado aberto. Nossa equipe responderá por esta conversa.");
    } catch (err) {
      setError(err?.message || "Não foi possível abrir o chamado.");
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!selected || !body || sending) return;
    setSending(true);
    setError("");
    try {
      const { error: rpcError } = await supabase.rpc("support_ticket_send_message", {
        p_ticket_id: selected.id,
        p_body: body,
      });
      if (rpcError) throw rpcError;
      setDraft("");
      await Promise.all([loadMessages(selected), loadTickets()]);
    } catch (err) {
      setError(err?.message || "Não foi possível enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status) {
    if (!selected || !isMaster) return;
    setError("");
    const { error: rpcError } = await supabase.rpc("support_ticket_set_status", {
      p_ticket_id: selected.id,
      p_status: status,
    });
    if (rpcError) {
      setError(rpcError.message || "Não foi possível atualizar o status.");
      return;
    }
    setNotice("Status atualizado.");
    await loadTickets();
  }

  const visibleTickets = useMemo(() => tickets.filter((ticket) => {
    if (filter === "nao_lidos") return isMaster ? ticket.support_unread : ticket.creator_unread;
    if (filter !== "todos") return ticket.status === filter;
    return true;
  }), [tickets, filter, isMaster]);
  const unreadCount = tickets.filter((ticket) => isMaster ? ticket.support_unread : ticket.creator_unread).length;

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-emerald-700">{isMaster ? "Avespet · Master" : "Avespet · Atendimento"}</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
            {isMaster ? <Headphones size={25} /> : <LifeBuoy size={25} />}
            {isMaster ? "Central de Atendimento" : "Suporte Avespet"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            {isMaster ? "Receba chamados dos criadores, responda e acompanhe cada atendimento." : "Abra um chamado e acompanhe as respostas da equipe Avespet nesta conversa."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <MessageCircle size={15} /> {tickets.length} chamado(s)
          {unreadCount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">{unreadCount} não lido(s)</span>}
          <button type="button" onClick={loadTickets} className="ml-1 rounded-lg p-1 hover:bg-slate-100" aria-label="Atualizar chamados"><RefreshCw size={14} /></button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-3">
            <div className="flex flex-wrap gap-1.5">
              {(isMaster
                ? [["todos", "Todos"], ["nao_lidos", "Não lidos"], ...STATUSES]
                : [["todos", "Todos"], ["nao_lidos", "Não lidos"], ...STATUSES]
              ).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setFilter(key)}
                  className={"rounded-lg px-2.5 py-1.5 text-[11px] font-semibold " + (filter === key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loading ? <div className="p-8 text-center text-sm text-slate-500"><Loader2 className="mr-2 inline animate-spin" size={16} />Carregando chamados...</div>
            : visibleTickets.length ? <div className="max-h-[680px] divide-y divide-slate-100 overflow-y-auto">
              {visibleTickets.map((ticket) => {
                const unread = isMaster ? ticket.support_unread : ticket.creator_unread;
                return <button key={ticket.id} type="button" onClick={() => openTicket(ticket)}
                  className={"w-full p-4 text-left transition hover:bg-slate-50 " + (selected?.id === ticket.id ? "bg-emerald-50/70" : "")}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{ticket.protocol}</span>
                    <span className={"rounded-full px-2 py-1 text-[10px] font-semibold " + (STATUS_TONES[ticket.status] || STATUS_TONES.aberto)}>{statusLabel(ticket.status)}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">{ticket.subject}</p>
                  {isMaster && <p className="mt-1 truncate text-xs text-slate-500">{ticket.creator_name || ticket.creator_email || "Criador"}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400">{categoryLabel(ticket.category)} · {dateTime(ticket.last_message_at || ticket.created_at)}</span>
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" title="Mensagem não lida" />}
                  </div>
                </button>;
              })}
            </div> : <div className="p-8 text-center text-sm text-slate-500"><MessageCircle size={24} className="mx-auto mb-2 text-slate-300" />Nenhum chamado nesta categoria.</div>}
        </aside>

        <div className="min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {selected ? <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{selected.protocol} · {categoryLabel(selected.category)}</p>
                <h2 className="mt-1 break-words text-lg font-bold text-slate-900">{selected.subject}</h2>
                {isMaster && <p className="mt-1 text-xs text-slate-500">{selected.creator_name || "Criador"} · {selected.creator_email}</p>}
              </div>
              {isMaster
                ? <label className="text-xs font-semibold text-slate-600">Status
                    <select value={selected.status} onChange={(e) => changeStatus(e.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                      {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                : <span className={"rounded-full px-3 py-1.5 text-xs font-semibold " + (STATUS_TONES[selected.status] || STATUS_TONES.aberto)}>{statusLabel(selected.status)}</span>}
            </div>
            <div className="flex h-[390px] flex-col gap-3 overflow-y-auto bg-slate-50/70 p-4 sm:p-5">
              {loadingMessages ? <div className="m-auto text-sm text-slate-500"><Loader2 className="mr-2 inline animate-spin" size={16} />Carregando conversa...</div>
                : messages.map((message) => {
                  const mine = isMaster ? message.author_type === "support" : message.author_type === "creator";
                  return <div key={message.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                    <article className={"max-w-[88%] rounded-2xl px-4 py-3 shadow-sm " + (mine ? "rounded-br-md bg-emerald-700 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800")}>
                      <div className={"mb-1 flex items-center gap-1.5 text-[10px] font-bold " + (mine ? "text-emerald-100" : "text-slate-400")}>
                        {mine ? <Headphones size={12} /> : <UserRound size={12} />}
                        {message.author_type === "support" ? "Suporte Avespet" : "Criador"}
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                      <time className={"mt-2 block text-right text-[10px] " + (mine ? "text-emerald-100" : "text-slate-400")}>{dateTime(message.created_at)}</time>
                    </article>
                  </div>;
                })}
              {!loadingMessages && !messages.length && <p className="m-auto text-sm text-slate-400">Ainda não há mensagens nesta conversa.</p>}
            </div>
            <form onSubmit={sendMessage} className="border-t border-slate-100 p-3 sm:p-4">
              {selected.status === "resolvido" && !isMaster && <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-500"><CheckCircle2 size={14} /> Este chamado foi resolvido. Se responder, ele será reaberto.</p>}
              <div className="flex items-end gap-2">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={5000} rows={2}
                  placeholder="Escreva sua mensagem..." className="min-h-[54px] flex-1 resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
                <button type="submit" disabled={!draft.trim() || sending} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}<span className="hidden sm:inline">Enviar</span>
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-400">Não envie senhas ou dados completos de cartão. Máximo de 5.000 caracteres.</p>
            </form>
          </> : isMaster ? <div className="flex h-full min-h-[520px] flex-col items-center justify-center p-8 text-center text-slate-400"><MessageCircle size={34} className="mb-3 text-slate-300" /><strong className="text-sm text-slate-600">Selecione um chamado</strong><p className="mt-1 max-w-xs text-xs">As mensagens dos criadores aparecerão aqui para sua equipe responder.</p></div>
            : <form onSubmit={createTicket} className="mx-auto max-w-xl space-y-4 p-5 sm:p-7">
              <div><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Novo atendimento</p><h2 className="mt-1 text-xl font-bold text-slate-900">Como podemos ajudar?</h2><p className="mt-1 text-sm text-slate-500">Descreva sua dúvida ou problema. A conversa ficará salva no seu painel.</p></div>
              <label className="block text-xs font-semibold text-slate-700">Assunto
                <input value={form.subject} onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))} maxLength={120} required placeholder="Ex.: Não consigo cadastrar uma ave" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Categoria
                <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
                  {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-700">Mensagem
                <textarea value={form.body} onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))} maxLength={5000} minLength={5} required rows={5} placeholder="Conte o que aconteceu e o que você precisa..." className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
              </label>
              <button type="submit" disabled={creating || !form.subject.trim() || form.body.trim().length < 5} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                {creating ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />} Abrir chamado
              </button>
              <p className="text-center text-[11px] text-slate-400">Nossa equipe responderá nesta área do Avespet.</p>
            </form>}
        </div>
      </div>
      <p className="flex items-start gap-2 text-[11px] leading-5 text-slate-500"><AlertCircle size={14} className="mt-0.5 shrink-0" /> O atendimento é privado e visível somente para o criador responsável e a equipe Master do Avespet.</p>
    </section>
  );
}
