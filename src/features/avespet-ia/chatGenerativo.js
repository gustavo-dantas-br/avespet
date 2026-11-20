// Serviço de chat gerativo opcional. O preview usa conversa local até a função
// e o provedor gratuito serem configurados e auditados.
import { supabase } from "../../supabaseClient";
export const CHAT_GENERATIVO_ATIVO = import.meta.env.VITE_AVESPET_IA_GEMINI_ENABLED === "true";

export async function conversarComModelo({ pergunta, historico = [], contexto = {} }) {
  if (!CHAT_GENERATIVO_ATIVO) return null;
  const texto = String(pergunta || "").trim().slice(0, 2000);
  if (!texto) throw new Error("Digite uma pergunta.");
  const ultimas = historico.slice(-5).map((item) => ({
    pergunta: String(item.pergunta || "").slice(0, 1000),
    resposta: String(item.resposta?.mensagem || "").slice(0, 1000),
  }));
  const { data, error } = await supabase.functions.invoke("avespet-ia-chat", {
    body: {
      mensagem: texto,
      historico: ultimas,
      contexto: { especie: String(contexto.especie || "").slice(0, 40), filhote: contexto.filhote === true ? true : null, idadeDias: contexto.idadeDias ?? null, etapa: String(contexto.etapa || "").slice(0, 45), assunto: contexto.assunto || "", faseInformada: contexto.faseInformada || "", casal: contexto.casal || null },
    },
  });
  if (error) {
    const detalhe = typeof error.context?.json === "function"
      ? await error.context.json().catch(() => null)
      : null;
    const falha = new Error(detalhe?.error || "O Gemini não respondeu.");
    falha.status = error.context?.status || error.status || 0;
    falha.codigo = detalhe?.codigo || "INDEFINIDO";
    throw falha;
  }
  if (!data?.mensagem) throw new Error("Resposta indisponível.");
  return { tipo: "conversa", titulo: "Avespet IA", mensagem: String(data.mensagem).slice(0, 3500), aviso: "Resposta gerada automaticamente, sujeita a erros. Não substitui atendimento veterinário.", fontes: [] };
}


/** Verifica disponibilidade sem chamar o modelo Gemini e sem gastar tokens. */
export async function verificarDisponibilidadeGemini() {
  if (!CHAT_GENERATIVO_ATIVO) return false;
  const { data, error } = await supabase.functions.invoke("avespet-ia-chat", {
    body: { acao: "status" },
  });
  if (error) return false;
  return data?.disponivel === true;
}
