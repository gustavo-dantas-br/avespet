import { supabase } from "../supabaseClient";

// A autorização Master é confirmada pela Edge Function.
// O navegador nunca decide privilégios com base em e-mail ou metadados editáveis.
export async function checkIsMaster(userId) {
  if (!userId) return false;

  const { data, error } = await supabase.functions.invoke("master-check-access", {
    body: {},
  });

  if (error) throw error;
  if (typeof data?.isMaster !== "boolean") {
    throw new Error("Resposta inválida ao validar acesso Master.");
  }
  return data.isMaster;
}
