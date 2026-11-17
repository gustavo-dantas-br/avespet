import React, { useCallback, useEffect, useState } from "react";
import { Mail, Inbox, RefreshCw, Send, ShieldCheck, AlertCircle, Paperclip, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "../../supabaseClient";
import EmailTestPanel from "./EmailTestPanel";

const boxes = [
  { key: "suporte", label: "Suporte", address: "suporte@avespet.com.br" },
  { key: "financeiro", label: "Financeiro", address: "financeiro@avespet.com.br" },
];
const formatDate = (date) => {
  if (!date) return "—";
  const result = new Date(date);
  return Number.isNaN(result.getTime()) ? "—" : result.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};
const newId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0").slice(-12);
};

export default function MasterInboxPanel({ user }) {
  const [box, setBox] = useState("suporte");
  const [threads, setThreads] = useState([]);
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [hasMore, setHasMore] = useState(false);

  const invoke = useCallback(async (body) => {
    const { data, error: invokeError } = await supabase.functions.invoke("master-resend-inboxes", { body });
    if (invokeError || data?.error || !data?.success) {
      throw new Error(data?.error || "Não foi possível conectar às caixas de entrada. Confirme a chave de integração no Supabase.");
    }
    return data;
  }, []);
  const load = useCallback(async (choice) => {
    setLoading(true);
    setError("");
    try {
      const data = await invoke({ action: "threads", box: choice });
      setThreads(data.threads || []);
      setHasMore(Boolean(data.has_more));
    } catch (err) {
      setThreads([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  useEffect(() => {
    setThread(null);
    setMessages([]);
    setReply("");
    setNotice("");
    setThreads([]);
    load(box);
  }, [box, load]);

  async function openThread(item) {
    setOpening(true);
    setThread(item);
    setMessages([]);
    setReply("");
    setError("");
    setNotice("");
    try {
      const data = await invoke({ action: "messages", box, thread_id: item.id });
      setMessages(data.messages || []);
      if (data.has_more) setNotice("Esta conversa possui mais de 50 mensagens; exibição parcial.");
    } catch (err) {
      setError(err.message);
    } finally {
      setOpening(false);
    }
  }
  async function send(e) {
    e.preventDefault();
    const target = [...messages].reverse().find((m) => m.direction === "inbound");
    if (!thread || !target || !reply.trim() || sending) return;
    if (!window.confirm("Enviar esta resposta pelo e-mail " + boxes.find((b) => b.key === box)?.address + "?")) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const data = await invoke({
        action: "reply", box, thread_id: thread.id, email_id: target.id,
        text: reply, idempotency_key: newId(),
      });
      setReply("");
      setNotice(data.audit_warning ? "Resposta enviada. A confirmação de auditoria precisa de revisão." : "Resposta enviada com sucesso.");
      await openThread(thread);
      await load(box);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }
  const selected = boxes.find((b) => b.key === box);
  const canReply = messages.some((m) => m.direction === "inbound");
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Avespet · Master</p>
        <h1 className="mt-1.5 text-2xl font-bold text-slate-900">Central de Comunicação</h1>
        <p className="mt-2 text-sm text-slate-500">Atendimento pelo próprio Avespet, com as caixas de Suporte e Financeiro do Resend.</p>
      </div>
      <div role="tablist" aria-label="Caixas de entrada" className="flex flex-wrap gap-2">
        {boxes.map((item) =>
          <button key={item.key} type="button" role="tab" aria-selected={box === item.key} onClick={() => setBox(item.key)}
            className={"rounded-xl border px-4 py-3 text-left transition " + (box === item.key ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
            <span className="flex items-center gap-2 text-sm font-semibold"><Inbox size={16} />{item.label}</span>
            <span className={"mt-1 block text-xs " + (box === item.key ? "text-slate-200" : "text-slate-500")}>{item.address}</span>
          </button>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:px-6">
          <div className="flex items-center gap-2 text-slate-800">
            <Mail size={19} /><strong className="text-sm">{selected.label} · Caixa de entrada</strong>
          </div>
          <button type="button" onClick={() => thread ? openThread(thread) : load(box)} disabled={loading || opening || sending}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">
            <RefreshCw size={14} className={loading || opening ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
        {error && <p role="alert" className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:mx-6"><AlertCircle size={18} className="shrink-0" />{error}</p>}
        {notice && <p role="status" className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 sm:mx-6"><CheckCircle2 size={18} className="shrink-0" />{notice}</p>}
        {!thread ? (
          <div className="min-h-56">
            {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 className="animate-spin" size={19} /> Carregando conversas...</div>
              : threads.length ? threads.map((item) => (
                <button key={item.id} type="button" onClick={() => openThread(item)}
                  className="flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left hover:bg-slate-50 sm:px-6">
                  <span className="mt-1 rounded-xl bg-slate-100 p-2 text-slate-600"><Mail size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="truncate text-sm text-slate-900">{item.subject || "(sem assunto)"}</strong>
                      <span className="text-xs text-slate-400">{formatDate(item.received_at)}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">{item.from || "Remetente não informado"}</span>
                    <span className="mt-1 flex gap-2 text-[11px] text-slate-500">{item.email_count} mensagem(ns){item.has_attachment && <Paperclip size={13} />}{!item.read && <span className="font-bold text-amber-700">Não lida</span>}</span>
                  </span>
                </button>
              )) : !error && <div className="flex flex-col items-center justify-center gap-2 p-12 text-center text-slate-500"><Inbox size={28} /><strong className="text-sm">Nenhuma conversa nesta caixa</strong><span className="text-xs">As novas mensagens aparecerão quando o Resend recebê-las.</span></div>}
            {hasMore && <p className="p-4 text-xs text-amber-800">Exibindo as 30 conversas mais recentes. Paginação será ativada em etapa posterior.</p>}
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <button type="button" onClick={() => { setThread(null); setMessages([]); setReply(""); setNotice(""); load(box); }} className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft size={15} /> Voltar às conversas</button>
            <h2 className="mb-4 break-words text-lg font-bold text-slate-900">{thread.subject || "(sem assunto)"}</h2>
            <div className="space-y-3">
              {opening && <p className="text-sm text-slate-500">Carregando mensagens...</p>}
              {messages.map((message) => (
                <article key={message.id} className={"rounded-xl border p-4 " + (message.direction === "outbound" ? "border-emerald-100 bg-emerald-50/50" : "border-slate-200 bg-slate-50")}>
                  <div className="flex flex-wrap justify-between gap-2 text-xs">
                    <strong className="break-all text-slate-800">{message.from}</strong>
                    <span className="text-slate-500">{formatDate(message.received_at)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{message.text || (message.html_only ? "Esta mensagem contém somente HTML. A visualização em texto será implementada sem executar conteúdo externo." : "(sem conteúdo em texto)")}</p>
                  {message.attachment_count > 0 && <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Paperclip size={13}/>{message.attachment_count} anexo(s) — acesso a anexos ainda não habilitado</p>}
                </article>
              ))}
            </div>
            {canReply && <form onSubmit={send} className="mt-6 border-t border-slate-100 pt-5">
              <label htmlFor="master-reply" className="text-sm font-semibold text-slate-800">Responder pela caixa {selected.address}</label>
              <textarea id="master-reply" required maxLength={5000} rows={5} value={reply} onChange={(event) => setReply(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300" placeholder="Escreva sua resposta ao cliente..." />
              <p className="mb-3 text-xs text-slate-500">Resposta em texto, com confirmação manual. Máximo de 5.000 caracteres e 15 respostas por hora.</p>
              <button disabled={sending || !reply.trim() || opening} type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}{sending ? "Enviando..." : "Enviar resposta"}
              </button>
            </form>}
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 text-xs text-slate-500"><ShieldCheck size={16} className="shrink-0" /> Mensagens acessíveis somente a contas Master. O conteúdo dos e-mails não é gravado no log administrativo.</div>
      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Teste de envio transacional (anterior)</summary>
        <div className="mt-5"><EmailTestPanel user={user}/></div>
      </details>
    </section>
  );
}
