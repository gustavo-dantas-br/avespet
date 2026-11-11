import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

export async function criarAnuncioPerdida(dados) {
  const { error } = await supabase.from(TABELA).insert({
    data: dados,
    status: "pendente",
  });

  if (error) throw error;

  // Não solicitamos o retorno do registro: anúncios pendentes não podem
  // ser lidos pela política pública de SELECT.
  return null;
}

export async function listarAvesPerdidas() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("id, data, created_at")
    .eq("status", "aprovado")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
