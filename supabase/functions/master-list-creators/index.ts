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
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  }});
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : authorization;
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
  const search = String(body.search || "").trim().slice(0, 100).toLocaleLowerCase("pt-BR");

  const allUsers: any[] = [];
  for (let authPage = 1; authPage <= 100; authPage += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
    if (error) {
      console.error("Master Auth users query failed", error.message);
      return respond({ error: "Could not load accounts" }, 503, origin);
    }
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [{ data: masterRows, error: masterError }, { data: adminRows, error: adminsError }] = await Promise.all([
    admin.from("master_admins").select("user_id"),
    admin.from("admins").select("user_id"),
  ]);
  if (masterError || adminsError) {
    console.error("Master protected accounts query failed", masterError?.message || adminsError?.message);
    return respond({ error: "Could not validate protected accounts" }, 503, origin);
  }
  const protectedIds = new Set([
    ...(masterRows || []).map((row) => row.user_id),
    ...(adminRows || []).map((row) => row.user_id),
  ]);
  const users = allUsers.filter((user) => !protectedIds.has(user.id));

  const userIds = users.map((user) => user.id);
  const profileMap = new Map<string, any>();
  for (let start = 0; start < userIds.length; start += 500) {
    const batch = userIds.slice(start, start + 500);
    if (!batch.length) continue;
    const { data, error } = await admin.from("perfil_criador")
      .select("user_id,data,updated_at").in("user_id", batch);
    if (error) {
      console.error("Creator profile query failed", error.message);
      return respond({ error: "Could not load account profiles" }, 503, origin);
    }
    for (const profile of data || []) profileMap.set(profile.user_id, profile);
  }

  const filtered = users.map((account) => {
    const profile = profileMap.get(account.id);
    const data = profile?.data || {};
    const name = String(data.nomeCompleto || [data.nome, data.sobrenome].filter(Boolean).join(" ") || data.nome || account.user_metadata?.name || "Nome não informado");
    const creatorName = String(data.nomeCriatorio || "");
    const city = String(data.cidade || "");
    const state = String(data.uf || "");
    return { account, profile, name, creatorName, city, state };
  }).filter((item) => {
    if (!search) return true;
    const haystack = [item.name, item.creatorName, item.city, item.state, item.account.email || ""]
      .join(" ").toLocaleLowerCase("pt-BR");
    return haystack.includes(search);
  }).sort((a, b) => new Date(b.account.created_at).getTime() - new Date(a.account.created_at).getTime());

  const total = filtered.length;
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageIds = pageItems.map((item) => item.account.id);
  const birdCounts = new Map<string, number>();
  if (pageIds.length) {
    const { data: birds, error: birdsError } = await admin.from("aves").select("user_id").in("user_id", pageIds);
    if (birdsError) {
      console.error("Creator bird counts query failed", birdsError.message);
      return respond({ error: "Could not load bird counts" }, 503, origin);
    }
    for (const bird of birds || []) birdCounts.set(bird.user_id, (birdCounts.get(bird.user_id) || 0) + 1);
  }

  const items = pageItems.map(({ account, profile, name, creatorName, city, state }) => {
    const bannedUntil = account.banned_until || null;
    return {
      userId: account.id,
      name,
      creatorName,
      city,
      state,
      email: account.email || "",
      createdAt: account.created_at,
      lastSignInAt: account.last_sign_in_at || null,
      emailConfirmed: Boolean(account.email_confirmed_at),
      blocked: Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
      blockedUntil: bannedUntil,
      birdsCount: birdCounts.get(account.id) || 0,
      profileUpdatedAt: profile?.updated_at || null,
      hasProfile: Boolean(profile),
    };
  });

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "accounts_list_viewed",
    resource_type: "account",
    metadata: { page, page_size: pageSize, search_applied: Boolean(search), result_count: items.length, total },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.message);
    return respond({ error: "Could not record administrative audit" }, 503, origin);
  }

  return respond({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, 200, origin);
});
