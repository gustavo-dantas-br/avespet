// Regras de validação puras para o Diário do Filhote.
// Data local no formato YYYY-MM-DD, sem conversão para UTC.
export function dataHojeLocal(agora = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return [agora.getFullYear(), pad(agora.getMonth() + 1), pad(agora.getDate())].join("-");
}
export function validarRegistro({ data, peso, observacoes }, hoje = dataHojeLocal()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data || "")) return "Informe uma data válida.";
  const ano = Number(data.slice(0, 4));
  if (ano < 2000) return "A data deve ser a partir do ano 2000.";
  const d = new Date(data + "T12:00:00");
  if (Number.isNaN(d.getTime()) || dataHojeLocal(d) !== data) return "Informe uma data válida.";
  if (data > hoje) return "Não registre data futura.";
  if (peso !== "" && (!Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 10000)) return "Informe um peso válido em gramas.";
  if (String(observacoes || "").length > 500) return "A observação deve ter até 500 caracteres.";
  if (peso === "" && !String(observacoes || "").trim()) return "Informe o peso ou uma observação.";
  return null;
}
export function historicoPeso(registros = []) {
  return registros.filter(r => r.peso !== "" && Number.isFinite(Number(r.peso)))
    .map(r => ({ data: r.data, peso: Number(r.peso) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}
