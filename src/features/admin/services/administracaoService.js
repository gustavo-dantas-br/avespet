import {
  checkIsAdmin,
  listTodosAnunciosParaAdmin,
  listPerfisPublicos,
  listAchadosAnilha,
  listAnunciosAvesPerdidasAdmin,
} from "../../../lib/db";

// Carrega os dados exclusivos do painel administrativo.
// As consultas auxiliares de achados e aves perdidas mantem fallback vazio.
export async function carregarDadosAdministracao(userId) {
  const isAdminUser = await checkIsAdmin(userId);

  if (!isAdminUser) {
    return {
      isAdminUser: false,
      anunciosAprovacao: [],
      perfisPublicos: [],
      achados: [],
      anunciosPerdidasAdmin: [],
    };
  }

  const [anunciosAprovacao, perfisPublicos, achados, anunciosPerdidasAdmin] = await Promise.all([
    listTodosAnunciosParaAdmin(),
    listPerfisPublicos(),
    listAchadosAnilha().catch(() => []),
    listAnunciosAvesPerdidasAdmin().catch(() => []),
  ]);

  return {
    isAdminUser: true,
    anunciosAprovacao,
    perfisPublicos,
    achados,
    anunciosPerdidasAdmin,
  };
}
