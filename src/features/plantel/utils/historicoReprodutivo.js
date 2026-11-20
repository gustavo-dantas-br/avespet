// Resumo somente leitura. Os dados e status continuam sendo definidos no módulo Reprodução.
const ATIVOS = new Set(["Incubando", "Fertil"]);
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const mesmoId = (a, b) => a !== null && a !== undefined && a !== "" && b !== null && b !== undefined && b !== "" && String(a) === String(b);
export function formatarDataReproducao(valor) {
  if (!DATA_ISO.test(String(valor || ""))) return valor || "Data não informada";
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return "Data inválida";
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`;
}
export function previsaoOvoSomenteLeitura(postura, ovo) {
  if (!ATIVOS.has(ovo.status) || !DATA_ISO.test(String(ovo.dataPostura || ""))) return null;
  const partes = ovo.dataPostura.split("-").map(Number);
  const data = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
  if (data.getUTCFullYear() !== partes[0] || data.getUTCMonth() !== partes[1] - 1 || data.getUTCDate() !== partes[2]) return null;
  const dias = Number(postura.diasIncubacao) || 24;
  if (!Number.isFinite(dias) || dias < 1 || dias > 100) return null;
  data.setUTCDate(data.getUTCDate() + Math.trunc(dias));
  return formatarDataReproducao(data.toISOString().slice(0, 10));
}
export function listarHistoricoReprodutivo(ave, posturas = [], aves = []) {
  if (!ave?.id) return [];
  return posturas.filter((p) => mesmoId(p.paiId, ave.id) || mesmoId(p.maeId, ave.id))
    .map((postura) => {
      const ovos = Array.isArray(postura.ovos) ? postura.ovos : [];
      const pai = aves.find((a) => mesmoId(a.id, postura.paiId));
      const mae = aves.find((a) => mesmoId(a.id, postura.maeId));
      const resumo = { total: ovos.length, incubando: 0, ferteis: 0, inferteis: 0, perdidos: 0, nascidos: 0 };
      ovos.forEach((ovo) => {
        if (ovo.status === "Incubando") resumo.incubando += 1;
        if (ovo.status === "Fertil") resumo.ferteis += 1;
        if (ovo.status === "Infertil") resumo.inferteis += 1;
        if (ovo.status === "Perdido") resumo.perdidos += 1;
        if (ovo.status === "Nasceu") resumo.nascidos += 1;
      });
      const ordenados = [...ovos].sort((a, b) => Number(a.n || 0) - Number(b.n || 0));
      return {
        ...postura, pai, mae, resumo,
        primeiraData: ovos.map((o) => o.dataPostura).filter((x) => DATA_ISO.test(String(x))).sort()[0] || "",
        ovosDetalhados: ordenados.map((ovo) => ({
          ...ovo,
          previsao: previsaoOvoSomenteLeitura(postura, ovo),
          filhote: ovo.aveId ? aves.find((a) => mesmoId(a.id, ovo.aveId)) || null : null,
        })),
      };
    })
    .sort((a, b) => (b.primeiraData || b.criadoEm || "").localeCompare(a.primeiraData || a.criadoEm || ""));
}
