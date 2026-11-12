import { supabase } from "../supabaseClient";

// A permissão Master é validada no servidor; a interface não decide privilégios.
export async function checkIsMaster() {
  const { data, error } = await supabase.functions.invoke("master-check-access", {
    body: {},
  });

  if (error) {
    // Antes da implantação da função, falhar fechado sem conceder painel Master.
    throw error;
  }
  if (typeof data?.isMaster !== "boolean") {
    throw new Error("Resposta inválida ao validar acesso Master.");
  }
  return data.isMaster;
}
