import { supabase } from "../supabaseClient";

// A tabela expõe ao usuário somente a própria autorização (RLS).
// Nenhum privilégio pode ser concedido pelo navegador: INSERT/UPDATE/DELETE
// ficam bloqueados e toda operação administrativa real será validada no servidor.
export async function checkIsMaster(userId) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("master_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Antes da migration Master, a tabela ausente significa sem acesso.
    if (error.code === "42P01" || error.code === "PGRST205") return false;
    throw error;
  }
  return Boolean(data);
}
