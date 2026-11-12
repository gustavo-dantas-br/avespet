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
function cors(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function response(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return response({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\\s+/i, "");
  if (!token) return response({ error: "Unauthorized" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return response({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Unauthorized" }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: entitlement, error: entitlementError } = await admin
    .from("master_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (entitlementError) {
    console.error("Master entitlement lookup failed", entitlementError.message);
    return response({ error: "Could not validate access" }, 503, origin);
  }
  if (!entitlement) return response({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }
  const targetId = String(body.user_id || "").trim();
  const action = String(body.action || "");
  const reason = String(body.reason || "").trim().slice(0, 500);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId)) {
    return response({ error: "Invalid user" }, 400, origin);
  }
  if (targetId === authData.user.id) return response({ error: "You cannot change your own access" }, 400, origin);
  if (action !== "block" && action !== "unblock") return response({ error: "Invalid action" }, 400, origin);
  if (action === "block" && reason.length < 8) return response({ error: "Informe um motivo com pelo menos 8 caracteres" }, 400, origin);

  const [{ data: targetMaster, error: masterError }, { data: targetLegacy, error: legacyError }] = await Promise.all([
    admin.from("master_admins").select("user_id").eq("user_id", targetId).maybeSingle(),
    admin.from("admins").select("*", { count: "exact", head: true }).eq("user_id", targetId),
  ]);
  if (masterError || legacyError) {
    console.error("Privileged target check failed", masterError?.message || legacyError?.message);
    return response({ error: "Could not validate target account" }, 503, origin);
  }
  if (targetMaster || (legacyError === null && (await admin.from("admins").select("*", { count: "exact", head: true }).eq("user_id", targetId)).count)) {
    return response({ error: "Administrative accounts cannot be managed through this action" }, 403, origin);
  }

  const { data: targetData, error: targetError } = await admin.auth.admin.getUserById(targetId);
  if (targetError || !targetData.user) return response({ error: "Creator not found" }, 404, origin);
  const target = targetData.user;
  const currentBan = target.banned_until ? new Date(target.banned_until).getTime() : 0;
  const currentlyBlocked = currentBan > Date.now();
  if (action === "block" && currentlyBlocked) return response({ error: "Account is already blocked" }, 409, origin);
  if (action === "unblock" && !currentlyBlocked) return response({ error: "Account is not blocked" }, 409, origin);

  const auditBase = {
    actor_user_id: authData.user.id,
    action: action === "block" ? "creator_account_block_requested" : "creator_account_unblock_requested",
    resource_type: "creator",
    resource_id: targetId,
    metadata: { reason, target_email: target.email || null },
  };
  const { error: beforeAuditError } = await admin.from("master_audit_log").insert(auditBase);
  if (beforeAuditError) {
    console.error("Pre-action audit failed", beforeAuditError.message);
    return response({ error: "Could not record administrative audit" }, 503, origin);
  }

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(
    targetId,
    { ban_duration: action === "block" ? "876000h" : "none" },
  );
  if (updateError) {
    console.error("Creator account update failed", updateError.message);
    await admin.from("master_audit_log").insert({
      ...auditBase,
      action: action === "block" ? "creator_account_block_failed" : "creator_account_unblock_failed",
      metadata: { reason, error: updateError.message },
    });
    return response({ error: "Could not update creator account" }, 503, origin);
  }

  const { error: afterAuditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: action === "block" ? "creator_account_blocked" : "creator_account_unblocked",
    resource_type: "creator",
    resource_id: targetId,
    metadata: { reason, target_email: updated.user?.email || target.email || null, banned_until: updated.user?.banned_until || null },
  });
  if (afterAuditError) {
    console.error("Post-action audit failed", afterAuditError.message);
    return response({ error: "Account updated, but audit confirmation failed. Contact support before repeating." }, 503, origin);
  }
  return response({ success: true, blocked: action === "block" }, 200, origin);
});
