// Somente apresentação: os valores originais continuam intactos no banco,
// no plantel e nos cálculos. Nomes populares primeiro, genética entre parênteses.
// Ordem crescente: cores básicas → fatores → ino/pallid → mutações adicionais.
export const APARENCIAS_COMUNS_RING_NECK = Object.freeze([
  { value: "Green (Verde)", label: "Verde (Green)", ordem: 1, tipo: "base" },
  { value: "Blue (Azul)", label: "Azul (Blue)", ordem: 2, tipo: "base" },
  { value: "Turquoise (Turquesa)", label: "Turquesa (Turquoise)", ordem: 3, tipo: "base" },
  { value: "Turquoise Blue (Azul Turquesa)", label: "Azul-turquesa (Turquoise Blue)", ordem: 4, tipo: "base" },
  { value: "Cobalto", label: "Cobalto (Dark SF)", ordem: 5, tipo: "fator", base: "Blue (Azul)", dark: "SF" },
  { value: "Mauve", label: "Malva (Dark DF)", ordem: 6, tipo: "fator", base: "Blue (Azul)", dark: "DF" },
  { value: "Violeta", label: "Violeta (Violet SF)", ordem: 7, tipo: "fator", base: "Blue (Azul)", violet: "SF" },
  { value: "Grey (Cinza)", label: "Cinza (Grey SF)", ordem: 8, tipo: "fator", base: "Blue (Azul)" },
  { value: "Grey Green (Cinza-verde)", label: "Cinza-verde (Grey SF)", ordem: 9, tipo: "fator", base: "Green (Verde)" },
  { value: "popular|Lutino", label: "Lutino (Ino, série verde)", ordem: 10, tipo: "ino" },
  { value: "popular|Albino", label: "Albino (Ino, série azul)", ordem: 11, tipo: "ino" },
  { value: "popular|Cremino", label: "Cremino (Ino, série turquesa)", ordem: 12, tipo: "ino" },
]);

const ALIAS_MUTACOES = Object.freeze([
  ["Pallid azul", "Pálido azul (Pallid Blue)", 13],
  ["Pallid (Palido)", "Pálido (Pallid)", 14],
  ["Pallid (Pálido)", "Pálido (Pallid)", 14],
  ["Pallid", "Pálido (Pallid)", 14],
  ["Cinnamon (Canela)", "Canela (Cinnamon)", 15],
  ["Opaline (Opalino)", "Opalino (Opaline)", 16],
  ["Cleartail (Cauda clara)", "Cauda clara (Cleartail)", 17],
  ["Recessive Pied (Arlequim recessivo)", "Arlequim recessivo (Recessive Pied)", 18],
  ["Dominant Pied (Arlequim dominante)", "Arlequim dominante (Dominant Pied)", 19],
  ["Bronze Fallow (Fallow bronze)", "Fallow bronze (Bronze Fallow)", 20],
  ["Clearhead Fallow (Fallow cabeca clara)", "Fallow cabeça clara (Clearhead Fallow)", 21],
  ["Dun Fallow (Fallow dun)", "Fallow dun (Dun Fallow)", 22],
  ["Dilute (Diluicao)", "Diluído (Dilute)", 23],
  ["Recessive Edged (Borda recessiva)", "Borda recessiva (Recessive Edged)", 24],
  ["Dominant Edged (Borda dominante)", "Borda dominante (Dominant Edged)", 25],
  ["Khaki (Cáqui / Misty)", "Cáqui (Khaki / Misty)", 26],
  ["Dominant Dilute (Diluicao dominante)", "Diluição dominante (Dominant Dilute)", 27],
  ["Mottle (Arlequim progressivo)", "Arlequim progressivo (Mottle)", 28],
  ["Grizzle (Grizzle)", "Grizzle", 29],
  ["Clear Flight (Asas claras)", "Asas claras (Clear Flight)", 30],
  ["Ino (Lutino / Albino conforme a serie)", "Lutino / Albino (Ino, conforme a série)", 10],
]);

const norm = (s) => String(s || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const mapNomes = new Map();
for (const item of APARENCIAS_COMUNS_RING_NECK) mapNomes.set(norm(item.value), item.label);
for (const [value, label] of ALIAS_MUTACOES) mapNomes.set(norm(value), label);
const rankNomes = new Map();
for (const item of APARENCIAS_COMUNS_RING_NECK) rankNomes.set(norm(item.value), item.ordem);
for (const [value, , ordem] of ALIAS_MUTACOES) rankNomes.set(norm(value), ordem);

export function mostrarNomePopularRingNeck(valor) {
  const nome = String(valor || "");
  if (!nome) return nome;
  if (mapNomes.has(norm(nome))) return mapNomes.get(norm(nome));
  if (nome === "Violet SF (Violeta)") return "Violeta (Violet SF)";
  if (nome === "Violet DF (Violeta duplo fator)") return "Violeta (Violet DF)";
  const compostos = [
    ["Violet Cobalt (Violeta cobalto)", "Violeta Cobalto (Violet SF + Dark SF)"],
    ["Violet DF Cobalt (Violeta DF cobalto)", "Violeta Cobalto (Violet DF + Dark SF)"],
    ["Violet Mauve (Violeta malva)", "Violeta Malva (Violet SF + Dark DF)"],
    ["Violet DF Mauve (Violeta DF malva)", "Violeta Malva (Violet DF + Dark DF)"],
    ["Cobalt (Cobalto)", "Cobalto (Dark SF)"],
    ["Mauve (Malva)", "Malva (Dark DF)"],
    ["Grey (Cinza)", "Cinza (Grey SF)"],
    ["Grey Green (Cinza-verde)", "Cinza-verde (Grey SF)"],
    ["Turquoise Blue (Azul-turquesa)", "Azul-turquesa (Turquoise Blue)"],
    ["Green (Verde) / Blue (Azul)", "Verde portador de Azul (Green / Blue)"],
    ["Green (Verde) / Turquoise (Turquesa)", "Verde portador de Turquesa (Green / Turquoise)"],
    ["PallidIno (LutinoPallid)", "LutinoPallid (PallidIno)"],
    ["Pallid (Pálido)", "Pálido (Pallid)"],
    ["Albino (Ino azul)", "Albino (Ino, série azul)"],
    ["Lutino (Ino verde)", "Lutino (Ino, série verde)"],
    ["Ino (série Turquesa)", "Ino turquesa (Ino, série Turquesa)"],
    ["Green (Verde)", "Verde (Green)"],
    ["Blue (Azul)", "Azul (Blue)"],
    ["Turquoise (Turquesa)", "Turquesa (Turquoise)"],
  ];
  // O motor pode retornar a série e cada fator separadamente.
  // Converta o conjunto para a cor popular, sem alterar os percentuais.
  const tokens = nome.split(" · ");
  const temBlue = tokens.some((v)=>norm(v)==="blue (azul)");
  if (temBlue && tokens.some((v)=>/^dark (sf|df)$/i.test(v))) {
    const dark = tokens.some((v)=>/^dark df$/i.test(v)) ? "DF" : "SF";
    const violet = tokens.some((v)=>/^violet df$/i.test(v)) ? "DF"
      : tokens.some((v)=>/^violet sf$/i.test(v)) ? "SF" : "";
    const semBase = tokens.filter((v)=>![
      "blue (azul)", "dark sf", "dark df", "violet sf", "violet df",
    ].includes(norm(v)));
    const principal = violet
      ? (dark === "SF" ? "Violeta Cobalto" : "Violeta Malva") +
        " (Violet " + violet + " + Dark " + dark + ")"
      : dark === "SF" ? "Cobalto (Dark SF)" : "Malva (Dark DF)";
    return [principal, ...semBase.map(v=>mostrarNomePopularRingNeck(v))].join(" · ");
  }
  if (temBlue && tokens.some((v)=>/^violet (sf|df)$/i.test(v))) {
    const violet = tokens.some((v)=>/^violet df$/i.test(v)) ? "DF" : "SF";
    const semBase=tokens.filter((v)=>!["blue (azul)","violet sf","violet df"].includes(norm(v)));
    return ["Violeta (Violet "+violet+")", ...semBase.map(v=>mostrarNomePopularRingNeck(v))].join(" · ");
  }
  // Reconhece o nome completo antes dos fragmentos para não perder a
  // apresentação popular de Cobalto Violeta, Malva Violeta etc.
  const partes = nome.split(" · ");
  return partes.map((parte) => {
    const direto = compostos.find(([de]) => norm(de) === norm(parte));
    if (direto) return direto[1];
    if (/^grey (sf|df)$/i.test(parte)) return "Cinza (" + parte + ")";
    if (/^violet (sf|df)$/i.test(parte)) return "Violeta (" + parte + ")";
    if (/^dark (sf|df)$/i.test(parte)) return "Fator escuro (" + parte + ")";
    return mapNomes.get(norm(parte)) || parte;
  }).join(" · ");
}

export function ordemNomeRingNeck(nome) {
  return rankNomes.get(norm(nome)) ?? 1000;
}

export function ordenarMutacoesRingNeck(mutacoes) {
  return [...(mutacoes || [])].sort((a, b) => {
    const n1 = typeof a === "string" ? a : a.nome;
    const n2 = typeof b === "string" ? b : b.nome;
    const d = ordemNomeRingNeck(n1) - ordemNomeRingNeck(n2);
    return d || mostrarNomePopularRingNeck(n1).localeCompare(mostrarNomePopularRingNeck(n2), "pt-BR");
  });
}
