// Contrato interno para futura integração com Asaas. Não realiza requests HTTP.
import { ASAAS_PAGAMENTOS_ATIVOS } from "./asaasConfig.js";

export function prepararCheckout({ pedidoId, planoCodigo }) {
  if (!ASAAS_PAGAMENTOS_ATIVOS) {
    return Object.freeze({ habilitado: false, motivo: "Contratações suspensas até ativação do Asaas.", pedidoId, planoCodigo });
  }
  // Fail-closed: mesmo que alguém altere o sinal no frontend, falta o endpoint
  // autorizado no servidor. Nunca criar cobranças diretamente no navegador.
  throw new Error("Checkout indisponível: operação financeira depende do backend autenticado.");
}

export function classificarEventoAsaas(evento) {
  const id = evento?.id, tipo = evento?.event, paymentId = evento?.payment?.id;
  if (typeof id !== "string" || !id || typeof tipo !== "string" || !tipo || typeof paymentId !== "string" || !paymentId) {
    return { valido: false, erro: "Evento inválido ou incompleto." };
  }
  // Classificação informativa, NÃO é validação de autenticidade e NÃO altera pedidos.
  return { valido: true, eventoId: id, tipo, paymentId, requerConferencia: true };
}
