// Catálogo versionado para curadoria editorial. Nenhum artigo abaixo está aprovado.
// Nunca transformar fonte externa em instrução clínica automaticamente.
export const CONTEUDOS_IA = Object.freeze([
  {
    id: "ambiente-ave-001",
    versao: 1,
    titulo: "Ambiente e espaço para aves de companhia",
    especies: ["Ring Neck", "Calopsita"],
    temas: ["ambiente", "gaiola", "viveiro", "poleiro", "espaço"],
    status: "em_revisao",
    risco: "geral",
    resposta: "Uma moradia adequada considera espaço para movimentação, poleiros apropriados, higiene e estímulos ambientais. A escolha depende da espécie e das características da ave.",
    fontes: [{
      titulo: "Providing a Home for a Bird — Merck Veterinary Manual",
      url: "https://www.merckvetmanual.com/bird-owners/choosing-and-taking-care-of-a-pet-bird/providing-a-home-for-a-bird",
      consultadoEm: "2026-11-19"
    }],
    revisao: { editorial: null, veterinaria: null, aprovadoEm: null }
  },
  {
    id: "enriquecimento-001",
    versao: 1,
    titulo: "Atividades e enriquecimento ambiental",
    especies: ["Ring Neck", "Calopsita"],
    temas: ["brinquedo", "brinquedos", "enriquecimento", "atividade", "forrageamento", "tédio"],
    status: "em_revisao",
    risco: "geral",
    resposta: "Aves podem se beneficiar de oportunidades de explorar o ambiente, buscar alimento e interagir com objetos apropriados à sua espécie. A segurança do objeto e a observação da ave são essenciais.",
    fontes: [{
      titulo: "Parrot Care Guides — World Parrot Trust",
      url: "https://parrots.org/learn/care-guides/",
      consultadoEm: "2026-11-19"
    }],
    revisao: { editorial: null, veterinaria: null, aprovadoEm: null }
  },
  {
    id: "higiene-001",
    versao: 1,
    titulo: "Higiene e observação do ambiente",
    especies: ["Ring Neck", "Calopsita"],
    temas: ["higiene", "limpeza", "fezes", "gaiola", "comedouro", "bebedouro"],
    status: "em_revisao",
    risco: "geral",
    resposta: "A higiene da instalação ajuda na observação da ave e reduz a exposição à sujeira. Materiais, produtos e frequência devem ser adequados à espécie e ao ambiente.",
    fontes: [{
      titulo: "Cage Hygiene in Birds — VCA Animal Hospitals",
      url: "https://vcahospitals.com/hollywood/specialty/know-your-pet/cage-hygiene-in-birds",
      consultadoEm: "2026-11-19"
    }],
    revisao: { editorial: null, veterinaria: null, aprovadoEm: null }
  },
  {
    id: "papa-desmame-001",
    versao: 1,
    titulo: "Alimentação assistida e transição alimentar",
    especies: ["Ring Neck", "Calopsita"],
    temas: ["papa", "seringa", "desmame", "filhote", "alimentação"],
    status: "em_revisao",
    risco: "requer_revisao_veterinaria",
    resposta: "O manejo alimentar de filhotes precisa de orientação individual de profissional habilitado. A idade, isoladamente, não determina a segurança da alimentação ou a conclusão do desmame.",
    fontes: [{
      titulo: "Overview of Pet Birds — Merck Veterinary Manual",
      url: "https://www.merckvetmanual.com/exotic-and-laboratory-animals/pet-birds/overview-of-pet-birds",
      consultadoEm: "2026-11-19"
    }],
    revisao: { editorial: null, veterinaria: null, aprovadoEm: null }
  }
]);

export function conteudosAprovados(catalogo = CONTEUDOS_IA) {
  return catalogo.filter((item) => item.status === "aprovado"
    && item.revisao?.editorial
    && item.revisao?.aprovadoEm
    && (item.risco !== "requer_revisao_veterinaria" || item.revisao?.veterinaria)
    && Array.isArray(item.fontes) && item.fontes.length > 0
    && item.fontes.every((fonte) => /^https:\/\//.test(fonte.url)));
}
