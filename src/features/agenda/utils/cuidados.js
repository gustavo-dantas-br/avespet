// Datas são informadas explicitamente pelo criador, sem cálculo terapêutico.
export function eventosCuidados(registros=[],aves=[]){
 const nomes=new Map(aves.map(a=>[String(a.id),a.nome||a.anilha||"Ave"]));
 return registros.flatMap(r=>{
  const nome=nomes.get(String(r.ave_id))||"Ave";
  const produto=r.produto||"Produto não informado";
  const tipo=r.tipo==="vitamina"?"Vitamina":"Medicamento";
  const base={tipo:"cuidados",origem:"cuidados",registro:r};
  const events=[{...base,id:"admin:"+r.id,dia:r.data_aplicacao,titulo:`${tipo} registrado · ${nome} · ${produto}`,feito:true}];
  if(r.proxima_data)events.push({...base,id:"next:"+r.id,dia:r.proxima_data,titulo:`Lembrete informado · ${nome} · ${produto}`,feito:false});
  return events;
 });
}
export function registroValido(r,ids){
 return !!r.produto?.trim() && ids.has(String(r.ave_id)) && /^\d{4}-\d{2}-\d{2}$/.test(r.data_aplicacao||"") && (!r.proxima_data || r.proxima_data>=r.data_aplicacao);
}

export function prepararNovaAdministracao(registro,hoje){
 return {ave_id:registro.ave_id,tipo:registro.tipo,produto:registro.produto,
 data_aplicacao:hoje,proxima_data:"",quantidade_informada:"",observacao:""};
}
export function mesSeguinte(mes){
 const [ano,m]=mes.split("-").map(Number);
 const d=new Date(ano,m,1,12);
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0")].join("-");
}
