import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import ReunionReviews from "./ReunionReviews";
import { lostBirdMessage, whatsappDigits } from "./lostBirdContactTemplates";
import { RefreshCw, CheckCircle2, XCircle, Clock3, AlertCircle, Bird, Mail, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS = { pendente: "Pendente", aprovado: "Publicado", reencontrado: "Reencontradas 💚", rejeitado: "Rejeitado", encerrado: "Encerrado", todos: "Todos" };
const MAIL = {
  sent: "Confirmação enviada ao provedor",
  processing: "Envio em andamento",
  failed: "Envio falhou",
  uncertain: "Entrega não confirmada",
};
const ptDate = (value) => {
  try { return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return "Data indisponível"; }
};
function emailResult(status) {
  if (status === "sent") return "Aprovação realizada. A confirmação foi aceita pelo provedor de e-mail.";
  if (status === "no_email") return "Aprovação realizada, mas não há e-mail confirmado para esta ocorrência.";
  if (status === "email_not_configured") return "Aprovação realizada. O serviço de e-mail não está configurado.";
  if (status === "provider_rejected") return "Aprovação realizada, porém o provedor rejeitou o e-mail. Verifique a configuração.";
  if (status === "delivery_uncertain") return "Aprovação realizada. Não foi possível confirmar se o e-mail saiu. Verifique o Resend antes de reenviar.";
  if (status === "error_registering") return "Aprovação realizada, mas houve falha no controle de notificações. Verifique os registros.";
  if (status === "already_approved") return "Esta ave já estava aprovada. Nenhum e-mail novo foi enviado.";
  if (status === "already_processed") return "Aprovação realizada. Esta ocorrência já possui tentativa de envio registrada.";
  return "Aprovação registrada. Atualize os dados para verificar a situação do e-mail.";
}

export default function LostBirdsModeration({ onPrepareEmail }) {
  const [status, setStatus] = useState("pendente");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [emailTesting, setEmailTesting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactMode, setContactMode] = useState("acompanhamento");
  const [contactText, setContactText] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactBusy, setContactBusy] = useState(false);
  const [contactFeedback, setContactFeedback] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-lost-birds", {
        body: { action: "list", status, page },
      });
      if (invokeError || data?.error) throw new Error(data?.error || "Não foi possível consultar as aves perdidas.");
      setResult(data || { items: [], total: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.message || "Falha ao carregar as ocorrências.");
    } finally { setLoading(false); }
  }, [status, page]);
  useEffect(() => { load(); }, [load]);

  function openContact(ad, kind = "acompanhamento") {
    if (!ad?.id) return;
    const { text, subject } = lostBirdMessage(ad, kind);
    setContactId(ad.id);
    setContactMode(kind);
    setContactText(text);
    setContactSubject(subject);
    setContactFeedback("");
    setError("");
  }

  function changeContactMode(ad, kind) {
    const { text, subject } = lostBirdMessage(ad, kind);
    setContactMode(kind);
    setContactText(text);
    setContactSubject(subject);
    setContactFeedback("");
  }

  async function copyContact() {
    if (!contactText.trim()) return;
    try {
      await navigator.clipboard.writeText(contactText);
      setContactFeedback("Mensagem copiada para a área de transferência.");
    } catch {
      setContactFeedback("Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.");
    }
  }

  function openWhatsApp(ad) {
    const to = whatsappDigits(ad?.data?.whatsapp);
    if (!to) {
      setContactFeedback("Número de WhatsApp ausente ou inválido. Confira o cadastro do tutor.");
      return;
    }
    if (!contactText.trim()) return;
    const url = "https://wa.me/" + to + "?text=" + encodeURIComponent(contactText);
    window.open(url, "_blank", "noopener,noreferrer");
    setContactFeedback("WhatsApp aberto com a mensagem. Confira o destinatário e envie manualmente.");
  }

  async function prepareEmail(ad) {
    if (contactBusy || typeof onPrepareEmail !== "function") return;
    if (!contactText.trim() || !contactSubject.trim()) {
      setContactFeedback("Informe o assunto e a mensagem.");
      return;
    }
    setContactBusy(true);
    setContactFeedback("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-lost-birds", {
        body: { action: "contact", anuncio_id: ad.id },
      });
      if (invokeError || data?.error || !data?.success || !data.to) {
        throw new Error(data?.error || "Não foi possível verificar o e-mail do responsável.");
      }
      onPrepareEmail({
        source_id: ad.id,
        to: data.to,
        subject: contactSubject.trim(),
        text: contactText.trim().replaceAll("**", ""),
      });
      setContactId("");
    } catch(e) {
      setContactFeedback(e?.message || "Não foi possível preparar o e-mail.");
    } finally {
      setContactBusy(false);
    }
  }

  async function testarEmail() {
    if (emailTesting || busyId) return;
    if (!window.confirm("Enviar um e-mail de teste somente para o endereço da sua conta Master? Nenhum anúncio será aprovado ou publicado.")) return;
    setEmailTesting(true);
    setError("");
    setNotice("");
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("master-resend-test", { body: {} });
      if (invokeError || data?.error || !data?.sent) {
        throw new Error(data?.error || "Não foi possível enviar a mensagem de teste.");
      }
      setNotice("O Resend aceitou o teste para o e-mail da sua conta Master. Confira a caixa de entrada e o spam. Nenhum anúncio foi publicado." +
        (data?.auditWarning ? " O envio foi aceito, mas o registro de auditoria precisa ser conferido." : ""));
    } catch (err) {
      setError(err?.message || "Falha ao testar o e-mail. Verifique a configuração no Resend.");
    } finally {
      setEmailTesting(false);
    }
  }

  async function registrarReencontroConfirmado(ad) {
    if (busyId) return;
    const bird=ad.data?.nomeAve||"esta ave";
    const date=window.prompt("Data do reencontro de "+bird+" (AAAA-MM-DD). Registre somente após o tutor confirmar:",new Date().toISOString().slice(0,10));
    if(date===null)return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){setError("Informe a data no formato AAAA-MM-DD.");return;}
    const note=window.prompt("Como o tutor confirmou o reencontro? Informe o canal e quando recebeu a confirmação (mínimo 15 caracteres). Esta observação é privada:");
    if(note===null)return;
    if(note.trim().length<15||note.trim().length>500){setError("Informe uma justificativa de 15 a 500 caracteres.");return;}
    if(!window.confirm("Confirmar que "+bird+" foi REENCONTRADA? O anúncio continuará público como FINAL FELIZ. Não há reversão pela moderação comum."))return;
    setBusyId(ad.id);setError("");setNotice("");
    try {
      const {data,error}=await supabase.functions.invoke("master-reunion-reviews",{
        body:{action:"confirm",anuncio_id:ad.id,date,note:note.trim()}
      });
      if(error||data?.error||!data?.success)throw new Error(data?.error||"Falha ao registrar o reencontro.");
      setNotice("Reencontro confirmado e registrado. A ave continuará pública com o selo FINAL FELIZ. Nenhum depoimento foi publicado automaticamente.");
      if(page!==1)setPage(1);else await load();
    } catch(e){setError(e?.message||"Falha ao registrar o reencontro.");}
    finally{setBusyId("");}
  }

  async function moderate(ad, next) {
    if (busyId) return;
    const bird = ad.data?.nomeAve || ad.data?.especie || "esta ave";
    let reason = "";
    if (next === "rejeitado") {
      const answer = window.prompt("Informe o motivo da rejeição. Essa justificativa será registrada no histórico Master:");
      if (answer === null) return;
      reason = answer.trim();
      if (reason.length < 5) {
        setError("Informe um motivo com pelo menos cinco caracteres.");
        return;
      }
    }
    const label = next === "aprovado" ? "aprovar e publicar" : next === "rejeitado" ? "rejeitar" : next === "encerrado" ? "encerrar" : "voltar à análise";
    if (!window.confirm("Confirma " + label + " o anúncio de " + bird + "?")) return;
    setBusyId(ad.id); setNotice(""); setError("");
    try {
      let data, invokeError;
      if (next === "aprovado") {
        ({ data, error: invokeError } = await supabase.functions.invoke("notify-approved-lost-bird", {
          body: { anuncio_id: ad.id },
        }));
      } else {
        ({ data, error: invokeError } = await supabase.functions.invoke("master-lost-birds", {
          body: { action: "moderate", anuncio_id: ad.id, status: next, reason },
        }));
      }
      if (invokeError || data?.error || !data?.success) throw new Error(data?.error || "Falha ao atualizar o status.");
      setNotice(next === "aprovado" ? emailResult(data?.email_status) : "Ocorrência atualizada para " + STATUS[next] + ".");
      if (page !== 1) setPage(1);
      else await load();
    } catch (err) { setError(err?.message || "Não foi possível concluir a moderação."); }
    finally { setBusyId(""); }
  }

  return <section className="space-y-5">
    <ReunionReviews />
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-700">Controle de buscas</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[28px]">Aves perdidas e moderação</h1>
        <p className="mt-1 text-sm text-slate-500">Analise os anúncios, acompanhe o status da busca e verifique o envio de confirmação. Anúncios de venda são gerenciados em outra área.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={emailTesting || !!busyId} onClick={testarEmail} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 disabled:opacity-50" title="Envia somente para o e-mail da sua conta Master; não publica anúncios"><Mail size={15}/>{emailTesting ? "Enviando teste..." : "Testar e-mail"}</button>
        <button type="button" disabled={loading} onClick={load} className="inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Atualizar</button>
      </div>
    </div>
    <p className="text-xs text-slate-500">O teste envia uma mensagem de verificação para a sua conta Master, sem alterar o status de nenhuma ave. A mensagem de aprovação só é enviada quando um anúncio verdadeiro é aprovado.</p>
    <div className="flex flex-wrap gap-2">
      {Object.entries(STATUS).map(([key, label]) => <button key={key} type="button" aria-pressed={status === key} onClick={() => { setStatus(key); setPage(1); setNotice(""); }}
        className={"rounded-xl px-4 py-2 text-xs font-semibold " + (status === key ? "bg-[#182b45] text-white" : "border bg-white text-slate-600")}>{label}</button>)}
      <span className="ml-auto self-center text-xs text-slate-500">{result.total} ocorrência(s)</span>
    </div>
    {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><AlertCircle size={17} className="shrink-0"/>{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
    {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Carregando ocorrências...</div> :
      result.items.length === 0 ? <div className="rounded-2xl bg-white p-10 text-center text-slate-500"><Bird className="mx-auto mb-3" size={28}/>Nenhum anúncio neste filtro.</div> :
      <div className="grid gap-3">{result.items.map(ad => {
        const data = ad.data || {};
        const label = STATUS[ad.status] || ad.status;
        return <article key={ad.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">{data.foto ?
              <img src={data.foto} alt={data.nomeAve || "Ave perdida"} className="h-full w-full object-cover"/> :
              <div className="flex h-full items-center justify-center"><Bird size={32} className="text-slate-300"/></div>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h2 className="font-semibold text-slate-900">{data.nomeAve || data.especie || "Ave sem nome"}</h2>
                  <p className="mt-1 text-xs text-slate-500">{[data.especie, data.cor].filter(Boolean).join(" · ")}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{label}</span>
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13}/>{[data.bairro, data.cidade, data.uf].filter(Boolean).join(" · ") || "Local não informado"}</p>
              <p className="mt-1 text-xs text-slate-500">Cadastrado em {ptDate(ad.created_at)} · {ad.has_owner ? "Conta vinculada" : "Anúncio anterior sem conta"}</p>
              {data.contatoNome && <p className="mt-2 text-sm text-slate-600">Responsável: {data.contatoNome}</p>}
              {data.descricao && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{data.descricao}</p>}
              {ad.email_status ? <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600"><Mail size={15}/>{MAIL[ad.email_status] || "Status do e-mail: " + ad.email_status}{ad.email_sent_at ? " · " + ptDate(ad.email_sent_at) : ""}</p> :
                <p className="mt-3 text-xs text-slate-400">E-mail automático: ainda sem envio registrado.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={!!busyId} onClick={() => openContact(ad)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 disabled:opacity-50">
                  <Mail size={15}/> Contatar responsável
                </button>
                {ad.status === "aprovado" && ad.has_owner && <button disabled={!!busyId}
                  onClick={()=>registrarReencontroConfirmado(ad)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900 disabled:opacity-50">
                  💚 Registrar reencontro confirmado
                </button>}
                {ad.status !== "reencontrado" && ad.status !== "aprovado" && <button disabled={!!busyId} onClick={() => moderate(ad, "aprovado")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 size={15}/>Aprovar e publicar</button>}
                {ad.status !== "reencontrado" && ad.status !== "rejeitado" && <button disabled={!!busyId} onClick={() => moderate(ad, "rejeitado")} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-50"><XCircle size={15}/>Rejeitar</button>}
                {ad.status !== "reencontrado" && ad.status !== "encerrado" && <button disabled={!!busyId} onClick={() => moderate(ad, "encerrado")} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"><Clock3 size={15}/>Encerrar</button>}
                {ad.status !== "reencontrado" && ad.status !== "pendente" && <button disabled={!!busyId} onClick={() => moderate(ad, "pendente")} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">Voltar à análise</button>}
              </div>
              {contactId === ad.id && <section className="mt-4 space-y-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4" aria-label={"Mensagem para o responsável de " + (data.nomeAve || "ave perdida")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Contato personalizado · {data.nomeAve || "Ave perdida"}</h3>
                    <p className="mt-1 text-xs text-slate-500">Responsável: {data.contatoNome || "Não informado"} · WhatsApp: {data.whatsapp || "Não informado"}</p>
                  </div>
                  <button type="button" onClick={() => {setContactId("");setContactFeedback("");}} className="rounded-lg border bg-white px-3 py-1.5 text-xs text-slate-600">Fechar</button>
                </div>
                <label className="block text-xs font-semibold text-slate-700">Modelo de mensagem
                  <select className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm"
                    value={contactMode} onChange={e=>changeContactMode(ad,e.target.value)}>
                    <option value="acompanhamento">Acompanhar busca e solicitar novidades</option>
                    <option value="possivel_reencontro">Possível reencontro: solicitar confirmação</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Assunto para e-mail
                  <input className="mt-1 block w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm" value={contactSubject}
                    maxLength={180} onChange={e=>setContactSubject(e.target.value)}/>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Mensagem (editável)
                  <textarea className="mt-1 block min-h-[250px] w-full rounded-lg border border-slate-200 bg-white p-3 text-sm leading-6"
                    value={contactText} onChange={e=>setContactText(e.target.value)} maxLength={4500}/>
                </label>
                <p className="text-xs text-slate-600">O sistema preenche os dados deste anúncio. Confirme as informações antes de enviar. Nenhum contato é disparado automaticamente.</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={!contactText.trim()} onClick={copyContact} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 disabled:opacity-50">Copiar mensagem</button>
                  <button type="button" disabled={!whatsappDigits(data.whatsapp) || !contactText.trim()} onClick={()=>openWhatsApp(ad)}
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Abrir WhatsApp</button>
                  <button type="button" disabled={contactBusy || !contactText.trim() || !contactSubject.trim()} onClick={()=>prepareEmail(ad)}
                    className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{contactBusy ? "Preparando e-mail..." : "Preparar e-mail"}</button>
                </div>
                {contactFeedback && <p role="status" className="rounded-lg bg-white p-3 text-xs text-slate-700">{contactFeedback}</p>}
              </section>}
            </div>
          </div>
        </article>;
      })}</div>}
    <div className="flex items-center justify-between rounded-xl border bg-white px-4 py-3">
      <span className="text-xs text-slate-500">Página {page} de {result.totalPages}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={17}/></button>
        <button type="button" disabled={page >= result.totalPages || loading} onClick={() => setPage(p => p + 1)} className="rounded-lg border p-2 disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}