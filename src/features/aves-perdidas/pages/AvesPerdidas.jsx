import React, { useEffect, useState } from "react";
import { listarAvesPerdidas } from "../services/avesPerdidasService";

export default function AvesPerdidas() {
  const [lista,setLista]=useState([]);
  const [loading,setLoading]=useState(true);
  const [erro,setErro]=useState("");
  useEffect(()=>{ listarAvesPerdidas().then(setLista).catch(()=>setErro("Não foi possível carregar os anúncios agora.")).finally(()=>setLoading(false)); },[]);
  return <section className="px-5 py-8 max-w-6xl mx-auto ui-sans">
    <h1 className="mb-2" style={{color:"#F1E6D2",fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:700}}>Aves perdidas</h1>
    <p className="mb-6" style={{color:"#b09a78"}}>Ajude a compartilhar. Se encontrou uma ave, informe a anilha em “Achei uma ave”; nossa equipe fará a intermediação.</p>
    {loading ? <p style={{color:"#b09a78"}}>Carregando anúncios...</p> : erro ? <p style={{color:"#e7b5a8"}}>{erro}</p> : lista.length===0 ? <p style={{color:"#b09a78"}}>Ainda não há anúncios aprovados.</p> :
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{lista.map(({id,data})=><article key={id} className="rounded-xl overflow-hidden" style={{background:"#FAF3E6",color:"#2B241C"}}>
        {data.foto && <img src={data.foto} alt={data.nomeAve || "Ave perdida"} className="w-full aspect-video object-cover" />}
        <div className="p-4"><h2 className="font-bold text-lg">{data.nomeAve || data.especie}</h2>
          <p className="text-sm">{data.especie} {data.cor ? "• "+data.cor : ""}</p>
          <p className="text-sm mt-2">{data.cidade}{data.uf ? "/"+data.uf : ""}</p>
          {data.dataPerda && <p className="text-xs mt-1">Desapareceu em {new Date(data.dataPerda+"T12:00:00").toLocaleDateString("pt-BR")}</p>}
          {data.descricao && <p className="text-sm mt-2 whitespace-pre-wrap">{data.descricao}</p>}
          <p className="text-xs mt-3">Contato sempre intermediado pelo Avespet para proteger o titular e quem encontrou a ave.</p>
        </div></article>)}</div>}
  </section>;
}
