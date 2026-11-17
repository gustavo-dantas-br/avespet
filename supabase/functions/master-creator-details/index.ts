import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
  "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app",
]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  } });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405, origin);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token === authHeader) return respond({ error: "Unauthorized" }, 401, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return respond({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return respond({ error: "Unauthorized" }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin
    .from("master_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (masterError) {
    console.error("Master access lookup failed", masterError.message);
    return respond({ error: "Could not verify Master access" }, 503, origin);
  }
  if (!master) return respond({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return respond({ error: "Invalid request" }, 400, origin); }

  const targetId = String(body.user_id || "").trim();
  const action = String(body.action || "birds");
  const pageInput = Number(body.page);
  const page = Number.isFinite(pageInput)
    ? Math.min(1000, Math.max(1, Math.floor(pageInput)))
    : 1;
  const pageSize = 15;

  if (!uuid.test(targetId)) return respond({ error: "Invalid user" }, 400, origin);
  if (action !== "birds" && action !== "history") return respond({ error: "Invalid action" }, 400, origin);

  const [{ data: protectedMaster, error: protectedMasterError }, { data: protectedLegacy, error: protectedLegacyError }] = await Promise.all([
    admin.from("master_admins").select("user_id").eq("user_id", targetId).maybeSingle(),
    admin.from("admins").select("user_id").eq("user_id", targetId).maybeSingle(),
  ]);
  if (protectedMasterError || protectedLegacyError) {
    return respond({ error: "Could not validate account" }, 503, origin);
  }
  if (protectedMaster || protectedLegacy) return respond({ error: "Administrative accounts are not shown here" }, 403, origin);

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(targetId);
  if (targetError || !target.user) return respond({ error: "Account not found" }, 404, origin);

  let items: Array<Record<string, unknown>> = [];
  let total = 0;
  const first = (page - 1) * pageSize;

  if (action === "birds") {
    const { data: rows, count, error } = await admin.from("aves")
      .select("id,updated_at,data", { count: "exact" })
      .eq("user_id", targetId)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .range(first, first + pageSize - 1);
    if (error) {
      console.error("Master creator bird query failed", error.message);
      return respond({ error: "Could not load creator birds" }, 503, origin);
    }
    total = count || 0;
    items = (rows || []).map((row) => {
      const bird = row.data || {};
      // Explicit allowlist: never expose sale, buyer, supplier, health notes, photos or private data.
      return {
        id: row.id,
        name: String(bird.nome || ""),
        ring: String(bird.anilha || ""),
        species: String(bird.especie || ""),
        mutation: String(bird.corMutacao || ""),
        sex: String(bird.sexo || ""),
        status: String(bird.status || ""),
        updatedAt: row.updated_at,
      };
    });
  } else {
    const { data: rows, count, error } = await admin.from("master_audit_log")
      .select("id,action,created_at,actor_user_id,metadata", { count: "exact" })
      .eq("resource_id", targetId)
      .in("resource_type", ["account", "creator", "auth_user"])
      .neq("action", "master_creator_activity_viewed")
      .order("created_at", { ascending: false })
      .range(first, first + pageSize - 1);
    if (error) {
      console.error("Master creator history query failed", error.message);
      return respond({ error: "Could not load account history" }, 503, origin);
    }
    total = count || 0;
    items = (rows || []).map((row) => {
      const metadata = row.metadata || {};
      return {
        id: row.id,
        action: String(row.action || "unknown"),
        createdAt: row.created_at,
        performedBy: row.actor_user_id === authData.user.id ? "Você" : "Outro administrador",
        reason: typeof metadata.reason === "string" ? metadata.reason.slice(0, 250) : null,
      };
    });
  }

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "master_creator_activity_viewed",
    resource_type: "account",
    resource_id: targetId,
    metadata: { section: action, page, page_size: pageSize, result_count: items.length, total },
  });
  if (auditError) {
    console.error("Master creator activity audit failed", auditError.message);
    return respond({ error: "Could not record administrative access" }, 503, origin);
  }

  return respond({ items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }, 200, origin);
});
