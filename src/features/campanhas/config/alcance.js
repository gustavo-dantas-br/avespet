// Faixas iniciais de planejamento, não dados históricos nem previsões oficiais da Meta.
// Exibir somente para os valores de referência aprovados. Uma alteração de preço
// não deve reutilizar uma estimativa antiga; o catálogo de alcance dinâmico será
// integrado ao orçamento real no backend em etapa posterior.
const referencias = Object.freeze({
 bairro: {preco:11990,min:800,max:2900},
 cidade: {preco:22990,min:2000,max:6800},
 regional: {preco:39990,min:3900,max:13100},
});
export function alcanceEstimado(code, priceCents) {
 const r=referencias[code];
 return r && r.preco===priceCents ? {min:r.min,max:r.max} : null;
}
export function formatarAlcance({min,max}) {const nf=new Intl.NumberFormat("pt-BR");return nf.format(min)+" a "+nf.format(max);}
