import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

export async function criarAnuncioPerdida(dados) {
  const { data, error } = await supabase.from(TABELA).insert({
    data: dados,
    status: "pendente",
  }).select("id").single();
  if (error) throw error;
  return data.id;
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
