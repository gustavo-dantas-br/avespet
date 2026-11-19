import { normalizarChaveGenetica } from "./catalogoRingNeck.js";

// Deduplicação somente da apresentação. Nunca muda valores salvos, alelos ou previsões.
// Ino visual é uma característica real, mas Lutino/Albino/Cremino já são escolhas
// explícitas da aparência principal — não devem aparecer uma segunda vez.
const normalize = (name) => normalizarChaveGenetica(name).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

export function chaveAparenciaRingNeck(nome) {
  const n = normalize(nome);
  const principal = n.split(/\s*\(/)[0].trim();
  if (/^(azul|blue)(\s*\(?blue\)?)?$/.test(principal) || principal === "blue" || principal === "azul") return "blue";
  if (principal === "verde" || principal === "green") return "green";
  if (principal === "turquesa" || principal === "turquoise") return "turquoise";
  if (["turquoise blue", "azul turquesa", "azul turquesa", "turquoiseblue"].includes(principal)) return "turquoise-blue";
  if (principal === "lutino" || n.startsWith("lutino (")) return "lutino";
  if (principal === "albino" || n.startsWith("albino (")) return "albino";
  if (principal === "cremino" || n.startsWith("cremino (")) return "cremino";
  if (principal === "ino" || /^ino\s*\(/.test(n)) return "ino";
  if (principal === "violeta" || principal === "violet") return "violet";
  if (principal === "cobalto" || principal === "cobalt") return "cobalt";
  if (principal === "malva" || principal === "mauve") return "mauve";
  if (principal === "cinza" || principal === "grey") return "grey";
  if (principal === "cinza verde" || principal === "grey green") return "grey-green";
  return principal;
}

const TIPOS_JA_REPRESENTADOS = new Set([
  "blue", "green", "turquoise", "turquoise-blue",
  "violet", "cobalt", "mauve", "grey", "grey-green",
  "lutino", "albino", "cremino", "ino",
]);

export function removerAparenciasRepetidasRingNeck(mutationOptions = []) {
  const vistos = new Set();
  return mutationOptions.filter((m) => {
    const chave = chaveAparenciaRingNeck(m?.nome);
    if (!chave || TIPOS_JA_REPRESENTADOS.has(chave) || vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

export function removerOpcoesRepetidasPorId(opcoes = []) {
  const vistos = new Set();
  return opcoes.filter((item) => {
    if (!item?.id || vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
}
