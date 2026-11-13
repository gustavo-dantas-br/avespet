import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins=new Set(["https://avespet.com.br","https://www.avespet.com.br","https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app"]);
function allowedOrigin(origin:string|null){if(!origin||allowedOrigins.has(origin))return true;try{const host=new URL(origin).hostname;return host.startsWith("avespet-")&&host.endsWith("-gustavo-dantas.vercel.app");}catch{return false;}}
function reply(body:unknown,status:number,origin:string|null){const headers:Record<string,string>={"Content-Type":"application/json","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};if(origin&&allowedOrigin(origin))headers["Access-Control-Allow-Origin"]=origin;return new Response(JSON.stringify(body),{status,headers});}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const featureKeys=["basic_profile","basic_bird_management","basic_ads","advanced_genetics","reproduction_management","financial_management","campaigns","after_sales"] as const;

Deno.serve(async(req)=>{
 const origin=req.headers.get("Origin");if(!allowedOrigin(origin))return reply({error:"Origin not allowed"},403,null);
 if(req.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Origin":origin||"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405,origin);
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!token||!url||!anon||!service)return reply({error:"Unauthorized or server configuration error"},401,origin);
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token);
 if(authError||!authData.user)return reply({error:"Unauthorized"},401,origin);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:master,error:masterError}=await admin.from("master_admins").select("user_id").eq("user_id",authData.user.id).maybeSingle();
 if(masterError)return reply({error:"Could not validate administrative access"},503,origin);
 if(!master)return reply({error:"Forbidden"},403,origin);
 let body:Record<string,unknown>;try{body=await req.json();}catch{return reply({error:"Invalid request"},400,origin);}
 const action=String(body.action||"");

 if(action==="search_creators"){
  const search=String(body.search||"").trim().slice(0,100).toLocaleLowerCase("pt-BR");
  if(search.length<2)return reply({success:true,creators:[]},200,origin);
  const accounts:any[]=[];
  for(let page=1;page<=100;page++){const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});if(error)return reply({error:"Falha ao pesquisar contas."},503,origin);accounts.push(...data.users);if(data.users.length<1000)break;}
  const [{data:masters,error:me},{data:admins,error:ae}]=await Promise.all([admin.from("master_admins").select("user_id"),admin.from("admins").select("user_id")]);
  if(me||ae)return reply({error:"Falha ao validar contas administrativas."},503,origin);
  const excluded=new Set([...(masters||[]).map(x=>x.user_id),...(admins||[]).map(x=>x.user_id)]);
  const users=accounts.filter(x=>!excluded.has(x.id)),profiles=new Map<string,any>();
  for(let i=0;i<users.length;i+=500){const {data,error}=await admin.from("perfil_criador").select("user_id,data").in("user_id",users.slice(i,i+500).map(x=>x.id));if(error)return reply({error:"Falha ao consultar perfis."},503,origin);for(const p of data||[])profiles.set(p.user_id,p.data||{});}
  const creators=users.map(u=>{const p=profiles.get(u.id)||{};return {user_id:u.id,name:String(p.nomeCompleto||[p.nome,p.sobrenome].filter(Boolean).join(" ")||u.user_metadata?.name||"Nome não informado"),business:String(p.nomeCriatorio||""),email:u.email||""};}).filter(x=>[x.name,x.business,x.email].join(" ").toLocaleLowerCase("pt-BR").includes(search)).slice(0,30);
  return reply({success:true,creators},200,origin);
 }

 if(action==="list"){
  const userId=String(body.user_id||"");if(!uuid.test(userId))return reply({error:"Criador inválido."},400,origin);
  const [{data:override,error:oe},{data:subscription,error:se}]=await Promise.all([
   admin.from("creator_entitlement_overrides").select("*").eq("user_id",userId).maybeSingle(),
   admin.from("creator_subscriptions").select("id,status,starts_at,ends_at,plan:platform_plans(id,code,name,features,max_birds,is_free)").eq("user_id",userId).in("status",["active","trialing","past_due"]).order("created_at",{ascending:false}).limit(1).maybeSingle()
  ]);
  if(oe||se)return reply({error:"Não foi possível consultar as permissões atuais."},503,origin);
  return reply({success:true,override,subscription},200,origin);
 }

 if(action==="save"){
  const userId=String(body.user_id||"");if(!uuid.test(userId))return reply({error:"Criador inválido."},400,origin);
  const [{data:user,error:ue},{data:masterTarget,error:me},{data:adminTarget,error:ae}]=await Promise.all([
   admin.auth.admin.getUserById(userId),admin.from("master_admins").select("user_id").eq("user_id",userId).maybeSingle(),admin.from("admins").select("user_id").eq("user_id",userId).maybeSingle()
  ]);
  if(ue||!user?.user)return reply({error:"Criador não encontrado."},404,origin);
  if(me||ae)return reply({error:"Não foi possível validar a conta."},503,origin);
  if(masterTarget||adminTarget)return reply({error:"Não é permitido conceder exceções a contas administrativas."},400,origin);
  const maxBirds=body.max_birds_override===null||body.max_birds_override===""||body.max_birds_override===undefined?null:Number(body.max_birds_override);
  const unlimited=body.unlimited_birds_override===true;
  if(maxBirds!==null&&(!Number.isSafeInteger(maxBirds)||maxBirds<0))return reply({error:"Informe um limite inteiro igual ou maior que zero."},400,origin);
  if(unlimited&&maxBirds!==null)return reply({error:"Limite ilimitado não pode ser combinado com um limite numérico."},400,origin);
  const raw=body.feature_overrides&&typeof body.feature_overrides==="object"&&!Array.isArray(body.feature_overrides)?body.feature_overrides as Record<string,unknown>:{};
  const featureOverrides:Record<string,boolean>={};
  for(const [key,value] of Object.entries(raw)){if(!featureKeys.includes(key as typeof featureKeys[number])||typeof value!=="boolean")return reply({error:"Permissão inválida."},400,origin);featureOverrides[key]=value;}
  const note=String(body.note||"").trim().slice(0,500);
  if(!note)return reply({error:"Informe o motivo da liberação ou restrição."},400,origin);
  const expiresAt=body.expires_at?new Date(String(body.expires_at)):null;
  if(expiresAt&&Number.isNaN(expiresAt.getTime()))return reply({error:"Data de expiração inválida."},400,origin);
  const {data:existing,error:existingError}=await admin.from("creator_entitlement_overrides").select("id").eq("user_id",userId).maybeSingle();
  if(existingError)return reply({error:"Falha ao verificar exceção atual."},503,origin);
  const payload={user_id:userId,max_birds_override:maxBirds,unlimited_birds_override:unlimited,feature_overrides:featureOverrides,note,expires_at:expiresAt?.toISOString()||null,updated_by:authData.user.id,...(!existing?{created_by:authData.user.id}:{})};
  const {data:saved,error:saveError}=await admin.from("creator_entitlement_overrides").upsert(payload,{onConflict:"user_id"}).select("*").single();
  if(saveError)return reply({error:"Não foi possível salvar as permissões especiais. Confirme se a migração está aplicada."},503,origin);
  const {error:auditError}=await admin.from("master_audit_log").insert({actor_user_id:authData.user.id,action:"creator_entitlements_overridden",resource_type:"creator_entitlement_override",resource_id:saved.id,metadata:{creator_user_id:userId,max_birds_override:maxBirds,unlimited_birds_override:unlimited,feature_overrides:featureOverrides,note,expires_at:payload.expires_at}});
  if(auditError)return reply({error:"Permissões salvas, mas a auditoria não foi confirmada."},503,origin);
  return reply({success:true,override:saved},200,origin);
 }

 if(action==="clear"){
  const userId=String(body.user_id||"");if(!uuid.test(userId))return reply({error:"Criador inválido."},400,origin);
  const {data:existing,error}=await admin.from("creator_entitlement_overrides").select("id").eq("user_id",userId).maybeSingle();
  if(error)return reply({error:"Falha ao consultar exceção."},503,origin);
  if(existing){const {error:deleteError}=await admin.from("creator_entitlement_overrides").delete().eq("user_id",userId);if(deleteError)return reply({error:"Não foi possível remover a exceção."},503,origin);
   const {error:auditError}=await admin.from("master_audit_log").insert({actor_user_id:authData.user.id,action:"creator_entitlements_cleared",resource_type:"creator_entitlement_override",resource_id:existing.id,metadata:{creator_user_id:userId}});
   if(auditError)return reply({error:"Exceção removida, mas auditoria não confirmada."},503,origin);
  }
  return reply({success:true},200,origin);
 }
 return reply({error:"Invalid action"},400,origin);
});
