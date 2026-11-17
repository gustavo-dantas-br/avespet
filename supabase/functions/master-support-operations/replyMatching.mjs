// Regras puras para relacionar uma resposta a um envio verificado do Avespet.
// Nunca concede acesso ao anúncio nem extrai conteúdo das mensagens.
export function emailAddress(value) {
  const source = String(value ?? "").trim();
  const bracketed = source.match(/<([^<>]+)>/);
  const candidate = (bracketed ? bracketed[1] : source).trim().toLowerCase();
  return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(candidate) ? candidate : "";
}
export function normalizeSubject(value) {
  let subject = String(value ?? "").normalize("NFC").trim();
  for (let i = 0; i < 8; i++) {
    const withoutPrefix = subject.replace(/^(?:re|res|enc|fw|fwd)\s*:\s*/i, "").trim();
    if (withoutPrefix === subject) break;
    subject = withoutPrefix;
  }
  return subject.replace(/\s+/g, " ").toLocaleLowerCase("pt-BR");
}
export function validTimestamp(value) {
  const time = Date.parse(String(value ?? ""));
  return Number.isFinite(time) && time > Date.parse("2025-01-01");
}
/**
 * Uma conversa só pode ser associada quando existe um envio anterior para a
 * conta do titular, a partir da caixa oficial. Para e-mails antigos sem ID
 * persistido, também exige assunto exato e validação externa de unicidade.
 */
export function findVerifiedReplies({
  messages, ownerEmail, supportEmail, expectedSubject,
  linkedSentIds = [], allowLegacy = false, preparedAt = "",
}) {
  const owner = emailAddress(ownerEmail);
  const support = emailAddress(supportEmail);
  if (!owner || !support || !Array.isArray(messages)) return [];
  const sentIds = new Set(linkedSentIds.filter(Boolean));
  const subject = normalizeSubject(expectedSubject);
  const preparedTime = validTimestamp(preparedAt) ? Date.parse(preparedAt) : 0;
  const outbound = messages.filter(m =>
    m?.direction === "outbound" && emailAddress(m.from) === support &&
    Array.isArray(m.to) && m.to.some(to => emailAddress(to) === owner) &&
    validTimestamp(m.received_at || m.created_at || m.sent_at)
  );
  const anchors = outbound.filter(m => {
    if (sentIds.has(m.id)) return true;
    return allowLegacy && subject &&
      normalizeSubject(m.subject) === subject &&
      preparedTime > 0 && Date.parse(m.received_at || m.created_at || m.sent_at) >= preparedTime;
  });
  if (!anchors.length) return [];
  const start = Math.min(...anchors.map(m => Date.parse(m.received_at || m.created_at || m.sent_at)));
  return messages.filter(m => {
    if (m?.direction !== "inbound" || !m.id || emailAddress(m.from) !== owner) return false;
    if (!Array.isArray(m.to) || !m.to.some(to => emailAddress(to) === support)) return false;
    const timestamp = m.received_at || m.created_at;
    return validTimestamp(timestamp) && Date.parse(timestamp) > start;
  }).map(m => ({
    providerEmailId: String(m.id),
    receivedAt: String(m.received_at || m.created_at),
  }));
}
