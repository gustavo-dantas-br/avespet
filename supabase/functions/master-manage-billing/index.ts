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
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const featureKeys = [
  "basic_profile",
  "basic_bird_management",
  "basic_ads",
  "advanced_genetics",
  "reproduction_management",
  "financial_management",
  "campaigns",
  "after_sales",
] as const;

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return response({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token || token === authHeader) return response({ error: "Unauthorized" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return response({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Unauthorized" }, 401, origin);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin
    .from("master_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (masterError) return response({ error: "Could not validate administrative access" }, 503, origin);
  if (!master) return response({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }
  const action = String(body.action || "");

  if (action === "list_campaign_packages") {
    const { data, error } = await admin.from("campaign_packages").select("*").order("sort_order");
    if (error) return response({error:"Catálogo de campanhas ainda não instalado."},503,origin);
    return response({success:true,packages:data || []},200,origin);
  }
  if (action === "save_campaign_package") {
    const code = String(body.code || "");
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const reach = String(body.reach_label || "").trim();
    const price = Number(body.price_cents), media = Number(body.media_cents), days = Number(body.duration_days), radius = Number(body.radius_km);
    if (!["destaque","bairro","cidade","regional"].includes(code) || name.length<2 || name.length>80 || description.length>500 || reach.length<2 || reach.length>100 || ![price,media,days,radius].every(Number.isSafeInteger) || price<1 || price>10000000 || media<0 || media>price || days<1 || days>90 || radius<0 || radius>100) return response({error:"Revise os valores, duração e alcance."},400,origin);
    const extras: Record<string,number> = {};
    for(const key of ["media_tax_bps","operating_cents","company_tax_bps"]){ if(body[key]===undefined)continue; const n=Number(body[key]); if(!Number.isSafeInteger(n)||n<0||n>(key==="operating_cents"?10000000:10000))return response({error:"Custos ou tributos inválidos."},400,origin); extras[key]=n; }
    const values={name,description,reach_label:reach,price_cents:price,media_cents:media,duration_days:days,radius_km:radius,is_published:body.is_published===true,updated_at:new Date().toISOString(),...extras};
    const {data,error}=await admin.from("campaign_packages").update(values).eq("code",code).select("code").single();
    if(error || !data) return response({error:"Não foi possível salvar o pacote."},503,origin);
    const {error:auditError}=await admin.from("master_audit_log").insert({actor_user_id:authData.user.id,action:"campaign_package_updated",resource_type:"campaign_package",metadata:{code,...values}});
    if(auditError) return response({error:"Pacote salvo, mas auditoria não confirmada."},503,origin);
    return response({success:true},200,origin);
  }

  if (action === "list_plans") {
    const { data, error } = await admin.from("platform_plans")
      .select("id,code,name,description,price_cents,currency,billing_interval,max_birds,features,is_free,is_active,sort_order,created_at,updated_at")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) {
      console.error("Plan listing failed", error.message);
      return response({ error: "Não foi possível carregar os planos. Confirme se a migração do módulo foi aplicada ao banco." }, 503, origin);
    }
    const { error: logError } = await admin.from("master_audit_log").insert({ actor_user_id: authData.user.id, action: "platform_plans_list_viewed", resource_type: "platform_plan", metadata: { result_count: data?.length || 0 } });
    if (logError) return response({ error: "Could not record plan access" }, 503, origin);
    return response({ success: true, plans: data || [] }, 200, origin);
  }

  if (action === "save_plan") {
    const id = String(body.id || "").trim();
    if (id && !uuid.test(id)) return response({ error: "Identificador de plano inválido." }, 400, origin);
    const code = String(body.code || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 500);
    const priceCents = Number(body.price_cents);
    const interval = String(body.billing_interval || "monthly");
    const maxBirds = body.max_birds === null || body.max_birds === "" ? null : Number(body.max_birds);
    const isFree = body.is_free === true;
    const sortOrder = Number(body.sort_order || 0);
    if (!/^[a-z0-9_-]{2,40}$/.test(code)) return response({ error: "Use um código com 2 a 40 caracteres: letras minúsculas, números, hífen ou sublinhado." }, 400, origin);
    if (!name) return response({ error: "Informe o nome do plano." }, 400, origin);
    if (!Number.isSafeInteger(priceCents) || priceCents !== 0) return response({ error: "Os valores estão bloqueados em R$ 0,00 até a aprovação da precificação." }, 409, origin);
    if (!["monthly", "yearly", "one_time"].includes(interval)) return response({ error: "Periodicidade inválida." }, 400, origin);
    if (maxBirds !== null && (!Number.isSafeInteger(maxBirds) || maxBirds < 0)) return response({ error: "O limite de aves deve ser zero ou um número inteiro positivo; deixe vazio para ilimitado." }, 400, origin);
    if (!Number.isSafeInteger(sortOrder)) return response({ error: "Ordem de exibição inválida." }, 400, origin);
    if (isFree !== (code === "free")) return response({ error: "Apenas o plano de código free pode ser gratuito." }, 400, origin);
    if (code !== "free" && body.is_active === true) return response({ error: "Planos futuros permanecerão inativos até a definição dos valores." }, 409, origin);
    const incoming = body.features && typeof body.features === "object" && !Array.isArray(body.features)
      ? body.features as Record<string, unknown> : {};
    const features: Record<string, boolean> = {};
    for (const key of featureKeys) features[key] = incoming[key] === true;
    const values = {
      code, name, description, price_cents: priceCents, currency: "BRL",
      billing_interval: interval, max_birds: maxBirds, features,
      is_free: isFree, is_active: code === "free", sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    };
    const query = admin.from("platform_plans");
    const result = id
      ? await query.update(values).eq("id", id).select("id").single()
      : await query.insert(values).select("id").single();
    if (result.error) {
      console.error("Plan save failed", result.error.message);
      const duplicate = result.error.code === "23505";
      return response({ error: duplicate ? "Já existe um plano com esse código." : "Não foi possível salvar o plano. Verifique a migração e os dados informados." }, 503, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id,
      action: id ? "platform_plan_updated" : "platform_plan_created",
      resource_type: "platform_plan",
      resource_id: result.data.id,
      metadata: { code, name, price_cents: priceCents, is_active: values.is_active },
    });
    if (auditError) {
      console.error("Plan audit failed", auditError.message);
      return response({ error: "Plano salvo, mas não foi possível confirmar o registro de auditoria. Verifique o log administrativo." }, 503, origin);
    }
    return response({ success: true, id: result.data.id }, 200, origin);
  }

  return response({ error: "Invalid action" }, 400, origin);
});
