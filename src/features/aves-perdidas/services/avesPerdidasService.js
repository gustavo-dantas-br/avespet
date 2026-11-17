import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

// Novos anúncios entram para moderação. A RLS protege os registros de cada tutor.
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

/**
 * A edição é restrita à conta dona do anúncio pela política RLS do Supabase.
 * Ao salvar, o anúncio volta para "pendente" e sai da vitrine até revisão.
 * A atualização nunca permite alterar diretamente a situação para aprovado.
 */
export async function atualizarMeuAnuncioPerdida(userId, anuncioId, dados) {
  if (!userId || !anuncioId) throw new Error("Entre na sua conta para editar o anúncio.");
  const { data, error } = await supabase
    .from(TABELA)
    .update({ data: dados, status: "pendente" })
    .eq("id", anuncioId)
    .eq("user_id", userId)
    .neq("status", "encerrado")
    .select("id");
  if (error) throw error;
  if (!data || data.length !== 1) {
    throw new Error("Anúncio indisponível para edição. Confirme que está na conta que o cadastrou.");
  }
  return data[0].id;
}
