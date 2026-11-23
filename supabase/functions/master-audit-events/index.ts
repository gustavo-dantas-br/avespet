import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const productionOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
]);
const allowedTypes = new Set([
  "", "account", "creator", "auth_user", "bird", "ad", "platform",
  "platform_plan", "creator_subscription", "creator_entitlement_override", "master_access",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function allowedOrigin(origin: string | null) {
  if (!origin || productionOrigins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function respond(body: unknown, status: number, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return respond({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  } });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const header = req.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token || token === header) return respond({ error: "Unauthorized" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: authError } = await auth.auth.getUser(token);
  if (authError || !identity.user) return respond({ error: "Unauthorized" }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (masterError) return respond({ error: "Could not verify Master access" }, 503, origin);
  if (!master) return respond({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return respond({ error: "Invalid request" }, 400, origin); }

  const scope = String(body.scope || "changes");
  const resourceType = String(body.resource_type || "");
  const days = String(body.days || "30");
  const n = Number(body.page);
  const page = Number.isSafeInteger(n) ? Math.min(1000, Math.max(1, n)) : 1;
  const pageSize = 25;
  if (!["changes", "all"].includes(scope) || !allowedTypes.has(resourceType) || !["7", "30", "all"].includes(days)) {
    return respond({ error: "Invalid filter" }, 400, origin);
  }

  let query = admin.from("master_audit_log")
    // Data minimization: never select metadata (may contain private names/emails/motives).
    .select("id,actor_user_id,action,resource_type,resource_id,created_at", { count: "exact" })
    .order("created_at", { ascending: false });
  if (scope === "changes") query = query.not("action", "ilike", "%viewed");
  if (resourceType) query = query.eq("resource_type", resourceType);
  if (days !== "all") {
    query = query.gte("created_at", new Date(Date.now() - Number(days) * 86400000).toISOString());
  }
  const { data: rows, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) {
    console.error("Master audit query failed", error.message);
    return respond({ error: "Could not load audit entries" }, 503, origin);
  }

  const items = (rows || []).map((row) => {
    const rawRef = String(row.resource_id || "");
    return {
      id: row.id,
      action: String(row.action || "unknown").slice(0, 100),
      resourceType: String(row.resource_type || "").slice(0, 60),
      resourceRef: (uuid.test(rawRef) || /^\d{1,20}$/.test(rawRef)) ? rawRef.slice(0, 8) : null,
      createdAt: row.created_at,
      actorLabel: row.actor_user_id === identity.user.id
        ? "Você"
        : "Outro administrador (" + String(row.actor_user_id || "").slice(0, 8) + ")",
    };
  });

  // Audit the privileged read itself, without revealing filter values or source metadata.
  const { error: logError } = await admin.from("master_audit_log").insert({
    actor_user_id: identity.user.id,
    action: "master_audit_log_viewed",
    resource_type: "platform",
    metadata: { scope, resource_type: resourceType || "all", days, page, result_count: items.length },
  });
  if (logError) {
    console.error("Could not audit audit log read", logError.message);
    return respond({ error: "Could not record administrative access" }, 503, origin);
  }
  const total = count || 0;
  return respond({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, 200, origin);
});
