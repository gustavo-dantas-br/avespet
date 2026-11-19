import { supabase } from "../../supabaseClient";

// Serviço pronto para uma futura ativação, DESLIGADO até que a tabela e RLS sejam auditadas.
// Nunca utilizar chave service_role no navegador.
export const DIARIO_PERSISTENCIA_ATIVA = false;

function checarHabilitacao() {
  if (!DIARIO_PERSISTENCIA_ATIVA) throw new Error("Armazenamento do Diário Avespet IA ainda não está habilitado.");
}

export async function listarDiario(userId, aveId) {
  checarHabilitacao();
  if (!userId || !aveId) throw new Error("Usuário e ave são obrigatórios.");
  const { data, error } = await supabase.from("avespet_ia_diario")
    .select("id, ave_id, data_registro, peso_gramas, fase_alimentar, observacoes, criado_em")
    .eq("user_id", userId).eq("ave_id", aveId).order("data_registro", { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function salvarDiario({ userId, aveId, dataRegistro, pesoGramas, faseAlimentar, observacoes }) {
  checarHabilitacao();
  if (!userId || !aveId) throw new Error("Usuário e ave são obrigatórios.");
  const { data, error } = await supabase.from("avespet_ia_diario").insert({
    user_id: userId,
    ave_id: aveId,
    data_registro: dataRegistro,
    peso_gramas: pesoGramas,
    fase_alimentar: faseAlimentar,
    observacoes,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}
