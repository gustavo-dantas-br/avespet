// Motor inicial do resultado enxuto para Ring Neck.
// Genética do locus Ino/Pallid: mesmo locus recessivo ligado ao cromossomo Z.
// SF/DF Violet/Grey/Dark são tratados como fatores autossômicos de dosagem.
// Resultados referem-se à proporção dentro de cada sexo (machos ou fêmeas).
// Premissas de cores simples são convenções de simulação, não laudos.

import { COMBINACOES_POPULARES_RING_NECK } from "../data/nomenclaturaRingNeck.js";

export const CORES_RAPIDAS_RING_NECK = Object.freeze([
  { id: "green", label: "Verde (Green)" },
  { id: "blue", label: "Azul (Blue)" },
  { id: "turquoise", label: "Turquesa (Turquoise)" },
  { id: "turquoise-blue", label: "Azul-turquesa (Turquoise Blue)" },
  { id: "cobalt", label: "Cobalto (Dark SF)" },
  { id: "mauve", label: "Malva (Dark DF)" },
  { id: "violet", label: "Violeta (Violet SF)" },
  { id: "grey", label: "Cinza (Grey SF)" },
  { id: "grey-green", label: "Cinza-verde (Grey SF)" },
  { id: "lutino", label: "Lutino (Ino na série verde)" },
  { id: "albino", label: "Albino (Ino na série azul)" },
  { id: "pallid", label: "Pálido (Pallid)" },
  { id: "pallid-blue", label: "Pálido azul (Pallid Blue)" },
  { id: "pallidino", label: "LutinoPallid (PallidIno, macho)" },
  ...COMBINACOES_POPULARES_RING_NECK.map(({ id, label }) => ({ id, label })),
]);
const PRESETS = {
  green: { serie: "G/G" },
  blue: { serie: "B/B" },
  turquoise: { serie: "T/T" },
  "turquoise-blue": { serie: "T/B" },
  violet: { serie: "B/B", violet: 1 },
  cobalt: { serie: "B/B", dark: 1 },
  mauve: { serie: "B/B", dark: 2 },
  grey: { serie: "B/B", grey: 1 },
  "grey-green": { serie: "G/G", grey: 1 },
  lutino: { serie: "G/G", ino: "ino" },
  albino: { serie: "B/B", ino: "ino" },
  pallid: { serie: "G/G", ino: "pallid" },
  "pallid-blue": { serie: "B/B", ino: "pallid" },
  pallidino: { serie: "G/G", ino: "pallidino" },
  ...Object.fromEntries(COMBINACOES_POPULARES_RING_NECK.map(({ id, serie, violet, dark, cinnamon }) =>
    [id, { serie, ...(violet ? {violet} : {}), ...(dark ? {dark} : {}), ...(cinnamon ? {cinnamon:"visual"} : {}) }])),
};
const ORDEM_SERIE = ["G", "T", "B"];
const normalize = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const serieNome = (a) => {
  const [x, y] = a;
  if (x === "G" && y === "G") return "Green (Verde)";
  if (x === "G" && y === "B") return "Green (Verde) / Blue (Azul)";
  if (x === "G" && y === "T") return "Green (Verde) / Turquoise (Turquesa)";
  if (x === "T" && y === "T") return "Turquoise (Turquesa)";
  if (x === "T" && y === "B") return "Turquoise Blue (Azul-turquesa)";
  return "Blue (Azul)";
};
const canonSerie = (alelos) => [...alelos].sort((a,b)=> ORDEM_SERIE.indexOf(a)-ORDEM_SERIE.indexOf(b));
const dose = (v, padrao = 0) => v === "" || v == null ? padrao :
  (v === "SF" || v === "1" || v === 1 ? 1 :
  (v === "DF" || v === "2" || v === 2 ? 2 :
  (v === "NONE" || v === "0" || v === 0 ? 0 : NaN)));
const zAlelos = (estado, sexo) => {
  const alelos = {
    normal: ["N","N"], split_ino: ["N","I"], split_pallid: ["N","P"],
    ino: ["I","I"], pallid: ["P","P"], pallidino: ["I","P"],
  };
  const par = alelos[estado || "normal"];
  if (!par || (sexo === "Femea" && ["split_ino","split_pallid","pallidino"].includes(estado))) return null;
  return sexo === "Macho" ? par : [par[0]];
};
function identificarVisual(ave) {
  const visual = normalize([ave.corAparencia, ave.corMutacao, ave.corBase].filter(Boolean).join(" "));
  const mutacao = normalize(ave.corMutacao);
  const base = normalize(ave.corBase);
  // O cadastro antigo salva a aparência Ino, a série no campo corBase.
  // Ignorar "Ino" aqui transforma erroneamente Albino em Azul comum.
  if (mutacao === "ino" || mutacao === "ino (lutino / albino conforme a serie)") {
    // "Turquoise Blue (Azul Turquesa)" contém Blue/Azul também.
    // Verifique Turquesa antes de Azul para não chamar Cremino de Albino.
    if (base.includes("turquoise") || base.includes("turquesa")) return "";
    if (base.includes("blue") || base.includes("azul")) return "albino";
    if (base.includes("green") || base.includes("verde")) return "lutino";
    return "";
  }
  if (mutacao === "cremino" || mutacao.startsWith("cremino (")) return "";
  for (const comb of COMBINACOES_POPULARES_RING_NECK) {
    if (visual.includes(normalize(comb.value))) return comb.id;
  }
  const temCanela = visual.includes("canela") || visual.includes("cinnamon");
  if (temCanela) {
    if (visual.includes("violeta") || visual.includes("violet")) return "violet-cinnamon";
    if (visual.includes("cobalto") || visual.includes("cobalt")) return "cobalt-cinnamon";
    if (visual.includes("blue") || visual.includes("azul")) return "blue-cinnamon";
  }
  if ((visual.includes("turquesa") || visual.includes("turquoise")) &&
      (visual.includes("violeta") || visual.includes("violet"))) return "turquoise-violet";
  if ((visual.includes("turquesa") || visual.includes("turquoise")) &&
      (visual.includes("cobalto") || visual.includes("cobalt"))) return "turquoise-cobalt";
  if (visual.includes("albino")) return "albino";
  if (visual.includes("pallidino") || visual.includes("pallid-ino") || visual.includes("lutinopallid")) return "pallidino";
  if (visual.includes("lutino") || visual.includes("ino (")) return "lutino";
  if (visual.includes("pallid azul") || visual.includes("pallid blue")) return "pallid-blue";
  if (visual.includes("pallid")) return "pallid";
  if (visual.includes("cinza-verde") || visual.includes("grey green")) return "grey-green";
  if (visual.includes("cinza") || visual.includes("grey")) return "grey";
  if (visual.includes("violet") || visual.includes("violeta")) return "violet";
  if (visual.includes("cobalto") || visual.includes("cobalt")) return "cobalt";
  if (visual.includes("malva") || visual.includes("mauve")) return "mauve";
  if (visual.includes("turquoise blue") || visual.includes("azul turquesa")) return "turquoise-blue";
  if (visual.includes("turquesa") || visual.includes("turquoise")) return "turquoise";
  if (visual.includes("azul") || visual.includes("blue")) return "blue";
  if (visual.includes("verde") || visual.includes("green")) return "green";
  return "";
}

export function criarSelecaoDeAve(ave, sexo) {
  if (!ave) return { cor: "", extras: {}, sexo };
  const cor = ave.cor && PRESETS[ave.cor] ? ave.cor : identificarVisual(ave);
  const portadores = (ave.portadores || []).map(normalize);
  const mutacoesVisuais = (ave.mutacoesVisuais || []).map(normalize);
  const canelaVisual = mutacoesVisuais.some((s)=>s.includes("cinnamon") || s.includes("canela"));
  const canelaPortador = portadores.some((s)=>s.includes("cinnamon") || s.includes("canela"));
  const extras = {
    ...ave.extras,
    violet: ave.extras?.violet ?? dose(ave.fatoresGeneticos?.violetFactor, null),
    dark: ave.extras?.dark ?? dose(ave.fatoresGeneticos?.darkFactor, null),
    grey: ave.extras?.grey ?? (mutacoesVisuais.some((s) => s.includes("grey") || s.includes("cinza")) ? 1 : null),
    cinnamon: ave.extras?.cinnamon || (canelaVisual ? "visual" : (sexo==="Macho" && canelaPortador ? "split" : "")),
  };
  if (sexo === "Femea" && canelaPortador) extras.invalido = "Fêmeas não podem ser portadoras ocultas de Cinnamon (Canela).";
  const splitBlue = portadores.includes("blue") || portadores.includes("azul");
  const splitTurq = portadores.includes("turquoise") || portadores.includes("turquesa");
  if (!extras.split && cor === "green") extras.split = splitBlue ? "blue" : splitTurq ? "turquoise" : "";
  if (!extras.ino) {
    if (sexo === "Macho") {
      const ino = portadores.some((s)=>s.includes("ino") || s.includes("lutino") || s.includes("albino"));
      const pallid = portadores.some((s)=>s.includes("pallid"));
      if (ino && pallid) extras.invalido = "Ino e Pallid são alelos no mesmo locus: confirme qual combinação o macho possui.";
      extras.ino = ino ? "split_ino" : pallid ? "split_pallid" : "";
    }
  }
  const reconhecidas = ["blue","azul","turquoise","turquesa","ino","lutino","albino","pallid","cinnamon","canela"];
  const naoModeladas = [
    ...portadores.filter((s)=> !reconhecidas.some((p)=>s===p || s.startsWith(p+" ("))),
    ...mutacoesVisuais.filter((s)=> !["grey","cinza","cinnamon","canela"].some((p)=>s.includes(p))),
  ];
  return { cor, extras, sexo, nome:ave.nome || "", naoModeladas: [...new Set(naoModeladas)] };
}

function preparar(ave, sexo) {
  const cor = ave.cor;
  const preset = PRESETS[cor];
  if (!preset) return { erro: "Escolha a cor ou aparência dos dois reprodutores." };
  if (sexo === "Femea" && cor === "pallidino") return { erro: "PallidIno é uma combinação de dois alelos no macho (ZZ). Não pode ser selecionada para uma fêmea (ZW)." };
  const e = ave.extras || {};
  if (e.invalido) return { erro: e.invalido };
  let serie = (e.serie || preset.serie).split("/");
  if (serie.length !== 2 || serie.some((a) => !ORDEM_SERIE.includes(a))) return { erro: "Genótipo da série de cor inválido." };
  const split = e.split || "";
  if (split && serie.join("/") === "G/G") {
    if (split !== "blue" && split !== "turquoise") return { erro: "Portador de cor desconhecido." };
    serie = ["G", split === "blue" ? "B" : "T"];
  } else if (split && serie.includes("G") && serie.some((x)=>x!=="G")) {
    return { erro: "Esta ave já tem uma variante da série de cor informada. Não marque outro portador Blue/Turquoise." };
  }
  const ino = e.ino || preset.ino || "normal";
  const z = zAlelos(ino, sexo);
  if (!z) return { erro: "Combinação de Ino/Pallid incompatível com o sexo informado." };
  const cinnamon = e.cinnamon || preset.cinnamon || "normal";
  const cinZ = cinnamon === "normal" ? (sexo==="Macho" ? ["N","N"] : ["N"])
    : cinnamon === "visual" ? (sexo==="Macho" ? ["C","C"] : ["C"])
    : cinnamon === "split" && sexo==="Macho" ? ["N","C"] : null;
  if (!cinZ) return { erro:"Cinnamon (Canela) é ligado ao sexo: fêmeas não podem ser portadoras ocultas." };
  const factors = {
    violet:dose(e.violet, preset.violet || 0),
    grey:dose(e.grey, preset.grey || 0),
    dark:dose(e.dark, preset.dark || 0),
  };
  if (Object.values(factors).some((v)=>!Number.isInteger(v)||v<0||v>2)) return { erro: "Dosagem SF/DF inválida. Revise os fatores informados." };
  return { serie:canonSerie(serie), ino, z, cinnamon, cinZ, factors, hipotese:!e.serie, naoModeladas: ave.naoModeladas || [] };
}
const obterDoseFilho = (dosePai, doseMae) => {
  const gametas = (v) => v === 0 ? [0,0] : v === 1 ? [0,1] : [1,1];
  const res = new Map();
  for (const p of gametas(dosePai)) for (const m of gametas(doseMae)) {
    res.set(p+m, (res.get(p+m)||0)+0.25);
  }
  return [...res].map(([dosagem, chance])=>({dosagem,chance}));
};
const germesSerie = (p,m) => {
  const res = new Map();
  for(const a of p.serie) for(const b of m.serie) {
    const serie = canonSerie([a,b]).join("/");
    res.set(serie,(res.get(serie)||0)+0.25);
  }
  return [...res].map(([serie,chance])=>({serie,chance}));
};
const zDescricao = (z,sexo,serie) => {
  const [a,b] = z;
  const herdado = sexo === "Macho" ? [a,b] : [a];
  const q = herdado.filter(v=>v==="I").length;
  const p = herdado.filter(v=>v==="P").length;
  if (q && p) return { visual: "PallidIno (LutinoPallid)", nota: "combinação alélica Ino/Pallid" };
  if (q === (sexo === "Macho" ? 2 : 1)) {
    return { visual: serie === "B/B" ? "Albino (Ino azul)" : serie.startsWith("G/") ? "Lutino (Ino verde)" : "Ino (série Turquesa)", nota: "Ino visual" };
  }
  if (p === (sexo === "Macho" ? 2 : 1)) return {visual: "Pallid (Pálido)",nota:"Pallid visual"};
  if (sexo === "Macho" && q === 1) return {visual:"",nota:"portador de Ino"};
  if (sexo === "Macho" && p === 1) return {visual:"",nota:"portador de Pallid"};
  return {visual:"",nota:""};
};
const etiqueta = (serie, fatores, z, sexo, cinnamon) => {
  const pref = zDescricao(z,sexo,serie);
  const colorBase = serieNome(serie.split("/"));
  const extras = [];
  if (fatores.violet>0) extras.push("Violet "+(fatores.violet===1?"SF":"DF"));
  if (fatores.grey>0) extras.push("Grey "+(fatores.grey===1?"SF":"DF"));
  if (fatores.dark>0) extras.push("Dark "+(fatores.dark===1?"SF":"DF"));
  const portIno = pref.nota.startsWith("portador de") ? pref.nota : "";
  let nomeBase = pref.visual || colorBase;
  if (!pref.visual && serie==="B/B") {
    const dark=fatores.dark, violet=fatores.violet;
    nomeBase = dark===2 ? "Mauve (Malva)" : dark===1 ? "Cobalt (Cobalto)" : "Blue (Azul)";
    if (violet===1) nomeBase = dark===0 ? "Violet SF (Violeta)" :
      dark===1 ? "Violet Cobalt (Violeta cobalto)" : "Violet Mauve (Violeta malva)";
    if (violet===2) nomeBase = dark===0 ? "Violet DF (Violeta duplo fator)" :
      dark===1 ? "Violet DF Cobalt (Violeta DF cobalto)" : "Violet DF Mauve (Violeta DF malva)";
  }
  if (!pref.visual && serie==="T/B" && fatores.grey===0 && fatores.dark===0 && fatores.violet===1)
    nomeBase="Violeta Turquesa (Turquoise Blue + Violet SF)";
  if (!pref.visual && serie==="T/B" && fatores.grey===0 && fatores.dark===1 && fatores.violet===0)
    nomeBase="Cobalto Turquesa (Turquoise Blue + Dark SF)";
  const extrasNoNome = pref.visual ? extras : serie==="B/B"
    ? extras.filter((item)=>item.startsWith("Grey"))
    : (nomeBase.startsWith("Violeta Turquesa") || nomeBase.startsWith("Cobalto Turquesa"))
      ? extras.filter((item)=>item.startsWith("Grey")) : extras;
  if (cinnamon==="visual" && !pref.visual) {
    if (serie==="B/B" && fatores.dark===0 && fatores.violet===0 && fatores.grey===0)
      nomeBase="Azul Canela (Skyblue / Blue Cinnamon)";
    else if (serie==="B/B" && fatores.dark===0 && fatores.violet===1 && fatores.grey===0)
      nomeBase="Violeta Canela (Violet SF + Cinnamon)";
    else if (serie==="B/B" && fatores.dark===1 && fatores.violet===0 && fatores.grey===0)
      nomeBase="Cobalto Canela (Dark SF + Cinnamon)";
    else nomeBase+=" · Canela (Cinnamon)";
  }
  const portadores=[portIno,cinnamon==="split" ? "portador de Canela (Cinnamon)" : ""].filter(Boolean);
  const nome=[nomeBase,...extrasNoNome,...portadores].filter(Boolean).join(" · ");
  const detalhes = pref.visual
    ? colorBase + " · " + pref.nota +
      (extras.length ? " · fatores podem estar mascarados por Ino/Pallid" : "")
    : "Série "+colorBase+" · "+(extras.length ? extras.join(", ") : "sem fatores adicionais")+
      (cinnamon==="visual" ? " · Cinnamon (Canela) visual" : "")+
      (portadores.length ? " · "+portadores.join(", ") : "");
  return {nome,detalhes};
};
const fracao = (p) => {
  if (Math.abs(p-100)<0.0001) return "todos os filhotes deste sexo";
  for (const n of [2,3,4,5,6,8,10,16]) {
    if (Math.abs(p-100/n)<0.0001) return "1 filhote em "+n;
    for (let k=2;k<n;k++) if(Math.abs(p-100*k/n)<0.0001) return k+" filhotes em "+n;
  }
  return "aprox. "+Number(p.toFixed(1))+" em cada 100";
};

/** Prevê porcentagens condicionadas ao sexo, separadas em machos e fêmeas. */
export function calcularCriasRingNeck(paiSelecionado, maeSelecionada) {
  const p = preparar(paiSelecionado, "Macho");
  const m = preparar(maeSelecionada, "Femea");
  if (p.erro || m.erro) return { status:"incompleto", mensagem:p.erro || m.erro, machos:[],femeas:[] };
  const serie = germesSerie(p,m);
  const ligadoDark = (p.factors.dark || m.factors.dark) && serie.length>1;
  const linkedCinnamonIno=(p.cinnamon!=="normal" || m.cinnamon!=="normal") &&
    (p.ino!=="normal" || m.ino!=="normal");
  const sexoZ = {
    Macho: p.z.flatMap((alelo)=>[{z:[alelo,m.z[0]],chance:0.5}]),
    Femea: p.z.flatMap((alelo)=>[{z:[alelo],chance:0.5}]),
  };
  const fatores = {
    violet:obterDoseFilho(p.factors.violet,m.factors.violet),
    grey:obterDoseFilho(p.factors.grey,m.factors.grey),
    dark:obterDoseFilho(p.factors.dark,m.factors.dark),
  };
  const cinPorSexo = (sexo) => p.cinZ.map((alelo) => {
    const herdados=sexo==="Macho" ? [alelo,m.cinZ[0]] : [alelo];
    const n=herdados.filter((x)=>x==="C").length;
    return { status:(sexo==="Macho" ? n===2 : n===1) ? "visual" :
      (sexo==="Macho" && n===1 ? "split" : "normal"),chance:0.5 };
  });
  const avisoNaoModelado = [...new Set([...p.naoModeladas,...m.naoModeladas])];
  const premissas = [
    "Cores simples e fatores não informados usam o padrão de simulação, não um genótipo confirmado.",
    "Percentuais dentro de cada sexo; a probabilidade de nascimento macho/fêmea é tratada separadamente.",
    "Ino e Pallid são alelos no mesmo locus ligado ao sexo, não duas mutações independentes.",
  ];
  if (linkedCinnamonIno) return {
    status:"parcial",
    mensagem:"Cinnamon (Canela) e Ino/Pallid são ligados ao cromossomo Z. Para combinar os percentuais precisamos conhecer a fase genética e a recombinação; não vamos inventar chances.",
    machos:[],femeas:[],premissas,
  };
  if (ligadoDark) {
    return {
      status:"parcial",
      mensagem:"O fator Dark pode estar ligado aos alelos da série Azul/Turquesa. Sem saber de qual cromossomo ele veio, não é seguro combinar todas as cores em uma porcentagem final.",
      serie:serie.map(x=>({nome:serieNome(x.serie.split("/")),percentual:x.chance*100})),
      machos:[],femeas:[],premissas,
    };
  }
  const resultadoSexo = (sexo) => {
    const agrupado = new Map();
    for(const cor of serie) for(const z of sexoZ[sexo]) for(const cin of cinPorSexo(sexo))
      for(const violet of fatores.violet) for(const grey of fatores.grey) for(const dark of fatores.dark) {
        const chance = cor.chance*z.chance*cin.chance*violet.chance*grey.chance*dark.chance;
        if(!chance)continue;
        const gen = {violet:violet.dosagem,grey:grey.dosagem,dark:dark.dosagem};
        const v = etiqueta(cor.serie,gen,z.z,sexo,cin.status);
        const antigo=agrupado.get(v.nome);
        if(antigo)antigo.probabilidade+=chance;
        else agrupado.set(v.nome,{...v,probabilidade:chance,serie:cor.serie});
      }
    return [...agrupado.values()].map(v=>({
      ...v, percentual:Number((v.probabilidade*100).toFixed(4)),
      proporcao:fracao(v.probabilidade*100),
    })).sort((a,b)=>b.percentual-a.percentual || a.nome.localeCompare(b.nome));
  };
  return {
    status:avisoNaoModelado.length ? "parcial" : "completo",
    mensagem:avisoNaoModelado.length
      ? "Cálculo parcial: as seguintes mutações adicionais ainda não foram incluídas: "+avisoNaoModelado.join(", ")+"."
      : "",
    machos:resultadoSexo("Macho"),
    femeas:resultadoSexo("Femea"),
    premissas,
  };
}
