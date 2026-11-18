import React,{useCallback,useEffect,useState} from "react";
import {supabase} from "../../supabaseClient";
export default function ReunionReviews(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(""),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");
   const {data,error:e}=await supabase.functions.invoke("master-reunion-reviews",{body:{action:"list"}});
   if(e||data?.error)setError(data?.error||"Não foi possível carregar os reencontros.");
   else setItems(data?.items||[]);
   setLoading(false);
 },[]);
 useEffect(()=>{load();},[load]);
 async function review(item,approve){
  if(busy||!window.confirm((approve?"Publicar":"Ocultar")+" o depoimento de "+item.name+"?"))return;
  setBusy(item.anuncio_id);setError("");setNotice("");
  try{
   const {data,error:e}=await supabase.functions.invoke("master-reunion-reviews",{body:{action:"review",anuncio_id:item.anuncio_id,approve}});
   if(e||data?.error||!data?.success)throw new Error(data?.error||"Falha ao revisar o depoimento.");
   setNotice(approve?"Depoimento autorizado e publicado.":"Depoimento ocultado. A ave permanece como reencontrada.");
   await load();
  }catch(e){setError(e?.message||"Não foi possível revisar.");}
  finally{setBusy("");}
 }
 return <section className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <div><h2 className="text-lg font-bold text-emerald-950">🦜💚 Histórias de reencontro</h2>
    <p className="text-sm text-slate-600">Confirmações feitas pelos tutores. Publique somente relatos autorizados; os contatos privados nunca aparecem aqui.</p></div>
   <button type="button" onClick={load} disabled={loading} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">Atualizar</button>
  </div>
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  {notice&&<p role="status" className="rounded-lg bg-white p-3 text-sm text-emerald-800">{notice}</p>}
  {loading?<p className="text-sm text-slate-600">Carregando...</p>:
  !items.length?<p className="rounded-xl bg-white p-4 text-sm text-slate-600">Ainda não existem reencontros confirmados pelos tutores.</p>:
  <div className="grid gap-3 lg:grid-cols-2">{items.map(item=><article key={item.anuncio_id} className="rounded-xl border bg-white p-4">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <strong className="text-slate-900">{item.name} · {item.especie}</strong>
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{item.aprovado?"Depoimento público":item.autorizado?"Aguardando revisão":"Sem autorização de publicação"}</span>
   </div>
   <p className="mt-2 text-xs text-slate-500">Reencontro: {item.data_reencontro} · Nota: {item.nota===null?"Não informada":item.nota+"/5"}</p>
   {item.relato&&<p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{item.relato}</p>}
   {item.autorizado&&(item.relato||item.nota!==null)&&<div className="mt-3 flex gap-2">
    {!item.aprovado&&<button type="button" disabled={!!busy} onClick={()=>review(item,true)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Aprovar depoimento</button>}
    {item.aprovado&&<button type="button" disabled={!!busy} onClick={()=>review(item,false)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 disabled:opacity-40">Ocultar depoimento</button>}
   </div>}
  </article>)}</div>}
 </section>;
}
