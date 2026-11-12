import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
  "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app",
]);

// Inclui URLs únicas de Preview do projeto, sem aceitar outros projetos Vercel.
function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  try {
    const hostname = new URL(origin).hostname;
    return /^avespet-[a-z0-9]+-gustavo-dantas\\.vercel\\.app$/.test(hostname);
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
  if (origin && allowedOrigins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
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

  // Validar o JWT com Auth antes de consultar qualquer dado administrativo.
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401, origin);

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // A lista Master é a única fonte de autorização para este painel.
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
  for (const table of tables) {
    const { count, error } = await adminClient
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("Master dashboard count failed", { table, message: error.message });
      return json({ error: "Could not load platform summary" }, 503, origin);
    }
    counts[table] = count || 0;
  }

  const { error: auditError } = await adminClient.from("master_audit_log").insert({
    actor_user_id: authData.user.id,
    action: "dashboard_summary_viewed",
    resource_type: "platform",
    metadata: { counts },
  });
  if (auditError) {
    console.error("Master audit insert failed", auditError.message);
    return json({ error: "Could not record administrative audit" }, 503, origin);
  }

  return json({ counts }, 200, origin);
});
