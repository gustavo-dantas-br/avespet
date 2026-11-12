import { listRows } from "../../../lib/db";

// Carrega registros pertencentes ao criador e padroniza o estado de sincronizacao.
// A ordenacao e opcional para preservar a regra especifica de cada tela.
export async function carregarRegistrosUsuario(userId, tabela, ordenarPor = null, direcao = "asc") {
  const items = await listRows(tabela, userId);
  const registros = items.map((item) => ({ ...item, synced: true }));

  if (!ordenarPor) return registros;

  return registros.sort((a, b) => {
    const valorA = a[ordenarPor] || "";
    const valorB = b[ordenarPor] || "";
    const comparacao = String(valorA).localeCompare(String(valorB));
    return direcao === "desc" ? -comparacao : comparacao;
  });
}
