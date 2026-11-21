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
export const FONTES_PET = [
  {
    "titulo": "University of Florida — Cuidados e gaiola de descanso",
    "url": "https://smallanimal.vethospital.ufl.edu/clinical-services/zoological-medicine/how-to-care-for-your-pet-bird/"
  },
  {
    "titulo": "Merck Veterinary Manual — Alojamento e exercício",
    "url": "https://www.merckvetmanual.com/bird-owners/choosing-and-taking-care-of-a-pet-bird/providing-a-home-for-a-bird"
  },
  {
    "titulo": "RSPCA — Enriquecimento ambiental",
    "url": "https://www.rspca.org.uk/adviceandwelfare/pets/birds/enrichment"
  },
  {
    "titulo": "RSPCA Austrália — Atividades e supervisão",
    "url": "https://kb.rspca.org.au/categories/companion-animals/other-pets/birds/how-can-i-keep-my-birds-entertained-alert-and-interested-in-their-environment"
  }
];
export const ROTINA_PET = "Para uma ave pet, a gaiola com abertura superior ou lateral pode funcionar como base de descanso, alimentação e segurança. Durante o dia, ofereça várias oportunidades de voo e exercício em ambiente interno protegido, com supervisão. Deixe a ave entrar e sair voluntariamente quando for seguro. Se não houver supervisão, mantenha-a em recinto seguro e espaçoso. Uma gaiola menor de descanso não substitui um alojamento adequado para o dia inteiro.";
export const ENRIQUECIMENTO_PET = "Ofereça playground com poleiros naturais variados e seguros, balanços, escadas firmes, brinquedos de madeira não tratada e papel próprio para rasgar, além de forrageamento (esconder pequenas porções da alimentação habitual em brinquedos apropriados). Alterne os brinquedos gradualmente e inspecione-os: descarte fios desfiados, peças soltas e metais de procedência desconhecida. Preserve espaço de voo e ofereça interação diária, sem forçar a ave.";
export const SEGURANCA_PET = "Antes de soltar, feche portas e janelas ou proteja-as com telas seguras, desligue ventiladores, mantenha cães e gatos separados e afaste a ave da cozinha, fumaça, superfícies quentes e fios elétricos. Não deixe a gaiola aberta sem supervisão nem solte a ave ao ar livre.";
const norm = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export function consultaGaiola(texto, contexto = {}) {
 const t=norm(texto);
 const pet = /\b(pet|descanso|dormir|dormitorio|aberta|abertura|solt[oa]s?|playground)\b/.test(t);
 const recinto = /\b(gaiolas?|viveiros?|recintos?)\b/.test(t);
 const seguimento = contexto.guiaAtual?.id === "gaiola" || contexto.guiaAtual?.id === "gaiola-pet" || contexto.etapa === "alojamento";
 if (!recinto && !(pet && seguimento)) return null;
 if (pet && (recinto || seguimento)) {
   const ave = DIMENSOES_AVES.find(a=>new RegExp("\\b(?:"+a.padrao+")\\b").test(t)) || DIMENSOES_AVES.find(a=>a.especie===contexto.especie);
   const tamanho = ave ? "Para "+ave.especie+", a meta de planejamento do alojamento habitual para uma ave é "+ave.individual.join(" × ")+" cm ou maior (comprimento × profundidade × altura). Não há dimensão reduzida universal validada para dormir; mesmo o recinto de descanso deve permitir abrir as asas, movimentar-se, manter a cauda livre e acomodar poleiros e água. Avalie a envergadura real e o tempo de confinamento." : "Qual é a espécie e por quanto tempo ela fica na gaiola fechada? O tamanho de descanso deve permitir abrir as asas, movimentar-se, manter a cauda livre e acomodar poleiros e água.";
   return {mensagem:ROTINA_PET+"\n\n"+tamanho+"\n\n"+ENRIQUECIMENTO_PET+"\n\n"+SEGURANCA_PET,fontes:FONTES_PET};
 }
 if (!/\b(tamanho|medidas?|dimensoes|espaco|ideal|adequad[oa]|escolher|qual|recomenda|comprar|grande|pequen[oa])\b/.test(t) && !DIMENSOES_AVES.some(a=>new RegExp("\\b(?:"+a.padrao+")\\b").test(t))) return null;
 const ave = DIMENSOES_AVES.find(a=>new RegExp("\\b(?:"+a.padrao+")\\b").test(t)) || DIMENSOES_AVES.find(a=>a.especie===contexto.especie);
 const formato = d => d.join(" × ")+" cm";
 const nota = "Medidas internas úteis (comprimento × profundidade × altura). São metas iniciais de planejamento, não mínimos legais nem garantia de bem-estar. Quanto maior o espaço horizontal de voo, melhor. Para aves pet, incentive saídas diárias supervisionadas e uma gaiola de descanso com acesso voluntário quando seguro. Se houver confinamento prolongado, prefira viveiro de voo amplo; não use gaiola pequena de dormir como moradia permanente.";
 if (!ave) return {mensagem:"Qual é a espécie e quantas aves ficarão juntas? Exemplos de metas iniciais para uma ave:\n"+DIMENSOES_AVES.map(a=>a.especie+": "+formato(a.individual)).join("\n")+"\n\n"+nota,fontes:FONTES_GAIOLA};
 const linhas=[ave.especie+":\n• Uma ave: "+formato(ave.individual)+" ou maior.",ave.casal?"• Duas aves compatíveis: viveiro a partir de "+formato(ave.casal)+", procurando ampliar o voo livre.":"• Para duas aves, planeje recintos separados ou um viveiro específico com avaliação de compatibilidade." ];
 if (/\b(?:tres|[3-9]|\d{2,})\s+(?:aves|exemplares|ring|calopsitas|agapornis|periquitos)\b/.test(t)) linhas.push("Para grupos maiores, não extrapole estas medidas: informe número de aves e rotina para planejar o recinto.");
 if (ave.especie==="Ring Neck") linhas.push("Para viveiro de voo, o World Parrot Trust indica comprimento de pelo menos 4,5 m.");
 if (ave.especie==="Calopsita") linhas.push("O World Parrot Trust sugere 1,8 m de comprimento para gaiola interna e 2,1 m para viveiro de acesso humano.");
 return {mensagem:linhas.join("\n")+"\n\n"+nota+"\n\n"+ENRIQUECIMENTO_PET+"\n\n"+SEGURANCA_PET,fontes:[...FONTES_GAIOLA,...FONTES_PET]};
}
