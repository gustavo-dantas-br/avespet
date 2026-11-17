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
// A aparência Violeta sozinha não distingue com segurança SF de DF.
export function dosagemFatorDaAve(ave = {}, chave = "darkFactor") {
  const informada = dosagemFator(ave.fatoresGeneticos?.[chave]);
  // Validamos Violet depois de ler a aparência, pois "Violeta + NONE"
  // é inconsistente e não autoriza um resultado de 0 cópias.
  if (chave !== "violetFactor" && informada !== null) return informada;

  const nomes = [
    ave.corMutacao,
    ...(ave.mutacoesVisuais || []),
    ave.corBase,
    ave.corAparencia,
    ave.corLivre,
  ].map(normalizarTexto).filter(Boolean);

  if (chave === "violetFactor") {
    // Nenhuma cor-base comprova a ausência do fator Violet.
    // Azul, Verde e Turquesa podem apresentar o fator com expressão visual
    // variável. Só "NONE" informado explicitamente equivale a ausência.
    // A aparência Violeta confirma sua presença, sem definir SF ou DF.
    const violetaVisual = nomes.some((nome) => nome.includes("violet") || nome.includes("violeta"));
    if (violetaVisual && informada === 0) return null; // Dados contraditórios.
    return informada;
  }

  if (chave !== "darkFactor") return null;
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


export function nomeFenotipoComFatoresRingNeck(genotipo, doseDark = 0, doseViolet = 0) {
  const bases = {
    "G/G": "Verde",
    "G/T": "Verde portador de turquesa",
    "G/B": "Verde portador de azul",
    "T/T": "Turquesa",
    "T/B": "Azul-turquesa",
    "B/B": "Azul",
  };
  let nome = bases[genotipo] || descricaoGenotipoSerie(genotipo);

  if (genotipo === "B/B") {
    nome = doseDark === 2 ? "Mauve" : doseDark === 1 ? "Cobalto" : "Azul";
  } else if (genotipo === "T/B" && doseDark > 0) {
    nome += doseDark === 2 ? " com fator escuro duplo" : " com fator escuro simples";
  } else if (genotipo === "T/T" && doseDark > 0) {
    nome += doseDark === 2 ? " com fator escuro duplo" : " com fator escuro simples";
  }

  if (doseViolet === 1) nome += "-violeta SF";
  if (doseViolet === 2) nome += "-violeta DF";
  return nome;
}


// Cores e aparências padrão do criador — convenções de SIMULAÇÃO, não laudos.
// Sem mutações ou portadores adicionais, Verde assume G/G, Azul B/B, Turquesa
// T/T, Azul-turquesa T/B, Violeta = Azul Violet SF, Cobalto = Azul Dark SF.
export const APARENCIAS_PADRAO_RING_NECK = Object.freeze([
  { value: "Green (Verde)", label: "Green (Verde)", genotipo: "G/G", dark: 0, violet: 0 },
  { value: "Blue (Azul)", label: "Blue (Azul)", genotipo: "B/B", dark: 0, violet: 0 },
  { value: "Turquoise (Turquesa)", label: "Turquoise (Turquesa)", genotipo: "T/T", dark: 0, violet: 0 },
  { value: "Turquoise Blue (Azul Turquesa)", label: "Turquoise Blue (Azul-turquesa)", genotipo: "T/B", dark: 0, violet: 0 },
  { value: "Violeta", label: "Violet SF (Violeta)", genotipo: "B/B", dark: 0, violet: 1 },
  { value: "Cobalto", label: "Cobalt (Cobalto)", genotipo: "B/B", dark: 1, violet: 0 },
  { value: "Mauve", label: "Mauve (Malva)", genotipo: "B/B", dark: 2, violet: 0 },
]);

function nomeCorPadraoRingNeck(genotipo, dark, violet) {
  if (genotipo !== "B/B") return nomeFenotipoComFatoresRingNeck(genotipo, dark, violet);
  const cor = dark === 2 ? "Mauve (Malva)" : dark === 1 ? "Cobalt (Cobalto)" : "Blue (Azul)";
  if (violet === 2) return cor + " + Violet DF (Violeta duplo fator)";
  if (violet === 1) return dark === 0 ? "Violet SF (Violeta)" : cor + " + Violet SF (Violeta)";
  return cor;
}

function aparenciaPadraoDaAve(ave = {}) {
  if (ave.especie && ave.especie !== "Ring Neck") return null;
  if ((ave.mutacoesVisuais || []).length || (ave.portadores || []).length) return null;
  const primaria = normalizarTexto(ave.corMutacao || ave.corAparencia || ave.corLivre || "");
  const base = normalizarTexto(ave.corBase || "");
  const opcoes = {
    "green (verde)": "Green (Verde)", green: "Green (Verde)", verde: "Green (Verde)",
    "blue (azul)": "Blue (Azul)", blue: "Blue (Azul)", azul: "Blue (Azul)",
    "turquoise (turquesa)": "Turquoise (Turquesa)", turquesa: "Turquoise (Turquesa)", turquoise: "Turquoise (Turquesa)",
    "turquoise blue (azul turquesa)": "Turquoise Blue (Azul Turquesa)",
    "turquoise blue": "Turquoise Blue (Azul Turquesa)",
    "azul turquesa": "Turquoise Blue (Azul Turquesa)",
    violeta: "Violeta", violet: "Violeta",
    "violet sf (violeta)": "Violeta", "violet factor (fator violeta)": "Violeta",
    cobalto: "Cobalto", cobalt: "Cobalto", "cobalt (cobalto)": "Cobalto",
    mauve: "Mauve", malva: "Mauve", "mauve (malva)": "Mauve",
  };
  const selecionada = opcoes[primaria] || (!primaria ? opcoes[base] : null);
  if (!selecionada) return null;
  const padrao = APARENCIAS_PADRAO_RING_NECK.find((item) => item.value === selecionada);
  if (!padrao) return null;
  const serieInformada = ave.serieCorGenotipo;
  if (serieInformada) {
    const serie = Array.isArray(serieInformada) ? serieInformada : String(serieInformada).split("/");
    if (normalizarGenotipoSerie(serie).join("/") !== padrao.genotipo) return null;
  }
  const baseInformada = base ? opcoes[base] : null;
  if (base && baseInformada !== selecionada && !(padrao.genotipo === "B/B" && baseInformada === "Blue (Azul)")) return null;
  const doses = { dark: padrao.dark, violet: padrao.violet };
  const informacoes = ave.fatoresGeneticos || {};
  for (const [chave, propriedade] of [["darkFactor", "dark"], ["violetFactor", "violet"]]) {
    if (informacoes[chave] !== undefined && informacoes[chave] !== "") {
      const dose = dosagemFator(informacoes[chave]);
      if (dose === null) return null;
      if (selecionada === "Violeta" && chave === "violetFactor" && dose === 0) return null;
      if ((selecionada === "Cobalto" || selecionada === "Mauve") && chave === "darkFactor" && dose !== padrao.dark) return null;
      doses[propriedade] = dose;
    }
  }
  return { genotipo: padrao.genotipo, dark: doses.dark, violet: doses.violet, nome: padrao.label };
}

// Quando o locus Dark segrega com alelos parblue variáveis não é seguro
// multiplicar os percentuais por causa da ligação genética.
export function cruzarAparenciasPadraoRingNeck(pai, mae) {
  const p = aparenciaPadraoDaAve(pai);
  const m = aparenciaPadraoDaAve(mae);
  if (!p || !m) return null;
  const serie = cruzarSerieCor(p.genotipo.split("/"), m.genotipo.split("/"));
  const escuro = cruzarDosagemFator(p.dark, m.dark, "Dark Factor");
  const violeta = cruzarDosagemFator(p.violet, m.violet, "Violet Factor");
  const darkSegrega = escuro.some((item) => item.dosagem > 0);
  const serieFixaAzul = serie.length === 1 && serie[0].genotipo === "B/B";
  const premissas = [
    "As cores simples usam padrões de simulação; o genótipo real pode ser diferente.",
    "O cálculo não inclui portadores nem mutações adicionais.",
    "Se conhecer a genética dos pais, use as informações avançadas para conferir.",
  ];
  if (darkSegrega && !serieFixaAzul) {
    return { tipo: "parcial", serie, escuro, violeta, premissas, pais: [p.nome, m.nome] };
  }
  const mapa = new Map();
  for (const cor of serie) for (const d of escuro) for (const v of violeta) {
    const prob = cor.percentual * d.percentual * v.percentual / 10000;
    if (!prob) continue;
    const nome = nomeCorPadraoRingNeck(cor.genotipo, d.dosagem, v.dosagem);
    mapa.set(nome, (mapa.get(nome) || 0) + prob);
  }
  return {
    tipo: "completo",
    pais: [p.nome, m.nome],
    resultados: [...mapa.entries()].map(([nome, percentual]) => ({ nome, percentual }))
      .sort((a, b) => b.percentual - a.percentual || a.nome.localeCompare(b.nome)),
    premissas,
  };
}

// Adaptador para a tela: o motor usa "completo"/"parcial" como modo de
// cálculo, enquanto a interface identifica esse resultado como "padrao".
// Não deixar ...resultado sobrescrever o discriminador da tela.
export function prepararResultadoPadraoRingNeck(pai, mae) {
  const calculo = cruzarAparenciasPadraoRingNeck(pai, mae);
  if (!calculo) return null;
  const { tipo: modoCalculo, ...dados } = calculo;
  return {
    ...dados,
    tipo: "padrao",
    modoCalculo,
    cruzamento: (pai.nome || "Pai") + " × " + (mae.nome || "Mãe"),
  };
}

export const NOTAS_SERIE_COR = [
  "A cor visivel nem sempre revela o genotipo: aves verdes podem carregar alelos azul ou turquesa.",
  "Turquoise Blue e representado aqui pelo heterozigoto T/B.",
  "A aparência verde, sem histórico ou descendência, não permite confirmar se a ave carrega azul ou turquesa.",
  "Dark Factor e Violet Factor sao modificadores independentes e seus resultados sao apresentados como fatores, sem prometer uma tonalidade visual especifica.",
];
