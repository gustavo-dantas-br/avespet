import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function page(title:string,text:string,buttonToken="") {
  const form=buttonToken ? '<form method="POST"><input type="hidden" name="token" value="'+buttonToken+'"><button type="submit" style="border:0;background:#20714b;color:white;border-radius:10px;padding:12px 18px;font-weight:700;cursor:pointer">Cancelar inscrição</button></form>' : "";
  return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' · Avespet</title><body style="font-family:Arial,sans-serif;max-width:520px;margin:12vh auto;padding:20px;color:#283d31"><h1>Avespet</h1><h2>'+title+'</h2><p>'+text+'</p>'+form+'<p><a href="https://www.avespet.com.br">Voltar ao site</a></p></body></html>',{
    status:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"},
  });
}
Deno.serve(async(req:Request)=>{
  if(req.method!=="GET"&&req.method!=="POST")return new Response("Método inválido",{status:405});
  const url=new URL(req.url);
  let token=url.searchParams.get("token")||"";
  if(req.method==="POST"&&!token) {
    try{const body=await req.formData();token=String(body.get("token")||"");}catch{return page("Link inválido","O link de cancelamento não foi reconhecido.");}
  }
  if(!uuid.test(token))return page("Link inválido","Confira o link que chegou no seu e-mail.");
  if(req.method==="GET")return page("Cancelar novidades","Confirme abaixo se deseja deixar de receber dicas e novidades por e-mail. Avisos importantes sobre sua conta continuam disponíveis.",token);
  const project=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!project||!secret)return page("Serviço indisponível","Tente novamente mais tarde.");
  const admin=createClient(project,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await admin.from("email_news_preferences")
    .update({opted_in:false,opted_out_at:new Date().toISOString(),updated_at:new Date().toISOString()})
    .eq("unsubscribe_token",token);
  if(error)return page("Serviço indisponível","Não foi possível salvar o cancelamento. Tente novamente.");
  return page("Inscrição cancelada","Você não receberá mais dicas e novidades por e-mail do Avespet. Obrigado por fazer parte da nossa comunidade!");
});
