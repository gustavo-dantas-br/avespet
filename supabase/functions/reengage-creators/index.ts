import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Disparo educativo opcional, agendado no Supabase. Não é chamado pelo navegador.
// Respeita consentimento registrado, email confirmado, 5 dias sem atividade e
// um envio por episódio de ausência com intervalo mínimo de 30 dias.
const SITE = "https://www.avespet.com.br";
const SENDER = "Avespet Novidades <novidades@avespet.com.br>";
const PROJECT = Deno.env.get("SUPABASE_URL") || "";
const LINK_PREFIX = PROJECT + "/functions/v1/reengagement-unsubscribe?token=";
const topics = {
  ringneck: {
    subject: "Ring Neck: cuidados e novidades para seu criatório",
    heading: "Uma dica útil para quem cuida de Ring Necks",
    tip: "Além de espaço adequado, Ring Necks precisam de oportunidades diárias de enriquecimento ambiental, brinquedos seguros e uma rotina que permita explorar, descansar e interagir. Para alimentação e saúde, procure orientação de um veterinário especializado em aves.",
  },
  calopsita: {
    subject: "Calopsitas: bem-estar e novidades no Avespet",
    heading: "Uma dica útil para quem cuida de calopsitas",
    tip: "Calopsitas se beneficiam de rotina previsível, descanso adequado, brinquedos seguros e observação de mudanças de comportamento. Dificuldade para respirar ou falta de apetite exigem avaliação veterinária.",
  },
  geral: {
    subject: "Novidades do Avespet para você",
    heading: "Seu espaço no Avespet continua disponível",
    tip: "Acompanhe nossos guias de cuidados com aves, atualize seus cadastros e conheça ferramentas para organizar seu criatório. Informações educativas não substituem a orientação de um veterinário especializado.",
  },
};
type Topic = keyof typeof topics;
const emailOk = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const fmtDate = (value: unknown) => {
  const date = Date.parse(String(value || ""));
  return Number.isFinite(date) ? date : 0;
};
const response = (data: object, status = 200) => new Response(JSON.stringify(data), {
  status, headers: {"Content-Type":"application/json","Cache-Control":"no-store"},
});
const digest = async (s: string) => {
  const bytes = new TextEncoder().encode(s);
  const bytesHash = await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(bytesHash)).map(v=>v.toString(16).padStart(2,"0")).join("");
};
const escapeHtml = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
function render(topic:Topic, url:string) {
  const t=topics[topic];
  const text=[
    "Olá!", "", t.heading, "", t.tip, "",
    "Veja os guias do Avespet: "+SITE+"/guias",
    "Acesse seu painel: "+SITE+"/", "",
    "Você recebeu esta mensagem porque escolheu receber novidades do Avespet.",
    "Para cancelar: "+url, "",
    "Equipe Avespet",
  ].join("\n");
  const html='<div style="font-family:Arial,sans-serif;line-height:1.7;max-width:600px;margin:auto;color:#253d2b">'+
    '<h1 style="color:#237448;font-size:26px">Avespet</h1>'+
    '<p>Olá!</p><h2>'+escapeHtml(t.heading)+'</h2><p>'+escapeHtml(t.tip)+'</p>'+
    '<p><a href="'+SITE+'/guias">Explorar guias e novidades</a> · <a href="'+SITE+'/">Abrir meu painel</a></p>'+
    '<p style="font-size:12px;color:#67736c;border-top:1px solid #e5e5e5;padding-top:16px">'+
    'Você recebeu este conteúdo porque autorizou e-mails educativos do Avespet. '+
    '<a href="'+url+'">Cancelar inscrição</a>.</p></div>';
  return {text,html};
}
function topicFor(birds: Array<{data?:{especie?:unknown}}>):Topic {
  const species=birds.map(b=>String(b.data?.especie||"").toLowerCase());
  if (species.some(s=>s.includes("ring")||s.includes("psittacula"))) return "ringneck";
  if (species.some(s=>s.includes("calops")||s.includes("nymphicus"))) return "calopsita";
  return "geral";
}
Deno.serve(async (req:Request) => {
  if (req.method !== "POST") return response({error:"Método não permitido."},405);
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url||!key) return response({error:"Configuração indisponível."},503);
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:config,error:settingsError}=await admin.from("email_reengagement_settings")
    .select("enabled,min_inactive_days,cooldown_days,max_per_day,scheduler_sha256").eq("singleton",true).maybeSingle();
  if (settingsError||!config) return response({error:"Agendamento não configurado."},503);
  const provided=req.headers.get("x-avespet-scheduler")||"";
  if (!/^[a-f0-9]{64}$/.test(provided) ||
      (await digest(provided)) !== config.scheduler_sha256) return response({error:"Não autorizado."},401);
  if (!config.enabled) return response({success:true,enabled:false,sent:0});
  const resendKey=Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return response({error:"Provedor indisponível."},503);
  const {data:consents,error:consentError}=await admin.from("email_news_preferences")
    .select("user_id,consented_at,unsubscribe_token").eq("opted_in",true).limit(500);
  if (consentError) return response({error:"Falha na consulta de preferências."},503);
  if (!consents?.length) return response({success:true,enabled:true,eligible:0,sent:0});
  const allIds=consents.map((c:any)=>c.user_id);
  const [act,birds,used]=await Promise.all([
    admin.from("email_user_activity").select("user_id,last_seen_at").in("user_id",allIds),
    admin.from("aves").select("user_id,data").in("user_id",allIds).limit(3000),
    admin.from("email_reengagement_delivery").select("user_id,episode_at,status,created_at")
      .in("user_id",allIds).order("created_at",{ascending:false}).limit(1000),
  ]);
  if (act.error||birds.error||used.error) return response({error:"Falha no controle de envios."},503);
  const activity=new Map((act.data||[]).map((a:any)=>[a.user_id,a.last_seen_at]));
  const species=new Map<string,any[]>();
  for(const b of birds.data||[]) species.set(b.user_id,[...(species.get(b.user_id)||[]),b]);
  const past=new Map<string,any[]>();
  for(const row of used.data||[]) past.set(row.user_id,[...(past.get(row.user_id)||[]),row]);
  const now=Date.now();
  const today=new Date().toISOString().slice(0,10)+"T00:00:00.000Z";
  const {count:todayCount,error:countError}=await admin.from("email_reengagement_delivery")
    .select("id",{head:true,count:"exact"}).gte("created_at",today);
  if(countError) return response({error:"Falha na contagem diária."},503);
  let remaining=Math.max(0,config.max_per_day-(todayCount||0));
  let eligible=0,sent=0,skipped=0,uncertain=0;
  for(const consent of consents) {
    if(remaining<=0) break;
    const {data:found,error:userError}=await admin.auth.admin.getUserById(consent.user_id);
    if(userError||!found?.user?.email_confirmed_at||!emailOk.test(found.user.email||"")){skipped++;continue;}
    const user=found.user;
    const last=Math.max(fmtDate(user.last_sign_in_at),fmtDate(activity.get(user.id)),fmtDate(consent.consented_at),fmtDate(user.created_at));
    if(!last||now-last<config.min_inactive_days*86400000){skipped++;continue;}
    const episode=new Date(last).toISOString();
    const recent=past.get(user.id)||[];
    if(recent.some(r=>r.episode_at===episode) ||
       recent.some(r=>now-fmtDate(r.created_at)<config.cooldown_days*86400000)){skipped++;continue;}
    eligible++;
    const topic=topicFor(species.get(user.id)||[]);
    // Claim durável ANTES de chamar o Resend; um erro ambíguo não gera envio duplicado.
    const claim=await admin.from("email_reengagement_delivery")
      .insert({user_id:user.id,episode_at:episode,status:"processing",topic}).select("id").single();
    if(claim.error){if(claim.error.code!=="23505")console.error("Reengagement claim failed",claim.error.code);continue;}
    remaining--;
    const unsubscribe=LINK_PREFIX+consent.unsubscribe_token;
    const mail=render(topic,unsubscribe);
    try {
      // Revalida o consentimento, inclusive se houver um cancelamento durante o processamento.
      const latest=await admin.from("email_news_preferences")
        .select("opted_in").eq("user_id",user.id).maybeSingle();
      if(latest.error||!latest.data?.opted_in){
        await admin.from("email_reengagement_delivery").update({status:"failed",failure_reason:"opted_out"}).eq("id",claim.data.id);
        continue;
      }
      const r=await fetch("https://api.resend.com/emails",{
        method:"POST",
        headers:{
          Authorization:"Bearer "+resendKey,
          "Content-Type":"application/json",
          "Idempotency-Key":"avespet-reactivate-"+user.id+"-"+episode.slice(0,10),
        },
        body:JSON.stringify({
          from:SENDER,to:[user.email],reply_to:"suporte@avespet.com.br",
          subject:topics[topic].subject,text:mail.text,html:mail.html,
          headers:{"List-Unsubscribe":"<"+unsubscribe+">","List-Unsubscribe-Post":"List-Unsubscribe=One-Click"},
        }),
        signal:AbortSignal.timeout(12000),
      });
      if(!r.ok) {
        await admin.from("email_reengagement_delivery").update({status:"failed",failure_reason:"provider_"+r.status}).eq("id",claim.data.id);
        continue;
      }
      const json=await r.json().catch(()=>({}));
      await admin.from("email_reengagement_delivery").update({
        status:"sent",provider_id:String(json?.id||"").slice(0,100)||null,sent_at:new Date().toISOString(),
      }).eq("id",claim.data.id);
      sent++;
    } catch {
      await admin.from("email_reengagement_delivery").update({status:"uncertain",failure_reason:"network_or_response_unknown"}).eq("id",claim.data.id);
      uncertain++;
    }
  }
  return response({success:true,enabled:true,eligible,sent,skipped,uncertain});
});
