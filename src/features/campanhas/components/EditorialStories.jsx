import React,{useEffect,useState} from "react";
import {supabase} from "../../../supabaseClient";
export function StoryCard({item,photo}) {
 return <article className="overflow-hidden rounded-2xl border bg-white">
 {photo&&<img src={photo} alt={item.bird_name} loading="lazy" className="h-64 w-full object-contain bg-slate-100"/>}
 <div className="p-4"><p className="text-xs font-bold text-emerald-800">{item.kind==="illustrative"?"História ilustrativa — caso fictício":"Relato autorizado pelo tutor"}</p>
 <h3 className="mt-2 text-lg font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.bird_name} · {item.species} · {item.city}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{item.story}</p>
 {item.kind==="illustrative"&&<p className="mt-3 text-xs text-slate-600">Exemplo fictício, imagem ilustrativa. Não é depoimento de cliente nem comprovação de recuperação.</p>}</div></article>;
}
export default function EditorialStories(){
 const [items,setItems]=useState([]);
 useEffect(()=>{let live=true;async function load(){const {data,error}=await supabase.from("reunion_editorial_stories").select("id,title,bird_name,species,city,story,kind,photo_path,publish_at").eq("state","scheduled").lte("publish_at",new Date().toISOString()).order("publish_at",{ascending:false}).limit(12);if(error||!live)return;const results=await Promise.all((data||[]).map(async item=>{const {data:photo}=await supabase.storage.from("reunion-editorial").createSignedUrl(item.photo_path,300);return {...item,photo:photo?.signedUrl};}));if(live)setItems(results);}load().catch(()=>{});const timer=setInterval(()=>load().catch(()=>{}),120000);return()=>{live=false;clearInterval(timer);};},[]);
 if(!items.length)return null;
 return <section className="mt-8"><h2 className="text-2xl font-bold text-emerald-950">Histórias e exemplos de reencontro</h2><p className="mt-2 text-sm text-slate-600">Conheça os recursos que podem auxiliar na busca. Os exemplos fictícios são identificados individualmente.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{items.map(item=><StoryCard key={item.id} item={item} photo={item.photo}/>)}</div></section>;
}
