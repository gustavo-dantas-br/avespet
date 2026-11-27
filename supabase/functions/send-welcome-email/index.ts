import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const inbox = "suporte@avespet.com.br";
const site = "https://www.avespet.com.br";
const emailRe = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: corsHeaders,
});
const safe = (v: unknown, max = 100) => typeof v === "string" ? v.trim().slice(0, max) : "";
const esc = (v: string) => v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({error:"Método não permitido."},405);
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i,"").trim();
  if (!token) return reply({error:"Sessão não autorizada."},401);
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), resend = Deno.env.get("RESEND_API_KEY");
  if (!url || !anon || !service || !resend) return reply({error:"Configuração incompleta."},503);
  const auth = createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:identity,error:identityError}=await auth.auth.getUser(token);
  if(identityError || !identity.user) return reply({error:"Sessão inválida."},401);
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:account,error:accountError}=await admin.auth.admin.getUserById(identity.user.id);
  if(accountError || !account.user) return reply({error:"Conta não localizada."},404);
  const user=account.user;
  const email=safe(user.email,254).toLowerCase();
  if(!user.email_confirmed_at || !emailRe.test(email)) return reply({error:"O e-mail ainda não foi confirmado."},403);
  if(user.user_metadata?.avespet_welcome_pending !== true) return reply({success:true,skipped:true,reason:"not_pending"});
  const {data:existing,error:readError}=await admin.from("email_welcome_delivery").select("status,provider_id").eq("user_id",user.id).maybeSingle();
  if(readError) return reply({error:"Não foi possível consultar o histórico."},503);
  let attemptTimestamp: string;
  if(existing) {
    // Só repetimos quando o Resend recusou explicitamente o envio.
    // Estados processing/uncertain nunca são reenviados automaticamente para evitar duplicidade.
    if(existing.status !== "failed") {
      if(existing.status === "sent" && user.user_metadata?.avespet_welcome_pending === true) {
        await admin.auth.admin.updateUserById(user.id,{user_metadata:{...user.user_metadata,avespet_welcome_pending:false}});
      }
      return reply({success:true,already_processed:true,status:existing.status});
    }
    attemptTimestamp = new Date().toISOString();
    const {data:retry,error:retryError}=await admin.from("email_welcome_delivery")
      .update({status:"processing",failure_reason:null,updated_at:attemptTimestamp})
      .eq("user_id",user.id).eq("status","failed").select("updated_at").maybeSingle();
    if(retryError) return reply({error:"Não foi possível preparar uma nova tentativa."},503);
    if(!retry) return reply({success:true,already_processed:true,status:"processing"});
    attemptTimestamp = retry.updated_at;
  } else {
    attemptTimestamp = new Date().toISOString();
    const {error:claimError}=await admin.from("email_welcome_delivery")
      .insert({user_id:user.id,email,status:"processing",created_at:attemptTimestamp,updated_at:attemptTimestamp});
    if(claimError) {
      if(claimError.code==="23505") return reply({success:true,already_processed:true});
      return reply({error:"Não foi possível registrar o envio."},503);
    }
  }
  const name=safe(user.user_metadata?.nome || user.user_metadata?.nomeCompleto,80).split(/\s+/)[0] || "Olá";
  const greeting=name==="Olá" ? "Olá!" : "Olá, "+name+"!";
  const subject="Bem-vindo ao Avespet! Sua jornada começa aqui 🦜";
  const text=[greeting,"","Sua conta Avespet está confirmada! Agora você pode organizar seu plantel, acompanhar reprodução, registrar informações das aves e acessar as ferramentas disponíveis para criadores.","","Comece pelo seu painel e complete seu perfil: "+site,"","Conte com a equipe Avespet quando precisar de ajuda.","","Equipe Avespet | "+inbox].join("\n");
  const html='<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f5f8f4;color:#23342c;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:16px;border:1px solid #e3eae4"><h1 style="color:#26764b">Bem-vindo ao Avespet! 🦜</h1><p>'+esc(greeting)+'</p><p>Sua conta Avespet está confirmada! Agora você pode organizar seu plantel, acompanhar reprodução, registrar informações das aves e acessar as ferramentas disponíveis para criadores.</p><p><a href="'+site+'" style="display:inline-block;background:#247346;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Acessar o Avespet</a></p><p>Conte com a equipe Avespet quando precisar de ajuda.</p><p style="font-size:13px;color:#5b6b60">Equipe Avespet<br><a href="mailto:'+inbox+'">'+inbox+'</a></p></div></body></html>';
  let remote:Response;
  try {
    remote=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json","Idempotency-Key":"avespet-welcome-"+user.id+"-"+new Date(attemptTimestamp).getTime()},body:JSON.stringify({from:"Avespet <"+inbox+">",to:[email],reply_to:inbox,subject,text,html})});
  } catch {
    await admin.from("email_welcome_delivery").update({status:"uncertain",failure_reason:"network_error",updated_at:new Date().toISOString()}).eq("user_id",user.id);
    return reply({success:false,status:"uncertain"},503);
  }
  if(!remote.ok) {
    // Respostas 5xx podem ter resultado incerto no provedor; não tentar novamente automaticamente.
    const failureStatus = remote.status >= 500 ? "uncertain" : "failed";
    await admin.from("email_welcome_delivery").update({status:failureStatus,failure_reason:"provider_"+remote.status,updated_at:new Date().toISOString()}).eq("user_id",user.id);
    return reply({success:false,status:failureStatus},502);
  }
  const provider=await remote.json().catch(()=>({}));
  await admin.from("email_welcome_delivery").update({status:"sent",provider_id:safe(provider?.id,120)||null,sent_at:new Date().toISOString(),updated_at:new Date().toISOString(),failure_reason:null}).eq("user_id",user.id);
  await admin.auth.admin.updateUserById(user.id,{user_metadata:{...user.user_metadata,avespet_welcome_pending:false}});
  return reply({success:true,status:"sent"});
});
