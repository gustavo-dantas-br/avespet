import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, Loader2, RefreshCw, Search, ShieldCheck, UserPlus, XCircle } from "lucide-react";

const money=(value)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((Number(value)||0)/100);
const date=(value)=>value?new Date(value).toLocaleDateString("pt-BR"):"Sem data final";
const statusInfo={
 active:{label:"Ativa",className:"bg-emerald-50 text-emerald-700"},
 trialing:{label:"Em teste",className:"bg-blue-50 text-blue-700"},
 past_due:{label:"Pagamento pendente",className:"bg-amber-50 text-amber-800"},
 canceled:{label:"Cancelada",className:"bg-slate-100 text-slate-600"},
 expired:{label:"Expirada",className:"bg-rose-50 text-rose-700"},
};
const inputClass="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400";

export default function SubscriptionsManagement(){
 const [items,setItems]=useState([]),[plans,setPlans]=useState([]);
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [search,setSearch]=useState(""),[creators,setCreators]=useState([]),[searching,setSearching]=useState(false);
 const [selectedCreator,setSelectedCreator]=useState(null),[planId,setPlanId]=useState("");
 const [status,setStatus]=useState("active"),[startsAt,setStartsAt]=useState(new Date().toISOString().slice(0,10)),[endsAt,setEndsAt]=useState("");

 const invoke=useCallback(async(body)=>{
  const {data,error}=await supabase.functions.invoke("master-manage-subscriptions",{body});
  if(error||data?.error||!data?.success) throw new Error(data?.error||"Não foi possível concluir a operação.");
  return data;
 },[]);
 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [subs,planResult]=await Promise.all([
    invoke({action:"list"}),
    supabase.functions.invoke("master-manage-billing",{body:{action:"list_plans"}})
   ]);
   if(planResult.error||planResult.data?.error||!planResult.data?.success) throw new Error(planResult.data?.error||"Não foi possível carregar o catálogo de planos.");
   setItems(subs.subscriptions||[]);
   setPlans((planResult.data.plans||[]).filter(p=>p.is_active));
  }catch(e){setError(e.message||"Falha ao carregar assinaturas.");}
  finally{setLoading(false);}
 },[invoke]);
 useEffect(()=>{load();},[load]);
 const activeCount=useMemo(()=>items.filter(x=>["active","trialing"].includes(x.status)).length,[items]);
 const paidCount=useMemo(()=>items.filter(x=>x.plan&&!x.plan.is_free&&["active","trialing"].includes(x.status)).length,[items]);

 async function searchCreators(value){
  setSearch(value);setSelectedCreator(null);setCreators([]);
  if(value.trim().length<2)return;
  setSearching(true);
  try{const result=await invoke({action:"search_creators",search:value});setCreators(result.creators||[]);}
  catch(e){setError(e.message);}
  finally{setSearching(false);}
 }
 async function assign(event){
  event.preventDefault();if(!selectedCreator||!planId)return;
  setSaving(true);setError("");setNotice("");
  try{
   await invoke({action:"assign",user_id:selectedCreator.userId,plan_id:planId,status,starts_at:new Date(startsAt+"T12:00:00").toISOString(),ends_at:endsAt?new Date(endsAt+"T12:00:00").toISOString():null});
   setNotice("Plano atribuído ao criador. A assinatura anterior, se existia, foi encerrada.");
   setSearch("");setCreators([]);setSelectedCreator(null);setPlanId("");setEndsAt("");
   await load();
  }catch(e){setError(e.message||"Não foi possível atribuir o plano.");}
  finally{setSaving(false);}
 }
 async function changeStatus(item,next){
  if(!window.confirm("Confirma alterar a situação desta assinatura?"))return;
  setError("");setNotice("");
  try{await invoke({action:"change_status",id:item.id,status:next});setNotice("Situação da assinatura atualizada.");await load();}
  catch(e){setError(e.message);}
 }

 return <section className="space-y-6">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-700">Gestão comercial</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Assinaturas dos criadores</h1><p className="mt-1.5 max-w-2xl text-sm text-slate-500">Consulte o plano atual, histórico de vínculos e atribua planos manualmente pelo Master.</p></div><button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 disabled:opacity-50"><RefreshCw size={14} className={loading?"animate-spin":""}/> Atualizar</button></div>
  {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800">{error}</div>}
  {notice&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800">{notice}</div>}
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Assinaturas no histórico</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading?"—":items.length}</p></div>
   <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Ativas / em teste</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading?"—":activeCount}</p></div>
   <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Planos pagos ativos</p><p className="mt-2 text-2xl font-bold text-slate-900">{loading?"—":paidCount}</p></div>
  </div>
  <div className="grid items-start gap-5 2xl:grid-cols-[1.1fr_.9fr]">
   <div className="space-y-3">
    <div><h2 className="font-semibold text-slate-800">Histórico de assinaturas</h2><p className="mt-1 text-xs text-slate-400">Exibindo até 500 registros mais recentes</p></div>
    {loading?<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400"><Loader2 className="mx-auto mb-2 animate-spin"/>Carregando...</div>:items.length?items.map(item=>{
     const info=statusInfo[item.status]||statusInfo.expired;
     return <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold text-slate-900">{item.creator_name}</h3><p className="mt-0.5 break-all text-xs text-slate-500">{item.email}</p>{item.creator_business&&<p className="mt-1 text-xs text-slate-400">{item.creator_business}</p>}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${info.className}`}>{info.label}</span></div>
      <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2"><div><p className="text-[10px] text-slate-400">Plano</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{item.plan?.name||"Plano não localizado"}</p><p className="text-xs text-slate-500">{item.plan?money(item.plan.price_cents):"—"} · {item.plan?.billing_interval==="yearly"?"Anual":item.plan?.billing_interval==="one_time"?"Único":"Mensal"}</p></div><div><p className="text-[10px] text-slate-400">Período</p><p className="mt-0.5 text-xs font-medium text-slate-700">{date(item.starts_at)} até {date(item.ends_at)}</p><p className="text-[10px] text-slate-400">Criada em {date(item.created_at)}</p></div></div>
      {["active","trialing","past_due"].includes(item.status)&&<div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>changeStatus(item,"canceled")} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Cancelar assinatura</button>{item.status!=="active"&&<button onClick={()=>changeStatus(item,"active")} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Marcar como ativa</button>}{item.status==="active"&&<button onClick={()=>changeStatus(item,"past_due")} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50">Marcar pagamento pendente</button>}</div>}
     </article>
    }):<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Nenhuma assinatura cadastrada até o momento.</div>}
   </div>
   <form onSubmit={assign} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-800"><UserPlus size={18}/></span><div><h2 className="font-semibold text-slate-900">Atribuir plano</h2><p className="text-xs text-slate-400">Ação administrativa manual</p></div></div>
    <label className="mt-5 block text-xs font-semibold text-slate-600">Buscar criador por nome, criatório ou e-mail
     <div className="relative"><Search size={15} className="absolute left-3 top-3.5 text-slate-400"/><input className={inputClass+" pl-9"} value={search} onChange={e=>searchCreators(e.target.value)} placeholder="Digite pelo menos 2 caracteres"/></div>
    </label>
    {searching&&<p className="mt-2 text-xs text-slate-400">Pesquisando criadores...</p>}
    {creators.length>0&&<div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200">{creators.map(c=><button type="button" key={c.userId} onClick={()=>{setSelectedCreator(c);setSearch(c.name);setCreators([]);}} className="block w-full border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"><span className="block text-xs font-semibold text-slate-800">{c.name}</span><span className="block text-[11px] text-slate-500">{c.business||c.email} · {c.email}</span></button>)}</div>}
    {selectedCreator&&<div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div><p className="text-xs font-semibold text-emerald-800">{selectedCreator.name}</p><p className="text-[10px] text-emerald-700">{selectedCreator.email}</p></div><button type="button" onClick={()=>{setSelectedCreator(null);setSearch("");}} aria-label="Remover criador selecionado" className="text-emerald-700"><XCircle size={17}/></button></div>}
    <label className="mt-4 block text-xs font-semibold text-slate-600">Plano<select className={inputClass} required value={planId} onChange={e=>setPlanId(e.target.value)}><option value="">Selecione um plano ativo</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name} · {money(p.price_cents)}</option>)}</select></label>
    <label className="mt-4 block text-xs font-semibold text-slate-600">Situação inicial<select className={inputClass} value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Ativa</option><option value="trialing">Em teste</option></select></label>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Início<input type="date" className={inputClass} value={startsAt} onChange={e=>setStartsAt(e.target.value)} required/></label><label className="text-xs font-semibold text-slate-600">Término (opcional)<input type="date" className={inputClass} value={endsAt} min={startsAt} onChange={e=>setEndsAt(e.target.value)}/></label></div>
    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><p className="font-semibold">Atenção</p><p>Ao atribuir um novo plano, as assinaturas ativas, em teste ou com pagamento pendente do criador serão encerradas. A ação ficará registrada na auditoria.</p></div>
    <button type="submit" disabled={saving||!selectedCreator||!planId} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" style={{background:"#1d3553"}}>{saving?<Loader2 size={16} className="animate-spin"/>:<CheckCircle2 size={16}/>} {saving?"Atribuindo...":"Confirmar atribuição"}</button>
   </form>
  </div>
  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-5 text-blue-900"><p className="font-semibold">Etapa atual</p><p className="mt-1">O módulo registra vínculos de assinatura e permite controle administrativo manual. Ainda não processa cobranças, não conecta gateway e não aplica automaticamente os limites e permissões no restante do sistema.</p></div>
 </section>;
}
