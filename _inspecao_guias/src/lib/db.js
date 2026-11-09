import { supabase } from "../supabaseClient";

export function uid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

export async function listRows(table, userId) {
  const { data, error } = await supabase.from(table).select("id, data").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id }));
}

export async function saveRow(table, userId, obj) {
  const id = obj.id || uid();
  const payload = { ...obj, id };
  const { error } = await supabase.from(table).upsert({ id, user_id: userId, data: payload, updated_at: new Date().toISOString() });
  if (error) throw error;
  return id;
}

export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Perfil do criador (uma linha por usuario, chave = user_id) ----------
export async function getPerfil(userId) {
  const { data, error } = await supabase.from("perfil_criador").select("data").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? data.data : null;
}

export async function savePerfil(userId, perfilData) {
  const { error } = await supabase.from("perfil_criador").upsert({
    user_id: userId,
    data: perfilData,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ---------- Anuncios (tem colunas proprias ave_id/ativo, alem do data jsonb) ----------
export async function listAnuncios(userId) {
  const { data, error } = await supabase.from("anuncios").select("id, ave_id, ativo, status, data, visualizacoes, cliques").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, aveId: r.ave_id, ativo: r.ativo, status: r.status, visualizacoes: r.visualizacoes, cliques: r.cliques }));
}

export async function saveAnuncio(userId, anuncio) {
  const id = anuncio.id || uid();
  const { error } = await supabase.from("anuncios").upsert({
    id,
    user_id: userId,
    ave_id: anuncio.aveId,
    ativo: anuncio.ativo !== false,
    data: anuncio,
  });
  if (error) throw error;
  return id;
}

export async function deleteAnuncio(id) {
  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Administracao (Fase 8D) ----------
export async function checkIsAdmin(userId) {
  const { data, error } = await supabase.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

// So retorna dado se o usuario logado for admin (garantido pela RLS: a
// policy "admin ve todos os anuncios" so libera linha pra quem esta na
// tabela admins - um usuario comum so veria os proprios, como sempre).
export async function listTodosAnunciosParaAdmin() {
  const { data, error } = await supabase.from("anuncios").select("id, user_id, ave_id, ativo, status, data");
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, userId: r.user_id, aveId: r.ave_id, ativo: r.ativo, status: r.status }));
}

export async function updateAnuncioStatus(id, status) {
  const { error } = await supabase.from("anuncios").update({ status }).eq("id", id);
  if (error) throw error;
}

// Nomes/whatsapp dos criadores - usado no painel de aprovacao pra identificar
// quem publicou cada anuncio. A tabela perfil_criador ja tem leitura publica.
export async function listPerfisPublicos() {
  const { data, error } = await supabase.from("perfil_criador").select("user_id, data");
  if (error) throw error;
  return (data || []).map((r) => ({ userId: r.user_id, ...r.data }));
}

// ---------- Aves perdidas/encontradas (Fase 8E) ----------
export async function listPerdidas(userId) {
  const { data, error } = await supabase.from("perdidas").select("id, ave_id, status, data").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, aveId: r.ave_id, status: r.status }));
}

export async function savePerdida(userId, perdida) {
  const id = perdida.id || uid();
  const { error } = await supabase.from("perdidas").upsert({
    id,
    user_id: userId,
    ave_id: perdida.aveId,
    status: perdida.status || "perdida",
    data: perdida,
  });
  if (error) throw error;
  return id;
}

export async function deletePerdida(id) {
  const { error } = await supabase.from("perdidas").delete().eq("id", id);
  if (error) throw error;
}

// Busca publica por anilha - funciona sem login, ve registros de QUALQUER
// criador (a policy de leitura publica da tabela 'perdidas' permite isso).
export async function buscarPerdidaPorAnilha(anilha) {
  const termo = (anilha || "").trim();
  if (!termo) return [];
  const { data, error } = await supabase
    .from("perdidas")
    .select("id, user_id, status, data")
    .ilike("data->>anilha", `%${termo}%`);
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.data, id: r.id, userId: r.user_id, status: r.status }));
}

// ---------- Vitrine publica de anuncios + metricas (Fase 8F) ----------
export async function listAnunciosPublicos() {
  const { data, error } = await supabase
    .from("anuncios")
    .select("id, user_id, ave_id, ativo, status, data, visualizacoes, cliques")
    .eq("ativo", true)
    .eq("status", "aprovado");
  if (error) throw error;
  return (data || []).map((r) => ({
    ...r.data, id: r.id, userId: r.user_id, aveId: r.ave_id,
    ativo: r.ativo, status: r.status, visualizacoes: r.visualizacoes, cliques: r.cliques,
  }));
}

export async function incrementarVisualizacaoAnuncio(anuncioId) {
  const { error } = await supabase.rpc("incrementar_visualizacao_anuncio", { anuncio_id: anuncioId });
  if (error) throw error;
}

export async function incrementarCliqueAnuncio(anuncioId) {
  const { error } = await supabase.rpc("incrementar_clique_anuncio", { anuncio_id: anuncioId });
  if (error) throw error;
}

// ---------- Busca geral por anilha - mediada pelo admin (Fase 8F) ----------
export async function registrarAchadoAnilha(anilha, nome, telefone, mensagem, endereco, foto) {
  const { error } = await supabase.rpc("registrar_achado_anilha", {
    p_anilha: anilha, p_nome: nome, p_telefone: telefone, p_mensagem: mensagem || "",
    p_endereco: endereco || "", p_foto: foto || "",
  });
  if (error) throw error;
}

// So funciona se o usuario logado estiver na tabela admins (RLS garante isso)
export async function listAchadosAnilha() {
  const { data, error } = await supabase.from("achados_anilha").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function atualizarStatusAchado(id, status) {
  const { error } = await supabase.from("achados_anilha").update({ status }).eq("id", id);
  if (error) throw error;
}

// ---------- Conteudo publico: guias e videos ----------
const ARTIGO_COLUNAS = "id, slug, titulo, resumo, corpo, especie, categoria, video_url, publicado, publicado_em, atualizado_em";

function artigoDeLinha(r) {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    resumo: r.resumo || "",
    corpo: r.corpo || "",
    especie: r.especie || "Geral",
    categoria: r.categoria || "",
    videoUrl: r.video_url || "",
    publicado: !!r.publicado,
    publicadoEm: r.publicado_em || "",
    atualizadoEm: r.atualizado_em || "",
  };
}

// Lista leve (sem o texto inteiro) - so o que esta publicado (a RLS tambem garante isso)
export async function listArtigosPublicos() {
  const { data, error } = await supabase
    .from("artigos")
    .select("id, slug, titulo, resumo, especie, categoria, video_url, publicado, publicado_em")
    .eq("publicado", true)
    .order("publicado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map(artigoDeLinha);
}

export async function getArtigoPorSlug(slug) {
  const { data, error } = await supabase.from("artigos").select(ARTIGO_COLUNAS).eq("slug", slug).eq("publicado", true).maybeSingle();
  if (error) throw error;
  return data ? artigoDeLinha(data) : null;
}

// Conta uma visita (a funcao no banco so aceita paginas que existem)
export async function registrarVisita(caminho) {
  const { error } = await supabase.rpc("registrar_visita", { p_caminho: caminho });
  if (error) throw error;
}

// ---- so admin (a RLS barra qualquer outro usuario) ----
export async function listArtigosAdmin() {
  const { data, error } = await supabase.from("artigos").select(ARTIGO_COLUNAS).order("atualizado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map(artigoDeLinha);
}

export async function saveArtigo(a) {
  const id = a.id || uid();
  const agora = new Date().toISOString();
  const { error } = await supabase.from("artigos").upsert({
    id,
    slug: a.slug,
    titulo: a.titulo,
    resumo: a.resumo || null,
    corpo: a.corpo,
    especie: a.especie || "Geral",
    categoria: a.categoria || null,
    video_url: a.videoUrl || null,
    publicado: !!a.publicado,
    publicado_em: a.publicadoEm || (a.publicado ? agora : null),
    atualizado_em: agora,
  });
  if (error) throw error;
  return id;
}

export async function deleteArtigo(id) {
  const { error } = await supabase.from("artigos").delete().eq("id", id);
  if (error) throw error;
}

export async function listVisitas(dias = 30) {
  const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase.from("visitas_diarias").select("dia, caminho, total").gte("dia", desde);
  if (error) throw error;
  return data || [];
}
