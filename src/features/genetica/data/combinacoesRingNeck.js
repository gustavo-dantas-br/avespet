// Combinacoes fenotipicas Ring Neck (nao sao mutacoes primarias).
// Este arquivo e referencia para a proxima etapa do motor; nao habilita calculos.
// A nomenclatura comercial pode variar entre criadores e regioes.

export const COMBINACOES_RING_NECK = [
  {
    nome: "Lutino",
    nomePopular: "Amarelo",
    componentes: ["Green (Verde)", "Ino (Lutino / Albino conforme a serie)"],
    regra: "Ino ligado ao sexo sobre a serie verde",
    status: "documentada",
    observacao: "Distinguir Ino ligado ao sexo de Lutino recessivo autossomico raro, descrito em algumas referencias.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri.htm",
  },
  {
    nome: "Albino",
    nomePopular: "Albino",
    componentes: ["Blue (Azul)", "Ino (Lutino / Albino conforme a serie)"],
    regra: "Azul recessivo combinado com Ino ligado ao sexo",
    status: "documentada",
    observacao: "Nao e uma mutacao independente; e a combinacao da serie azul com Ino.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri.htm",
  },
  {
    nome: "Creamino",
    nomePopular: "Cremino",
    componentes: ["Turquoise Blue (Azul Turquesa)", "Ino (Lutino / Albino conforme a serie)"],
    regra: "Turquoise Blue combinado com Ino ligado ao sexo",
    status: "documentada_com_variacao_de_nome",
    observacao: "O mercado pode usar Creamino ou Cremino. Manter os dois como sinonimos de exibicao, sem criar dois genes.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri.htm",
  },
  {
    nome: "Pallid-ino",
    nomePopular: "Pallid-ino",
    componentes: ["Pallid (Palido)", "Ino (Lutino / Albino conforme a serie)"],
    regra: "Dois alelos diferentes no mesmo locus ligado ao sexo",
    status: "documentada",
    observacao: "Nao modelar Pallid e Ino como loci independentes. O macho pode ter um alelo Pallid e outro Ino no par ZZ, produzindo o fenotipo Pallid-ino. Exige representacao de alelos por cromossomo Z.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri-Pallid.htm",
  },
  {
    nome: "Skyblue",
    nomePopular: "Azul Canela",
    componentes: ["Blue (Azul)", "Cinnamon (Canela)"],
    regra: "Serie azul combinada com Cinnamon ligado ao sexo",
    status: "documentada_com_variacao_de_nome",
    observacao: "Skyblue e nome de criador; Cinnamon Blue e uma descricao tecnica mais explicita. Nao tratar Skyblue como gene independente.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri.htm",
  },
  {
    nome: "Silver",
    nomePopular: "Silver",
    componentes: ["Cinnamon (Canela)", "Grey (Cinza)"],
    regra: "Cinnamon combinado com Grey na serie azul",
    status: "documentada_com_ressalva",
    observacao: "Psittacula World cita Cinnamon Grey como Silver. A ficha deve preservar os componentes e nao usar Silver como mutacao isolada; validar o uso brasileiro e a composicao exata antes de automatizar.",
    fonte: "https://www.psittacula-world.com/EN/Mutations/P-krameri.htm",
  },
];

export const AVISOS_MODELO_COMBINACOES = [
  "Combinacoes sao nomes de fenotipos resultantes de dois ou mais componentes geneticos; nao devem ser cadastradas como genes independentes.",
  "Genes ligados ao sexo exigem genotipo por cromossomo Z e diferenca entre macho ZZ e femea ZW.",
  "Pallid e Ino pertencem ao mesmo locus alélico; a calculadora deve representar os dois alelos no mesmo locus.",
  "A combinacao de genes ligados exige fase e, quando aplicavel, taxa de recombinacao validada.",
  "Nomes comerciais podem variar; guardar componentes geneticos e usar nomes populares apenas como rotulos.",
];
