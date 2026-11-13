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

function respond(body: unknown, status: number, origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json",
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
  }});
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\\s+/i, "");
  if (!token || token === authorization) return respond({ error: "Unauthorized" }, 401, origin);

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

  const page = Math.max(1, Math.min(10000, Math.floor(Number(body.page) || 1)));
  const pageSize = 25;
  const search = String(body.search || "").trim().replace(/[,%()]/g, " ").replace(/\\s+/g, " ").slice(0, 80);
  const species = String(body.species || "").trim().slice(0, 80);
  const sex = String(body.sex || "").trim().slice(0, 40);

  let query = admin.from("aves")
    .select("id,user_id,updated_at,data", { count: "exact" })
    .order("updated_at", { ascending: false, nullsFirst: false });
  if (species) query = query.eq("data->>especie", species);
  if (sex) query = query.eq("data->>sexo", sex);
  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "")}%`;
    query = query.or([
      `data->>nome.ilike.${pattern}`,
      `data->>anilha.ilike.${pattern}`,
      `data->>corMutacao.ilike.${pattern}`,
    ].join(","));
  }

  const { data: rows, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) {
    console.error("Master birds query failed", error.message);
    return respond({ error: "Could not load bird records" }, 503, origin);
  }

  const userIds = [...new Set((rows || []).map((row) => row.user_id).filter(Boolean))];
  const profiles = new Map<string, Record<string, unknown>>();
  if (userIds.length) {
    const { data, error: profileError } = await admin.from("perfil_criador")
      .select("user_id,data").in("user_id", userIds);
    if (profileError) {
      console.error("Master bird profiles query failed", profileError.message);
      return respond({ error: "Could not load creator profiles" }, 503, origin);
    }
    for (const profile of data || []) profiles.set(profile.user_id, profile.data || {});
  }

  const items = (rows || []).map((row) => {
    const data = row.data || {};
    const profile = profiles.get(row.user_id) || {};
    return {
      id: row.id,
      userId: row.user_id,
      updatedAt: row.updated_at,
      name: String(data.nome || ""),
      species: String(data.especie || ""),
      mutation: String(data.corMutacao || ""),
      sex: String(data.sexo || ""),
      ring: String(data.anilha || ""),
      status: String(data.status || ""),
      creator: String(profile.nomeCriatorio || profile.nomeCompleto || profile.nome || "Criador sem nome"),
    };
  });

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "master_birds_list_viewed",
    resource_type: "bird",
    metadata: { page, page_size: pageSize, search: Boolean(search), species_filter: species || null, sex_filter: sex || null, result_count: items.length, total: count || 0 },
  });
  if (auditError) {
    console.error("Master birds audit failed", auditError.message);
    return respond({ error: "Could not record administrative audit" }, 503, origin);
  }

  return respond({ items, total: count || 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)) }, 200, origin);
});
