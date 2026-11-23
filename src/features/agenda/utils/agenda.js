export function diaLocal(date=new Date()){
 return [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
}
export function addDiasISO(iso,days){
 const [y,m,d]=iso.split("-").map(Number);
 const date=new Date(y,m-1,d,12);
 date.setDate(date.getDate()+days);
 return diaLocal(date);
}
export function eventosReproducao(posturas=[]){
 const events=[];
 for(const p of posturas){
  const casal=(p.casalLabel||"Casal sem nome").trim();
  const prazo=Number(p.diasIncubacao)||24;
  for(const ovo of p.ovos||[]){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(ovo.dataPostura||""))continue;
   if(!["Incubando","Fertil"].includes(ovo.status))continue;
   const dia=addDiasISO(ovo.dataPostura,prazo);
   events.push({id:`ovo:${p.id||"postura"}:${ovo.n}`,dia,titulo:`Eclosão estimada · ${casal} · ovo ${ovo.n}`,tipo:"eclosao",origem:"reproducao",tab:"reproducao"});
  }
 }
 return events.sort((a,b)=>a.dia.localeCompare(b.dia));
}
export function eventosTarefas(tarefas=[]){
 return tarefas.map(t=>({id:`tarefa:${t.id}`,dia:t.dia,titulo:t.titulo,tipo:t.categoria||"manejo",origem:"tarefa",concluida:!!t.concluida,tarefa:t}));
}
export function diasDoMes(mesISO){
 const [y,m]=mesISO.split("-").map(Number);
 const n=new Date(y,m,0).getDate();
 return Array.from({length:n},(_,i)=>`${mesISO}-${String(i+1).padStart(2,"0")}`);
}
