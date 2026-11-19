// Avespet IA: memória transitória de conversação. Não persiste dados e não faz diagnóstico.
import { normalizarTexto, responderComBiblioteca } from "./respostasComFontes.js";
import { classificarRisco, respostaEducativa } from "./motorEducativo.js";

export function contextoInicial(perfil = {}) {
  return { especie: "", filhote: false, idadeDias: null, nome: "", etapa: "inicio" };
}
export function extrairContexto(texto, anterior = contextoInicial()) {
  const limpo = normalizarTexto(texto);
  const proximo = { ...anterior };
  if (/\b(ring\s*neck|ringneck|periquito de colar)\b/.test(limpo)) proximo.especie = "Ring Neck";
  else if (/\b(calopsita|calopsitas)\b/.test(limpo)) proximo.especie = "Calopsita";
  if (/\b(filhote|filhotinho|bebe|recem nascid[oa])\b/.test(limpo)) proximo.filhote = true;
  const idade = limpo.match(/\b(\d{1,4})\s*(dias?|d)\b/);
  if (idade && Number(idade[1]) <= 3000) proximo.idadeDias = Number(idade[1]);
  const nome = limpo.match(/\b(?:nome (?:dele|dela) e|chama(?:-se)?|se chama)\s+([a-z]{2,22})\b/);
  if (nome) proximo.nome = nome[1];
  return proximo;
}

const retorno = (titulo, mensagem, contexto) => ({ resposta: { tipo: "conversa", titulo, mensagem, aviso: "", fontes: [] }, contexto });
export function conversarLocal(perfil, mensagem, contextoAnterior = contextoInicial(perfil)) {
  const texto = String(mensagem || "").trim().slice(0, 2000);
  const contexto = extrairContexto(texto, contextoAnterior);
  const limpo = normalizarTexto(texto);
  const risco = classificarRisco(texto);
  if (risco !== "educativo") return { resposta: { ...respostaEducativa(perfil, texto), fontes: [] }, contexto };

  // Preserve a intenção da pergunta antes de tratar idade e outras informações isoladas.
  // Alimentação manual de neonatos é um assunto de alto risco: nunca inventar doses ou técnica.
  const perguntaAlimentacao = /\b(como|qual a forma|o que fazer|preciso|posso|devo)\b.*\b(alimentar|dar papa|dar papinha|alimentacao)\b/.test(limpo)
    || /\b(alimentar|alimentacao)\b.*\b(filhote|ave|ring\s*neck|calopsita)\b/.test(limpo);
  if (perguntaAlimentacao && contexto.filhote) {
    contexto.etapa = "orientacao_alimentacao";
    return retorno("Vamos cuidar dessa dúvida 🦜",
      `Entendi: você quer saber como alimentar ${contexto.especie ? "seu " + contexto.especie : "um filhote"}${contexto.idadeDias !== null ? " de " + contexto.idadeDias + " dias" : ""}. Nessa fase, a alimentação manual pode ter riscos sérios, como aspiração, e a orientação precisa ser individualizada por um veterinário de aves. Não é seguro indicar quantidades, intervalos ou técnica só pela idade. Qual é a espécie e ele está sendo alimentado pelos pais ou recebe papinha de uma pessoa?`,
      contexto);
  }
  // O usuário pode responder "na papa" ou "só papinha" depois de uma pergunta sobre alimentação.
  if (contexto.filhote && /^(?:so|somente|apenas|ainda|ainda so|ele esta|ela esta|esta)?\s*(?:na\s+)?(?:papa|papinha)(?:\s+mesmo)?$/.test(limpo)) {
    contexto.etapa = "alimentacao_assistida";
    if (!contexto.especie) return retorno("Entendi 🦜",
      "Ele está recebendo papinha. Qual é a espécie? E quem está alimentando: os pais ou uma pessoa? Para um filhote tão novo, é importante ter acompanhamento de um veterinário de aves.", contexto);
    return retorno("Entendi 🦜",
      contexto.idadeDias !== null && contexto.idadeDias >= 35
        ? `Seu ${contexto.especie} de ${contexto.idadeDias} dias ainda recebe papinha. Já demonstra interesse em alimentos sólidos? O desmame deve respeitar o desenvolvimento e acompanhamento veterinário.`
        : `Seu ${contexto.especie}${contexto.idadeDias !== null ? " de " + contexto.idadeDias + " dias" : ""} está recebendo papinha. Quem está oferecendo a alimentação? Pergunto porque a orientação muda conforme a condição do filhote e precisa ser avaliada por um profissional.`,
      contexto);
  }
  // Uma resposta curta identificando a espécie é informação, não uma nova pergunta.
  if (/^(?:(?:e|eh|um|uma|o|a|ele e|ela e|tenho um|tenho uma|meu e|minha e)\s+)?(?:ring\s*neck|ringneck|periquito de colar|calopsita)$/.test(limpo) && contexto.especie) {
    if (contexto.etapa === "alimentacao_assistida" || contexto.etapa === "orientacao_alimentacao") {
      return retorno("Certo, é um " + contexto.especie + " 🦜",
        `Agora entendi: é um filhote de ${contexto.especie}${contexto.idadeDias !== null ? " com " + contexto.idadeDias + " dias" : ""}, e estamos falando da alimentação. Ele está com os pais ou você está oferecendo a papinha? Para esta idade, evite ajustar quantidade ou modo de alimentar sem orientação veterinária.`, contexto);
    }
    return retorno("Certo, é um " + contexto.especie + " 🦜",
      contexto.filhote
        ? `E quantos dias tem o filhote de ${contexto.especie}?`
        : "É filhote ou adulto?", contexto);
  }

  // Fazer a conversa avançar de acordo com as informações já dadas.
  if (/^(tenho|comprei|ganhei|adotei|peguei|estou com) (um|uma|o|a)?\s*(filhote|filhotinho|passarinho|ave|ring\s*neck|calopsita)\b/.test(limpo)) {
    if (contexto.especie && contexto.filhote) return retorno("Que legal! 🦜", `Você está com um filhote de ${contexto.especie}! Sabe quantos dias ele tem ou se já se alimenta sozinho?`, contexto);
    if (contexto.filhote) return retorno("Que legal! 🦜", "Qual é a espécie do seu filhote? É Ring Neck, calopsita ou outra ave?", contexto);
    return retorno("Vamos conhecer sua ave!", "Qual é a espécie dela? E você sabe se é filhote ou adulta?", contexto);
  }
  if (/^(e|eh|ele e|ela e|meu filhote e|minha ave e|tenho um|tenho uma|ring\s*neck|calopsita)\s*(um|uma|o|a)?\s*(ring\s*neck|ringneck|calopsita|periquito de colar)?\s*$/.test(limpo) && /ring\s*neck|ringneck|calopsita/.test(limpo)) {
    return retorno("Entendi! 🦜", `É um ${contexto.especie}. ${contexto.filhote ? "Como ele é filhote, você sabe a idade aproximada em dias?" : "Ele é filhote ou adulto?"}`, contexto);
  }
  if (contexto.filhote && /\b\d{1,4}\s*(dias?|d)\b/.test(limpo) && limpo.length < 60) {
    return retorno("Obrigado pela informação!", `Anotei na conversa que seu ${contexto.especie || "filhote"} tem cerca de ${contexto.idadeDias} dias. Você sabe se ele ainda recebe alimentação assistida, está experimentando sólidos ou já se alimenta sozinho? A idade, sozinha, não determina isso.`, contexto);
  }
  // Respostas curtas e naturais às perguntas anteriores também integram o contexto.
  if (contexto.filhote && /^(so|somente|apenas|ainda so|ainda somente|ele so|ela so)?\s*(papa|papinha|papinha ainda|na papinha)( mesmo)?$/.test(limpo)) {
    contexto.etapa = "alimentacao_assistida";
    return retorno("Entendi! 🦜",
      `Seu ${contexto.especie || "filhote"}${contexto.idadeDias !== null ? " de aproximadamente " + contexto.idadeDias + " dias" : ""} ainda recebe apenas papinha. Você percebe se ele demonstra interesse por alimentos sólidos? Podemos registrar isso no diário. A transição alimentar precisa de acompanhamento profissional e não deve ser decidida somente pela idade.`,
      contexto);
  }
  if (contexto.filhote && /^(so|somente|apenas)?\s*(solidos|comida solida|racao|sementes|come sozinho|se alimenta sozinho)$/.test(limpo)) {
    contexto.etapa = "solidos_relato";
    return retorno("Entendi! 🦜",
      "Você está observando que a ave consome alimentos sólidos. Podemos acompanhar o peso e as observações no diário. Para confirmar a independência alimentar e qualquer mudança na papa, conte com um veterinário de aves.", contexto);
  }
  if (/\b(ele|ela)\b.*\b(papa|sozinh[oa]|solidos|comida)\b/.test(limpo) && contexto.filhote) {
    return retorno("Entendi a fase que você está observando", "Podemos registrar as observações no Diário de Desenvolvimento. Mudanças na alimentação manual e no desmame devem seguir acompanhamento profissional; não é seguro definir quantidade ou frequência apenas pela idade.", contexto);
  }
  const resposta = responderComBiblioteca({ ...perfil, especie: contexto.especie || perfil.especie }, texto);
  if (resposta.tipo !== "informativo" || !/guia aprovado/.test(resposta.titulo)) return { resposta, contexto };
  return retorno("Entendi sua pergunta", `Estou acompanhando nossa conversa${contexto.especie ? " sobre " + contexto.especie : ""}. Ainda não tenho informação técnica revisada para responder isso com segurança. Se quiser, me conte mais detalhes ou escolha um dos assuntos do painel. Para dúvidas fora do catálogo, a conversa livre com modelo de IA depende da integração do provedor.`, contexto);
}
