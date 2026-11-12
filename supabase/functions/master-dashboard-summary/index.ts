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
  const token = authorization.replace(/^Bearer\\s+/i, "");
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

  const tables = ["admins", "perfil_criador", "aves", "anuncios", "anuncios_aves_perdidas"];
  const counts: Record<string, number> = {};
  const countResults = await Promise.all(tables.map((table) =>
    adminClient.from(table).select("*", { count: "exact", head: true })
  ));
  for (let index = 0; index < tables.length; index += 1) {
    if (countResults[index].error) {
      console.error("Master dashboard count failed", {
        table: tables[index],
        message: countResults[index].error?.message,
      });
      return json({ error: "Could not load platform summary" }, 503, origin);
    }
    counts[tables[index]] = countResults[index].count || 0;
  }

  // Agregados anônimos para os gráficos; nenhum dado pessoal é enviado ao cliente.
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 13);
  since.setUTCHours(0, 0, 0, 0);
  const sinceDate = since.toISOString().slice(0, 10);
  const [visitsResult, usersResult, adsPending, adsApproved, adsRejected, lostPending, lostApproved, lostRejected, lostClosed] = await Promise.all([
    adminClient.from("visitas_diarias").select("dia,total").gte("dia", sinceDate).order("dia", { ascending: true }),
    adminClient.from("auth.users").select("id", { count: "exact", head: true }),
    adminClient.from("anuncios").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    adminClient.from("anuncios").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
    adminClient.from("anuncios").select("*", { count: "exact", head: true }).eq("status", "rejeitado"),
    adminClient.from("anuncios_aves_perdidas").select("*", { count: "exact", head: true }).eq("status", "pendente"),
    adminClient.from("anuncios_aves_perdidas").select("*", { count: "exact", head: true }).eq("status", "aprovado"),
    adminClient.from("anuncios_aves_perdidas").select("*", { count: "exact", head: true }).eq("status", "rejeitado"),
    adminClient.from("anuncios_aves_perdidas").select("*", { count: "exact", head: true }).eq("status", "encerrado"),
  ]);

  const analyticsResults = [visitsResult, adsPending, adsApproved, adsRejected, lostPending, lostApproved, lostRejected, lostClosed];
  if (analyticsResults.some((result) => result.error)) {
    console.error("Master dashboard analytics failed", analyticsResults.filter((result) => result.error).map((result) => result.error?.message));
    return json({ error: "Could not load platform analytics" }, 503, origin);
  }

  const visitMap = new Map<string, number>();
  for (const row of visitsResult.data || []) {
    const day = String(row.dia);
    visitMap.set(day, (visitMap.get(day) || 0) + Number(row.total || 0));
  }
  const visits = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + index);
    const date = day.toISOString().slice(0, 10);
    return { date, total: visitMap.get(date) || 0 };
  });

  const analytics = {
    visits,
    totalVisits: visits.reduce((sum, day) => sum + day.total, 0),
    adsByStatus: [
      { status: "Pendente", total: adsPending.count || 0 },
      { status: "Aprovado", total: adsApproved.count || 0 },
      { status: "Rejeitado", total: adsRejected.count || 0 },
    ],
    lostAdsByStatus: [
      { status: "Pendente", total: lostPending.count || 0 },
      { status: "Aprovado", total: lostApproved.count || 0 },
      { status: "Rejeitado", total: lostRejected.count || 0 },
      { status: "Encerrado", total: lostClosed.count || 0 },
    ],
  };

  const { error: auditError } = await adminClient.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "dashboard_summary_viewed",
    resource_type: "platform",
    metadata: { counts, analytics: { totalVisits: analytics.totalVisits } },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.message);
    return json({ error: "Could not record administrative audit" }, 503, origin);
  }

  return json({ counts, analytics }, 200, origin);
});
