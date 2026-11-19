// Serviço de chat gerativo opcional. O preview usa conversa local até a função
// e o provedor gratuito serem configurados e auditados.
import { supabase } from "../../supabaseClient";
export const CHAT_GENERATIVO_ATIVO = import.meta.env.VITE_AVESPET_IA_GEMINI_ENABLED === "true";

export async function conversarComModelo({ pergunta, historico = [], contexto = {} }) {
  if (!CHAT_GENERATIVO_ATIVO) return null;
  const texto = String(pergunta || "").trim().slice(0, 2000);
  if (!texto) throw new Error("Digite uma pergunta.");
  const ultimas = historico.slice(-8).map((item) => ({
    pergunta: String(item.pergunta || "").slice(0, 1000),
    resposta: String(item.resposta?.mensagem || "").slice(0, 1500),
  }));
  const { data, error } = await supabase.functions.invoke("avespet-ia-chat", {
    body: {
      mensagem: texto,
      historico: ultimas,
      contexto: { especie: String(contexto.especie || "").slice(0, 40), filhote: Boolean(contexto.filhote), idadeDias: contexto.idadeDias ?? null },
    },
  });
  if (error) throw error;
  if (!data?.mensagem) throw new Error("Resposta indisponível.");
  return { tipo: "conversa", titulo: "Avespet IA", mensagem: String(data.mensagem).slice(0, 3500), aviso: "Resposta gerada automaticamente, sujeita a erros. Não substitui atendimento veterinário.", fontes: [] };
}
