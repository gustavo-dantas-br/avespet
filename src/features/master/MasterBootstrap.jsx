import React,{useState} from "react";
import {supabase} from "../../supabaseClient";

export default function MasterBootstrap(){
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function sendInvite(){
    if(!window.confirm("Enviar convite Master para gustavosvaio@gmail.com? O convite concede acesso administrativo à plataforma após a confirmação do e-mail.")) return;
    setLoading(true);setMessage("");setError("");
    try{
      const {data,error}=await supabase.functions.invoke("master-invite-user",{body:{}});
      if(error) throw new Error(data?.error || error.message || "Falha ao enviar convite.");
      if(!data?.success) throw new Error(data?.error || "Resposta inesperada do servidor.");
      setMessage(data.message || "Convite enviado.");
    }catch(e){setError(e.message || "Não foi possível enviar o convite.");}
    finally{setLoading(false);}
  }

  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#2B1D14"}}>
    <section style={{maxWidth:520,width:"100%",padding:28,borderRadius:18,background:"#FAF3E6",color:"#2B241C"}}>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:"#A27B2E"}}>AVESPET · CONFIGURAÇÃO SEGURA</div>
      <h1 style={{fontSize:25,fontWeight:800,marginTop:12}}>Convite da conta Master</h1>
      <p style={{fontSize:14,lineHeight:1.6,marginTop:10}}>Esta operação envia um convite pelo Supabase Auth para <strong>gustavosvaio@gmail.com</strong> e registra a permissão Master no servidor. A conta não será criada como perfil de criador.</p>
      {message&&<p role="status" style={{padding:12,background:"#e4ead9",color:"#405735",borderRadius:8,marginTop:18}}>{message}</p>}
      {error&&<p role="alert" style={{padding:12,background:"#f0dad4",color:"#8c3025",borderRadius:8,marginTop:18}}>{error}</p>}
      <button type="button" onClick={sendInvite} disabled={loading} style={{marginTop:20,width:"100%",padding:13,borderRadius:9,background:"#2B1D14",color:"#FAF3E6",fontWeight:700,opacity:loading ? 0.6 : 1}}>{loading?"Enviando convite…":"Enviar convite Master"}</button>
      <p style={{fontSize:12,color:"#806f58",marginTop:14}}>Acesso restrito à conta administrativa Yahoo já autorizada. Não compartilhe este endereço.</p>
    </section>
  </main>;
}
