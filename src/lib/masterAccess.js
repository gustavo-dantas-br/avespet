import { supabase } from "../supabaseClient";

// A permissão Master é mantida no banco e não depende de metadata editável pelo usuário.
export async function checkIsMaster(userId) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from("master_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}
