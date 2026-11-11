import { supabase } from "../../../supabaseClient";

const TABELA = "anuncios_aves_perdidas";

export async function criarAnuncioPerdida(dados) {
  // O ID e gerado no cliente para permitir vincular a solicitacao de campanha
  // sem fazer SELECT do anuncio pendente (bloqueado pelo RLS publico).
  const id = dados.id || globalThis.crypto.randomUUID();
  const { error } = await supabase.from(TABELA).insert({
    id,
    data: dados,
    status: "pendente",
  });

  if (error) throw error;
  return id;
}

export async function listarAvesPerdidas() {
  const { data, error } = await supabase.rpc("listar_aves_perdidas_publicas");
  if (error) throw error;
  return data || [];
}
