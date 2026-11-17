import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const origins = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
function originAllowed(value: string | null) {
  if (!value || origins.has(value)) return true;
  try {
    const hostname = new URL(value).hostname;
    return hostname.startsWith("avespet-") && hostname.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function response(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status, headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      ...(origin && originAllowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!originAllowed(origin)) return response({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return response({ success: true }, 200, origin);
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  const header = req.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token || token === header) return response({ error: "Unauthorized" }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return response({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: identityError } = await auth.auth.getUser(token);
  if (identityError || !identity.user) return response({ error: "Unauthorized" }, 401, origin);

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (masterError) return response({ error: "Could not validate administrative access" }, 503, origin);
  if (!master) return response({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }
  const userId = String(body.user_id || "").trim();
  if (!uuid.test(userId) || userId === identity.user.id) return response({ error: "Invalid creator account" }, 400, origin);
  const p = (body.profile && typeof body.profile === "object" && !Array.isArray(body.profile))
    ? body.profile as Record<string, unknown> : {};
  const name = String(p.name || "").trim().slice(0, 120);
  const whatsapp = String(p.whatsapp || "").trim().slice(0, 30);
  const business = String(p.creatorName || "").trim().slice(0, 120);
  const city = String(p.city || "").trim().slice(0, 100);
  const state = String(p.state || "").trim().toUpperCase().slice(0, 2);
  const digits = whatsapp.replace(/\D/g, "");
  if (!name) return response({ error: "Informe o nome completo" }, 400, origin);
  if (whatsapp && (digits.length < 10 || digits.length > 15))
    return response({ error: "Informe um WhatsApp com 10 a 15 dígitos ou deixe vazio." }, 400, origin);

  const [{ data: protectedMaster, error: pmError }, { data: protectedAdmin, error: paError }] = await Promise.all([
    admin.from("master_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    admin.from("admins").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (pmError || paError) return response({ error: "Could not verify protected accounts" }, 503, origin);
  if (protectedMaster || protectedAdmin) return response({ error: "Administrative accounts cannot be edited here" }, 403, origin);
  const { data: account, error: accountError } = await admin.auth.admin.getUserById(userId);
  if (accountError || !account.user) return response({ error: "Creator account not found" }, 404, origin);

  const { data: existing, error: readError } = await admin.from("perfil_criador")
    .select("data").eq("user_id", userId).maybeSingle();
  if (readError) return response({ error: "Could not load creator profile" }, 503, origin);

  const { error: auditBeforeError } = await admin.from("master_audit_log").insert({
    actor_user_id: identity.user.id, action: "creator_profile_update_requested",
    resource_type: "account", resource_id: userId,
    metadata: { fields: ["name", "whatsapp", "creatorName", "city", "state"] },
  });
  if (auditBeforeError) return response({ error: "Could not record administrative audit" }, 503, origin);

  const profile = {
    ...(existing?.data || {}),
    nomeCompleto: name,
    nomeCriatorio: business,
    whatsapp,
    cidade: city,
    uf: state,
  };
  const { error: updateError } = await admin.from("perfil_criador")
    .upsert({ user_id: userId, data: profile }, { onConflict: "user_id" });
  if (updateError) {
    console.error("Creator profile update failed", updateError.message);
    return response({ error: "Não foi possível atualizar o perfil do criador" }, 503, origin);
  }

  const { error: auditAfterError } = await admin.from("master_audit_log").insert({
    actor_user_id: identity.user.id, action: "account_profile_updated",
    resource_type: "account", resource_id: userId,
    metadata: { fields: ["name", "whatsapp", "creatorName", "city", "state"] },
  });
  if (auditAfterError) return response({ error: "Perfil atualizado, mas a auditoria não foi confirmada" }, 503, origin);
  return response({ success: true }, 200, origin);
});