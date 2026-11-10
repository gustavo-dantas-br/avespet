import { supabase } from "../../../supabaseClient";

const TABELA = "solicitacoes_campanhas_aves";

export async function solicitarCampanha(dados) {
  const { error } = await supabase.from(TABELA).insert({
    anuncio_id: dados.anuncioId || null,
    pacote: dados.pacote,
    nome_contato: dados.nome.trim(),
    whatsapp: dados.whatsapp.trim(),
    email: dados.email?.trim() || null,
    cidade: dados.cidade.trim(),
    uf: dados.uf.trim().toUpperCase(),
    area_alvo: dados.areaAlvo.trim(),
    descricao_ave: dados.descricaoAve.trim(),
    status: "solicitada",
  });
  if (error) throw error;
}

export async function listarCampanhasAdmin() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("id, pacote, nome_contato, whatsapp, email, cidade, uf, area_alvo, descricao_ave, status, valor, observacoes_admin, created_at, atualizado_em")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function atualizarCampanhaAdmin(id, alteracoes) {
  const permitidos = ["solicitada", "em_orcamento", "aguardando_pagamento", "paga", "em_execucao", "concluida", "cancelada"];
  if (alteracoes.status && !permitidos.includes(alteracoes.status)) throw new Error("Status de campanha inválido.");
  const atualizacao = {};
  if (alteracoes.status) atualizacao.status = alteracoes.status;
  if (alteracoes.valor !== undefined) atualizacao.valor = alteracoes.valor === "" ? null : Number(alteracoes.valor);
  if (alteracoes.observacoes_admin !== undefined) atualizacao.observacoes_admin = alteracoes.observacoes_admin;
  atualizacao.atualizado_em = new Date().toISOString();
  const { error } = await supabase.from(TABELA).update(atualizacao).eq("id", id);
  if (error) throw error;
}
