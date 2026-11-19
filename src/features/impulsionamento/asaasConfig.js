// Preparação para Asaas Checkout. Nenhum segredo, cobrança ou SDK no cliente.
// Ativar exclusivamente após cadastro empresarial, homologação de segurança e liberação explícita.
export const ASAAS_PAGAMENTOS_ATIVOS = false;
export const ASAAS_AMBIENTE = "sandbox";
export const ASAAS_METODOS_PREVISTOS = Object.freeze(["PIX", "CREDIT_CARD"]);
export const ASAAS_TIPOS_PREVISTOS = Object.freeze(["DETACHED"]);

// Nunca habilitar a partir de dados da URL, localStorage ou preferências do usuário.
// Este sinal é informativo; autorização financeira efetiva deverá ocorrer no servidor.
export function situacaoAsaas() {
  return Object.freeze({
    ativo: ASAAS_PAGAMENTOS_ATIVOS,
    ambiente: ASAAS_AMBIENTE,
    motivo: "Aguardando CNPJ, credenciais Asaas, testes em sandbox e confirmação de webhook no servidor.",
    metodos: ASAAS_METODOS_PREVISTOS,
  });
}
