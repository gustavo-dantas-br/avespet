import { supabase } from "../supabaseClient";

// A permissão Master é mantida no banco e não depende de metadata editável pelo usuário.
export async function checkIsMaster(userId) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("master_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Antes da migration Master chegar ao banco, a tabela pode não existir.
    // Nesse caso não há como conceder acesso Master: mantenha o usuário no
    // painel comum. Falhas de rede, RLS ou outras consultas continuam bloqueando.
    if (error.code === "42P01" || error.code === "PGRST205") return false;
    throw error;
  }
  return Boolean(data);
}
