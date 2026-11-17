import React, { useState } from "react";
import { Mail, ShieldCheck, Send, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../supabaseClient";

// Etapa 1: só teste transacional ao próprio Master. Nada de campanhas.
export default function EmailTestPanel({ user }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function sendTest() {
    if (sending || !user?.email) return;
    setSending(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("master-resend-test", { body: {} });
      if (error || !data?.sent) {
        throw new Error(data?.error || "O envio ainda não está disponível. Verifique a função e o segredo do Resend no Supabase.");
      }
      setResult({ success: true, message: "Solicitação aceita pelo Resend. Confira a caixa de entrada e o spam de " + (data.recipient || user.email) + "." });
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : "Não foi possível realizar o teste." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Avespet · Master</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Central de e-mails</h1>
        <p className="mt-2 text-sm text-slate-500">Primeira etapa: validar o envio profissional de e-mails do Avespet com o Resend.</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Mail size={22} /></span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Teste de envio protegido</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Enviar uma mensagem de verificação de suporte@avespet.com.br somente para o e-mail da sua sessão Master.</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Destinatário do teste</p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-800">{user?.email || "E-mail indisponível"}</p>
        </div>
        <button type="button" onClick={sendTest} disabled={sending || !user?.email} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#182b45] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#284663] disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? "Enviando teste..." : "Enviar e-mail de teste"}
        </button>
        {result && (
          <div role="status" className={"mt-4 flex items-start gap-2 rounded-xl border p-4 text-sm " + (result.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>
            {result.success ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
            <span>{result.message}</span>
          </div>
        )}
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck size={19} /> Segurança</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">O servidor confirma a conta Master; a chave do Resend fica somente nos Secrets do Supabase.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><Mail size={19} /> Próximas etapas</div>
          <p className="mt-2 text-sm leading-6 text-slate-500">Recebimento, atendimento financeiro, boas-vindas e campanhas continuarão desativados até os próximos testes.</p>
        </div>
      </section>
    </div>
  );
}
