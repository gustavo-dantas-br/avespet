import React,{useEffect,useState} from "react";
import {Heart,Star,Bird,ArrowDown,MapPin,CheckCircle2} from "lucide-react";
import {listarAvesPerdidas} from "../../aves-perdidas/services/avesPerdidasService";

// O RPC público entrega depoimentos/nota apenas quando autorizados e aprovados.
function ReencontroCard({data:d,featured=false}){
 const name=d.nomeAve||d.especie||"Ave reencontrada";
 return <article className={"overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm "+(featured?"sm:grid sm:grid-cols-2":"")}>
   {d.foto?<img src={d.foto} alt={name} loading="lazy" decoding="async" className={"w-full bg-emerald-50 object-contain object-center "+(featured?"h-[320px] sm:h-[400px]":"h-[300px]")}/>:<div className={"flex items-center justify-center bg-emerald-50 text-emerald-800 "+(featured?"h-64 sm:h-full sm:min-h-[260px]":"h-52")}><Bird size={48}/></div>}
   <div className="flex flex-col justify-center p-5 sm:p-6">
     <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800"><CheckCircle2 size={16}/> Reencontro registrado pelo tutor</p>
     <h3 className={"mt-2 font-extrabold tracking-tight text-emerald-950 "+(featured?"text-3xl":"text-xl")}>{name}</h3>
     <p className="mt-1 text-sm text-slate-600">{d.especie}</p>
     {(d.cidade||d.uf)&&<p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><MapPin size={15}/>{[d.cidade,d.uf].filter(Boolean).join("/")}</p>}
     {Number(d.avaliacao)>=1&&Number(d.avaliacao)<=5&&<div className="mt-3 flex gap-1 text-amber-600" aria-label={d.avaliacao+" de 5 estrelas"}>{Array.from({length:Number(d.avaliacao)},(_,i)=><Star key={i} size={18} fill="currentColor"/>)}</div>}
     {d.depoimento&&<blockquote className="mt-4 whitespace-pre-wrap break-words border-l-2 border-emerald-300 pl-3 text-sm leading-6 text-slate-800">“{d.depoimento}”</blockquote>}
   </div>
 </article>;
}
export default function ReencontrosPublicos(){
 const [items,setItems]=useState(null);
 useEffect(()=>{let active=true;listarAvesPerdidas().then(rows=>{if(active)setItems(rows.filter(({data})=>data?.situacao==="reencontrado" && (data.depoimento || (Number.isInteger(Number(data.avaliacao)) && Number(data.avaliacao)>=1 && Number(data.avaliacao)<=5))).slice(0,6));}).catch(()=>{if(active)setItems([]);});return()=>{active=false;};},[]);
 if(!items?.length)return null;
 const [first,...rest]=items;
 return <section id="aves-reencontradas" aria-labelledby="reencontros-titulo" className="scroll-mt-24 overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50">
   <div className="bg-emerald-950 px-5 py-6 text-white sm:px-7 sm:py-8">
     <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-200"><Heart size={18}/> Histórias reais</p>
     <h2 id="reencontros-titulo" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Aves que voltaram para casa</h2>
     <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100">Conheça reencontros registrados pelos tutores, com relatos ou avaliações autorizados e revisados pelo Avespet.</p>
   </div>
   <div className="space-y-4 p-4 sm:p-6">
     <ReencontroCard data={first.data} featured/>
     {rest.length>0&&<div className="grid gap-4 sm:grid-cols-2">{rest.map(({id,data})=><ReencontroCard key={id} data={data}/>)}</div>}
     <p className="text-xs leading-5 text-slate-600">Reencontros não garantem resultados futuros e não comprovam, por si só, que uma campanha paga causou a recuperação.</p>
     <a href="#opcoes-divulgacao" className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white">Conhecer opções de divulgação <ArrowDown size={16}/></a>
   </div>
 </section>;
}
