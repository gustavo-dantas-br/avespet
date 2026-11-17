import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const originAllow = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
const inboxes = { suporte: "suporte@avespet.com.br", financeiro: "financeiro@avespet.com.br" } as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type Box = keyof typeof inboxes;

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
  const address = inboxes[box];
  const base = "/inboxes/" + encodeURIComponent(address);
  const thread = str(body.thread_id, 50);
  const email = str(body.email_id, 50);

  try {
    if (action === "threads") {
      const result = await resend(base + "/threads?folders=inbox&limit=30", key);
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
      return reply({ success: true, threads, has_more: Boolean(result?.has_more) }, 200, origin);
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
    if (action === "reply") {
      if (!uuid.test(thread) || !uuid.test(email)) return reply({ error: "Mensagem inválida." }, 400, origin);
      const content = typeof body.text === "string" ? body.text.trim() : "";
      const idempotency = str(body.idempotency_key, 50);
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
        key, "POST", { text: content, reply_all: false }, idempotency);
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
    if (error instanceof ProviderError) return reply({ error: error.message }, error.status, origin);
    console.error("Master inbox failure", error instanceof Error ? error.message : "unknown");
    return reply({ error: "Falha temporária na Central de Comunicação." }, 503, origin);
  }
});
