// Proposta inicial: preços não publicados nem habilitados para cobrança.
export const PLANOS_IMPULSIONAMENTO = Object.freeze([
  { id: "gratuito", nome: "Divulgação gratuita", precoCentavos: 0, dias: null, midiaCentavos: 0, raioKm: null, categoria: "organico", descricao: "Publicação gratuita e edição do anúncio, sujeita à moderação." },
  { id: "destaque", nome: "Destaque Avespet", precoCentavos: 2990, dias: 7, midiaCentavos: 0, raioKm: null, categoria: "interno", descricao: "Destaque na plataforma; não inclui anúncios pagos." },
  { id: "local", nome: "Alerta Local", precoCentavos: 11990, dias: 3, midiaCentavos: 6000, raioKm: 5, categoria: "meta", descricao: "Campanha geográfica no Facebook e Instagram." },
  { id: "regional", nome: "Alerta Regional", precoCentavos: 22990, dias: 7, midiaCentavos: 14000, raioKm: 10, categoria: "meta", descricao: "Campanha regional com acompanhamento e relatório." },
  { id: "intensiva", nome: "Busca Intensiva", precoCentavos: 39990, dias: 10, midiaCentavos: 27000, raioKm: 15, categoria: "meta", descricao: "Campanha regional ampliada com relatório." },
]);

export const STATUS_PEDIDO = Object.freeze([
  "rascunho", "aguardando_pagamento", "pagamento_confirmado", "em_analise",
  "aprovado", "ativo", "pausado", "concluido", "cancelado", "reembolsado",
]);

export const dinheiro = (centavos) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);

export function validarPlano(plano) {
  if (!plano || !Number.isInteger(plano.precoCentavos) || !Number.isInteger(plano.midiaCentavos)) return false;
  return plano.precoCentavos >= 0 && plano.midiaCentavos >= 0 && plano.midiaCentavos <= plano.precoCentavos;
}
