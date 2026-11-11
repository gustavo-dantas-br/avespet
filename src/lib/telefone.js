// Utilitarios para normalizacao de telefone e links do WhatsApp.

function normalizeTelefone(t) {
  return (t || "").replace(/\D/g, "");
}

// Monta o link do WhatsApp a partir de um telefone e uma mensagem opcional.
// Funcao pura - nao le nem grava nada, so formata a URL.
function whatsappUrl(telefone, mensagem) {
  let digitos = normalizeTelefone(telefone);
  if (!digitos) return null;
  // Numeros brasileiros digitados sem DDI (10 ou 11 digitos com DDD) precisam
  // do "55" na frente pro link do WhatsApp funcionar.
  if (digitos.length <= 11) digitos = "55" + digitos;
  const base = `https://wa.me/${digitos}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

export { normalizeTelefone, whatsappUrl };
