import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

// O cadastro exige sessão autenticada. A política RLS também valida o proprietário.
export async function criarAnuncioPerdida(userId, dados) {
  if (!userId) throw new Error("Entre na sua conta para cadastrar uma ave perdida.");
  const id = dados.id || globalThis.crypto.randomUUID();
  const { error } = await supabase.from(TABELA).insert({
    id,
    user_id: userId,
    data: dados,
    status: "pendente",
  });

  if (error) throw error;
  return id;
}

export async function listarMinhasAvesPerdidas(userId) {
  if (!userId) throw new Error("Sessão não identificada.");
  const { data, error } = await supabase
    .from(TABELA)
    .select("id, data, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function listarAvesPerdidas() {
  const { data, error } = await supabase.rpc("listar_aves_perdidas_publicas");
  if (error) throw error;
  return data || [];
}
