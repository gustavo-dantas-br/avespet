import React from "react";
import { ArrowRight } from "lucide-react";

const itens = [
  {id:"gaiola-pet",tipo:"pet",titulo:"Gaiola pet",descricao:"Base para descanso e acesso voluntário."},
  {id:"gaiola",tipo:"viveiro",titulo:"Viveiro",descricao:"Espaço amplo para movimentação e voo."},
  {id:"exercicio-pet",tipo:"playground",titulo:"Playground",descricao:"Atividades fora da gaiola com supervisão."},
  {id:"enriquecimento-pet",tipo:"brinquedo",titulo:"Brinquedos seguros",descricao:"Explore, rasgue e manipule materiais apropriados."},
  {id:"enriquecimento-pet",tipo:"forrageamento",titulo:"Forrageamento",descricao:"Estimule a busca pela alimentação habitual."},
  {id:"poleiros",tipo:"poleiro",titulo:"Poleiros e balanços",descricao:"Variedade de diâmetros e posições seguras."},
];

function Ave({x=0,y=0}) {
  return <g transform={`translate(${x} ${y})`} strokeLinejoin="round">
    <path d="M-4 12 L-15 35 L0 24 L9 10" fill="#45786A" stroke="#285B48" strokeWidth="1.5"/>
    <ellipse cx="0" cy="0" rx="13" ry="19" transform="rotate(-24)" fill="#77B784" stroke="#285B48" strokeWidth="1.5"/>
    <path d="M-6 0Q8-6 7 14Q-3 12-6 0" fill="#478C69"/>
    <circle cx="7" cy="-16" r="10" fill="#8BCC84" stroke="#285B48" strokeWidth="1.5"/>
    <path d="M9-7Q17-10 20-16Q16-21 14-17" fill="#C9754A"/>
    <circle cx="10" cy="-17" r="1.8" fill="#203D32"/>
    <path d="M-1 18v5m8-6v6" stroke="#88694D" strokeWidth="2"/>
  </g>;
}
function Ilustracao({tipo}) {
  const green="#4D8B68", dark="#285B48", wood="#A67850";
  return <svg viewBox="0 0 240 144" className="h-auto w-full" role="img" aria-label={"Ilustração educativa de "+itens.find(i=>i.tipo===tipo)?.titulo} xmlns="http://www.w3.org/2000/svg">
    <rect width="240" height="144" rx="14" fill="#EDF6EF"/>
    <ellipse cx="120" cy="126" rx="86" ry="7" fill="#D5E8D8"/>
    {tipo==="pet" && <g strokeLinecap="round" strokeLinejoin="round">
      <rect x="65" y="49" width="110" height="62" rx="5" stroke={dark} strokeWidth="2.5" fill="white"/>
      {[77,89,101,113,125,137,149,161].map(x=><line key={x} x1={x} y1="49" x2={x} y2="111" stroke={green} strokeWidth="1.2"/>)}
      <path d="M65 49Q70 20 100 18M175 49Q170 20 140 18" fill="none" stroke={dark} strokeWidth="2.5"/>
      <path d="M99 18h42" stroke={wood} strokeWidth="6"/>
      <path d="M66 111h108v8H66z" fill={green} stroke={dark} strokeWidth="2"/>
      <path d="M90 83h62" stroke={wood} strokeWidth="5"/>
      <Ave x={120} y={-6}/>
    </g>}
    {tipo==="viveiro" && <g strokeLinejoin="round">
      <rect x="30" y="24" width="180" height="92" rx="3" fill="white" stroke={dark} strokeWidth="3"/>
      {[42,54,66,78,90,102,114,126,138,150,162,174,186,198].map(x=><line key={x} x1={x} x2={x} y1="24" y2="116" stroke="#8BB49A" strokeWidth="1"/>)}
      {[40,56,72,88,104].map(y=><line key={y} x1="30" x2="210" y1={y} y2={y} stroke="#BDD8C1" strokeWidth="1"/>)}
      <path d="M45 87h48m55-30h48" stroke={wood} strokeWidth="6" strokeLinecap="round"/>
      <Ave x={69} y={64}/><Ave x={172} y={34}/>
      <path d="M102 69h35m-5-5 6 5-6 5" fill="none" stroke={green} strokeWidth="2" strokeLinecap="round"/>
    </g>}
    {tipo==="playground" && <g strokeLinecap="round">
      <rect x="49" y="115" width="142" height="10" rx="5" fill={wood}/>
      <path d="M83 116V40m71 76V31M63 42h74m-5-9h44m-93 46h81" stroke={wood} strokeWidth="7" fill="none"/>
      <path d="M105 116l49-75m-40 59 14 9m-4-23 14 9m-4-23 14 9" stroke="#B89064" strokeWidth="4"/>
      <Ave x={100} y={18}/>
    </g>}
    {tipo==="brinquedo" && <g strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 9v107" stroke={dark} strokeWidth="3"/>
      <circle cx="120" cy="16" r="7" fill="none" stroke={dark} strokeWidth="3"/>
      <rect x="93" y="27" width="54" height="17" rx="4" fill="#C48A57" transform="rotate(-10 120 35)"/>
      <rect x="84" y="49" width="72" height="19" rx="3" fill="#78B38B" transform="rotate(8 120 58)"/>
      <path d="M91 73l58 5-9 21-43-2z" fill="#E4BA75"/>
      <path d="M101 99l-4 19m13-18-1 22m12-21 3 20m7-22 6 19" stroke="#A67850" strokeWidth="3"/>
      <circle cx="72" cy="58" r="13" fill="#BD8E61"/><circle cx="72" cy="58" r="5" fill="#EDF6EF"/>
      <circle cx="169" cy="79" r="12" fill="#77B784"/><circle cx="169" cy="79" r="5" fill="#EDF6EF"/>
    </g>}
    {tipo==="forrageamento" && <g strokeLinejoin="round">
      <path d="M61 65h118l-10 43H71z" fill="#DDBA85" stroke={wood} strokeWidth="2"/>
      <path d="M65 68l21-22 19 18 18-26 23 26 18-20 12 25" fill="#F8E6BC" stroke={wood} strokeWidth="2"/>
      {[94,113,132,151].map((x,i)=><ellipse key={x} cx={x} cy={83+i%2*10} rx="5" ry="3" fill="#89633E"/>)}
      <Ave x={82} y={37}/>
    </g>}
    {tipo==="poleiro" && <g strokeLinecap="round">
      <path d="M42 30h74m-37 0v78M54 108h50" stroke={wood} strokeWidth="7"/>
      <path d="M146 21l-13 64m42-64 13 64" stroke={green} strokeWidth="3"/>
      <path d="M129 85h63" stroke={wood} strokeWidth="7"/>
      <Ave x={79} y={8}/>
      <path d="M29 116Q72 102 112 115" stroke="#C69E70" strokeWidth="5" fill="none"/>
    </g>}
  </svg>;
}

export default function GuiaVisual({onPergunta, disabled=false}) {
 return <div className="space-y-2" aria-label="Guia visual de ambiente e enriquecimento">
   <h3 className="text-sm font-bold text-[#234332]">Conheça os ambientes e acessórios</h3>
   <p className="text-xs text-[#607366]">Ilustrações educativas, não modelos comerciais nem escala de dimensões. Clique para aprender.</p>
   <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
    {itens.map(item => <button key={item.tipo} type="button" disabled={disabled} onClick={()=>onPergunta(item.id)} className="group min-w-0 overflow-hidden rounded-xl border border-[#D7E6DA] bg-white p-2 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-50">
      <Ilustracao tipo={item.tipo}/>
      <strong className="mt-2 flex items-center justify-between gap-1 text-sm text-[#234332]">{item.titulo}<ArrowRight size={14} className="shrink-0 text-emerald-700"/></strong>
      <span className="mt-1 block text-xs leading-4 text-[#607366]">{item.descricao}</span>
    </button>)}
   </div>
 </div>;
}
