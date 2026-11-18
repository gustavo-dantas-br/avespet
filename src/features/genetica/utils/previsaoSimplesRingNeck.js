// Motor inicial do resultado enxuto para Ring Neck.
// Genética do locus Ino/Pallid: mesmo locus recessivo ligado ao cromossomo Z.
// SF/DF Violet/Grey/Dark são tratados como fatores autossômicos de dosagem.
// Resultados referem-se à proporção dentro de cada sexo (machos ou fêmeas).
// Premissas de cores simples são convenções de simulação, não laudos.

export const CORES_RAPIDAS_RING_NECK = Object.freeze([
  { id: "green", label: "Green (Verde)" },
  { id: "blue", label: "Blue (Azul)" },
  { id: "turquoise", label: "Turquoise (Turquesa)" },
  { id: "turquoise-blue", label: "Turquoise Blue (Azul-turquesa)" },
  { id: "violet", label: "Violet SF (Violeta)" },
  { id: "cobalt", label: "Cobalt (Cobalto)" },
  { id: "mauve", label: "Mauve (Malva)" },
  { id: "grey", label: "Grey (Cinza)" },
  { id: "grey-green", label: "Grey Green (Cinza-verde)" },
  { id: "lutino", label: "Lutino (Amarelo Ino)" },
  { id: "albino", label: "Albino (Branco Ino)" },
  { id: "pallid", label: "Pallid (Pálido)" },
  { id: "pallid-blue", label: "Pallid Blue (Pálido azul)" },
  { id: "pallidino", label: "PallidIno (Pálido-Ino, macho)" },
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
  const extras = {
    ...ave.extras,
    violet: ave.extras?.violet ?? dose(ave.fatoresGeneticos?.violetFactor, null),
    dark: ave.extras?.dark ?? dose(ave.fatoresGeneticos?.darkFactor, null),
    grey: ave.extras?.grey ?? (mutacoesVisuais.some((s) => s.includes("grey") || s.includes("cinza")) ? 1 : null),
  };
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
  const reconhecidas = ["blue","azul","turquoise","turquesa","ino","lutino","albino","pallid"];
  const naoModeladas = [
    ...portadores.filter((s)=> !reconhecidas.some((p)=>s===p || s.startsWith(p+" ("))),
    ...mutacoesVisuais.filter((s)=> !["grey","cinza"].some((p)=>s.includes(p))),
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
  const factors = {
    violet:dose(e.violet, preset.violet || 0),
    grey:dose(e.grey, preset.grey || 0),
    dark:dose(e.dark, preset.dark || 0),
  };
  if (Object.values(factors).some((v)=>!Number.isInteger(v)||v<0||v>2)) return { erro: "Dosagem SF/DF inválida. Revise os fatores informados." };
  return { serie:canonSerie(serie), ino, z, factors, hipotese:!e.serie, naoModeladas: ave.naoModeladas || [] };
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
const etiqueta = (serie, fatores, z, sexo) => {
  const pref = zDescricao(z,sexo,serie);
  const colorBase = serieNome(serie.split("/"));
  const base = pref.visual || colorBase;
  const extras = [];
  if (fatores.violet>0) extras.push("Violet " + (fatores.violet===1?"SF":"DF"));
  if (fatores.grey>0) extras.push("Grey " + (fatores.grey===1?"SF":"DF"));
  if (fatores.dark>0) extras.push("Dark " + (fatores.dark===1?"SF":"DF"));
  const port = pref.nota.startsWith("portador de") ? pref.nota : "";
  const nome = [base,...extras,port].filter(Boolean).join(" · ");
  const detalhes = pref.visual
    ? colorBase + (pref.nota ? " · "+pref.nota : "") +
      (extras.length ? " · fatores genéticos podem estar mascarados pela Ino/Pallid" : "")
    : (extras.length ? "Fatores presentes: "+extras.join(", ")+". " : "") +
      (port ? "Portador oculto (não visual)." : "Série de cor "+colorBase+".");
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
  const sexoZ = {
    Macho: p.z.flatMap((alelo)=>[{z:[alelo,m.z[0]],chance:0.5}]),
    Femea: p.z.flatMap((alelo)=>[{z:[alelo],chance:0.5}]),
  };
  const fatores = {
    violet:obterDoseFilho(p.factors.violet,m.factors.violet),
    grey:obterDoseFilho(p.factors.grey,m.factors.grey),
    dark:obterDoseFilho(p.factors.dark,m.factors.dark),
  };
  const avisoNaoModelado = [...new Set([...p.naoModeladas,...m.naoModeladas])];
  const premissas = [
    "Cores simples e fatores não informados usam o padrão de simulação, não um genótipo confirmado.",
    "Percentuais dentro de cada sexo; a probabilidade de nascimento macho/fêmea é tratada separadamente.",
    "Ino e Pallid são alelos no mesmo locus ligado ao sexo, não duas mutações independentes.",
  ];
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
    for(const cor of serie) for(const z of sexoZ[sexo])
      for(const violet of fatores.violet) for(const grey of fatores.grey) for(const dark of fatores.dark) {
        const chance = cor.chance*z.chance*violet.chance*grey.chance*dark.chance;
        if(!chance)continue;
        const gen = {violet:violet.dosagem,grey:grey.dosagem,dark:dark.dosagem};
        const v = etiqueta(cor.serie,gen,z.z,sexo);
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
