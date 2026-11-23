import React,{useEffect,useState} from "react";
import {supabase} from "../../../supabaseClient";
export function StoryCard({item,photo,featured=false}) {
 return <article className={"overflow-hidden rounded-2xl border border-slate-200 bg-white "+(featured?"sm:grid sm:grid-cols-2":"")}>
 {photo&&<img src={photo} alt={item.bird_name} loading="lazy" className={"w-full object-contain object-center bg-slate-100 "+(featured?"h-[320px] sm:h-[400px]":"h-[300px]")}/>}
 <div className="p-5"><p className={"text-xs font-bold "+(item.kind==="illustrative"?"text-slate-700":"text-emerald-800")}>{item.kind==="illustrative"?"História de reencontro":"Relato autorizado pelo tutor"}</p>
 <h3 className={"mt-2 font-bold tracking-tight "+(featured?"text-2xl":"text-lg")}>{item.title}</h3><p className="text-sm text-slate-600">{item.bird_name} · {item.species} · {item.city}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.story}</p>
 {item.kind==="illustrative"&&<p className="mt-3 text-xs text-slate-600">Exemplo demonstrativo: esta narrativa não representa uma recuperação registrada ou depoimento real.</p>}</div></article>;
}
export default function EditorialStories(){
 const [items,setItems]=useState([]);
 useEffect(()=>{let live=true;async function load(){const {data,error}=await supabase.from("reunion_editorial_stories").select("id,title,bird_name,species,city,story,kind,photo_path,publish_at").eq("state","scheduled").lte("publish_at",new Date().toISOString()).order("publish_at",{ascending:false}).limit(12);if(error||!live)return;const results=await Promise.all((data||[]).map(async item=>{const {data:photo}=await supabase.storage.from("reunion-editorial").createSignedUrl(item.photo_path,300);return {...item,photo:photo?.signedUrl};}));if(live)setItems(results);}load().catch(()=>{});const timer=setInterval(()=>load().catch(()=>{}),120000);return()=>{live=false;clearInterval(timer);};},[]);
 if(!items.length)return null;
 const authorized=items.filter(item=>item.kind==="authorized");
 const illustrative=items.filter(item=>item.kind==="illustrative");
 const renderGroup=(rows,kind)=>{
  if(!rows.length)return null;
  const [first,...rest]=rows;
  const isExample=kind==="illustrative";
  return <section aria-label={isExample?"Exemplos demonstrativos":"Relatos autorizados"} className={"overflow-hidden rounded-3xl border p-5 sm:p-6 "+(isExample?"border-slate-200 bg-slate-50":"border-emerald-200 bg-emerald-50")}>
   <p className="text-xs font-bold uppercase tracking-widest text-slate-600">{isExample?"Histórias de reencontro":"Relatos autorizados"}</p>
   <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{isExample?"Como um reencontro pode acontecer":"Outras histórias de reencontro"}</h2>
   <p className="mt-2 text-sm leading-6 text-slate-600">{isExample?"Exemplos demonstrativos que ajudam a entender os recursos de busca. Não são depoimentos nem recuperações comprovadas.":"Histórias enviadas com autorização dos responsáveis. Não representam uma garantia de resultado."}</p>
   <div className="mt-4 space-y-4"><StoryCard item={first} photo={first.photo} featured/>{rest.length>0&&<div className="grid gap-4 sm:grid-cols-2">{rest.map(item=><StoryCard key={item.id} item={item} photo={item.photo}/>)}</div>}</div>
  </section>;
 };
 return <div className="space-y-6">{renderGroup(authorized,"authorized")}{renderGroup(illustrative,"illustrative")}<a href="#opcoes-divulgacao" className="inline-flex min-h-[44px] items-center rounded-xl border border-emerald-700 bg-white px-4 py-3 text-sm font-bold text-emerald-800">Ir para as opções de divulgação ↓</a></div>;
}
