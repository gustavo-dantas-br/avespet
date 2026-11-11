import { emptyPerfilCriador } from "../../../lib/modelos";
import { getPerfil, getPerfilPrivado, savePerfil } from "../../../lib/db";

// Centraliza a leitura e a inicializacao dos dados do criador.
// Mantem o comportamento anterior: dados privados nunca sao incorporados ao perfil publico.
export async function carregarDadosPerfil(user) {
  const [perfilExistente, perfilPrivado] = await Promise.all([
    getPerfil(user.id),
    getPerfilPrivado(user.id),
  ]);

  if (perfilExistente) {
    return { perfil: perfilExistente, perfilPrivado };
  }

  // Dados do cadastro ficam no Auth metadata ate o primeiro acesso.
  const metadata = user.user_metadata || {};
  const nome = (metadata.nome || "").trim();
  const sobrenome = (metadata.sobrenome || "").trim();
  const telefone = (metadata.telefone || metadata.whatsapp || "").trim();

  if (nome || sobrenome || telefone) {
    const perfilInicial = {
      ...emptyPerfilCriador(),
      nome,
      sobrenome,
      nomeCompleto: [nome, sobrenome].filter(Boolean).join(" "),
      telefone,
      whatsapp: telefone,
    };
    await savePerfil(user.id, perfilInicial);
    return { perfil: perfilInicial, perfilPrivado };
  }

  return { perfil: null, perfilPrivado };
}
