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
  } catch {
    return false;
  }
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
  const token = authorization.replace(/^Bearer\s+/i, "");
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

  const action = String(body.action || "list");
  if (action === "list") {
    const page = Math.max(1, Math.min(500, Math.floor(Number(body.page) || 1)));
    const pageSize = 20;
    const status = String(body.status || "todos");
    const allowedStatuses = ["todos", "pendente", "aprovado", "rejeitado"];
    if (!allowedStatuses.includes(status)) return respond({ error: "Invalid status filter" }, 400, origin);

    let query = admin.from("anuncios")
      .select("id,user_id,ave_id,ativo,status,data,visualizacoes,cliques", { count: "exact" })
      .order("id", { ascending: false });
    if (status !== "todos") query = query.eq("status", status);
    const { data: ads, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) {
      console.error("Master ads query failed", error.message);
      return respond({ error: "Could not load ads" }, 503, origin);
    }

    const userIds = [...new Set((ads || []).map((ad) => ad.user_id).filter(Boolean))];
    const profiles = new Map<string, Record<string, unknown>>();
    if (userIds.length) {
      const { data, error: profileError } = await admin.from("perfil_criador")
        .select("user_id,data").in("user_id", userIds);
      if (profileError) {
        console.error("Master ad profiles query failed", profileError.message);
        return respond({ error: "Could not load creator profiles" }, 503, origin);
      }
      for (const profile of data || []) profiles.set(profile.user_id, profile.data || {});
    }

    const items = (ads || []).map((ad) => ({
      id: ad.id,
      userId: ad.user_id,
      aveId: ad.ave_id,
      ativo: ad.ativo,
      status: ad.status || "pendente",
      data: ad.data || {},
      visualizacoes: ad.visualizacoes || 0,
      cliques: ad.cliques || 0,
      criador: profiles.get(ad.user_id) || {},
    }));

    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id,
      action: "master_ads_list_viewed",
      resource_type: "ad",
      metadata: { page, page_size: pageSize, status_filter: status, result_count: items.length, total: count || 0 },
    });
    if (auditError) {
      console.error("Master ads audit failed", auditError.message);
      return respond({ error: "Could not record administrative audit" }, 503, origin);
    }

    return respond({ items, total: count || 0, page, pageSize, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)) }, 200, origin);
  }

  if (action === "moderate") {
    const id = String(body.ad_id || "").trim();
    const status = String(body.status || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!/^[0-9a-f-]{36}$/i.test(id)) return respond({ error: "Invalid ad" }, 400, origin);
    if (!["pendente", "aprovado", "rejeitado"].includes(status)) return respond({ error: "Invalid status" }, 400, origin);

    const { data: current, error: readError } = await admin.from("anuncios")
      .select("id,user_id,status").eq("id", id).maybeSingle();
    if (readError) return respond({ error: "Could not load ad" }, 503, origin);
    if (!current) return respond({ error: "Ad not found" }, 404, origin);
    if (current.status === status) return respond({ error: "Ad already has this status" }, 409, origin);

    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id,
      action: "master_ad_moderation_requested",
      resource_type: "ad",
      resource_id: id,
      metadata: { previous_status: current.status || "pendente", new_status: status, reason, owner_user_id: current.user_id },
    });
    if (auditError) {
      console.error("Master ad moderation audit failed", auditError.message);
      return respond({ error: "Could not record administrative audit" }, 503, origin);
    }

    const update = { status };
    const { error: updateError } = await admin.from("anuncios").update(update).eq("id", id);
    if (updateError) {
      console.error("Master ad moderation update failed", updateError.message);
      return respond({ error: "Could not update ad status" }, 503, origin);
    }
    return respond({ success: true, id, status }, 200, origin);
  }

  return respond({ error: "Invalid action" }, 400, origin);
});
