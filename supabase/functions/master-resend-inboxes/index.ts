import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const originAllow = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
const inboxes = { suporte: "suporte@avespet.com.br", financeiro: "financeiro@avespet.com.br" } as const;
// Cache apenas do identificador técnico da caixa, nunca de e-mails ou mensagens.
// Cada chamada continua validando a sessão e a permissão Master.
const inboxCache = new Map<Box, { id: string, expiresAt: number }>();
const inboxCacheTtlMs = 10 * 60 * 1000;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Box = keyof typeof inboxes;

const instagramUrl = "https://www.instagram.com/avespet.oficial/";
const websiteUrl = "https://www.avespet.com.br/";
// Logo provisório com pena verde, versionado em commit imutável e hospedado publicamente.
const signatureLogoUrl = "https://www.avespet.com.br/avespet-assinatura.png";
function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function composeSignedReply(body: string, box: Box) {
  const department = box === "suporte" ? "Suporte" : "Financeiro";
  const fromEmail = inboxes[box];
  const message = body.replace(/\r\n?/g, "\n").trim();
  const sigText = [
    "Atenciosamente,",
    "Equipe Avespet | " + department,
    fromEmail,
    "www.avespet.com.br",
    "Instagram: @avespet.oficial (" + instagramUrl + ")",
  ].join("\n");
  // O HTML é criado no servidor: texto do atendente recebe escape para não executar markup.
  const text = message + "\n\n" + sigText;
  const html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#20352a">' +
    '<div>' + escapeHtml(message).replace(/\n/g, "<br>") + '</div>' +
    '<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid #d7e6dc;padding-top:14px"><tr>' +
    '<td style="vertical-align:top;padding-right:14px">' +
    '<img src="' + signatureLogoUrl + '" alt="Pena Avespet" width="66" height="66" style="width:66px;height:66px;display:block;border:0;border-radius:12px" />' +
    '</td><td style="vertical-align:top;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#4b6354">' +
    'Atenciosamente,<br>' +
    '<strong style="font-size:15px;color:#1d3b2b">Aves<span style="color:#26945f">pet</span></strong> &nbsp;|&nbsp; <strong style="color:#1d754b">' + department + '</strong><br>' +
    '<a href="mailto:' + fromEmail + '" style="color:#1d754b;text-decoration:none">' + fromEmail + '</a><br>' +
    '<a href="' + websiteUrl + '" style="color:#1d754b;text-decoration:none">www.avespet.com.br</a><br>' +
    '<a href="' + instagramUrl + '" style="color:#1d754b;text-decoration:none">Instagram @avespet.oficial</a>' +
    '</td></tr></table></div>';
  return { text, html };
}

function allowedOrigin(origin: string | null) {
  if (!origin || originAllow.has(origin)) return true;
  try {
    const h = new URL(origin).hostname;
    return h.startsWith("avespet-") && h.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function headers(origin: string | null) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...(origin && allowedOrigin(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}
function reply(payload: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(payload), { status, headers: headers(origin) });
}
function validBox(value: unknown): value is Box {
  return value === "suporte" || value === "financeiro";
}
function formatList(data: unknown) {
  return Array.isArray(data) ? data : [];
}
function str(value: unknown, max = 200) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function htmlToText(html: unknown) {
  if (typeof html !== "string") return "";
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim().slice(0, 30000);
}

class ProviderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
async function resend(path: string, key: string, method: "GET" | "POST" = "GET", body?: Record<string, unknown>, idem?: string) {
  const result = await fetch("https://api.resend.com" + path, {
    method,
    headers: {
      Authorization: "Bearer " + key,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(idem ? { "Idempotency-Key": idem } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!result.ok) {
    console.error("Resend Inbox API status", result.status, "route", method, path.split("?")[0].replace(uuid, "[id]"));
    if (result.status === 401 || result.status === 403) throw new ProviderError(503, "A chave da caixa de entrada precisa ter permissão Full access no Resend.");
    if (result.status === 404) throw new ProviderError(404, "Essa conversa não foi encontrada na caixa selecionada.");
    if (result.status === 429) throw new ProviderError(429, "Limite temporário da API de e-mail. Tente novamente mais tarde.");
    throw new ProviderError(503, "Não foi possível consultar o Resend neste momento.");
  }
  return await result.json();
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return reply({ error: "Origem não autorizada." }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Método inválido." }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return reply({ error: "Sessão obrigatória." }, 401, origin);
  const projectUrl = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !anon || !service) return reply({ error: "Configuração Supabase indisponível." }, 503, origin);

  const auth = createClient(projectUrl, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: identityError } = await auth.auth.getUser(token);
  if (identityError || !identity.user) return reply({ error: "Sessão inválida." }, 401, origin);
  const admin = createClient(projectUrl, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (masterError) return reply({ error: "Não foi possível verificar a autorização Master." }, 503, origin);
  if (!master) return reply({ error: "Acesso exclusivo do Master." }, 403, origin);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 12000) return reply({ error: "Requisição muito grande." }, 413, origin);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
  } catch { return reply({ error: "Requisição inválida." }, 400, origin); }
  const action = str(body.action, 32);
  const box = body.box;
  if (!validBox(box)) return reply({ error: "Caixa inválida." }, 400, origin);
  const key = Deno.env.get("RESEND_INBOX_API_KEY");
  if (!key) return reply({ error: "Integração de caixas não ativada. Configure RESEND_INBOX_API_KEY nos Secrets do Supabase." }, 503, origin);
  // O provedor exige o ID da caixa. Reutilizamos esse identificador por até
  // 10 minutos para não consultar /inboxes antes de toda leitura ou envio.
  // Os indicadores de não lidos são consultados em tempo real em "threads".
  const address = inboxes[box];
  let selectedId: string;
  let inboxUnread = 0;
  let inboxLastReceived: string | null = null;
  const cached = inboxCache.get(box);
  const cacheHit = Boolean(cached && cached.expiresAt > Date.now());
  if (cacheHit && cached) {
    selectedId = cached.id;
  } else {
    inboxCache.delete(box);
    try {
      const listing = await resend("/inboxes?limit=100", key);
      const item = formatList(listing?.data).find((entry: any) =>
        typeof entry?.email_address === "string" &&
        entry.email_address.toLowerCase() === address);
      if (!item || !uuid.test(String(item.id))) {
        return reply({ error: "Caixa " + address + " não encontrada na conta Resend desta chave." }, 503, origin);
      }
      selectedId = item.id;
      inboxUnread = Number(item.unread) || 0;
      inboxLastReceived = typeof item.last_received === "string" ? item.last_received : null;
      inboxCache.set(box, { id: selectedId, expiresAt: Date.now() + inboxCacheTtlMs });
    } catch (error) {
      if (error instanceof ProviderError) return reply({ error: error.message }, error.status, origin);
      return reply({ error: "Não foi possível localizar as caixas do Resend." }, 503, origin);
    }
  }
  const base = "/inboxes/" + selectedId;
  const thread = str(body.thread_id, 50);
  const email = str(body.email_id, 50);

  try {
    if (action === "sent") {
      const after = str(body.after, 50);
      if (after && !uuid.test(after)) return reply({ error: "Cursor de paginação inválido." }, 400, origin);
      const query = new URLSearchParams({ limit: "50" });
      if (after) query.set("after", after);
      const result = await resend("/emails?" + query.toString(), key);
      const emails = formatList(result?.data).map((item: any) => ({
        id: str(item.id, 50), to: formatList(item.to).map((v: unknown) => str(v, 254)),
        from: str(item.from, 254), subject: str(item.subject, 200) || "(sem assunto)",
        created_at: str(item.created_at, 50), last_event: str(item.last_event, 40) || "sent",
      })).filter((item: any) => uuid.test(item.id));
      const { error: auditError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_sent_emails_viewed",
        resource_type: "communication", metadata: { count: emails.length, has_more: Boolean(result?.has_more) },
      });
      if (auditError) return reply({ error: "Não foi possível registrar o acesso administrativo." }, 503, origin);
      return reply({ success: true, emails, has_more: Boolean(result?.has_more),
        next_cursor: emails.length ? emails[emails.length - 1].id : null }, 200, origin);
    }
    if (action === "sent_detail") {
      const emailId = str(body.email_id, 50);
      if (!uuid.test(emailId)) return reply({ error: "E-mail inválido." }, 400, origin);
      const item = await resend("/emails/" + emailId, key);
      const emailDetail = {
        id: str(item?.id, 50), to: formatList(item?.to).map((v: unknown) => str(v, 254)),
        from: str(item?.from, 254), subject: str(item?.subject, 200) || "(sem assunto)",
        created_at: str(item?.created_at, 50), last_event: str(item?.last_event, 40) || "sent",
        text: str(item?.text, 30000) || htmlToText(item?.html),
        message_id: str(item?.message_id, 255),
      };
      const { error: auditError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_sent_email_detail_viewed",
        resource_type: "communication", resource_id: emailId,
        metadata: { has_text: Boolean(emailDetail.text) },
      });
      if (auditError) return reply({ error: "Não foi possível registrar o acesso administrativo." }, 503, origin);
      return reply({ success: true, email: emailDetail }, 200, origin);
    }
    if (action === "threads") {
      // Total de não lidos permanece atualizado, sem voltar a bloquear
      // a listagem de conversas enquanto o Resend responde sobre as caixas.
      const [result, inboxListing] = await Promise.all([
        resend(base + "/threads?folders=inbox&limit=30", key),
        cacheHit ? resend("/inboxes?limit=100", key) : Promise.resolve(null),
      ]);
      if (inboxListing) {
        const item = formatList(inboxListing?.data).find((entry: any) =>
          typeof entry?.email_address === "string" &&
          entry.email_address.toLowerCase() === address);
        if (item && uuid.test(String(item.id))) {
          inboxUnread = Number(item.unread) || 0;
          inboxLastReceived = typeof item.last_received === "string" ? item.last_received : null;
          inboxCache.set(box, { id: item.id, expiresAt: Date.now() + inboxCacheTtlMs });
        }
      }
      const threads = formatList(result?.data).map((item: any) => ({
        id: str(item.id, 50), subject: str(item.subject, 200) || "(sem assunto)",
        from: str(item.from, 200), received_at: str(item.received_at, 50),
        read: Boolean(item.read), email_count: Number(item.email_count) || 0,
        has_attachment: Boolean(item.has_attachment),
      })).filter((item: any) => uuid.test(item.id));
      const { error: auditError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_threads_viewed",
        resource_type: "communication", metadata: { box, count: threads.length },
      });
      if (auditError) return reply({ error: "Não foi possível registrar o acesso administrativo." }, 503, origin);
      return reply({ success: true, threads, has_more: Boolean(result?.has_more),
        unread_count: inboxUnread, last_received: inboxLastReceived }, 200, origin);
    }
    if (action === "messages") {
      if (!uuid.test(thread)) return reply({ error: "Conversa inválida." }, 400, origin);
      const result = await resend(base + "/threads/" + thread + "/emails?limit=50", key);
      const messages = formatList(result?.data).map((item: any) => ({
        id: str(item.id, 50), direction: item.direction === "outbound" ? "outbound" : "inbound",
        from: str(item.from, 200), to: formatList(item.to).map((v: unknown) => str(v, 200)),
        subject: str(item.subject, 200), text: str(item.text, 30000),
        html_only: !item.text && Boolean(item.html),
        received_at: str(item.received_at, 50),
        attachment_count: formatList(item.attachments).length,
      })).filter((item: any) => uuid.test(item.id));
      const { error: auditError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_messages_viewed",
        resource_type: "communication", resource_id: thread, metadata: { box, count: messages.length },
      });
      if (auditError) return reply({ error: "Não foi possível registrar o acesso administrativo." }, 503, origin);
      return reply({ success: true, messages, has_more: Boolean(result?.has_more) }, 200, origin);
    }
    if (action === "compose") {
      // Individual, manual operational emails only; campaigns require a separate, consent-based flow.
      const recipient = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
      const subject = typeof body.subject === "string" ? body.subject.trim() : "";
      const content = typeof body.text === "string" ? body.text.trim() : "";
      const idempotency = str(body.idempotency_key, 50);
      const sourceId = str(body.source_id, 40);
      if (sourceId) {
        if (box !== "suporte" || !uuid.test(sourceId)) return reply({ error:"Referência da ave inválida." },400,origin);
        const {data:ad,error:adError}=await admin.from("anuncios_aves_perdidas")
          .select("user_id").eq("id",sourceId).maybeSingle();
        if (adError || !ad?.user_id) return reply({error:"Não foi possível validar a titularidade."},409,origin);
        const {data:account,error:accountError}=await admin.auth.admin.getUserById(ad.user_id);
        if (accountError || !account?.user?.email_confirmed_at ||
            account.user.email?.trim().toLowerCase() !== recipient) {
          return reply({error:"O destinatário não corresponde ao e-mail confirmado do titular."},409,origin);
        }
      }
      if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(recipient) || recipient.length > 254 ||
          !subject || subject.length > 180 || /[\r\n]/.test(subject) ||
          !content || content.length > 5000 || !uuid.test(idempotency)) {
        return reply({ error: "Informe um destinatário, assunto e mensagem válidos (até 5.000 caracteres)." }, 400, origin);
      }
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: limitError } = await admin.from("master_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("actor_user_id", identity.user.id)
        .eq("action", "resend_inbox_compose_requested")
        .gte("created_at", since);
      if (limitError) return reply({ error: "Não foi possível conferir o limite de envio." }, 503, origin);
      if ((count || 0) >= 10) return reply({ error: "Limite de 10 novos e-mails por hora alcançado." }, 429, origin);
      const signed = composeSignedReply(content, box);
      // Audit intention before creating the draft; neither addresses nor bodies are stored in the log.
      const { error: requestedError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_compose_requested",
        resource_type: "communication",
        metadata: { box, idempotency },
      });
      if (requestedError) return reply({ error: "Não foi possível registrar o envio administrativo." }, 503, origin);
      const draft = await resend(base + "/drafts", key, "POST",
        { to: [recipient], subject, text: signed.text, html: signed.html },
        idempotency + "-draft");
      if (!uuid.test(String(draft?.id || ""))) {
        return reply({ error: "O rascunho foi criado, mas a resposta do Resend é inválida. Verifique o Resend antes de repetir." }, 503, origin);
      }
      // Use a stable idempotency key for the second step; avoid blind retries on uncertain outcomes.
      const sent = await resend(base + "/drafts/" + draft.id + "/send", key, "POST", {},
        idempotency + "-send");
      const { error: completedError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_compose_sent",
        resource_type: "communication",
        metadata: { box, idempotency, provider_id: str(sent?.id, 50), ...(sourceId ? {source_id:sourceId} : {}) },
      });
      let historyError = null;
      if (sourceId) {
        const saved = await admin.from("master_support_events").insert({
          source:"perdida",source_id:sourceId,event_type:"email_sent",
          summary:"Solicitação de informações enviada por e-mail",actor_user_id:identity.user.id,
          details:{provider_id:str(sent?.id,50),box:"suporte"},
        });
        historyError = saved.error;
      }
      if (completedError || historyError) console.error("New inbox email sent; audit/history confirmation failed");
      return reply({ success: true, sent: true, audit_warning: Boolean(completedError || historyError) }, 200, origin);
    }
    if (action === "reply") {
      if (!uuid.test(thread) || !uuid.test(email)) return reply({ error: "Mensagem inválida." }, 400, origin);
      const content = typeof body.text === "string" ? body.text.trim() : "";
      const idempotency = str(body.idempotency_key, 50);
      const signed = composeSignedReply(content, box);
      if (!content || content.length > 5000 || !uuid.test(idempotency)) {
        return reply({ error: "Informe uma resposta de até 5.000 caracteres." }, 400, origin);
      }
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: limitError } = await admin.from("master_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("actor_user_id", identity.user.id).eq("action", "resend_inbox_reply_requested")
        .gte("created_at", hourAgo);
      if (limitError) return reply({ error: "Não foi possível conferir o limite de segurança." }, 503, origin);
      if ((count || 0) >= 15) return reply({ error: "Limite de 15 respostas por hora alcançado." }, 429, origin);
      const original = await resend(base + "/threads/" + thread + "/emails/" + email, key);
      if (original.direction !== "inbound" || !original.from) {
        return reply({ error: "Selecione uma mensagem recebida para responder." }, 400, origin);
      }
      // Audit intention BEFORE sending; never log message text or customer address.
      const { error: beforeError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_reply_requested",
        resource_type: "communication", resource_id: thread, metadata: { box, idempotency },
      });
      if (beforeError) return reply({ error: "Não foi possível registrar a autorização para resposta." }, 503, origin);
      const response = await resend(base + "/threads/" + thread + "/emails/" + email + "/reply",
        key, "POST", { text: signed.text, html: signed.html, reply_all: false }, idempotency);
      const { error: afterError } = await admin.from("master_audit_log").insert({
        actor_user_id: identity.user.id, action: "resend_inbox_reply_sent",
        resource_type: "communication", resource_id: thread,
        metadata: { box, provider_id: str(response?.id, 50), idempotency },
      });
      if (afterError) console.error("Resend reply delivered but audit completion failed");
      return reply({ success: true, sent: true, audit_warning: Boolean(afterError) }, 200, origin);
    }
    return reply({ error: "Ação inválida." }, 400, origin);
  } catch (error) {
    // Se a caixa tiver sido recriada no Resend, refazer a descoberta na próxima chamada.
    if (error instanceof ProviderError && error.status === 404) inboxCache.delete(box);
    if (error instanceof ProviderError) return reply({ error: error.message }, error.status, origin);
    console.error("Master inbox failure", error instanceof Error ? error.message : "unknown");
    return reply({ error: "Falha temporária na Central de Comunicação." }, 503, origin);
  }
});
