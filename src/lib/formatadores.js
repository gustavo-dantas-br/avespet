// Formatadores de data e moeda usados nas telas do sistema.

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function primeiroDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMeses);
  return d.toISOString().slice(0, 10);
}
function ultimoDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMeses + 1, 0);
  return d.toISOString().slice(0, 10);
}
function primeiroDiaAnoISO() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
}

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export { hojeISO, primeiroDiaMesISO, ultimoDiaMesISO, primeiroDiaAnoISO, money };
