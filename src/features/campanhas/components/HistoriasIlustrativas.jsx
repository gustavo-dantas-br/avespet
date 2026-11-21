import React,{useEffect,useState} from 'react';
import {historiasDisponiveis} from '../config/historiasIlustrativas.mjs';
export default function HistoriasIlustrativas(){
 const [agora,setAgora]=useState(()=>Date.now());
 useEffect(()=>{const id=setInterval(()=>setAgora(Date.now()),30000);return()=>clearInterval(id);},[]);
 const items=historiasDisponiveis(agora);
 if(!items.length)return null;
 return <section className="mt-8" aria-label="Cenários educativos fictícios">
 <h2 className="text-2xl font-bold text-emerald-950">Como a busca pode ajudar</h2>
 <p className="mt-2 text-sm leading-6 text-slate-700">Histórias fictícias e imagens geradas por IA, para demonstrar os recursos do Avespet. Não são depoimentos de clientes nem recuperações reais. Não há garantia de reencontro.</p>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">{items.map(h=><article key={h.id} className="overflow-hidden rounded-2xl border border-emerald-100 bg-white">
 <img src={h.imagem} alt={`Imagem ilustrativa de Ring Neck ${h.cor}, gerada por IA`} loading="lazy" className="aspect-[4/5] w-full object-cover"/>
 <div className="p-4"><p className="text-xs font-bold text-emerald-800">História fictícia · Imagem gerada por IA</p><h3 className="mt-2 text-lg font-bold text-slate-900">{h.nome} — {h.canal}</h3><p className="text-sm text-slate-600">Ring Neck {h.cor} · {h.cidade} (cenário fictício)</p><p className="mt-3 text-sm leading-6 text-slate-800">{h.relato}</p></div></article>)}</div>
 </section>;
}
