// Modelo do locus parblue e dos modificadores de dosagem em Ring Neck.
// G = verde, T = turquesa, B = azul. O fenotipo segue a hierarquia G > T > B.
// A inferencia a partir da cor visual so e feita quando nao ha genotipo explicito.

export const ALELOS_SERIE_COR = Object.freeze({
  GREEN: "G",
  TURQUOISE: "T",
  BLUE: "B",
});

const ORDEM = ["G", "T", "B"];
const normalizarTexto = (valor) => String(valor || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function normalizarGenotipoSerie(genotipo) {
  if (!Array.isArray(genotipo) || genotipo.length !== 2) {
    throw new Error("Informe dois alelos para o locus da serie de cor.");
  }
  const alelos = genotipo.map((alelo) => String(alelo).toUpperCase());
  if (alelos.some((alelo) => !ORDEM.includes(alelo))) {
    throw new Error("Alelo invalido. Use G, T ou B.");
  }
  return alelos.sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b));
}

export function descricaoGenotipoSerie(genotipo) {
  const nomes = {
    "G/G": "Verde sem azul ou turquesa conhecido",
    "G/T": "Verde que carrega turquesa",
    "G/B": "Verde que carrega azul",
    "T/T": "Turquesa",
    "T/B": "Azul-turquesa",
    "B/B": "Azul",
  };
  return nomes[genotipo] || "combinação genética não identificada";
}

export function fenotipoSerieCor(genotipo) {
  const [a, b] = normalizarGenotipoSerie(genotipo);
  if (a === "G" && b === "G") return { nome: "Verde", genotipo: "G/G", visual: "Green", portador: null };
  if (a === "G" && b === "T") return { nome: "Verde portador de turquesa", genotipo: "G/T", visual: "Green", portador: "Turquoise" };
  if (a === "G" && b === "B") return { nome: "Verde portador de azul", genotipo: "G/B", visual: "Green", portador: "Blue" };
  if (a === "T" && b === "T") return { nome: "Turquesa", genotipo: "T/T", visual: "Turquoise", portador: null };
  if (a === "T" && b === "B") return { nome: "Azul-turquesa", genotipo: "T/B", visual: "Turquoise Blue", portador: null };
  return { nome: "Azul", genotipo: "B/B", visual: "Blue", portador: null };
}

// Retorna [G,G], [G,T], [G,B], [T,T], [T,B] ou [B,B].
// Para aves verdes, o campo portadores deve identificar apenas um alelo parblue.
// Quando a informacao nao e suficiente, retorna null em vez de presumir G/G.
export function genotipoSerieDaAve(ave = {}) {
  const explicito = ave.serieCorGenotipo;
  if (Array.isArray(explicito)) return normalizarGenotipoSerie(explicito);
  if (typeof explicito === "string" && explicito.includes("/")) {
    return normalizarGenotipoSerie(explicito.split("/"));
  }

  const visuais = [ave.corMutacao, ...(ave.mutacoesVisuais || []), ave.corBase]
    .map(normalizarTexto).filter(Boolean);
  const texto = visuais.join(" ");
  // Cobalto e Mauve são apresentações da série azul com dosagem Dark:
  // Cobalto = um fator escuro; Mauve = dois fatores escuros.
  // A cor-base continua sendo Azul (B/B).
  if (texto.includes("cobalto") || texto.includes("cobalt") || texto.includes("mauve") || texto.includes("malva")) return ["B", "B"];
  if (texto.includes("turquoise blue") || texto.includes("azul turquesa")) return ["T", "B"];
  if (texto.includes("blue") || texto.includes("azul")) return ["B", "B"];
  if (texto.includes("turquoise") || texto.includes("turquesa")) return ["T", "T"];

  if (texto.includes("green") || texto.includes("verde")) {
    const portadores = (ave.portadores || []).map(normalizarTexto);
    const carregaT = portadores.some((p) => p === "turquoise" || p === "turquesa");
    const carregaB = portadores.some((p) => p === "blue" || p === "azul");
    if (carregaT && carregaB) return null;
    if (carregaT) return ["G", "T"];
    if (carregaB) return ["G", "B"];
    return null;
  }
  return null;
}

export function cruzarSerieCor(genotipoPai, genotipoMae) {
  const pai = normalizarGenotipoSerie(genotipoPai);
  const mae = normalizarGenotipoSerie(genotipoMae);
  const resultados = new Map();
  for (const aleloPai of pai) {
    for (const aleloMae of mae) {
      const fenotipo = fenotipoSerieCor([aleloPai, aleloMae]);
      const atual = resultados.get(fenotipo.genotipo) || { ...fenotipo, probabilidade: 0 };
      atual.probabilidade += 25;
      resultados.set(fenotipo.genotipo, atual);
    }
  }
  return [...resultados.values()]
    .map(({ probabilidade, ...fenotipo }) => ({ ...fenotipo, percentual: probabilidade }))
    .sort((a, b) => b.percentual - a.percentual || a.genotipo.localeCompare(b.genotipo));
}

// NONE representa ausencia confirmada; campo vazio significa informacao desconhecida.
export function dosagemFator(valor) {
  if (valor === "NONE" || valor === "0" || valor === 0) return 0;
  if (valor === "SF" || valor === 1) return 1;
  if (valor === "DF" || valor === 2) return 2;
  return null;
}

// Usa a dosagem informada pelo criador quando existe. Quando a aparência
// identifica inequivocamente um modificador conhecido, pode inferir o Dark:
// Azul = sem fator; Cobalto = fator simples; Mauve = fator duplo.
// Não infere Violet nem tenta deduzir fatores a partir de cores ambíguas.
export function dosagemFatorDaAve(ave = {}, chave = "darkFactor") {
  const valorInformado = ave.fatoresGeneticos?.[chave];
  const informada = dosagemFator(valorInformado);
  if (informada !== null) return informada;

  // Regra de produto aprovada para o Avespet: quando o criador não informa
  // Violet Factor, considerar SF por padrão. DF só será usado quando escolhido.
  // NONE continua disponível para representar ausência confirmada.
  if (chave === "violetFactor" && (valorInformado === undefined || valorInformado === null || valorInformado === "")) {
    return 1;
  }
  if (chave !== "darkFactor") return null;

  const nomes = [ave.corMutacao, ...(ave.mutacoesVisuais || []), ave.corBase, ave.corAparencia]
    .map(normalizarTexto).filter(Boolean);
  if (nomes.some((nome) => nome.includes("cobalto") || nome.includes("cobalt"))) return 1;
  if (nomes.some((nome) => nome.includes("mauve") || nome.includes("malva"))) return 2;
  if (nomes.some((nome) => nome === "azul" || nome === "blue" || nome === "blue (azul)")) return 0;
  return null;
}

export function cruzarDosagemFator(dosagemPai, dosagemMae, nome) {
  if (![0, 1, 2].includes(dosagemPai) || ![0, 1, 2].includes(dosagemMae)) return [];
  const gametas = (dose) => dose === 0 ? [0, 0] : dose === 1 ? [0, 1] : [1, 1];
  const resultados = new Map();
  for (const a of gametas(dosagemPai)) {
    for (const b of gametas(dosagemMae)) {
      const dose = a + b;
      resultados.set(dose, (resultados.get(dose) || 0) + 25);
    }
  }
  return [...resultados.entries()].map(([dose, percentual]) => ({
    dosagem: dose,
    nome: dose === 0 ? `${nome}: sem fator` : `${nome}: ${dose === 1 ? "SF (fator simples)" : "DF (duplo fator)"}`,
    percentual,
  })).sort((a, b) => a.dosagem - b.dosagem);
}

export const NOTAS_SERIE_COR = [
  "A cor visivel nem sempre revela o genotipo: aves verdes podem carregar alelos azul ou turquesa.",
  "Turquoise Blue e representado aqui pelo heterozigoto T/B.",
  "A aparência verde, sem histórico ou descendência, não permite confirmar se a ave carrega azul ou turquesa.",
  "Dark Factor e Violet Factor sao modificadores independentes e seus resultados sao apresentados como fatores, sem prometer uma tonalidade visual especifica.",
];
