import test from "node:test";
import assert from "node:assert/strict";
import { ASAAS_PAGAMENTOS_ATIVOS, ASAAS_AMBIENTE } from "../src/features/impulsionamento/asaasConfig.js";
import { prepararCheckout, classificarEventoAsaas } from "../src/features/impulsionamento/asaasGateway.js";

test("cobranças permanecem desativadas até CNPJ e homologação", () => {
  assert.equal(ASAAS_PAGAMENTOS_ATIVOS, false);
  assert.equal(ASAAS_AMBIENTE, "sandbox");
  assert.deepEqual(prepararCheckout({ pedidoId: "teste", planoCodigo: "regional" }).habilitado, false);
});
test("evento incompleto não pode ser classificado como confirmado", () => {
  assert.deepEqual(classificarEventoAsaas({ event: "PAYMENT_RECEIVED" }).valido, false);
});
test("evento completo é apenas classificado, nunca confirma pagamento", () => {
  const evt = classificarEventoAsaas({ id: "evt_123", event: "PAYMENT_RECEIVED", payment: { id: "pay_123" } });
  assert.equal(evt.valido, true);
  assert.equal(evt.requerConferencia, true);
  assert.equal(Object.hasOwn(evt, "pagamentoConfirmado"), false);
});
