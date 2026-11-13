import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const origins = new Set(["https://avespet.com.br", "https://www.avespet.com.br", "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app"]);
function originAllowed(value: string | null) {
  if (!value || origins.has(value)) return true;
  try { const host = new URL(value).hostname; return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app"); } catch { return false; }
}
function reply(body: unknown, status: number, origin: string | null) {
  const headers: Record<string,string> = { "Content-Type":"application/json", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS", "Vary":"Origin" };
  if (origin && originAllowed(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!originAllowed(origin)) return reply({error:"Origin not allowed"},403,null);
  if (req.method === "OPTIONS") return new Response("ok",{headers:{"Access-Control-Allow-Origin":origin || "*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
  if (req.method !== "POST") return reply({error:"Method not allowed"},405,origin);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i,"");
  const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !url || !anon || !service) return reply({error:"Unauthorized or server configuration error"},401,origin);
  const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:authData,error:authError}=await auth.auth.getUser(token);
  if(authError || !authData.user) return reply({error:"Unauthorized"},401,origin);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:master,error:masterError}=await admin.from("master_admins").select("user_id").eq("user_id",authData.user.id).maybeSingle();
  if(masterError) return reply({error:"Could not validate administrative access"},503,origin);
  if(!master) return reply({error:"Forbidden"},403,origin);
  let body:Record<string,unknown>; try{body=await req.json();}catch{return reply({error:"Invalid request"},400,origin);}
  const action=String(body.action || "");

  if(action==="list") {
    const {data:subs,error}=await admin.from("creator_subscriptions").select("id,user_id,plan_id,status,starts_at,ends_at,canceled_at,created_at,updated_at").order("created_at",{ascending:false}).limit(500);
    if(error) return reply({error:"Não foi possível carregar assinaturas. Verifique se a migração do módulo foi aplicada."},503,origin);
    const planIds=[...new Set((subs||[]).map(x=>x.plan_id))], userIds=[...new Set((subs||[]).map(x=>x.user_id))];
    const [{data:plans,error:pe},{data:users,error:ue}]=await Promise.all([
      planIds.length?admin.from("platform_plans").select("id,code,name,price_cents,billing_interval,max_birds,is_active").in("id",planIds):Promise.resolve({data:[],error:null}),
      admin.auth.admin.listUsers({page:1,perPage:1000})
    ]);
    if(pe||ue) return reply({error:"Falha ao consultar dados de planos ou contas."},503,origin);
    const planMap=new Map((plans||[]).map(x=>[x.id,x])), userMap=new Map((users?.users||[]).map(x=>[x.id,x]));
    const profileMap=new Map<string,any>();
    for(let i=0;i<userIds.length;i+=500){
      const {data,error:profileError}=await admin.from("perfil_criador").select("user_id,data").in("user_id",userIds.slice(i,i+500));
      if(profileError) return reply({error:"Falha ao consultar perfis dos criadores."},503,origin);
      for(const p of data||[]) profileMap.set(p.user_id,p.data||{});
    }
    const items=(subs||[]).map(s=>{
      const u=userMap.get(s.user_id), p=profileMap.get(s.user_id)||{};
      return {...s,creator_name:String(p.nomeCompleto||[p.nome,p.sobrenome].filter(Boolean).join(" ")||u?.user_metadata?.name||"Nome não informado"),creator_business:String(p.nomeCriatorio||""),email:u?.email||"Conta não localizada",plan:planMap.get(s.plan_id)||null};
    });
    return reply({success:true,subscriptions:items},200,origin);
  }

  if(action==="search_creators") {
    const search=String(body.search||"").trim().slice(0,100).toLocaleLowerCase("pt-BR");
    if(search.length<2) return reply({success:true,creators:[]},200,origin);
    const accounts:any[]=[];
    for(let page=1;page<=100;page++){
      const {data,error}=await admin.auth.admin.listUsers({page,perPage:1000});
      if(error) return reply({error:"Não foi possível pesquisar criadores."},503,origin);
      accounts.push(...data.users); if(data.users.length<1000) break;
    }
    const [{data:masters,error:me},{data:admins,error:ae}]=await Promise.all([admin.from("master_admins").select("user_id"),admin.from("admins").select("user_id")]);
    if(me||ae) return reply({error:"Não foi possível validar contas administrativas."},503,origin);
    const excluded=new Set([...(masters||[]).map(x=>x.user_id),...(admins||[]).map(x=>x.user_id)]);
    const candidates=accounts.filter(x=>!excluded.has(x.id)), profiles=new Map<string,any>();
    for(let i=0;i<candidates.length;i+=500){
      const {data,error}=await admin.from("perfil_criador").select("user_id,data").in("user_id",candidates.slice(i,i+500).map(x=>x.id));
      if(error) return reply({error:"Não foi possível pesquisar perfis."},503,origin);
      for(const p of data||[]) profiles.set(p.user_id,p.data||{});
    }
    const creators=candidates.map(u=>{const p=profiles.get(u.id)||{};return {userId:u.id,name:String(p.nomeCompleto||[p.nome,p.sobrenome].filter(Boolean).join(" ")||u.user_metadata?.name||"Nome não informado"),business:String(p.nomeCriatorio||""),email:u.email||""};})
      .filter(x=>[x.name,x.business,x.email].join(" ").toLocaleLowerCase("pt-BR").includes(search)).slice(0,30);
    return reply({success:true,creators},200,origin);
  }

  if(action==="assign") {
    const userId=String(body.user_id||""), planId=String(body.plan_id||""), status=String(body.status||"active");
    const starts=body.starts_at?new Date(String(body.starts_at)):new Date(), ends=body.ends_at?new Date(String(body.ends_at)):null;
    if(!uuid.test(userId)||!uuid.test(planId)||!["active","trialing"].includes(status)) return reply({error:"Selecione criador, plano e situação válidos."},400,origin);
    if(Number.isNaN(starts.getTime())||(ends&&(Number.isNaN(ends.getTime())||ends<=starts))) return reply({error:"Confira as datas da assinatura."},400,origin);
    const [{data:user,error:ue},{data:plan,error:pe}]=await Promise.all([admin.auth.admin.getUserById(userId),admin.from("platform_plans").select("id,code,name,is_active").eq("id",planId).maybeSingle()]);
    if(ue||!user?.user) return reply({error:"Criador não encontrado."},404,origin);
    if(pe||!plan||!plan.is_active) return reply({error:"Plano inexistente ou inativo."},400,origin);
    const {data:current,error:ce}=await admin.from("creator_subscriptions").select("id").eq("user_id",userId).in("status",["active","trialing","past_due"]);
    if(ce) return reply({error:"Não foi possível verificar a assinatura atual."},503,origin);
    if(current?.length){
      const {error:closeError}=await admin.from("creator_subscriptions").update({status:"canceled",canceled_at:new Date().toISOString(),updated_at:new Date().toISOString()}).in("id",current.map(x=>x.id));
      if(closeError) return reply({error:"Não foi possível encerrar a assinatura anterior; a nova não foi criada."},503,origin);
    }
    const {data:created,error}=await admin.from("creator_subscriptions").insert({user_id:userId,plan_id:planId,status,starts_at:starts.toISOString(),ends_at:ends?.toISOString()||null}).select("id").single();
    if(error) return reply({error:"Falha ao atribuir o plano."},503,origin);
    const {error:auditError}=await admin.from("master_audit_log").insert({actor_user_id:authData.user.id,action:"creator_subscription_assigned",resource_type:"creator_subscription",resource_id:created.id,metadata:{creator_user_id:userId,plan_id:planId,plan_code:plan.code,plan_name:plan.name,status}});
    if(auditError) return reply({error:"Assinatura criada, mas auditoria não confirmada."},503,origin);
    return reply({success:true,subscription_id:created.id},200,origin);
  }

  if(action==="change_status") {
    const id=String(body.id||""), status=String(body.status||"");
    if(!uuid.test(id)||!["active","past_due","canceled","expired"].includes(status)) return reply({error:"Situação inválida."},400,origin);
    const {data:updated,error}=await admin.from("creator_subscriptions").update({status,canceled_at:status==="canceled"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",id).select("id,user_id,plan_id,status").single();
    if(error||!updated) return reply({error:"Não foi possível atualizar a assinatura."},503,origin);
    const {error:auditError}=await admin.from("master_audit_log").insert({actor_user_id:authData.user.id,action:"creator_subscription_status_changed",resource_type:"creator_subscription",resource_id:id,metadata:{creator_user_id:updated.user_id,plan_id:updated.plan_id,status}});
    if(auditError) return reply({error:"Situação alterada, mas auditoria não confirmada."},503,origin);
    return reply({success:true},200,origin);
  }
  return reply({error:"Invalid action"},400,origin);
});
