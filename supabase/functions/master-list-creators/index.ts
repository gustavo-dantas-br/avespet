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

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");
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
  const search = String(body.search || "").trim().replace(/[^\\p{L}\\p{N}\\s@._-]/gu, " ").replace(/\\s+/g, " ").slice(0, 60).toLocaleLowerCase("pt-BR");

  // A fonte principal é Auth: assim contas recém-criadas também aparecem mesmo sem perfil.
  const allUsers = [];
  for (let authPage = 1; authPage <= 100; authPage++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: authPage, perPage: 1000 });
    if (error) {
      console.error("Auth users query failed", error.message);
      return respond({ error: "Could not load user accounts" }, 503, origin);
    }
    allUsers.push(...data.users);
    if (data.users.length < 1000) break;
  }

  const [{ data: masterRows, error: masterError }, { data: adminRows, error: adminError }] = await Promise.all([
    admin.from("master_admins").select("user_id"),
    admin.from("admins").select("user_id"),
  ]);
  if (masterError || adminError) {
    console.error("Privileged accounts lookup failed", masterError?.message || adminError?.message);
    return respond({ error: "Could not validate account types" }, 503, origin);
  }
  const privilegedIds = new Set([
    ...(masterRows || []).map((row) => row.user_id),
    ...(adminRows || []).map((row) => row.user_id),
  ]);
  const regularUsers = allUsers.filter((user) => !privilegedIds.has(user.id));
  const userIds = regularUsers.map((user) => user.id);

  const { data: profiles, error: profilesError } = userIds.length
    ? await admin.from("perfil_criador").select("user_id,data,updated_at").in("user_id", userIds)
    : { data: [], error: null };
  if (profilesError) {
    console.error("Creator profiles query failed", profilesError.message);
    return respond({ error: "Could not load creator profiles" }, 503, origin);
  }
  const profileByUser = new Map((profiles || []).map((profile) => [profile.user_id, profile]));

  const filteredUsers = regularUsers.filter((account) => {
    if (!search) return true;
    const profile = profileByUser.get(account.id);
    const data = profile?.data || {};
    const searchable = [
      account.email,
      data.nome,
      data.sobrenome,
      data.nomeCompleto,
      data.nomeCriatorio,
      data.cidade,
      data.uf,
    ].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
    return searchable.includes(search);
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const total = filteredUsers.length;
  const pageUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const pageIds = pageUsers.map((user) => user.id);
  const { data: birdRows, error: birdsError } = pageIds.length
    ? await admin.from("aves").select("user_id").in("user_id", pageIds)
    : { data: [], error: null };
  if (birdsError) {
    console.error("Creator birds count query failed", birdsError.message);
    return respond({ error: "Could not load creator bird counts" }, 503, origin);
  }
  const birdCounts = new Map<string, number>();
  for (const bird of birdRows || []) {
    birdCounts.set(bird.user_id, (birdCounts.get(bird.user_id) || 0) + 1);
  }

  const result = pageUsers.map((account) => {
    const profile = profileByUser.get(account.id);
    const data = profile?.data || {};
    const bannedUntil = account.banned_until || null;
    const isBlocked = Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());
    const fullName = data.nomeCompleto || [data.nome, data.sobrenome].filter(Boolean).join(" ") || data.nome;
    return {
      userId: account.id,
      name: String(fullName || account.email || "Nome não informado"),
      creatorName: String(data.nomeCriatorio || ""),
      city: String(data.cidade || ""),
      state: String(data.uf || ""),
      email: account.email || "",
      createdAt: account.created_at,
      lastSignInAt: account.last_sign_in_at || null,
      emailConfirmed: Boolean(account.email_confirmed_at),
      blocked: isBlocked,
      blockedUntil: bannedUntil,
      birdsCount: birdCounts.get(account.id) || 0,
      profileUpdatedAt: profile?.updated_at || null,
      hasProfile: Boolean(profile),
    };
  });

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "creators_list_viewed",
    resource_type: "creator",
    metadata: { page, page_size: pageSize, search_applied: Boolean(search), result_count: result.length, total_accounts: total },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.message);
    return respond({ error: "Could not record administrative audit" }, 503, origin);
  }

  return respond({ items: result, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, 200, origin);
});
