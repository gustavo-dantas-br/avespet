import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const origins=new Set(["https://www.avespet.com.br","https://avespet.com.br"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowed=(origin:string|null)=>{
 if(!origin||origins.has(origin))return true;
 try {const u=new URL(origin);return u.protocol==="https:"&&u.hostname.startsWith("avespet-")&&u.hostname.endsWith("-gustavo-dantas.vercel.app");}catch{return false;}
};
const respond=(body:unknown,status:number,origin:string|null)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json","Cache-Control":"no-store",
 "Access-Control-Allow-Methods":"POST,OPTIONS",
 "Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info",
 ...(origin&&allowed(origin)?{"Access-Control-Allow-Origin":origin}:{})}
});
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin");
 if(!allowed(origin))return respond({error:"Origem inválida."},403,origin);
 if(req.method==="OPTIONS")return respond({ok:true},200,origin);
 if(req.method!=="POST")return respond({error:"Método inválido."},405,origin);
 const token=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!token||!url||!anon||!service)return respond({error:"Sessão ou configuração ausente."},401,origin);
 const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:identityError}=await client.auth.getUser(token);
 if(identityError||!identity.user)return respond({error:"Sessão inválida."},401,origin);
 const db=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:master,error:masterError}=await db.from("master_admins").select("user_id").eq("user_id",identity.user.id).maybeSingle();
 if(masterError||!master)return respond({error:"Acesso exclusivo ao Master."},403,origin);
 let body:any={};try {body=await req.json();}catch{return respond({error:"Dados inválidos."},400,origin);}
 if(body.action==="list"){
  const {data:rows,error}=await db.from("ave_perdida_reencontros")
   .select("anuncio_id,data_reencontro,relato,nota,autoriza_publicacao,aprovado_publicacao,confirmado_em")
   .order("confirmado_em",{ascending:false}).limit(50);
  if(error)return respond({error:"Falha ao consultar os reencontros."},503,origin);
  const ids=(rows||[]).map(x=>x.anuncio_id);
  let ads:any[]=[];
  if(ids.length){
   const r=await db.from("anuncios_aves_perdidas").select("id,status,data").in("id",ids);
   if(r.error)return respond({error:"Falha ao consultar os anúncios."},503,origin);
   ads=r.data||[];
  }
  const names=new Map(ads.map(x=>[x.id,{name:String(x.data?.nomeAve||"Ave sem nome").slice(0,80),status:x.status,especie:String(x.data?.especie||"").slice(0,80)}]));
  return respond({success:true,items:(rows||[]).filter(x=>names.has(x.anuncio_id)).map(x=>({
    anuncio_id:x.anuncio_id,data_reencontro:x.data_reencontro,relato:x.relato,nota:x.nota,
    autorizado:x.autoriza_publicacao,aprovado:x.aprovado_publicacao,confirmado_em:x.confirmado_em,
    ...names.get(x.anuncio_id)
  }))},200,origin);
 }
 if(body.action==="confirm"){
  const id=String(body.anuncio_id||"");
  const recoveryDate=String(body.date||"");
  const note=String(body.note||"").trim();
  if(!uuid.test(id)||!/^\\d{4}-\\d{2}-\\d{2}$/.test(recoveryDate)||
     note.length<15||note.length>500)return respond({error:"Informe data válida e confirmação do tutor (15–500 caracteres)."},400,origin);
  const {error:auditError}=await db.from("master_audit_log").insert({
    actor_user_id:identity.user.id,action:"master_reunion_confirmation_requested",
    resource_type:"lost_bird_ad",resource_id:id,
    metadata:{confirmation_received:true,date:recoveryDate,source:"tutor"}
  });
  if(auditError)return respond({error:"Não foi possível auditar a operação."},503,origin);
  const {error:rpcError}=await db.rpc("master_confirmar_reencontro_ave_perdida",{
    p_anuncio_id:id,p_data_reencontro:recoveryDate,p_observacao:note,p_admin_id:identity.user.id
  });
  if(rpcError)return respond({error:"Não foi possível confirmar. Verifique a data, o anúncio e a origem da confirmação."},409,origin);
  return respond({success:true,status:"reencontrado"},200,origin);
 }
 if(body.action==="review"){
  const id=String(body.anuncio_id||"");
  const approved=body.approve;
  if(!uuid.test(id)||typeof approved!=="boolean")return respond({error:"Dados inválidos."},400,origin);
  const {data:record,error:recordError}=await db.from("ave_perdida_reencontros")
    .select("anuncio_id,autoriza_publicacao,relato,nota,aprovado_publicacao")
    .eq("anuncio_id",id).maybeSingle();
  if(recordError||!record)return respond({error:"Reencontro não encontrado."},404,origin);
  if(approved && (!record.autoriza_publicacao || (!record.relato.trim() && record.nota===null)))
    return respond({error:"O tutor não autorizou ou não enviou uma avaliação para publicação."},409,origin);
  const {data:ad,error:adError}=await db.from("anuncios_aves_perdidas").select("status").eq("id",id).maybeSingle();
  if(adError||ad?.status!=="reencontrado")return respond({error:"O anúncio não está como reencontrado."},409,origin);
  const {error:auditError}=await db.from("master_audit_log").insert({
   actor_user_id:identity.user.id,action:"reunion_review_requested",
   resource_type:"lost_bird_ad",resource_id:id,
   metadata:{publish:approved}
  });
  if(auditError)return respond({error:"Não foi possível auditar a revisão."},503,origin);
  const {data:updated,error:updateError}=await db.from("ave_perdida_reencontros")
   .update({aprovado_publicacao:approved,aprovado_em:approved?new Date().toISOString():null,
     aprovado_por:approved?identity.user.id:null,atualizado_em:new Date().toISOString()})
   .eq("anuncio_id",id).eq("autoriza_publicacao",true)
   .select("anuncio_id").maybeSingle();
  if(updateError||!updated)return respond({error:"Não foi possível registrar a revisão."},409,origin);
  return respond({success:true,aprovado:approved},200,origin);
 }
 return respond({error:"Ação não permitida."},400,origin);
});
