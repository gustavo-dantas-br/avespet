// Somente leitura. Nenhum token, resposta bruta ou URL sensível sai desta função.
export async function metaAccountDiagnostic(env, request=fetch){
 const token=env("META_ACCESS_TOKEN"), raw=env("META_AD_ACCOUNT_ID")||"", version=env("META_GRAPH_API_VERSION")||"";
 const missing=[["META_ACCESS_TOKEN",token],["META_AD_ACCOUNT_ID",raw],["META_GRAPH_API_VERSION",version]].filter(([,v])=>!v).map(([k])=>k);
 if(missing.length)return {state:"not_configured",missing};
 const id=raw.replace(/^act_/,"");
 if(!/^\d{5,30}$/.test(id)||!/^v\d{1,3}\.\d{1,2}$/.test(version))return {state:"invalid_configuration"};
 const url=new URL("https://graph.facebook.com/"+version+"/act_"+id);
 url.searchParams.set("fields","id,account_status,currency,timezone_name");
 try{
  const response=await request(url.toString(),{method:"GET",headers:{Authorization:"Bearer "+token,Accept:"application/json"},redirect:"error",signal:AbortSignal.timeout(8000)});
  const data=await response.json();
  if(!response.ok||data?.error){
   const code=Number(data?.error?.code);
   return {state:code===190?"invalid_token":code===10||code===200||response.status===403?"access_denied":response.status===429||code===4||code===17||code===32||code===613?"rate_limited":"provider_error"};
  }
  if(data?.id!=="act_"+id||!Number.isInteger(data.account_status)||typeof data.currency!=="string"||!/^[A-Z]{3}$/.test(data.currency))return {state:"unexpected_response"};
  const active=data.account_status===1, brl=data.currency==="BRL";
  return {state:active&&brl?"read_ready":"account_review",account:{id:data.id,status:data.account_status,currency:data.currency,timezone:typeof data.timezone_name==="string"?data.timezone_name.slice(0,80):null,active},checkedAt:new Date().toISOString()};
 }catch{return {state:"unavailable"};}
}
