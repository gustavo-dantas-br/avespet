// Valores em centavos. Simulação comercial; não é livro-caixa nem confirma pagamento.
export function validarCentavos(valor) {
  return Number.isSafeInteger(valor) && valor >= 0;
}

export function demonstrativoPlano(plano, { gastoMidiaCentavos = 0, taxasCentavos = 0, custosOperacionaisCentavos = 0 } = {}) {
  if (!plano || ![plano.precoCentavos, plano.midiaCentavos, gastoMidiaCentavos, taxasCentavos, custosOperacionaisCentavos].every(validarCentavos)) {
    throw new RangeError("Informe valores inteiros e não negativos em centavos.");
  }
  const { precoCentavos, midiaCentavos } = plano;
  if (midiaCentavos > precoCentavos) throw new RangeError("A verba de mídia supera o preço do plano.");
  if (gastoMidiaCentavos > midiaCentavos) throw new RangeError("O gasto supera o orçamento de mídia definido.");
  const gestaoCentavos = precoCentavos - midiaCentavos;
  const midiaRestanteCentavos = midiaCentavos - gastoMidiaCentavos;
  const contribuicaoCentavos = precoCentavos - gastoMidiaCentavos - taxasCentavos - custosOperacionaisCentavos;
  return Object.freeze({
    precoCentavos, midiaCentavos, gestaoCentavos,
    gastoMidiaCentavos, midiaRestanteCentavos,
    taxasCentavos, custosOperacionaisCentavos,
    contribuicaoCentavos,
    // Parcela de mídia ainda não gasta; NÃO equivale ao valor legalmente reembolsável.
    baseRevisaoReembolsoCentavos: midiaRestanteCentavos,
  });
}

export function calcularReembolsoSimulado({ totalPagoCentavos, valorSolicitadoCentavos, valorJaReembolsadoCentavos = 0 }) {
  if (![totalPagoCentavos, valorSolicitadoCentavos, valorJaReembolsadoCentavos].every(validarCentavos)) {
    throw new RangeError("Os valores devem ser inteiros não negativos em centavos.");
  }
  if (valorJaReembolsadoCentavos > totalPagoCentavos || valorSolicitadoCentavos > totalPagoCentavos - valorJaReembolsadoCentavos) {
    throw new RangeError("O reembolso simulado excede o saldo disponível.");
  }
  return Object.freeze({
    valorSolicitadoCentavos,
    saldoAposReembolsoCentavos: totalPagoCentavos - valorJaReembolsadoCentavos - valorSolicitadoCentavos,
    // Somente cálculo; a decisão depende de política, contrato e direitos do consumidor.
    precisaRevisaoHumana: true,
  });
}
