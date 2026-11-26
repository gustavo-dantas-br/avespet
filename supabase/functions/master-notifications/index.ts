import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const allowed=(o:string|null)=>{if(!o)return true;if(["https://avespet.com.br","https://www.avespet.com.br"].includes(o))return true;try{const h=new URL(o).hostname;return h.startsWith("avespet-")&&h.endsWith("-gustavo-dantas.vercel.app")}catch{return false}};
const response=(data:unknown,status:number,o:string|null)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin",...(o&&allowed(o)?{"Access-Control-Allow-Origin":o}:{})}});
const list=(v:unknown):any[]=>Array.isArray(v)?v:[];
const str=(v:unknown,n=200)=>String(v??"").trim().slice(0,n);
const date=(v:unknown)=>typeof v==="string"&&!Number.isNaN(Date.parse(v))?v:new Date().toISOString();
Deno.serve(async req=>{
 const origin=req.headers.get("Origin");
 if(!allowed(origin))return response({error:"Origem não autorizada."},403,null);
 if(req.method==="OPTIONS")return new Response("ok",{headers:{"Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin",...(origin?{"Access-Control-Allow-Origin":origin}:{})}});
 if(req.method!=="POST")return response({error:"Método inválido."},405,origin);
 const bearer=req.headers.get("Authorization")||"",token=bearer.replace(/^Bearer\s+/i,"");
 if(!token||token===bearer)return response({error:"Sessão obrigatória."},401,origin);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!key)return response({error:"Configuração indisponível."},503,origin);
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:userData,error:userError}=await auth.auth.getUser(token);
 if(userError||!userData.user)return response({error:"Sessão inválida."},401,origin);
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:master,error:masterError}=await db.from("master_admins").select("user_id").eq("user_id",userData.user.id).maybeSingle();
 if(masterError)return response({error:"Falha ao validar acesso Master."},503,origin);
 if(!master)return response({error:"Acesso exclusivo Master."},403,origin);
 let body:any;try{const raw=await req.text();if(raw.length>3000)throw 0;body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=="object")throw 0}catch{return response({error:"Requisição inválida."},400,origin)}
 const action=str(body.action,20);
 try{
  if(action==="mark_read"||action==="archive"){
   const id=str(body.id,40);if(!/^[0-9a-f-]{36}$/i.test(id))return response({error:"Identificador inválido."},400,origin);
   const {error}=await db.from("master_notifications").update(action==="mark_read"?{read_at:new Date().toISOString()}:{archived_at:new Date().toISOString()}).eq("id",id);
   if(error)throw error;
  }else if(action!=="list")return response({error:"Ação inválida."},400,origin);
  if(action==="list"){
   const since=new Date(Date.now()-30*86400000).toISOString(),pending:any[]=[];
   const [events,cases,ads,lost,infra]=await Promise.all([
    db.from("master_support_events").select("id,event_type,summary,created_at").gte("created_at",since).eq("event_type","email_received"),
    db.from("master_support_cases").select("id,priority,created_at").eq("status","aguardando").gte("created_at",since),
    db.from("anuncios").select("id,criado_em").eq("status","pendente").gte("criado_em",since),
    db.from("anuncios_aves_perdidas").select("id,created_at").eq("status","pendente").gte("created_at",since),
    db.schema("avespet_infra").from("alert_outbox").select("id,metric,level,pct,status,created_at").in("status",["pending","failed","uncertain"]).gte("created_at",since)
   ]);
   for(const x of [events,cases,ads,lost,infra])if(x.error)throw x.error;
   for(const e of list(events.data))pending.push({source_key:"support:event:"+e.id,category:e.event_type==="email_received"?"email":"support",title:e.event_type==="email_received"?"Nova resposta recebida":"Novo registro no suporte",message:str(e.summary),priority:"normal",target_section:e.event_type==="email_received"?"communications":"support",source_created_at:date(e.created_at)});
   for(const c of list(cases.data))pending.push({source_key:"support:case:"+c.id,category:"support",title:"Atendimento aguardando triagem",message:"Há um caso novo na fila de suporte.",priority:c.priority==="urgente"?"critical":c.priority==="alta"?"high":"normal",target_section:"support",source_created_at:date(c.created_at)});
   for(const a of list(ads.data))pending.push({source_key:"moderation:ad:"+a.id,category:"moderation",title:"Anúncio aguardando aprovação",message:"Um anúncio de ave está pendente de análise.",priority:"normal",target_section:"ads",source_created_at:date(a.criado_em)});
   for(const a of list(lost.data))pending.push({source_key:"moderation:lost:"+a.id,category:"moderation",title:"Ave perdida aguardando análise",message:"Um anúncio de ave perdida está pendente de análise.",priority:"high",target_section:"lost-birds",source_created_at:date(a.created_at)});
   for(const a of list(infra.data))pending.push({source_key:"infra:"+a.id,category:"infrastructure",title:"Alerta de infraestrutura",message:str(a.metric,80)+" · "+Number(a.pct).toFixed(1)+"% · "+str(a.status,20),priority:Number(a.level)>=3?"critical":Number(a.level)>=2?"high":"normal",target_section:"infrastructure",source_created_at:date(a.created_at)});
   // Consulta somente leitura das caixas do Resend; não abre mensagens, não altera status e não envia e-mails.
   const resendKey=Deno.env.get("RESEND_INBOX_API_KEY");
   if(resendKey){
    try{
     const inboxResponse=await fetch("https://api.resend.com/inboxes?limit=100",{headers:{Authorization:"Bearer "+resendKey},signal:AbortSignal.timeout(6500)});
     if(inboxResponse.ok){
      const inboxData=await inboxResponse.json();
      for(const address of ["suporte@avespet.com.br","financeiro@avespet.com.br"]){
       const inbox=list(inboxData?.data).find((item:any)=>str(item.email_address,254).toLowerCase()===address);
       const unread=Number(inbox?.unread)||0,last=str(inbox?.last_received,50);
       if(unread>0)pending.push({source_key:"email:inbox:"+address+":"+(last||String(unread)),category:"email",title:"E-mails não lidos · "+(address.startsWith("suporte")?"Suporte":"Financeiro"),message:unread+" conversa(s) não lida(s) na caixa "+address+".",priority:"high",target_section:"communications",source_created_at:date(last)});
      }
     }
    }catch(error){console.error("Resend inbox count unavailable",error instanceof Error?error.message:"unknown")}
   }
   if(pending.length){const {error}=await db.from("master_notifications").upsert(pending,{onConflict:"source_key",ignoreDuplicates:true});if(error)throw error}
  }
  const {data,error}=await db.from("master_notifications").select("id,category,title,message,priority,target_section,source_created_at,read_at,archived_at,created_at").is("archived_at",null).order("source_created_at",{ascending:false}).limit(60);
  if(error)throw error;
  const items=list(data);return response({success:true,items,unread_count:items.filter(x=>!x.read_at).length},200,origin);
 }catch(e){console.error("master-notifications",e instanceof Error?e.message:"unknown");return response({error:"Não foi possível carregar as notificações."},503,origin)}
});
