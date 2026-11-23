// Lembretes de cuidados, apresentados no sino. Nunca confirmam aplicação automaticamente.
const toDate=iso=>Date.UTC(Number(iso.slice(0,4)),Number(iso.slice(5,7))-1,Number(iso.slice(8,10)));
export function dateSaoPaulo(now=new Date()){
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
 const get=t=>parts.find(x=>x.type===t).value;
 return [get("year"),get("month"),get("day")].join("-");
}
export function agruparLembretes(rows=[],aves=[],today=dateSaoPaulo()){
 const nomes=new Map(aves.map(a=>[String(a.id),a.nome||a.anilha||"Ave"]));
 const groups=new Map();
 for(const r of rows){
  if(!r.proxima_data||!r.ave_id||!r.produto)continue;
  const days=Math.round((toDate(r.proxima_data)-toDate(today))/86400000);
  if(days>1)continue;
  const normalized=r.produto.trim().toLocaleLowerCase("pt-BR");
  const key=[r.proxima_data,r.tipo,normalized].join("|");
  if(!groups.has(key))groups.set(key,{id:key,produto:r.produto,tipo:r.tipo,dia:r.proxima_data,days,aves:[]});
  const group=groups.get(key);
  if(!group.aves.some(a=>a.id===String(r.ave_id)))group.aves.push({id:String(r.ave_id),nome:nomes.get(String(r.ave_id))||"Ave",registro:r});
 }
 return [...groups.values()].sort((a,b)=>a.dia.localeCompare(b.dia)||a.produto.localeCompare(b.produto));
}
