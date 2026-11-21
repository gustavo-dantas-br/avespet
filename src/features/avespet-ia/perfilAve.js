// Perfil educativo separado do cadastro oficial do plantel.
export const NIVEIS = [{id:"iniciante",label:"Minha primeira ave"},{id:"intermediario",label:"Já tenho experiência"},{id:"experiente",label:"Criador experiente"}];
export const PERFIL_VAZIO = {nivel:"iniciante",especie:"",fase:"incerta",idadeDias:"",nascimento:"",nome:"",sexo:"",mutacao:"",etapaVida:""};
export const ESPECIES = ["Ring Neck","Calopsita","Agapornis","Periquito-australiano","Canário","Papagaio-amazona","Outra"];
const texto=(v,n)=>String(v??"").trim().slice(0,n);
export function idadeEmDias(nascimento, hoje=new Date()) {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento||"")) return null;
 const [y,m,d]=nascimento.split("-").map(Number);
 const dt=new Date(Date.UTC(y,m-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return null;
 const days=Math.round((Date.UTC(hoje.getFullYear(),hoje.getMonth(),hoje.getDate())-dt.getTime())/86400000);
 return days>=0&&days<=30000?days:null;
}
export function especieCanonica(valor) {
 const t=texto(valor,80).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z]/g,"");
 const a=ESPECIES.find(v=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z]/g,"")===t);
 return a || (t ? "Outra" : "");
}
export function normalizarPerfil(p={}) {
 return {...PERFIL_VAZIO,nivel:NIVEIS.some(n=>n.id===p.nivel)?p.nivel:"iniciante",especie:especieCanonica(p.especie),fase:["papa","transicao","desmamada","incerta"].includes(p.fase)?p.fase:"incerta",idadeDias:/^\d{1,5}$/.test(String(p.idadeDias??""))&&Number(p.idadeDias)<=30000?String(p.idadeDias):"",nascimento:idadeEmDias(p.nascimento)!==null?p.nascimento:"",nome:texto(p.nome,60),sexo:["Macho","Fêmea","Não identificado"].includes(p.sexo)?p.sexo:"",mutacao:texto(p.mutacao,80),etapaVida:["filhote","jovem","adulto"].includes(p.etapaVida)?p.etapaVida:""};
}
export function perfilDaAve(ave,nivel="iniciante",extra={}) {
 const sexo=texto(ave?.sexo,30).toLowerCase();
 return normalizarPerfil({...extra,nivel,nome:ave?.nome||"",especie:ave?.especie||"",nascimento:ave?.nascimento||"",idadeDias:extra.idadeDias||"",mutacao:ave?.corMutacao||"",sexo:sexo==="macho"||sexo==="m"?"Macho":sexo==="fêmea"||sexo==="femea"||sexo==="f"?"Fêmea":"Não identificado"});
}
export function idadePerfil(p) {return p.nascimento?idadeEmDias(p.nascimento):p.idadeDias!==""&&Number.isInteger(Number(p.idadeDias))?Number(p.idadeDias):null;}
export function contextoDoPerfil(p) {
 const fase=p.etapaVida==="adulto"?"adulto":p.etapaVida==="filhote"||["papa","transicao"].includes(p.fase)?"filhote":p.etapaVida==="jovem"?"jovem":"";
 return {especie:p.especie==="Outra"?"":p.especie,filhote:fase==="filhote",idadeDias:idadePerfil(p),nome:p.nome,etapa:"inicio",assunto:"ave",faseInformada:fase,casal:null,faseAlimentar:p.fase,nivel:p.nivel,sexo:p.sexo,mutacao:p.mutacao};
}
export function lerPerfilLocal(userId, storage) {
 if(!userId||!storage)return null;
 try {const v=JSON.parse(storage.getItem("avespet:ia:perfil:v1:"+userId)||"null");return v&&v.v===1?{perfil:normalizarPerfil(v.perfil),aveId:texto(v.aveId,80)}:null;} catch{return null;}
}
export function salvarPerfilLocal(userId,perfil,aveId,storage) {
 if(!userId||!storage)throw Error("Armazenamento indisponível");
 storage.setItem("avespet:ia:perfil:v1:"+userId,JSON.stringify({v:1,perfil:normalizarPerfil(perfil),aveId:texto(aveId,80)}));
}
export function validarEdicao(p) {
 if(p.nascimento&&idadeEmDias(p.nascimento)===null)return "Informe uma data de nascimento válida, sem datas futuras.";
 if(p.idadeDias!==""&&(!/^\d{1,5}$/.test(String(p.idadeDias))||Number(p.idadeDias)>30000))return "Informe uma idade em dias válida.";
 if(p.etapaVida==="adulto"&&["papa","transicao"].includes(p.fase))return "Confira a fase alimentar: alimentação assistida em ave adulta exige avaliação veterinária. Use fase não identificada se estiver em dúvida.";
 return null;
}
