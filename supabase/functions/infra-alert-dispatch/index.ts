import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req)=>{
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 const provided=req.headers.get("x-avespet-scheduler")||"";
 if(!/^[a-f0-9]{64}$/.test(provided))return reply({error:"Unauthorized"},401);
 const key=Deno.env.get("RESEND_API_KEY"),url=Deno.env.get("SUPABASE_URL"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!service)return reply({error:"Configuration incomplete"},503);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:config,error:configError}=await admin.rpc("master_infra_dispatch_config",{p_digest:await digest(provided)});
 if(configError)return reply({error:"Configuration unavailable"},503);
 if(!config)return reply({error:"Unauthorized"},401);
 const body=await req.json().catch(()=>({}));
 if(body?.action==="check_vercel"){
  const token=Deno.env.get("AVESPET_VERCEL_READ_TOKEN");
  if(!token)return reply({vercel:"not_configured"});
  try{
   const endpoint=new URL("https://api.vercel.com/v6/deployments");
   endpoint.searchParams.set("teamId","team_U7fxAgYIeol47gm6WHtsGvVW");
   endpoint.searchParams.set("limit","1");
   const response=await fetch(endpoint,{headers:{Authorization:"Bearer "+token},signal:AbortSignal.timeout(8000)});
   if(!response.ok)return reply({vercel:"unavailable",provider_status:response.status});
   const result=await response.json();
   return reply({vercel:Array.isArray(result.deployments)?"ok":"invalid_response",provider_status:response.status});
  }catch{return reply({vercel:"unavailable"});}
 }
 if(!config.enabled)return reply({enabled:false,sent:0});
 const recipient=config.recipient||"";
 if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(recipient)||!key)return reply({error:"Configuration incomplete"},503);
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
