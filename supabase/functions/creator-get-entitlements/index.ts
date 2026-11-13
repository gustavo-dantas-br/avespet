import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const FEATURE_KEYS=["basic_profile","basic_bird_management","basic_ads","advanced_genetics","reproduction_management","financial_management","campaigns","after_sales"] as const;
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
function response(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers});}

Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return response({error:"Method not allowed"},405);
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!token||!url||!anon||!service)return response({error:"Unauthorized or server configuration error"},401);
 const auth=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:authData,error:authError}=await auth.auth.getUser(token);
 if(authError||!authData.user)return response({error:"Unauthorized"},401);
 const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
 const userId=authData.user.id;
 const [{data:subscription,error:subscriptionError},{data:freePlan,error:freeError},{data:override,error:overrideError}]=await Promise.all([
  admin.from("creator_subscriptions").select("id,status,starts_at,ends_at,plan:platform_plans(id,code,name,features,max_birds,is_free)").eq("user_id",userId).in("status",["active","trialing"]).lte("starts_at",new Date().toISOString()).or("ends_at.is.null,ends_at.gt."+new Date().toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle(),
  admin.from("platform_plans").select("id,code,name,features,max_birds,is_free").eq("code","free").eq("is_active",true).maybeSingle(),
  admin.from("creator_entitlement_overrides").select("max_birds_override,unlimited_birds_override,feature_overrides,expires_at").eq("user_id",userId).maybeSingle()
 ]);
 if(subscriptionError||freeError||overrideError)return response({error:"Não foi possível consultar as permissões da conta. Verifique se as migrações de planos estão aplicadas."},503);
 const currentPlan=subscription?.plan||freePlan;
 if(!currentPlan)return response({error:"Plano gratuito padrão não encontrado."},503);
 const overrideActive=!!override&&(!override.expires_at||new Date(override.expires_at).getTime()>Date.now());
 const features:Record<string,boolean>={};
 for(const key of FEATURE_KEYS){
  const special=overrideActive?override.feature_overrides?.[key]:undefined;
  features[key]=typeof special==="boolean"?special:currentPlan.features?.[key]===true;
 }
 let maxBirds:number|null=currentPlan.max_birds??null;
 let unlimitedBirds=maxBirds===null;
 if(overrideActive){
  if(override.unlimited_birds_override){maxBirds=null;unlimitedBirds=true;}
  else if(Number.isInteger(override.max_birds_override)&&override.max_birds_override>=0){maxBirds=override.max_birds_override;unlimitedBirds=false;}
 }
 return response({success:true,plan:{id:currentPlan.id,code:currentPlan.code,name:currentPlan.name,is_free:currentPlan.is_free},subscription:subscription?{id:subscription.id,status:subscription.status,starts_at:subscription.starts_at,ends_at:subscription.ends_at}:null,features,max_birds:maxBirds,unlimited_birds:unlimitedBirds,override_expires_at:overrideActive?override.expires_at:null});
});
