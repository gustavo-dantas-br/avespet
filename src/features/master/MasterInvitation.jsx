import React,{useState} from "react";
import {ShieldCheck} from "lucide-react";
import {supabase} from "../../supabaseClient";

export default function MasterInvitation({session,authorized}){
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function submit(e){
    e.preventDefault();
    if(busy||!session||!authorized)return;
    if(password.length<12||password!==confirmation){setError("Use pelo menos 12 caracteres e confirme a mesma senha.");return;}
    setBusy(true);setError("");
    try{
      const {data,error:identityError}=await supabase.auth.getUser();
      if(identityError||data.user?.id!==session.user.id)throw new Error("Sessão inválida. Abra novamente o convite.");
      const {error:passwordError}=await supabase.auth.updateUser({password});
      if(passwordError)throw passwordError;
      window.location.replace("/adm");
    }catch(e){setError("Não foi possível definir a senha. Confira os requisitos ou solicite ajuda ao proprietário.");}
    finally{setBusy(false);}
  }
  return <main className="flex min-h-screen items-center justify-center bg-[#182b45] p-5">
    <section className="w-full max-w-md space-y-5 rounded-2xl bg-white p-7 shadow-xl">
      <ShieldCheck size={36} className="text-[#a27b2e]"/>
      <h1 className="text-xl font-bold text-slate-900">Convite Avespet Master</h1>
      {!session||!authorized?<><p className="text-sm text-slate-600">Não foi possível confirmar o convite. Abra o link recebido por e-mail ou entre com sua conta autorizada.</p><a href="/adm" className="block rounded-xl bg-[#182b45] p-3 text-center text-sm font-semibold text-white">Acessar o Master</a></>:<form onSubmit={submit} className="space-y-4">
        <p className="break-all text-sm text-slate-600">Conta: {session.user.email}. Crie sua senha individual de acesso administrativo.</p>
        {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <label className="block text-sm font-medium">Nova senha<input className="mt-1 block w-full rounded-xl border p-3" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
        <label className="block text-sm font-medium">Confirmar senha<input className="mt-1 block w-full rounded-xl border p-3" type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
        <button disabled={busy} className="w-full rounded-xl bg-[#182b45] p-3 text-sm font-semibold text-white disabled:opacity-50">Definir senha e acessar Master</button>
      </form>}
    </section>
  </main>;
}
