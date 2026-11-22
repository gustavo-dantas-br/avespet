import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const origins = new Set(["https://avespet.com.br","https://www.avespet.com.br"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const headers = {"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS", ...(origin && origins.has(origin) ? {"Access-Control-Allow-Origin":origin}: {})};
  const reply = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers});
  if(origin && !origins.has(origin)) return reply({error:"Origem não autorizada"},403);
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers});
  if(req.method!=="POST") return reply({error:"Método inválido"},405);
  const token=req.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if(!token) return reply({error:"Sessão necessária"},401);
  const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!anon||!key) return reply({error:"Serviço indisponível"},503);
  const options={auth:{persistSession:false,autoRefreshToken:false}};
  const auth=createClient(url,anon,options), admin=createClient(url,key,options);
  const {data:identity,error:identityError}=await auth.auth.getUser(token);
  if(identityError||!identity.user) return reply({error:"Sessão inválida"},401);
  const actor=identity.user.id;
  const {data:role,error:roleError}=await admin.from("master_admins").select("papel").eq("user_id",actor).maybeSingle();
  if(roleError) return reply({error:"Não foi possível validar o acesso"},503);
  if(!role) return reply({error:"Acesso não autorizado"},403);
  let body;
  try { body=await req.json(); } catch { return reply({error:"Solicitação inválida"},400); }
  if(!body||typeof body!=="object"||Array.isArray(body)) return reply({error:"Solicitação inválida"},400);
  const action=body.action;
  if(action==="list"){
    const {data:rows,error}=await admin.from("master_admins").select("user_id,papel,created_at").order("created_at");
    if(error) return reply({error:"Não foi possível consultar administradores"},503);
    const users=await Promise.all((rows||[]).map(async row=>{
      const {data,error}=await admin.auth.admin.getUserById(row.user_id);
      if(error||!data.user) return null;
      return {id:row.user_id,papel:row.papel,created_at:row.created_at,email:data.user.email,last_sign_in_at:data.user.last_sign_in_at,email_confirmed_at:data.user.email_confirmed_at};
    }));
    if(users.some(x=>!x)) return reply({error:"Não foi possível confirmar todas as contas"},503);
    return reply({success:true,can_manage:role.papel==="owner",users});
  }
  if(role.papel!=="owner") return reply({error:"Somente o proprietário pode gerenciar acessos"},403);
  const latest=await admin.auth.admin.getUserById(actor);
  if(latest.error||!latest.data.user||latest.data.user.app_metadata?.must_change_password===true) return reply({error:"Conclua a verificação de sua conta"},403);
  const reason=typeof body.reason==="string"?body.reason.trim().slice(0,500):"";
  if(reason.length<8) return reply({error:"Informe um motivo com pelo menos 8 caracteres"},400);
  if(action==="invite"){
    const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
    if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email===latest.data.user.email?.toLowerCase()) return reply({error:"Informe um e-mail válido e diferente do seu"},400);
    // O Auth recusa endereços existentes; nunca recuperar uma conta existente para promovê-la.
    const {data:invited,error}=await admin.auth.admin.inviteUserByEmail(email,{redirectTo:"https://www.avespet.com.br"});
    if(error||!invited.user) return reply({error:"Convite não realizado. Verifique se a conta já existe; nenhuma promoção automática foi feita."},409);
    const {error:grantError}=await admin.rpc("master_alterar_acesso",{p_actor:actor,p_target:invited.user.id,p_grant:true,p_reason:reason});
    if(grantError) return reply({error:"Convite enviado, mas autorização não concedida. Verificação manual necessária; a conta foi preservada."},503);
    return reply({success:true,message:"Convite enviado e autorização Master registrada."});
  }
  if(action==="revoke"){
    if(typeof body.user_id!=="string"||!uuid.test(body.user_id)||body.user_id===actor) return reply({error:"Conta inválida ou protegida"},400);
    const {error}=await admin.rpc("master_alterar_acesso",{p_actor:actor,p_target:body.user_id,p_grant:false,p_reason:reason});
    if(error) return reply({error:"Não foi possível revogar a autorização"},409);
    return reply({success:true,message:"Acesso Master revogado; conta preservada."});
  }
  return reply({error:"Ação inválida"},400);
});
