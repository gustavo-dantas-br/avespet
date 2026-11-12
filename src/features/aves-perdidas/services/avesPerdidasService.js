import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

// Visitantes podem enviar ocorrências pendentes; a política RLS valida os campos
// obrigatórios e impede que registros públicos sejam publicados diretamente.
export async function criarAnuncioPerdida(userId, dados) {
  const id = dados.id || globalThis.crypto.randomUUID();
  const { error } = await supabase.from(TABELA).insert({
    id,
    user_id: userId || null,
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
