import { lerNascimento } from "./resumoAve.js";

// Grupos visuais sugeridos, nunca ninhadas confirmadas. Conserva os vínculos originais.
// Mesmo casal + datas completas dentro de no máximo 14 dias desde o primeiro nascimento.
// Não agrupa datas parciais (mês/ano ou apenas ano) como se fossem uma ninhada.
const JANELA_DIAS = 14;
const chavePais = (ave) => [ave.paiId || ave.paiExterno || "pai-desconhecido", ave.maeId || ave.maeExterno || "mae-desconhecida"].map(String).join("|");
const dataDoNascimento = (ave) => {
  const d = lerNascimento(ave.nascimento);
  return d?.precisao === "dia" ? Date.UTC(d.ano, d.mes - 1, d.dia) : null;
};
const formatar = (ms) => {
  const data = new Date(ms);
  return `${String(data.getUTCDate()).padStart(2, "0")}/${String(data.getUTCMonth() + 1).padStart(2, "0")}/${data.getUTCFullYear()}`;
};

export function agruparFilhotesPorNascimento(filhotes = []) {
  const comData = [], semDataExata = [];
  filhotes.forEach((ave) => {
    const data = dataDoNascimento(ave);
    if (data === null) semDataExata.push(ave);
    else comData.push({ ave, data, casal: chavePais(ave) });
  });
  comData.sort((a, b) => b.data - a.data || String(a.ave.nome || "").localeCompare(String(b.ave.nome || ""), "pt-BR"));
  const grupos = [];
  for (const item of comData) {
    const grupo = grupos.find((g) =>
      g.casal === item.casal && g.maisAntigo - item.data <= JANELA_DIAS * 86400000 && g.maisAntigo >= item.data
    );
    if (grupo) {
      grupo.aves.push(item.ave);
      grupo.maisAntigo = item.data;
    } else grupos.push({ casal: item.casal, maisRecente: item.data, maisAntigo: item.data, aves: [item.ave] });
  }
  const resultado = grupos.map((g) => ({
    chave: `${g.casal}-${g.maisRecente}`,
    titulo: g.aves.length === 1 ? "Nascimento registrado" : "Possível mesma ninhada",
    periodo: g.maisRecente === g.maisAntigo ? formatar(g.maisRecente) : `${formatar(g.maisAntigo)} a ${formatar(g.maisRecente)}`,
    aves: g.aves,
    estimado: true,
  }));
  if (semDataExata.length) resultado.push({
    chave: "datas-incompletas", titulo: "Nascimento sem data completa",
    periodo: "Apenas mês/ano, ano ou data não informada",
    aves: semDataExata.sort((a,b) => String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")),
    estimado: false,
  });
  return resultado;
}
