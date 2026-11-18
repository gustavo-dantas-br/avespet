import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const origins=new Set(["https://www.avespet.com.br","https://avespet.com.br"]);
function allow(origin:string|null) {
  if(!origin || origins.has(origin)) return true;
  try {const u=new URL(origin); return u.protocol==="https:"&&u.hostname.startsWith("avespet-")&&u.hostname.endsWith("-gustavo-dantas.vercel.app");}
  catch{return false;}
}
const respond=(data:unknown,status=200,origin:string|null=null)=>new Response(JSON.stringify(data),{
  status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",
    "Access-Control-Allow-Headers":"authorization,apikey,x-client-info,content-type",
    "Access-Control-Allow-Methods":"POST,OPTIONS","Vary":"Origin",
    ...(origin&&allow(origin)?{"Access-Control-Allow-Origin":origin}:{})},
});
const ms=(s:unknown)=>{const n=Date.parse(String(s||"")); return Number.isFinite(n)?n:0;};
const short=(s:unknown,n=120)=>String(s||"").slice(0,n);
const mask=(value:string)=>{
  const [local,domain]=value.split("@");
  if(!local||!domain) return "E-mail privado";
  return local.slice(0,2)+"***@"+domain;
};
const sameEpisode=(rows:any[],episode:string)=>rows.some(r=>r.episode_at===episode);
const newestAttempt=(rows:any[])=>rows.reduce((max,r)=>Math.max(max,ms(r.created_at)),0);

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get("Origin");
  if(!allow(origin))return respond({error:"Origem não autorizada."},403,null);
  if(req.method==="OPTIONS")return respond({ok:true},200,origin);
  if(req.method!=="POST")return respond({error:"Método inválido."},405,origin);
  const authorization=req.headers.get("Authorization")||"";
  const token=authorization.replace(/^Bearer\s+/i,"");
  if(!token||token===authorization)return respond({error:"Sessão obrigatória."},401,origin);
  const url=Deno.env.get("SUPABASE_URL"),publicKey=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!publicKey||!service)return respond({error:"Serviço indisponível."},503,origin);
  const auth=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:identity,error:authError}=await auth.auth.getUser(token);
  if(authError||!identity.user)return respond({error:"Sessão inválida."},401,origin);
  const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:master,error:masterError}=await db.from("master_admins").select("user_id").eq("user_id",identity.user.id).maybeSingle();
  if(masterError)return respond({error:"Não foi possível verificar permissões."},503,origin);
  if(!master)return respond({error:"Acesso exclusivo ao Master."},403,origin);
  let body:any;
  try {const raw=await req.text(); if(raw.length>2000)throw Error("large"); body=JSON.parse(raw); if(!body||typeof body!=="object"||Array.isArray(body))throw Error("invalid");}
  catch{return respond({error:"Requisição inválida."},400,origin);}
  const action=short(body.action,40);
  if(action==="settings"){
    const enabled=body.enabled;
    const inactivity=body.min_inactive_days;
    const cooldown=body.cooldown_days;
    const limit=body.max_per_day;
    if(typeof enabled!=="boolean"||!Number.isInteger(inactivity)||inactivity<5||inactivity>90||
      !Number.isInteger(cooldown)||cooldown<14||cooldown>90||
      !Number.isInteger(limit)||limit<1||limit>50) {
      return respond({error:"Configurações inválidas."},400,origin);
    }
    const next={enabled,min_inactive_days:inactivity,cooldown_days:cooldown,max_per_day:limit};
    const {error:auditError}=await db.from("master_audit_log").insert({
      actor_user_id:identity.user.id,action:"master_email_automation_settings_requested",
      resource_type:"email_automation",metadata:next
    });
    if(auditError)return respond({error:"Não foi possível auditar esta alteração."},503,origin);
    const {data:updated,error:updateError}=await db.from("email_reengagement_settings")
      .update({...next,updated_at:new Date().toISOString()}).eq("singleton",true)
      .select("enabled,min_inactive_days,cooldown_days,max_per_day,updated_at").single();
    if(updateError)return respond({error:"Não foi possível salvar as regras."},503,origin);
    const {error:completedError}=await db.from("master_audit_log").insert({
      actor_user_id:identity.user.id,action:"master_email_automation_settings_saved",
      resource_type:"email_automation",metadata:next
    });
    return respond({success:true,settings:updated,audit_warning:Boolean(completedError)},200,origin);
  }
  if(action!=="overview")return respond({error:"Ação não suportada."},400,origin);
  const [settings,subs,sends,guides,byStatus]=await Promise.all([
    db.from("email_reengagement_settings")
      .select("enabled,min_inactive_days,cooldown_days,max_per_day,updated_at").eq("singleton",true).maybeSingle(),
    db.from("email_news_preferences").select("user_id,consented_at",{count:"exact"})
      .eq("opted_in",true).order("consented_at",{ascending:false}).limit(50),
    db.from("email_reengagement_delivery").select("id,user_id,episode_at,status,topic,article_slug,failure_reason,created_at,sent_at")
      .order("created_at",{ascending:false}).limit(200),
    db.from("artigos").select("slug,titulo,especie,categoria,publicado_em")
      .eq("publicado",true).order("publicado_em",{ascending:false}).limit(30),
    Promise.all(["sent","failed","uncertain","processing"].map(async(status)=>{
      const q=await db.from("email_reengagement_delivery").select("id",{count:"exact",head:true}).eq("status",status);
      return {status,count:q.count||0,error:q.error};
    })),
  ]);
  if(settings.error||subs.error||sends.error||guides.error||byStatus.some(r=>r.error)){
    return respond({error:"Não foi possível consultar a automação."},503,origin);
  }
  const setting=settings.data;
  if(!setting)return respond({error:"Rotina ainda não configurada."},503,origin);
  const {count:unsubscribed,error:unsubError}=await db.from("email_news_preferences").select("user_id",{count:"exact",head:true}).eq("opted_in",false);
  if(unsubError)return respond({error:"Não foi possível consultar descadastros."},503,origin);
  const ids=(subs.data||[]).map(s=>s.user_id);
  let activity:any[]=[];
  if(ids.length){
    const q=await db.from("email_user_activity").select("user_id,last_seen_at").in("user_id",ids);
    if(q.error)return respond({error:"Falha na consulta de atividades."},503,origin);
    activity=q.data||[];
  }
  const recentByUser=new Map<string,any[]>();
  for(const item of sends.data||[])recentByUser.set(item.user_id,[...(recentByUser.get(item.user_id)||[]),item]);
  const lastSeen=new Map(activity.map(a=>[a.user_id,a.last_seen_at]));
  const now=Date.now();
  const slots:any[]=[];
  for(const consent of subs.data||[]){
    const r=await db.auth.admin.getUserById(consent.user_id);
    const user=r.data?.user;
    if(r.error||!user)continue;
    const last=Math.max(ms(user.last_sign_in_at),ms(lastSeen.get(consent.user_id)),ms(consent.consented_at),ms(user.created_at));
    const history=recentByUser.get(consent.user_id)||[];
    const episode=last?new Date(last).toISOString():"";
    let next=Math.max(last+setting.min_inactive_days*86400000,newestAttempt(history)+setting.cooldown_days*86400000);
    if(!Number.isFinite(next)||next<=0)next=0;
    const alreadyAttempted=episode?sameEpisode(history,episode):false;
    slots.push({
      id:short(user.id,36),email:mask(String(user.email||"")),last_seen_at:last?new Date(last).toISOString():null,
      next_eligible_at:next&&!alreadyAttempted?new Date(next).toISOString():null,
      status:!user.email_confirmed_at?"email_pendente":alreadyAttempted?"ja_contatado":
        next<=now?"elegivel":"previsto",
    });
  }
  const nextSevenDays=slots.filter(s=>s.next_eligible_at&&ms(s.next_eligible_at)<=now+7*86400000).length;
  const totalAccepted=(byStatus.find(x=>x.status==="sent")?.count||0);
  const acceptedLast30=(sends.data||[]).filter(x=>x.status==="sent"&&ms(x.created_at)>=now-30*86400000).length;
  return respond({success:true,
    settings:setting,
    subscribers:{active:subs.count||0,opted_out:unsubscribed||0,preview:slots,partial:(subs.count||0)>slots.length},
    delivery:{totalAccepted,acceptedLast30,counts:Object.fromEntries(byStatus.map(x=>[x.status,x.count])),recent:sends.data||[],partial:(sends.data||[]).length===200},
    guides:guides.data||[],
    forecasts:{nextSevenDays,eligibleNow:slots.filter(x=>x.status==="elegivel").length,estimated:true},
    schedule:{daily_local_time:"11:00",timezone:"America/Sao_Paulo"},
    note:"Aceito pelo Resend não confirma entrega, leitura ou cliques. Próximos envios são previsões condicionadas a consentimento e atividade."},
  200,origin);
});
