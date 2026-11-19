import { supabase } from "../../supabaseClient";
import { validarVinculo, paraBanco, doBanco } from "./diarioMapeamento";
import { validarRegistro } from "./diarioValidacao";

// Não habilitar até a migração e os testes RLS entre contas serem aprovados.
// Nenhuma chave administrativa deve ser usada no navegador.
export const DIARIO_PERSISTENCIA_ATIVA = false;

function verificarAcesso(userId, aveId) {
  if (!DIARIO_PERSISTENCIA_ATIVA) throw new Error("O diário permanente ainda está em preparação.");
  const erro = validarVinculo({ userId, aveId });
  if (erro) throw new Error(erro);
}

export async function listarDiario(userId, aveId) {
  verificarAcesso(userId, aveId);
  const { data, error } = await supabase.from("avespet_ia_diario")
    .select("id, ave_id, data_registro, peso_gramas, fase_alimentar, observacoes")
    .eq("user_id", userId).eq("ave_id", aveId)
    .order("data_registro", { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map(doBanco);
}

export async function salvarDiario(userId, aveId, registro) {
  verificarAcesso(userId, aveId);
  const erro = validarRegistro(registro);
  if (erro) throw new Error(erro);
  const { data, error } = await supabase.from("avespet_ia_diario")
    .insert({ user_id: userId, ave_id: aveId, ...paraBanco(registro) })
    .select("id").single();
  if (error) throw error;
  return data.id;
}

export async function excluirRegistroDiario(userId, aveId, registroId) {
  verificarAcesso(userId, aveId);
  if (!registroId) throw new Error("Registro obrigatório.");
  const { error } = await supabase.from("avespet_ia_diario").delete()
    .eq("id", registroId).eq("user_id", userId).eq("ave_id", aveId);
  if (error) throw error;
}
