// Metas de planejamento Avespet, não mínimos legais brasileiros nem valores universais.
export const DIMENSOES_AVES = [
  {
    "especie": "Ring Neck",
    "padrao": "ring\\s*neck|ringneck|periquito de colar",
    "individual": [
      120,
      80,
      120
    ],
    "casal": [
      300,
      120,
      180
    ]
  },
  {
    "especie": "Calopsita",
    "padrao": "calopsitas?",
    "individual": [
      100,
      75,
      100
    ],
    "casal": [
      290,
      100,
      150
    ]
  },
  {
    "especie": "Agapornis",
    "padrao": "agapornis|inseparaveis?",
    "individual": [
      80,
      60,
      75
    ],
    "casal": [
      170,
      80,
      100
    ]
  },
  {
    "especie": "Periquito-australiano",
    "padrao": "periquitos?[- ]australianos?|budgies?",
    "individual": [
      80,
      60,
      75
    ],
    "casal": [
      180,
      80,
      100
    ]
  },
  {
    "especie": "Papagaio-amazona",
    "padrao": "papagaio[- ]amazona|papagaio verdadeiro",
    "individual": [
      150,
      100,
      150
    ],
    "casal": null
  },
  {
    "especie": "Canário",
    "padrao": "canarios?",
    "individual": [
      60,
      45,
      50
    ],
    "casal": [
      140,
      60,
      75
    ]
  }
];
export const FONTES_GAIOLA = [
  {
    "titulo": "RSPCA — alojamento de aves",
    "url": "https://kb.rspca.org.au/categories/companion-animals/other-pets/birds/what-kind-of-enclosure-does-my-bird-need"
  },
  {
    "titulo": "Referência escocesa — dimensões por envergadura",
    "url": "https://www.gov.scot/publications/animal-welfare-licensing-activities-involving-animals-scotland-regulations-2021-guidance-animal-welfare-establishments/pages/8/"
  },
  {
    "titulo": "World Parrot Trust — Ring Neck",
    "url": "https://parrots.org/encyclopedia/rose-ringed-parakeet/"
  },
  {
    "titulo": "World Parrot Trust — Calopsita",
    "url": "https://parrots.org/encyclopedia/cockatiel/"
  }
];
const norm = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function consultaGaiola(texto, contexto = {}) {
 const t=norm(texto);
 if (!/\b(gaiolas?|viveiros?|recintos?)\b/.test(t)) return null;
 if (!/\b(tamanho|medidas?|dimensoes|espaco|ideal|adequad[oa]|escolher|qual|recomenda|comprar|grande|pequen[oa])\b/.test(t) && !DIMENSOES_AVES.some(a=>new RegExp("\\b(?:"+a.padrao+")\\b").test(t))) return null;
 const ave = DIMENSOES_AVES.find(a=>new RegExp("\\b(?:"+a.padrao+")\\b").test(t)) || DIMENSOES_AVES.find(a=>a.especie===contexto.especie);
 const formato = d => d.join(" × ")+" cm";
 const nota = "Medidas internas úteis (comprimento × profundidade × altura). São metas iniciais de planejamento, não mínimos legais nem garantia de bem-estar. Quanto maior o espaço horizontal de voo, melhor. Se a ave fica confinada por muito tempo, prefira viveiro de voo amplo; proporcione voo seguro, poleiros e enriquecimento.";
 if (!ave) return {mensagem:"Qual é a espécie e quantas aves ficarão juntas? Exemplos de metas iniciais para uma ave:\n"+DIMENSOES_AVES.map(a=>a.especie+": "+formato(a.individual)).join("\n")+"\n\n"+nota,fontes:FONTES_GAIOLA};
 const linhas=[ave.especie+":\n• Uma ave: "+formato(ave.individual)+" ou maior.",ave.casal?"• Duas aves compatíveis: viveiro a partir de "+formato(ave.casal)+", procurando ampliar o voo livre.":"• Para duas aves, planeje recintos separados ou um viveiro específico com avaliação de compatibilidade." ];
 if (/\b(?:tres|[3-9]|\d{2,})\s+(?:aves|exemplares|ring|calopsitas|agapornis|periquitos)\b/.test(t)) linhas.push("Para grupos maiores, não extrapole estas medidas: informe número de aves e rotina para planejar o recinto.");
 if (ave.especie==="Ring Neck") linhas.push("Para viveiro de voo, o World Parrot Trust indica comprimento de pelo menos 4,5 m.");
 if (ave.especie==="Calopsita") linhas.push("O World Parrot Trust sugere 1,8 m de comprimento para gaiola interna e 2,1 m para viveiro de acesso humano.");
 return {mensagem:linhas.join("\n")+"\n\n"+nota,fontes:FONTES_GAIOLA};
}
