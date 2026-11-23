// Sugestões determinísticas a partir de dados existentes no painel do criador.
// Sem notificações, dados médicos ou automações em segundo plano.
export function buildCreatorActions({aves=[],posturas=[],clientes=[],rep={},posVendasPendentes=0,STATUS_PLANTEL=["No plantel","A venda","Reservada"]}={}){
 const result=[];
 if(aves.length===0) result.push({id:"first-bird",level:"start",title:"Cadastre sua primeira ave",detail:"Comece seu plantel para liberar o acompanhamento individual.",tab:"form"});
 else {
  const unsynced=aves.filter(a=>a.synced===false).length;
  if(unsynced>0)result.push({id:"sync",level:"attention",title:`${unsynced} registro(s) ainda não sincronizado(s)`,detail:"Confira a conexão antes de depender desses dados.",tab:"lista"});
  if((rep.atrasados||0)>0)result.push({id:"eggs-late",level:"attention",title:`${rep.atrasados} ovo(s) após a data prevista`,detail:"Confira a postura e o histórico; a previsão não determina a viabilidade.",tab:"reproducao"});
  if((rep.previstos7||0)>0)result.push({id:"eggs-due",level:"upcoming",title:`${rep.previstos7} nascimento(s) previstos em 7 dias`,detail:"Acompanhe a incubação e as condições de manejo.",tab:"reproducao"});
  if(posVendasPendentes>0)result.push({id:"followup",level:"attention",title:`${posVendasPendentes} pós-venda(s) pendente(s)`,detail:"Acompanhe o comprador e registre o retorno.",tab:"posvenda"});
  const unknown=aves.filter(a=>STATUS_PLANTEL.includes(a.status) && !a.sexado).length;
  if(unknown>0)result.push({id:"sexing",level:"upcoming",title:`${unknown} ave(s) sem sexagem registrada`,detail:"Organize os laudos quando houver, sem presumir o sexo.",tab:"lista",filter:"sem-sexagem"});
  if(clientes.length===0)result.push({id:"customers",level:"start",title:"Organize seus contatos de clientes",detail:"Centralize o relacionamento para futuros acompanhamentos.",tab:"clientes"});
 }
 return result.slice(0,5);
}
