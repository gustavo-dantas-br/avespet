// Avespet IA — motor educativo local, sem chamadas de API e sem diagnóstico.
// As mensagens abaixo não substituem revisão profissional do conteúdo.
export const ESPECIES_INICIAIS = ["Ring Neck", "Calopsita", "Outra"];
export const FASES = [
  { id: "papa", label: "Ainda recebe papa" },
  { id: "transicao", label: "Experimentando alimentos sólidos" },
  { id: "desmamada", label: "Já se alimenta sozinha" },
  { id: "incerta", label: "Não sei identificar" },
];

export function validarPerfil(perfil) {
  const idade = perfil.idadeDias === "" ? null : Number(perfil.idadeDias);
  if (!ESPECIES_INICIAIS.includes(perfil.especie)) return "Selecione a espécie.";
  if (!FASES.some((fase) => fase.id === perfil.fase)) return "Selecione a fase.";
  if (idade !== null && (!Number.isInteger(idade) || idade < 0 || idade > 30000)) return "Informe a idade em dias ou deixe em branco.";
  return null;
}

const sinaisUrgentes = [
  /dificuldade (para |de )?respirar/i, /não (consegue |está )?respir/i,
  /falta de ar/i, /convuls/i, /sangramento (intenso|forte)/i,
  /alimento (saindo|saiu) (pelo|do) nariz/i, /aspirou (papa|alimento)/i,
  /muito (mole|fraco|prostrado)/i,
];
const sinaisAtencao = [
  /papo (não |nao )?(esvazia|esvaziou)/i, /papo parado/i,
  /vomit/i, /diarreia/i, /parou de comer/i, /perdendo peso/i,
];
export function classificarRisco(texto = "") {
  const pergunta = String(texto).slice(0, 2000);
  if (sinaisUrgentes.some((regra) => regra.test(pergunta))) return "urgente";
  if (sinaisAtencao.some((regra) => regra.test(pergunta))) return "atencao";
  return "educativo";
}

export function respostaEducativa(perfil, pergunta = "") {
  const risco = classificarRisco(pergunta);
  const aviso = "O Avespet IA oferece educação sobre manejo; não realiza diagnóstico, prescrição ou atendimento veterinário.";
  if (risco === "urgente") return {
    tipo: risco, titulo: "Procure atendimento veterinário imediatamente",
    mensagem: "O sinal relatado pode exigir atendimento urgente com veterinário especializado em aves. Evite tentar procedimentos ou alimentação forçada e procure assistência imediatamente.",
    aviso,
  };
  if (risco === "atencao") return {
    tipo: risco, titulo: "É importante falar com um veterinário de aves",
    mensagem: "Registre quando a alteração começou, o comportamento e o peso, se puder observar sem estressar a ave. A avaliação profissional é necessária; não altere a alimentação manual por conta própria.",
    aviso,
  };
  if (perfil.fase === "papa") return {
    tipo: risco, titulo: "Acompanhamento de filhote em alimentação assistida",
    mensagem: "Registre peso, aceitação do alimento e observações sobre o papo. O esvaziamento isolado do papo ou a idade não autorizam uma nova alimentação. Siga a orientação individual de profissional habilitado e as instruções do fabricante da fórmula. Se não recebeu orientação prática, busque apoio especializado antes de alimentar manualmente.",
    aviso,
  };
  if (perfil.fase === "transicao") return {
    tipo: risco, titulo: "Acompanhamento da transição alimentar",
    mensagem: "Observe se a ave realmente ingere alimentos sólidos, acompanhe o peso e registre a evolução. Manipular alimento não é o mesmo que consumi-lo. Não suspenda a papa com base somente na idade; siga a orientação profissional para um desmame gradual.",
    aviso,
  };
  if (perfil.fase === "desmamada") return {
    tipo: risco, titulo: "Rotina da ave independente",
    mensagem: "Organize registros de alimentação apropriada à espécie, peso, atividade, ambiente e enriquecimento. Mudanças importantes devem ser discutidas com veterinário de aves.",
    aviso,
  };
  return {
    tipo: risco, titulo: "Vamos conhecer melhor sua ave",
    mensagem: "Para identificar a fase de desenvolvimento com segurança, registre a idade aproximada, comportamento alimentar e histórico disponível. Se ainda depende de alimentação manual, procure orientação especializada.",
    aviso,
  };
}
