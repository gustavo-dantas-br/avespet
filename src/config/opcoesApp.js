// Opções e rótulos compartilhados pela aplicação autenticada.
// Manter aqui apenas configurações estáticas; regras de negócio ficam nos domínios.
const ESPECIES = ["Ring Neck", "Calopsita", "Outra"];
const SEXOS = ["Macho", "Femea", "Indefinido"];
const STATUS_AVE = ["No plantel", "A venda", "Reservada", "Vendida", "Falecida", "Perdida"];
const STATUS_PLANTEL = ["No plantel", "A venda", "Reservada"];
const STATUS_POSVENDA = ["Venda realizada", "Entregue", "Primeiro contato", "Acompanhamento", "Cliente satisfeito"];
const SATISFACAO_OPCOES = ["Pendente", "Sim", "Nao"];
const ORIGEM_TIPOS = ["Nasceu no plantel", "Comprada"];
const DESPESA_TIPOS = ["Racao", "Veterinario/Medicamento", "Gaiola/Equipamento", "Anilha", "Outro"];
const TIPOS_HERANCA = [
  "Cor base (selvagem)",
  "Autossomica recessiva",
  "Autossomica dominante",
  "Ligada ao sexo (recessiva)",
  "Ligada ao sexo (dominante)",
  "Codominante",
  "Nao definido / em estudo",
];
const STATUS_INDICACAO = ["Nova", "Em atendimento", "Venda realizada", "Nao converteu"];
const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };

export {
  ESPECIES,
  SEXOS,
  STATUS_AVE,
  STATUS_PLANTEL,
  STATUS_POSVENDA,
  SATISFACAO_OPCOES,
  ORIGEM_TIPOS,
  DESPESA_TIPOS,
  TIPOS_HERANCA,
  STATUS_INDICACAO,
  STATUS_ANUNCIO_TONS,
  STATUS_ANUNCIO_LABEL,
};
