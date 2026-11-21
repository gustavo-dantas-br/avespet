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


  const body = await req.json().catch(() => ({}));
  if(body?.action==="deployment_history"){
    const key=Deno.env.get("AVESPET_VERCEL_READ_TOKEN");
    if(!key)return json({error:"Integração Vercel não configurada"},503,origin);
    try{
      const endpoint=new URL("https://api.vercel.com/v6/deployments");
      endpoint.searchParams.set("teamId","team_U7fxAgYIeol47gm6WHtsGvVW");
      endpoint.searchParams.set("projectId","prj_2caK4ylyNyjy4HhrguTuR4V7xJ0j");
      endpoint.searchParams.set("limit","50");
      const response=await fetch(endpoint,{headers:{Authorization:"Bearer "+key},signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw Error("provider");
      const result=await response.json();
      if(!Array.isArray(result.deployments))throw Error("format");
      const rows=result.deployments.slice(0,50).filter((d:any)=>d.name==="avespet"&&typeof (d.uid??d.id)==="string").map((d:any)=>({
         id:d.uid??d.id,created:Number(d.created??d.createdAt)||null,
         target:d.target==="production"?"production":"preview",
         state:String(d.state??d.readyState??"UNKNOWN").slice(0,32),
         branch:String(d.meta?.githubCommitRef??"").slice(0,150),
         commit:String(d.meta?.githubCommitSha??"").slice(0,64),
         url:typeof d.url==="string"&&/^[a-z0-9-]+\.vercel\.app$/i.test(d.url)?"https://"+d.url:null
      }));
      return json({usage:{rows,more:Boolean(result.pagination?.next),collected_at:new Date().toISOString()}},200,origin);
    }catch{return json({error:"Histórico Vercel indisponível"},503,origin);}
  }
  if(body?.action==="health_usage"){
    const {data,error}=await adminClient.rpc("master_infra_health_summary",{p_actor:authData.user.id});
    if(error)return json({error:"Disponibilidade indisponível"},503,origin);
    return json({usage:data},200,origin);
  }
  if(body?.action==="traffic_usage"){
    const {data,error}=await adminClient.rpc("master_infra_traffic_summary",{p_actor:authData.user.id});
    if(error)return json({error:"Métricas de tráfego indisponíveis"},503,origin);
    return json({usage:data},200,origin);
  }
  if(body?.action==="email_usage"){
    const {data,error}=await adminClient.rpc("master_infra_email_summary",{p_actor:authData.user.id});
    if(error)return json({error:"Consumo de e-mails indisponível"},503,origin);
    return json({usage:data},200,origin);
  }
  if(body?.action==="ia_usage"){
    const {data,error}=await adminClient.rpc("master_infra_ia_summary",{p_actor:authData.user.id});
    if(error)return json({error:"Consumo IA indisponível"},503,origin);
    return json({usage:data},200,origin);
  }
  if(body?.action==="alert_settings"){
    const save=body?.save===true;
    if(save && (typeof body.recipient!=="string" || typeof body.enabled!=="boolean" || body.recipient.length>254))return json({error:"Configuração inválida"},400,origin);
    const {data,error}=await adminClient.rpc("master_infra_alert_settings",{p_actor:authData.user.id,p_recipient:save?body.recipient.trim():null,p_enabled:save?body.enabled:null});
    if(error)return json({error:"Não foi possível carregar ou salvar a configuração"},400,origin);
    return json({settings:data},200,origin);
  }
  const {data,error} = await adminClient.rpc("master_infra_snapshot",{p_refresh:body?.refresh===true});
  if(error) return json({error:"Métricas temporariamente indisponíveis"},503,origin);
  const vercelToken = Deno.env.get("AVESPET_VERCEL_READ_TOKEN");
  const githubToken = Deno.env.get("AVESPET_GITHUB_READ_TOKEN");
  const vercel = async () => {
    if(!vercelToken) return {status:"not_configured"};
    const now = Date.now(), since = now - 86400000;
    const url = new URL("https://api.vercel.com/v6/deployments");
    url.searchParams.set("teamId","team_U7fxAgYIeol47gm6WHtsGvVW");
    url.searchParams.set("since",String(since));
    url.searchParams.set("until",String(now));
    url.searchParams.set("limit","100");
    let total=0, project=0, failed=0, latest=null;
    for(let i=0;i<20;i++){
      const response=await fetch(url,{headers:{Authorization:"Bearer "+vercelToken},signal:AbortSignal.timeout(5000)});
      if(!response.ok) throw new Error("Vercel unavailable");
      const result=await response.json();
      const rows=result.deployments;
      if(!Array.isArray(rows)) throw new Error("Invalid response");
      total+=rows.length;
      for(const row of rows) if(row.name==="avespet"){
        project++; if(row.state==="ERROR") failed++;
        if(row.target==="production" && row.state==="READY" && !latest) latest={created:row.created,state:row.state};
      }
      if(!result.pagination?.next) return {status:"ok",teamDeploys24h:total,projectDeploys24h:project,failed,latest};
      url.searchParams.set("until",String(result.pagination.next));
    }
    throw new Error("Pagination limit");
  };
  const github=async()=>{
    // O repositório é público; token opcional apenas para limite maior ou futura mudança de visibilidade.
    const headers: Record<string,string> = {Accept:"application/vnd.github+json","User-Agent":"Avespet-Master-Infra"};
    if(githubToken) headers.Authorization="Bearer "+githubToken;
    const response=await fetch("https://api.github.com/repos/gustavo-dantas-br/avespet/commits/main",{headers,signal:AbortSignal.timeout(5000)});
    if(!response.ok) throw new Error("GitHub unavailable");
    const result=await response.json();
    return {status:"ok",sha:result.sha,updatedAt:result.commit?.committer?.date};
  };
  const [v,g]=await Promise.allSettled([vercel(),github()]);
  return json({...data,vercel:v.status==="fulfilled"?v.value:{status:"unavailable"},github:g.status==="fulfilled"?g.value:{status:"unavailable"}},200,origin);
});
