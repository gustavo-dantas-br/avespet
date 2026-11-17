import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Envio exclusivamente à própria identidade Master, sem destinatários arbitrários.
const approvedOrigins = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
function allowed(origin: string | null): boolean {
  if (!origin || approvedOrigins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function headers(origin: string | null): Record<string,string> {
  const h: Record<string,string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowed(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");
  if (!allowed(origin)) return reply({ error: "Origem não autorizada." }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Método não permitido." }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return reply({ error: "Sessão não autorizada." }, 401, origin);
  const token = authorization.slice(7).trim();
  if (!token) return reply({ error: "Sessão não autorizada." }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({ error: "Configuração do Supabase incompleta." }, 503, origin);

  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  const actor = authData.user;
  if (authError || !actor?.email) return reply({ error: "Sessão não autorizada." }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: grant, error: grantError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", actor.id).maybeSingle();
  if (grantError) {
    console.error("Resend test Master lookup failed", grantError.message);
    return reply({ error: "Não foi possível confirmar a permissão Master." }, 503, origin);
  }
  if (!grant) return reply({ error: "Acesso exclusivo ao Master." }, 403, origin);

  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count, error: auditLookupError } = await admin.from("master_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("actor_user_id", actor.id).eq("action", "resend_test_email_sent").gte("created_at", hourAgo);
  if (auditLookupError) {
    console.error("Resend test rate limit lookup failed", auditLookupError.message);
    return reply({ error: "Não foi possível consultar o limite de testes." }, 503, origin);
  }
  if ((count || 0) >= 3) return reply({ error: "Limite de três testes por hora atingido." }, 429, origin);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return reply({ error: "A chave RESEND_API_KEY ainda não foi configurada no Supabase." }, 503, origin);

  const recipient = actor.email.trim().toLowerCase();
  const email = {
    from: "Avespet Suporte <suporte@avespet.com.br>",
    to: [recipient],
    subject: "Avespet — teste de e-mail",
    text: "Olá! Este é um teste de envio da Central de Comunicação Avespet. Nenhuma campanha foi ativada.",
    html: "<!doctype html><html lang='pt-BR'><body style='font-family:Arial,sans-serif;padding:24px;color:#1d3348'><h1 style='color:#28724e'>Avespet</h1><p>Este é um <strong>teste de envio</strong> da Central de Comunicação.</p><p>Nenhuma campanha foi ativada.</p></body></html>",
  };

  let provider: Response;
  try {
    provider = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + resendKey,
        "Content-Type": "application/json",
        "Idempotency-Key": "avespet-test-" + actor.id + "-" + Math.floor(Date.now() / 300000),
      },
      body: JSON.stringify(email),
    });
  } catch {
    console.error("Resend test network error");
    return reply({ error: "Não foi possível conectar ao serviço de e-mail." }, 502, origin);
  }
  if (!provider.ok) {
    console.error("Resend test rejected", provider.status);
    return reply({ error: provider.status === 429 ? "Limite do Resend atingido." : "O Resend recusou o envio. Confira a chave e o domínio." }, 502, origin);
  }
  const data: { id?: string } = await provider.json().catch(() => ({}));
  if (!data.id) return reply({ error: "O provedor não retornou ID. Confira o Resend antes de repetir." }, 502, origin);

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: actor.id,
    action: "resend_test_email_sent",
    resource_type: "email",
    resource_id: data.id,
    metadata: { provider: "resend", recipient, purpose: "connection_test" },
  });
  if (auditError) {
    console.error("Resend test audit insert failed", auditError.message);
    return reply({ sent: true, recipient, auditWarning: true }, 200, origin);
  }
  return reply({ sent: true, recipient }, 200, origin);
});
