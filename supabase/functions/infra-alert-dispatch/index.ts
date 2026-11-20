import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
async function match(a:string,b:string){const [x,y]=await Promise.all([digest(a),digest(b)]);let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0;}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const secret=Deno.env.get("AVESPET_INFRA_SCHEDULER_SECRET")||"";
 const provided=req.headers.get("x-avespet-scheduler")||"";
 if(secret.length<32||provided.length>200||!(await match(secret,provided)))return reply({error:"Unauthorized"},401);
 if(Deno.env.get("AVESPET_INFRA_ALERTS_ENABLED")!=="true")return reply({enabled:false,sent:0});
 const recipient=Deno.env.get("AVESPET_INFRA_ALERT_EMAIL")||"";
 const key=Deno.env.get("RESEND_API_KEY"),url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient)||!key||!url||!service)return reply({error:"Configuration incomplete"},503);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 let sent=0,failed=0;
 for(let i=0;i<4;i++){
  const {data:a,error}=await admin.rpc("master_infra_claim_alert");
  if(error)return reply({error:"Queue unavailable",sent},503);
  if(!a)break;
  const label=a.metric==="database"?"Banco de dados":"Armazenamento";
  const level=["Normalizado","Atenção","Alerta","Crítico"][a.level];
  let status="uncertain",providerId=null;
  try{
   const res=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"avespet-infra-"+a.id},body:JSON.stringify({from:"Avespet Monitoramento <suporte@avespet.com.br>",to:[recipient],subject:"[Avespet Infra] "+level+" — "+label,text:`${label}: ${a.pct}% da capacidade de referência. Nível: ${level}. Medição: ${a.created_at}. Consulte https://www.avespet.com.br/adm para verificar os dados. Alerta interno, não representa cobrança.`}),signal:AbortSignal.timeout(8000)});
   if(res.ok){const result=await res.json();if(typeof result.id==="string"){status="sent";providerId=result.id;}}
   else if(res.status>=400&&res.status<500&&res.status!==408&&res.status!==429)status="failed";
  }catch{/* ambiguous; do not retry blindly */}
  const {error:finishError}=await admin.rpc("master_infra_finish_alert",{p_id:a.id,p_status:status,p_provider_id:providerId});
  if(finishError)return reply({error:"Could not record delivery",sent},503);
  if(status==="sent")sent++;else failed++;
 }
 return reply({enabled:true,sent,failed});
});
