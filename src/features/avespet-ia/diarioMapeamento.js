// Mapeamento puro entre o formulário do Diário e a tabela Supabase.
// Não executa nenhuma chamada externa. Mantém regras de negócio testáveis.
const FASE_PARA_BANCO = Object.freeze({
  "não informado": "nao_informada",
  "alimentação assistida": "assistida",
  "experimentando sólidos": "transicao",
  "alimentação independente": "independente",
});
const FASE_DO_BANCO = Object.freeze(Object.fromEntries(Object.entries(FASE_PARA_BANCO).map(([k,v]) => [v,k])));

export function validarVinculo({ userId, aveId }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(userId || "")))
    return "Usuário inválido.";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(aveId || "")))
    return "Selecione uma ave cadastrada.";
  return null;
}
export function paraBanco(registro) {
  if (!Object.hasOwn(FASE_PARA_BANCO, registro.alimentacao)) throw new Error("Fase alimentar inválida.");
  return {
    data_registro: registro.data,
    peso_gramas: registro.peso === "" ? null : Number(registro.peso),
    fase_alimentar: FASE_PARA_BANCO[registro.alimentacao],
    observacoes: String(registro.observacoes || "").trim(),
  };
}
export function doBanco(row) {
  return {
    id: row.id,
    data: row.data_registro,
    peso: row.peso_gramas === null || row.peso_gramas === undefined ? "" : String(row.peso_gramas),
    alimentacao: FASE_DO_BANCO[row.fase_alimentar] || "não informado",
    observacoes: row.observacoes || "",
  };
}
