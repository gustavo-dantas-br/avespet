import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
function headers(origin: string | null) {
  const h: Record<string,string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && isAllowedOrigin(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers(origin), "Content-Type":"application/json" } });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return reply({ error:"Origin not allowed" },403,origin);
  if (req.method === "OPTIONS") return new Response("ok",{headers:headers(origin)});
  if (req.method !== "POST") return reply({error:"Method not allowed"},405,origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i,"");
  if (!token || token === authorization) return reply({error:"Unauthorized"},401,origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return reply({error:"Server configuration error"},503,origin);

  const authClient = createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError} = await authClient.auth.getUser(token);
  const actor = authData.user;
  if (authError || !actor) return reply({error:"Unauthorized"},401,origin);

  // Somente a conta administrativa já validada do projeto pode iniciar o bootstrap.
  if ((actor.email || "").toLowerCase() !== "gustavosvaio@yahoo.com.br") {
    return reply({error:"Forbidden"},403,origin);
  }
  const admin = createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:adminRow,error:adminError} = await admin.from("admins").select("user_id").eq("user_id",actor.id).maybeSingle();
  if (adminError) return reply({error:"Could not validate administrator"},503,origin);
  if (!adminRow) return reply({error:"Forbidden"},403,origin);

  const targetEmail = "gustavosvaio@gmail.com";
  const {data:existing,error:lookupError} = await admin.auth.admin.listUsers({page:1,perPage:1000});
  if (lookupError) return reply({error:"Could not verify target account"},503,origin);
  if (existing.users.some((u) => (u.email || "").toLowerCase() === targetEmail)) {
    return reply({error:"A conta de destino já existe no Auth. Nenhuma permissão foi alterada; é necessária uma verificação manual antes de continuar."},409,origin);
  }

  const {data:inviteData,error:inviteError} = await admin.auth.admin.inviteUserByEmail(targetEmail,{
    redirectTo:"https://avespet.com.br",
    data:{account_type:"platform_master"},
  });
  if (inviteError || !inviteData.user) {
    console.error("Master invite failed",inviteError?.message);
    return reply({error:"Não foi possível enviar o convite. Nenhuma permissão Master foi concedida."},502,origin);
  }

  const {error:grantError} = await admin.from("master_admins").insert({user_id:inviteData.user.id});
  if (grantError) {
    console.error("Master grant failed",grantError.message);
    return reply({error:"Convite enviado, mas a permissão não foi registrada. A equipe precisa reconciliar o convite antes do primeiro acesso."},503,origin);
  }

  const {error:auditError} = await admin.from("master_audit_log").insert({
    actor_user_id:actor.id,
    action:"master_invitation_created",
    resource_type:"auth_user",
    resource_id:inviteData.user.id,
    metadata:{target_email:targetEmail},
  });
  if (auditError) {
    console.error("Master invite audit failed",auditError.message);
    const { error: rollbackError } = await admin.from("master_admins").delete().eq("user_id",inviteData.user.id);
    if (rollbackError) console.error("Master grant rollback failed",rollbackError.message);
    return reply({error: rollbackError
      ? "Falha na auditoria e no rollback da permissão. Acesso requer intervenção imediata."
      : "O convite foi enviado, mas a auditoria falhou; a permissão Master foi removida. Corrija a auditoria antes de tentar novamente."},503,origin);
  }

  return reply({success:true,email:targetEmail,message:"Convite enviado. A conta receberá o link do Supabase Auth."},200,origin);
});
