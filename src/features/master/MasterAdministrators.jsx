import React,{useCallback,useEffect,useState} from "react";
import {ShieldCheck,UserPlus,RefreshCw,LockKeyhole} from "lucide-react";
import {supabase} from "../../supabaseClient";

const date=(value)=>value?new Date(value).toLocaleString("pt-BR"):"Ainda não registrado";
async function request(body){
  const {data,error}=await supabase.functions.invoke("master-manage-admins",{body});
  if(error){
    let message="Não foi possível concluir a operação.";
    try{const payload=await error.context.json();if(typeof payload?.error==="string")message=payload.error;}catch{}
    throw new Error(message);
  }
  if(!data?.success)throw new Error(data?.error||"Resposta inválida do servidor.");
  return data;
}
export default function MasterAdministrators(){
  const [users,setUsers]=useState([]);
  const [canManage,setCanManage]=useState(false);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [email,setEmail]=useState("");
  const [reason,setReason]=useState("");
  const [confirm,setConfirm]=useState(false);
  const [target,setTarget]=useState(null);
  const [revokeReason,setRevokeReason]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");setCanManage(false);setUsers([]);
    try{const data=await request({action:"list"});setUsers(Array.isArray(data.users)?data.users:[]);setCanManage(data.can_manage===true);}
    catch(e){setError(e.message);}finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  async function invite(e){
    e.preventDefault();if(busy||!canManage||!confirm||reason.trim().length<8)return;
    setBusy(true);setError("");setNotice("");
    try{const data=await request({action:"invite",email:email.trim(),reason:reason.trim()});setNotice(data.message);setEmail("");setReason("");setConfirm(false);await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  async function revoke(e){
    e.preventDefault();if(busy||!canManage||!target||revokeReason.trim().length<8)return;
    setBusy(true);setError("");setNotice("");
    try{const data=await request({action:"revoke",user_id:target.id,reason:revokeReason.trim()});setNotice(data.message);setTarget(null);setRevokeReason("");await load();}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  return <section className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#a27b2e]">Segurança e governança</p><h1 className="mt-2 text-2xl font-bold text-slate-900">Administradores Master</h1><p className="mt-2 text-sm text-slate-500">Contas individuais, permissões e gestão de sócios.</p></div>
      <button type="button" disabled={busy||loading} onClick={load} className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"><RefreshCw size={16} className={loading?"animate-spin":""}/> Atualizar</button>
    </header>
    {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
    <div className="grid gap-3 sm:grid-cols-3">
      {[["Administradores",users.length],["Proprietários",users.filter(x=>x.papel==="owner").length],["Sócios Master",users.filter(x=>x.papel==="master").length]].map(([label,value])=><article key={label} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{loading?"—":value}</p></article>)}
    </div>
    <article className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b p-5"><h2 className="font-semibold text-slate-800">Equipe administrativa</h2><p className="mt-1 text-xs text-slate-500">Acesso ao painel Master. Permissões externas são gerenciadas separadamente.</p></div>
      {loading?<p className="p-6 text-sm text-slate-500">Carregando administradores...</p>:!error&&users.length===0?<p className="p-6 text-sm text-slate-500">Nenhum administrador retornado.</p>:<div className="divide-y">{users.map(u=><div key={u.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-slate-100 p-3 text-[#182b45]"><ShieldCheck size={20}/></span><div className="min-w-0"><p className="break-all font-semibold text-slate-800">{u.email||"E-mail indisponível"}</p><p className="mt-1 text-xs text-slate-500">{u.papel==="owner"?"Proprietário protegido":"Sócio Master"} · {u.email_confirmed_at?"E-mail confirmado":"Confirmação pendente"}</p><p className="mt-1 text-xs text-slate-500">Último acesso: {date(u.last_sign_in_at)}</p><p className="text-xs text-slate-500">Autorizado em: {date(u.created_at)}</p></div></div>
        {canManage&&u.papel==="master"&&<button type="button" disabled={busy} onClick={()=>{setTarget(u);setRevokeReason("");}} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700">Revogar acesso</button>}
      </div>)}</div>}
    </article>
    {canManage&&<form onSubmit={invite} className="space-y-4 rounded-2xl border bg-white p-5">
      <div className="flex items-center gap-2"><UserPlus size={20} className="text-[#a27b2e]"/><h2 className="font-semibold">Convidar administrador Master</h2></div>
      <p className="text-sm text-slate-500">O convite concede acesso administrativo amplo ao painel. Use o e-mail individual do sócio. Contas existentes exigem análise separada.</p>
      <label className="block text-sm font-medium">E-mail do sócio<input required type="email" maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);setConfirm(false);}} className="mt-1 block w-full rounded-xl border p-3"/></label>
      <label className="block text-sm font-medium">Motivo da concessão<textarea required minLength={8} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} className="mt-1 block w-full rounded-xl border p-3"/></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={confirm} onChange={e=>setConfirm(e.target.checked)}/>Confirmo que este sócio poderá acessar os módulos administrativos e os dados necessários à gestão da plataforma.</label>
      <button disabled={busy||!confirm||reason.trim().length<8||!email.trim()} className="rounded-xl bg-[#182b45] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Enviar convite Master</button>
    </form>}
    {target&&canManage&&<form onSubmit={revoke} className="space-y-3 rounded-2xl border border-red-200 bg-white p-5">
      <h2 className="font-semibold text-red-800">Confirmar revogação de acesso</h2>
      <p className="break-all text-sm">Revogar a autorização de {target.email}. A conta e seus dados serão preservados.</p>
      <label className="block text-sm">Motivo<textarea required minLength={8} maxLength={500} value={revokeReason} onChange={e=>setRevokeReason(e.target.value)} className="mt-1 block w-full rounded-xl border p-3"/></label>
      <div className="flex gap-2"><button disabled={busy||revokeReason.trim().length<8} className="rounded-lg bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">Confirmar revogação</button><button type="button" disabled={busy} onClick={()=>setTarget(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button></div>
    </form>}
    <aside className="flex items-start gap-3 rounded-2xl border bg-white p-5 text-sm text-slate-600"><LockKeyhole size={20} className="shrink-0"/><p>GitHub, Supabase e Vercel exigem convites e permissões nas respectivas plataformas. Este painel não compartilha credenciais nem concede acesso externo.</p></aside>
  </section>;
}
