import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
  "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app",
]);

function allowedOrigin(origin: string | null) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function headers(origin: string | null) {
  const result: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigin(origin)) result["Access-Control-Allow-Origin"] = origin;
  return result;
}
function respond(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return respond({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return respond({ error: "Unauthorized" }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Unauthorized" }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: entitlement, error: entitlementError } = await admin
    .from("master_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (entitlementError) {
    console.error("Master entitlement lookup failed", entitlementError.message);
    return respond({ error: "Could not validate access" }, 503, origin);
  }
  if (!entitlement) return respond({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return respond({ error: "Invalid request" }, 400, origin); }
  const page = Math.max(1, Math.min(500, Math.floor(Number(body.page) || 1)));
  const pageSize = 20;
  const search = String(body.search || "").trim().replace(/[%_]/g, "").slice(0, 60);
  let query = admin.from("perfil_criador").select("user_id,data,updated_at", { count: "exact" });
  if (search) {
    const safe = search.replace(/[,.()]/g, " ").trim();
    if (safe) query = query.or([
      `data->>nome.ilike.%${safe}%`,
      `data->>sobrenome.ilike.%${safe}%`,
      `data->>nomeCompleto.ilike.%${safe}%`,
      `data->>nomeCriatorio.ilike.%${safe}%`,
      `data->>cidade.ilike.%${safe}%`,
      `data->>uf.ilike.%${safe}%`,
    ].join(","));
  }
  const { data: profiles, count, error: profilesError } = await query
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (profilesError) {
    console.error("Creator profiles query failed", profilesError.message);
    return respond({ error: "Could not load creators" }, 503, origin);
  }

  const rows = await Promise.all((profiles || []).map(async (profile) => {
    const [userResult, birdResult] = await Promise.all([
      admin.auth.admin.getUserById(profile.user_id),
      admin.from("aves").select("id", { count: "exact", head: true }).eq("user_id", profile.user_id),
    ]);
    if (userResult.error) {
      console.error("Creator auth lookup failed", userResult.error.message);
      return null;
    }
    const account = userResult.data.user;
    const data = profile.data || {};
    const bannedUntil = account.banned_until || null;
    const isBlocked = Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
    return {
      userId: profile.user_id,
      name: String(data.nomeCompleto || [data.nome, data.sobrenome].filter(Boolean).join(" ") || data.nome || "Nome não informado"),
      creatorName: String(data.nomeCriatorio || ""),
      city: String(data.cidade || ""),
      state: String(data.uf || ""),
      email: account.email || "",
      createdAt: account.created_at,
      lastSignInAt: account.last_sign_in_at || null,
      emailConfirmed: Boolean(account.email_confirmed_at),
      blocked: isBlocked,
      blockedUntil: bannedUntil,
      birdsCount: birdResult.count || 0,
      profileUpdatedAt: profile.updated_at,
    };
  }));

  const result = rows.filter(Boolean);
  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "creators_list_viewed",
    resource_type: "creator",
    metadata: { page, page_size: pageSize, search_applied: Boolean(search), result_count: result.length },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.message);
    return respond({ error: "Could not record administrative audit" }, 503, origin);
  }

  return respond({ items: result, total: count || 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)) }, 200, origin);
});
