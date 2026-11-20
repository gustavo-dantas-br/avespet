// Centavos inteiros. CPM de R$12–30 e frequência 1,5–2 são hipóteses de planejamento.
export function fichaMeta(p) {
 const gross=Number(p.media_cents)||0, tax=Math.round(gross*(Number(p.media_tax_bps??1215))/10000), net=gross-tax, days=Number(p.duration_days)||0;
 const daily=days>0?Math.round(net/days):0;
 const min= Math.floor(net/600)*100, max=Math.floor(net/180)*100;
 const companyTax=Math.round((Number(p.price_cents)||0)*(Number(p.company_tax_bps)||0)/10000);
 const result=(Number(p.price_cents)||0)-gross-(Number(p.operating_cents)||0)-companyTax;
 return {gross,tax,net,daily,days,min,max,companyTax,result,paid:p.code!=="destaque"&&gross>0};
}
export function fichaTexto(p,format) {const f=fichaMeta(p);if(!f.paid)return p.name+" — destaque no site, sem anúncios Meta.";return [p.name,"Objetivo: Reconhecimento — maximizar alcance, se disponível.","Orçamento total da campanha: "+format(f.net),"Verba bruta reservada: "+format(f.gross),"Reserva de tributos Meta: "+format(f.tax),"Média diária (referência): "+format(f.daily),"Duração: "+f.days+" dias completos, após aprovação e pagamento.","Local: endereço/ponto onde a ave foi vista pela última vez. Raio: "+p.radius_km+" km; conferir mapa e limitar expansão geográfica.","Público: 18+, todos os gêneros, sem interesses obrigatórios. Facebook e Instagram: Feed, Stories e Reels compatíveis.","Criativo: foto real autorizada, espécie, região, data, chamada para informar avistamentos; link do anúncio Avespet. Não divulgar endereço residencial ou contato privado.","Antes de publicar: conferir impostos na conta, mínimo de orçamento, previsão de alcance Meta, datas e limite total; não aumentar verba sem aprovação.","Monitoramento diário: gasto, alcance, impressões, frequência, CPM e contatos úteis; pausar ao confirmar reencontro.","Alcance estimado (não garantia): "+f.min.toLocaleString("pt-BR")+" a "+f.max.toLocaleString("pt-BR")+" pessoas."].join("\n");}
