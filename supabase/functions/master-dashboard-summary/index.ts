import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
  "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return hostname.startsWith("avespet-") && hostname.endsWith("-gustavo-dantas.vercel.app");
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && isAllowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const originAllowed = isAllowedOrigin(origin);

  if (req.method === "OPTIONS") {
    return originAllowed
      ? new Response("ok", { headers: corsHeaders(origin) })
      : new Response("Origin not allowed", { status: 403, headers: corsHeaders(null) });
  }
  if (!originAllowed) return json({ error: "Origin not allowed" }, 403, origin);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return json({ error: "Unauthorized" }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration error" }, 503, origin);

  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401, origin);

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: entitlement, error: entitlementError } = await adminClient
    .from("master_admins")
    .select("user_id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (entitlementError) {
    console.error("Master entitlement lookup failed", entitlementError.message);
    return json({ error: "Could not validate access" }, 503, origin);
  }
  if (!entitlement) return json({ error: "Forbidden" }, 403, origin);


  // A consulta agregada substitui 13 requisições REST por uma só.
  // Contagem Auth segue pelo Admin API e ocorre em paralelo.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 13);
  since.setUTCHours(0, 0, 0, 0);
  const sinceDate = since.toISOString().slice(0, 10);

  const authCount = async () => {
    let total = 0;
    for (let page = 1; page <= 100; page += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error("Falha ao consultar a contagem de usuários");
      total += data.users.length;
      if (data.users.length < 1000) return total;
    }
    throw new Error("Limite seguro de paginação excedido");
  };

  const [statsResult, usersResult] = await Promise.allSettled([
    adminClient.rpc("master_dashboard_stats", { p_since: sinceDate }),
    authCount(),
  ]);
  if (statsResult.status !== "fulfilled" || statsResult.value.error || !statsResult.value.data) {
    console.error("Master dashboard aggregated stats unavailable",
      statsResult.status === "fulfilled" ? statsResult.value.error?.code : "rpc_rejected");
    return json({ error: "Could not load platform summary" }, 503, origin);
  }
  if (usersResult.status !== "fulfilled") {
    console.error("Master dashboard Auth count failed");
    return json({ error: "Could not load account total" }, 503, origin);
  }

  const result = statsResult.value.data as Record<string, unknown>;
  const rawCounts = result.counts as Record<string, unknown> || {};
  const counts = {
    admins: Number(rawCounts.admins || 0),
    perfil_criador: Number(rawCounts.perfil_criador || 0),
    aves: Number(rawCounts.aves || 0),
    anuncios: Number(rawCounts.anuncios || 0),
    anuncios_aves_perdidas: Number(rawCounts.anuncios_aves_perdidas || 0),
    auth_users: usersResult.value,
  };

  const visitMap = new Map<string, number>();
  for (const row of (Array.isArray(result.visits) ? result.visits : []) as Array<{ dia: string, total: number }>) {
    visitMap.set(String(row.dia), Number(row.total || 0));
  }
  const visits = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return { date, total: visitMap.get(date) || 0 };
  });
  const statuses = (record: unknown, statuses: Array<[string, string]>) => {
    const data = (record || {}) as Record<string, unknown>;
    return statuses.map(([key, label]) => ({ status: label, total: Number(data[key] || 0) }));
  };
  const analytics = {
    visits,
    totalVisits: visits.reduce((sum, day) => sum + day.total, 0),
    adsByStatus: statuses(result.adsByStatus, [
      ["pendente", "Pendente"], ["aprovado", "Aprovado"], ["rejeitado", "Rejeitado"],
    ]),
    lostAdsByStatus: statuses(result.lostAdsByStatus, [
      ["pendente", "Pendente"], ["aprovado", "Aprovado"], ["rejeitado", "Rejeitado"],
      ["encerrado", "Encerrado"], ["reencontrado", "Reencontrado"],
    ]),
  };

  const { error: auditError } = await adminClient.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "dashboard_summary_viewed",
    resource_type: "platform",
    metadata: { counts, analytics: { totalVisits: analytics.totalVisits } },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.code);
    return json({ error: "Could not record administrative audit" }, 503, origin);
  }

  return json({ counts, analytics }, 200, origin);
});
