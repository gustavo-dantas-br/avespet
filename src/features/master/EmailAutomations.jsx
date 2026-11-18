import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Mail, RefreshCw, CalendarClock, BookOpen, ShieldCheck, PauseCircle, PlayCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

const number = v => Number(v || 0).toLocaleString("pt-BR");
const date = v => v ? new Date(v).toLocaleString("pt-BR", { dateStyle:"short",timeStyle:"short" }) : "—";
const statuses = {
  sent:"Aceito pelo Resend",failed:"Falha",uncertain:"Não confirmado",processing:"Processando",
  elegivel:"Elegível",previsto:"Previsto",email_pendente:"E-mail não confirmado",ja_contatado:"Já contatado",
};
const topics = {ringneck:"Ring Neck",calopsita:"Calopsita",geral:"Geral"};
const card = "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5";

export default function EmailAutomations() {
  const [data,setData] = useState(null);
  const [form,setForm] = useState(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const invoke = async body => {
    const {data,error} = await supabase.functions.invoke("master-email-automations",{body});
    if(error||data?.error||!data?.success) throw new Error(data?.error||"Não foi possível acessar a automação.");
    return data;
  };
  const load = useCallback(async() => {
    setLoading(true);setError("");
    try {
      const result=await invoke({action:"overview"});
      setData(result);
      setForm(result.settings);
    } catch(err) {setError(err?.message||"Falha ao consultar a automação.");}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const save = async() => {
    if(!form||saving)return;
    if(!window.confirm(form.enabled
      ? "Salvar regras de reativação? Novos envios automáticos poderão ocorrer apenas para usuários inscritos e elegíveis."
      : "Pausar os disparos automáticos de dicas e novidades do Avespet?"))return;
    setSaving(true);setError("");setNotice("");
    try {
      const result=await invoke({action:"settings",enabled:form.enabled,
        min_inactive_days:Number(form.min_inactive_days),cooldown_days:Number(form.cooldown_days),
        max_per_day:Number(form.max_per_day)});
      setForm(result.settings);
      setNotice(result.audit_warning
        ? "Regras salvas, mas a auditoria de confirmação precisa de revisão."
        : "Regras de automação salvas com sucesso.");
      await load();
    } catch(err) {setError(err?.message||"Não foi possível salvar as regras.");}
    finally {setSaving(false);}
  };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Master · Comunicação</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900"><Mail size={24}/>Automações de e-mail</h1>
        <p className="mt-2 text-sm text-slate-500">Reativação educativa com autorização, limites e registro de envios. Sem mensagens em massa não autorizadas.</p>
      </div>
      <button type="button" disabled={loading} onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={16}/> Atualizar dados</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertTriangle size={16} className="mr-2 inline"/>{error}</div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {loading && !data ? <p className={card}>Carregando automações...</p> : data && <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Inscritos",data.subscribers.active],
          ["Elegíveis agora",data.forecasts.eligibleNow],
          ["Aceitos pelo Resend",data.delivery.totalAccepted],
          ["Falhas / pendências",(data.delivery.counts.failed||0)+(data.delivery.counts.uncertain||0)],
        ].map(([label,value])=><div key={label} className={card}><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-slate-800">{number(value)}</p></div>)}
      </section>
      <div className="grid gap-4 2xl:grid-cols-[1.1fr_1fr]">
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><CalendarClock size={18}/> Reativação após inatividade</h2>
          <p className="mt-1 text-xs text-slate-500">O Supabase verifica diariamente às 11h, horário de São Paulo. O envio ocorre somente se houver consentimento e condições atendidas.</p>
          {form && <div className="mt-5 space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
              <input type="checkbox" checked={Boolean(form.enabled)} onChange={e=>setForm(f=>({...f,enabled:e.target.checked}))} className="mt-1 h-4 w-4"/>
              <span><strong className="block text-slate-800">{form.enabled?"Automação habilitada":"Automação pausada"}</strong><span className="text-xs text-slate-500">Pausar impede novos disparos desta rotina, mas não afeta os e-mails de cadastro e recuperação de senha.</span></span>
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Dias sem acesso","min_inactive_days",5,90],
                ["Intervalo mínimo (dias)","cooldown_days",14,90],
                ["Limite diário","max_per_day",1,50],
              ].map(([label,key,min,max])=><label key={key} className="text-xs font-semibold text-slate-600">{label}
                <input type="number" min={min} max={max} step={1} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-900" />
              </label>)}
            </div>
            <button onClick={save} type="button" disabled={saving||loading} className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
              {form.enabled?<PlayCircle size={16}/>:<PauseCircle size={16}/>} {saving?"Salvando...":"Salvar regras"}
            </button>
          </div>}
        </section>
        <section className={card}>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><ShieldCheck size={18}/> Consentimento e próximos contatos</h2>
          <p className="mt-2 text-sm text-slate-600">Inscritos: <strong>{number(data.subscribers.active)}</strong> · Cancelaram: <strong>{number(data.subscribers.opted_out)}</strong></p>
          <p className="mt-1 text-sm text-slate-600">Previsão para os próximos 7 dias: <strong>{number(data.forecasts.nextSevenDays)}</strong></p>
          <p className="mt-1 text-xs text-slate-500">A previsão é condicional: a conta pode voltar a acessar, cancelar a inscrição ou ficar inelegível.</p>
          {data.subscribers.partial && <p className="mt-2 text-xs text-amber-700">Exibição parcial: apenas os primeiros 50 inscritos.</p>}
          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {data.subscribers.preview.length ? data.subscribers.preview.map(entry=><div key={entry.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 p-3 text-xs">
              <div><strong className="text-slate-700">{entry.email}</strong><p className="mt-1 text-slate-500">Última atividade: {date(entry.last_seen_at)}</p></div>
              <div className="text-right"><p className="font-semibold text-slate-700">{statuses[entry.status]||entry.status}</p><p className="mt-1 text-slate-500">Próximo: {date(entry.next_eligible_at)}</p></div>
            </div>) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Ainda não há criadores que autorizaram receber dicas e novidades.</p>}
          </div>
        </section>
      </div>
      <section className={card}>
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-800"><BookOpen size={18}/> Guias publicados para as mensagens</h2>
        <p className="mt-1 text-xs text-slate-500">Os e-mails educativos usam os artigos efetivamente publicados. O conteúdo é selecionado por espécie, com guias gerais como alternativa.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.guides.length ? data.guides.map(g=><a key={g.slug} href={"/guias/"+encodeURIComponent(g.slug)} target="_blank" rel="noreferrer"
            className="rounded-xl border border-slate-200 p-3 text-sm hover:border-emerald-500">
            <strong className="block text-slate-800">{g.titulo}</strong>
            <span className="mt-1 block text-xs text-slate-500">{g.especie||"Geral"} · {g.categoria||"Cuidados"}</span>
          </a>) : <p className="text-sm text-slate-500">Nenhum guia publicado encontrado.</p>}
        </div>
      </section>
      <section className={card}>
        <h2 className="text-base font-bold text-slate-800">Histórico dos envios</h2>
        <p className="mt-1 text-xs text-slate-500">Aceito pelo Resend não significa entregue ou lido. Conteúdos, nomes e contatos não ficam expostos nesta lista.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead><tr className="border-b text-slate-500"><th className="py-2">Data</th><th>Situação</th><th>Conteúdo</th><th>Guia</th></tr></thead>
            <tbody>{data.delivery.recent.length ? data.delivery.recent.map(item=><tr key={item.id} className="border-b border-slate-100">
              <td className="py-2">{date(item.sent_at||item.created_at)}</td><td>{statuses[item.status]||item.status}</td><td>{topics[item.topic]||"Geral"}</td><td>{item.article_slug||"—"}</td>
            </tr>) : <tr><td colSpan={4} className="py-4 text-slate-500">Ainda não há tentativas registradas.</td></tr>}</tbody>
          </table>
        </div>
        {data.delivery.partial && <p className="mt-2 text-xs text-amber-700">Histórico parcial: últimas 200 tentativas.</p>}
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14}/> As contas precisam autorizar e-mails no Perfil do Criador; campanhas promocionais continuam separadas.</p>
      </section>
    </>}
  </div>;
}
