import React,{useEffect,useState} from "react";
import {supabase} from "../../supabaseClient";
import {StoryCard} from "../campanhas/components/EditorialStories";
const empty={title:"",bird_name:"",species:"",city:"",story:"",kind:"illustrative",consent_confirmed:false,photo_path:"",state:"draft",publish_at:null};
const input="mt-1 w-full rounded-lg border p-2.5 text-sm";
const fields=[["bird_name","Nome da ave",80],["species","Espécie e mutação",120],["city","Cidade / UF",100],["title","Título",150]];
async function compress(file){
 if(!file||!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>15*1024*1024)throw Error("Escolha JPG, PNG ou WebP de até 15 MB.");
 const bitmap=await createImageBitmap(file);
 try{for(const max of [1280,1024,800,640]){const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const c=document.createElement("canvas");c.width=Math.max(1,Math.round(bitmap.width*scale));c.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(bitmap,0,0,c.width,c.height);for(const quality of [.84,.72,.6,.48]){const blob=await new Promise(resolve=>c.toBlob(resolve,"image/jpeg",quality));if(blob&&blob.size<=150*1024)return blob;}}}finally{bitmap.close();}
 throw Error("Não foi possível comprimir a foto.");
}
const localDate=iso=>iso?new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(iso)).replace(" ","T"):"";
export default function ReunionEditorial(){
 const [items,setItems]=useState([]),[form,setForm]=useState(empty),[id,setId]=useState(null),[file,setFile]=useState(null),[preview,setPreview]=useState(""),[date,setDate]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[filter,setFilter]=useState("all");
 async function load(){const {data,error}=await supabase.from("reunion_editorial_stories").select("*").order("created_at",{ascending:false}).limit(100);if(error)throw error;setItems(data||[]);}
 useEffect(()=>{load().catch(e=>setMessage(e.message));},[]);
 useEffect(()=>{if(!file)return;const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 const change=(key,value)=>setForm(old=>({...old,[key]:value}));
 function reset(){setForm(empty);setId(null);setFile(null);setPreview("");setDate("");}
 async function edit(item){setId(item.id);setForm(item);setFile(null);setDate(localDate(item.publish_at));setPreview("");const {data}=await supabase.storage.from("reunion-editorial").createSignedUrl(item.photo_path,300);setPreview(data?.signedUrl||"");}
 async function save(mode){if(busy)return;setBusy(true);setMessage("");try{
 for(const [key,label] of fields)if(!form[key]?.trim())throw Error("Preencha "+label+".");
 if(!form.story.trim())throw Error("Escreva a história.");
 if(form.kind==="authorized"&&!form.consent_confirmed)throw Error("Confirme a autorização do tutor.");
 if(mode==="schedule"&&!date)throw Error("Informe data e horário.");
 const at=mode==="schedule"?new Date(date+":00-03:00"):new Date();
 if(mode==="schedule"&&(!Number.isFinite(+at)||+at<=Date.now()))throw Error("Escolha uma data futura.");
 let path=form.photo_path;
 if(file){const blob=await compress(file);path=crypto.randomUUID()+".jpg";const {error}=await supabase.storage.from("reunion-editorial").upload(path,blob,{contentType:"image/jpeg",upsert:false});if(error)throw error;change("photo_path",path);setFile(null);}
 if(!path)throw Error("Anexe uma fotografia.");
 const payload=Object.fromEntries(fields.map(([key])=>[key,form[key].trim()]));
 Object.assign(payload,{story:form.story.trim(),kind:form.kind,consent_confirmed:form.kind==="authorized"&&form.consent_confirmed,photo_path:path,state:mode==="draft"?"draft":"scheduled",publish_at:mode==="draft"?null:at.toISOString()});
 const query=supabase.from("reunion_editorial_stories");const {error}=await (id?query.update(payload).eq("id",id):query.insert(payload)).select("id").single();if(error)throw error;
 reset();await load();setMessage(mode==="draft"?"Rascunho salvo.":mode==="schedule"?"Publicação agendada.":"Publicação liberada.");
 }catch(e){setMessage(e.message||"Não foi possível salvar.");}finally{setBusy(false);}}
 async function hide(item){if(!confirm("Retirar esta publicação do ar?"))return;setBusy(true);try{const {error}=await supabase.from("reunion_editorial_stories").update({state:"hidden"}).eq("id",item.id).select("id").single();if(error)throw error;await load();setMessage("Publicação ocultada.");}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 const status=i=>i.state==="draft"?"Rascunho":i.state==="hidden"?"Ocultada":new Date(i.publish_at)>new Date()?"Agendada":"Publicada";
 return <section className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Histórias de reencontro — editar publicações</h2><p className="text-sm text-slate-600">Edite as histórias publicadas, incluindo Thor, nesta seção. Exemplos demonstrativos não alteram os indicadores de recuperação.</p>
 {message&&<p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
 <div className="grid gap-5 lg:grid-cols-2"><form onSubmit={e=>{e.preventDefault();save("draft");}} className="space-y-3"><h3 className="font-bold">{id?"Editar publicação":"Nova publicação"}</h3>
 <label className="block text-sm font-semibold">Fotografia<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className={input} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
 {fields.map(([key,label,max])=><label key={key} className="block text-sm font-semibold">{label}<input className={input} value={form[key]} maxLength={max} onChange={e=>change(key,e.target.value)} required/></label>)}
 <label className="block text-sm font-semibold">História<textarea className={input} rows={6} maxLength={3000} value={form.story} onChange={e=>change("story",e.target.value)} required/></label>
 <label className="block text-sm font-semibold">Tipo<select className={input} value={form.kind} onChange={e=>change("kind",e.target.value)}><option value="illustrative">Exemplo demonstrativo</option><option value="authorized">Relato real autorizado</option></select></label>
 {form.kind==="authorized"&&<label className="flex gap-2 text-sm"><input type="checkbox" checked={form.consent_confirmed} onChange={e=>change("consent_confirmed",e.target.checked)}/>Confirmo que a história é real e o tutor autorizou texto e foto.</label>}
 <label className="block text-sm font-semibold">Agendamento (horário de Brasília)<input className={input} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/></label>
 <div className="flex flex-wrap gap-2"><button disabled={busy} type="submit" className="rounded-lg border p-2 text-sm">Salvar rascunho</button><button disabled={busy} type="button" onClick={()=>save("schedule")} className="rounded-lg bg-emerald-700 p-2 text-sm text-white">Agendar</button><button disabled={busy} type="button" onClick={()=>save("now")} className="rounded-lg bg-slate-900 p-2 text-sm text-white">Publicar agora</button>{id&&<button type="button" disabled={busy} onClick={reset} className="rounded-lg border p-2 text-sm">Cancelar edição</button>}</div></form>
 <div><h3 className="mb-3 font-semibold">Pré-visualização</h3><StoryCard item={form} photo={preview}/></div></div>
 <div className="flex flex-wrap gap-2">{["all","Agendada","Publicada","Rascunho","Ocultada"].map(f=><button key={f} type="button" onClick={()=>setFilter(f)} className={"rounded-lg border px-3 py-2 text-xs "+(filter===f?"bg-slate-900 text-white":"")}>{f==="all"?"Todas":f}</button>)}</div>
 {items.filter(i=>filter==="all"||status(i)===filter).map(i=><article key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"><div><strong>{i.bird_name} — {i.title}</strong><p className="text-xs text-slate-600">{status(i)} · {i.publish_at?localDate(i.publish_at).replace("T"," "):"Sem data"} · {i.kind==="illustrative"?"Exemplo demonstrativo":"Real autorizada"}</p></div><div className="flex gap-2"><button disabled={busy} type="button" onClick={()=>edit(i)} className="rounded-lg border p-2 text-xs">Editar</button>{i.state!=="hidden"&&<button disabled={busy} type="button" onClick={()=>hide(i)} className="rounded-lg border p-2 text-xs">Ocultar</button>}</div></article>)}</section>;
}
