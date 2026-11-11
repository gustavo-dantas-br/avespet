import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server configuration error" }, 503);

  // Validar o JWT com Auth antes de consultar qualquer dado administrativo.
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);

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
    return json({ error: "Could not validate access" }, 503);
  }
  if (!entitlement) return json({ error: "Forbidden" }, 403);

  const tables = ["admins", "perfil_criador", "aves", "anuncios", "anuncios_aves_perdidas"];
  const counts: Record<string, number> = {};
  for (const table of tables) {
    const { count, error } = await adminClient
      .from(table)
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("Master dashboard count failed", { table, message: error.message });
      return json({ error: "Could not load platform summary" }, 503);
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
    return json({ error: "Could not record administrative audit" }, 503);
  }

  return json({ counts });
});
