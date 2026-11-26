import React,{useCallback,useEffect,useMemo,useState} from "react";
import {supabase} from "../../supabaseClient";
import {
 CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList,
 Clock3, Egg, HeartPulse, LayoutDashboard, Plus, RotateCcw, X
} from "lucide-react";
import {diaLocal,eventosReproducao,eventosTarefas,diasDoMes} from "./utils/agenda";
import {eventosCuidados} from "./utils/cuidados";
const CuidadosAves=React.lazy(()=>import("./CuidadosAves"));
const categorias={manejo:"Manejo",reproducao:"Reprodução",saude:"Saúde",posvenda:"Pós-venda",outro:"Outro"};
const empty={titulo:"",dia:diaLocal(),categoria:"manejo",observacao:""};
const formatMonth=s=>new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date(Number(s.slice(0,4)),Number(s.slice(5,7))-1,1,12));
function changeMonth(iso,offset){const [y,m]=iso.split("-").map(Number);const next=new Date(y,m-1+offset,1,12);return `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`;}
function MonthControl({mes,onChange}) {
 return <div className="flex items-center justify-between gap-3">
  <button type="button" aria-label="Mês anterior" onClick={()=>onChange(-1)} className="rounded-lg border border-[#D9E5DC] p-2 text-[#315B43] hover:bg-[#F3F8F4]"><ChevronLeft size={18}/></button>
  <h2 className="font-bold capitalize text-[#173D29]">{formatMonth(mes)}</h2>
  <button type="button" aria-label="Próximo mês" onClick={()=>onChange(1)} className="rounded-lg border border-[#D9E5DC] p-2 text-[#315B43] hover:bg-[#F3F8F4]"><ChevronRight size={18}/></button>
 </div>;
}
const views=[
 {id:"resumo",label:"Resumo",icon:LayoutDashboard},
 {id:"calendario",label:"Calendário",icon:CalendarDays},
 {id:"tarefas",label:"Tarefas",icon:ClipboardList},
 {id:"cuidados",label:"Medicamentos e vitaminas",icon:HeartPulse}
];
export default function AgendaCriador({userId,posturas=[],aves=[],onNavigate,carePrefill,onCareSaved}){
 const [activeView,setActiveView]=useState("resumo");
 const [cuidados,setCuidados]=useState([]);
 const onCuidados=useCallback(rows=>setCuidados(rows),[]);
 const [mes,setMes]=useState(()=>diaLocal().slice(0,7));
 const [selected,setSelected]=useState(()=>diaLocal());
 const [tarefas,setTarefas]=useState([]);
 const [form,setForm]=useState(empty);
 const [editing,setEditing]=useState(null);
 const [showTaskForm,setShowTaskForm]=useState(false);
 const [taskFilter,setTaskFilter]=useState("pendentes");
 const [loading,setLoading]=useState(false);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");

 const load=useCallback(async()=>{
  if(!userId)return;
  setLoading(true);setError("");
  const {data,error:e}=await supabase.from("agenda_tarefas")
   .select("id,titulo,categoria,dia,observacao,concluida,created_at")
   .eq("user_id",userId).gte("dia",mes+"-01").lt("dia",changeMonth(mes,1)+"-01")
   .order("dia",{ascending:true}).limit(500);
  if(e){setError("Não foi possível consultar as tarefas da agenda. Confirme a conexão e tente novamente.");}
  else setTarefas(data||[]);
  setLoading(false);
 },[userId,mes]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{if(carePrefill?.token){setActiveView("cuidados");}},[carePrefill?.token]);

 const events=useMemo(()=>[...eventosReproducao(posturas),...eventosTarefas(tarefas),...eventosCuidados(cuidados,aves)]
  .filter(e=>e.dia.startsWith(mes)).sort((a,b)=>a.dia.localeCompare(b.dia)),[posturas,tarefas,cuidados,aves,mes]);
 const days=diasDoMes(mes);
 const offset=new Date(Number(mes.slice(0,4)),Number(mes.slice(5,7))-1,1,12).getDay();
 const byDay=useMemo(()=>{const o={};for(const e of events)(o[e.dia]??=[]).push(e);return o},[events]);
 const selectedEvents=byDay[selected]||[];
 const hoje=diaLocal();
 const tarefasPendentes=tarefas.filter(t=>!t.concluida);
 const eclosoes=events.filter(e=>e.origem==="reproducao");
 const cuidadosProgramados=events.filter(e=>e.origem==="cuidados"&&!e.feito);
 const proximosEventos=events.filter(e=>e.dia>=hoje&&(
  e.origem==="reproducao"||(e.origem==="tarefa"&&!e.concluida)||(e.origem==="cuidados"&&!e.feito)
 )).slice(0,6);
 const atrasados=events.filter(e=>e.dia<hoje&&(
  (e.origem==="tarefa"&&!e.concluida)||(e.origem==="cuidados"&&!e.feito)
 )).slice(0,5);
 const tarefasFiltradas=tarefas.filter(t=>taskFilter==="todas"||(taskFilter==="pendentes"?!t.concluida:!!t.concluida))
  .sort((a,b)=>a.dia.localeCompare(b.dia));

 const navegarMes=offsetMes=>{
  const next=changeMonth(mes,offsetMes);
  setMes(next);setSelected(next+"-01");
  setForm(f=>f.titulo||editing?f:{...f,dia:next+"-01"});
 };
 const novaTarefa=()=>{
  setEditing(null);setForm({...empty,dia:selected.startsWith(mes)?selected:mes+"-01"});
  setShowTaskForm(true);setError("");
 };
 const submit=async e=>{
  e.preventDefault();setSaving(true);setError("");
  const payload={user_id:userId,titulo:form.titulo.trim(),dia:form.dia,categoria:form.categoria,observacao:form.observacao.trim()||null};
  const result=editing
   ?await supabase.from("agenda_tarefas").update(payload).eq("user_id",userId).eq("id",editing)
   :await supabase.from("agenda_tarefas").insert(payload);
  setSaving(false);
  if(result.error){setError("Não foi possível salvar a tarefa. Confira os dados e tente novamente.");return;}
  setEditing(null);setForm(empty);setShowTaskForm(false);
  const targetMonth=payload.dia.slice(0,7);
  setMes(targetMonth);setSelected(payload.dia);
  if(targetMonth===mes)await load();
 };
 const toggle=async t=>{
  setSaving(true);const {error:e}=await supabase.from("agenda_tarefas").update({concluida:!t.concluida}).eq("user_id",userId).eq("id",t.id);
  setSaving(false);if(e)setError("Falha ao atualizar o status da tarefa.");else await load();
 };
 const remove=async t=>{
  if(!window.confirm("Excluir esta tarefa?"))return;
  setSaving(true);const {error:e}=await supabase.from("agenda_tarefas").delete().eq("user_id",userId).eq("id",t.id);
  setSaving(false);if(e)setError("Não foi possível excluir a tarefa.");else await load();
 };
 const editarTarefa=t=>{
  setEditing(t.id);setForm({titulo:t.titulo,dia:t.dia,categoria:t.categoria,observacao:t.observacao||""});
  setShowTaskForm(true);setError("");
 };
 const eventDescription=item=>item.origem==="tarefa"
  ?`Tarefa · ${categorias[item.tipo]||"Outro"}`
  :item.origem==="cuidados"
   ?(item.feito?"Administração registrada":"Lembrete informado — conferir antes de administrar")
   :"Previsão automática da reprodução";

 const taskForm=<form onSubmit={submit} className="rounded-2xl border border-[#D9E5DC] bg-white p-4 space-y-3">
  <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-[#173D29]">{editing?"Editar tarefa":"Nova tarefa"}</h3><button type="button" aria-label="Fechar formulário" onClick={()=>{setShowTaskForm(false);setEditing(null);setForm(empty)}} className="rounded-lg p-1 text-[#526A5B] hover:bg-slate-100"><X size={18}/></button></div>
  <label className="block text-sm text-[#294B37]">Título<input required maxLength={140} className="mt-1 block w-full rounded-lg border border-[#D9E5DC] p-2" value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))}/></label>
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><label className="text-sm text-[#294B37]">Data<input type="date" required className="mt-1 block w-full rounded-lg border border-[#D9E5DC] p-2" value={form.dia} onChange={e=>setForm(f=>({...f,dia:e.target.value}))}/></label><label className="text-sm text-[#294B37]">Categoria<select className="mt-1 block w-full rounded-lg border border-[#D9E5DC] p-2" value={form.categoria} onChange={e=>setForm(f=>({...f,categoria:e.target.value}))}>{Object.entries(categorias).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label></div>
  <label className="block text-sm text-[#294B37]">Observações (opcional)<textarea maxLength={1000} rows={2} value={form.observacao} onChange={e=>setForm(f=>({...f,observacao:e.target.value}))} className="mt-1 block w-full rounded-lg border border-[#D9E5DC] p-2"/></label>
  <div className="flex flex-wrap gap-2"><button type="submit" disabled={saving||!userId} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?"Salvando...":editing?"Salvar alterações":"Adicionar tarefa"}</button><button type="button" onClick={()=>{setShowTaskForm(false);setEditing(null);setForm(empty)}} className="rounded-lg border border-[#D9E5DC] px-4 py-2 text-sm">Cancelar</button></div>
 </form>;

 return <section className="space-y-5 ui-sans">
  <header><h1 className="text-2xl font-bold text-[#173D29]">Agenda inteligente</h1><p className="mt-1 text-sm text-[#526A5B]">Tudo do criatório em um só lugar, organizado por assunto.</p></header>
  <nav aria-label="Seções da agenda" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
   {views.map(({id,label,icon:Icon})=><button key={id} type="button" aria-pressed={activeView===id} onClick={()=>setActiveView(id)}
    className={"flex min-h-12 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition sm:text-sm "+(activeView===id?"border-emerald-700 bg-[#E7F4EA] text-[#173D29] shadow-sm":"border-[#D9E5DC] bg-white text-[#526A5B] hover:bg-[#F5F9F5]")}>
    <Icon size={17}/><span>{label}</span>
   </button>)}
  </nav>
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

  <div hidden={activeView!=="resumo"} className="space-y-4">
   <div className="rounded-2xl border border-[#D9E5DC] bg-white p-3 sm:p-4"><MonthControl mes={mes} onChange={navegarMes}/></div>
   <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <article className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex items-center gap-2 text-sm text-[#526A5B]"><ClipboardList size={17}/>Tarefas pendentes</div><p className="mt-2 text-2xl font-bold text-[#173D29]">{tarefasPendentes.length}</p><p className="text-xs text-[#718477]">Neste mês</p></article>
    <article className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex items-center gap-2 text-sm text-[#526A5B]"><Egg size={17}/>Eclosões previstas</div><p className="mt-2 text-2xl font-bold text-[#173D29]">{eclosoes.length}</p><p className="text-xs text-[#718477]">Estimativas do mês</p></article>
    <article className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex items-center gap-2 text-sm text-[#526A5B]"><HeartPulse size={17}/>Cuidados programados</div><p className="mt-2 text-2xl font-bold text-[#173D29]">{cuidadosProgramados.length}</p><p className="text-xs text-[#718477]">Lembretes neste mês</p></article>
    <article className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex items-center gap-2 text-sm text-[#526A5B]"><CalendarDays size={17}/>Eventos no mês</div><p className="mt-2 text-2xl font-bold text-[#173D29]">{events.length}</p><p className="text-xs text-[#718477]">Todos os tipos</p></article>
   </div>
   {atrasados.length>0&&<section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="flex items-center gap-2 font-bold text-amber-900"><Clock3 size={18}/>Precisam de atenção</h2><div className="mt-3 space-y-2">{atrasados.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/80 p-3"><div><p className="text-sm font-semibold text-[#49391C]">{item.titulo}</p><p className="text-xs text-[#79643B]">{item.dia.split("-").reverse().join("/")} · {eventDescription(item)}</p></div>{item.origem==="tarefa"?<button type="button" onClick={()=>{setActiveView("tarefas");editarTarefa(item.tarefa)}} className="text-xs font-semibold text-emerald-800 underline">Ver tarefa</button>:<button type="button" onClick={()=>setActiveView("cuidados")} className="text-xs font-semibold text-emerald-800 underline">Ver cuidados</button>}</div>)}</div></section>}
   <section className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold text-[#173D29]">Próximos eventos</h2><p className="text-xs text-[#718477]">Compromissos futuros deste mês</p></div><button type="button" onClick={()=>setActiveView("calendario")} className="text-xs font-semibold text-emerald-700 underline">Abrir calendário</button></div>
    {loading&&<p className="mt-3 text-sm text-[#526A5B]">Carregando...</p>}
    {!loading&&proximosEventos.length===0&&<p className="mt-3 text-sm text-[#526A5B]">Não há próximos eventos registrados neste mês.</p>}
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{proximosEventos.map(item=><article key={item.id} className="rounded-xl border border-[#E2EBE4] p-3"><p className="text-xs font-semibold text-emerald-800">{item.dia.split("-").reverse().join("/")}</p><p className="mt-1 text-sm font-semibold text-[#173D29]">{item.titulo}</p><p className="mt-1 text-xs text-[#526A5B]">{eventDescription(item)}</p></article>)}</div>
   </section>
   <p className="text-xs text-[#718477]">As eclosões são estimativas calculadas a partir das posturas. Lembretes de cuidados usam as datas informadas por você e não representam confirmação de aplicação.</p>
  </div>

  <div hidden={activeView!=="calendario"} className="space-y-4">
   <div className="rounded-2xl border border-[#D9E5DC] bg-white p-3 sm:p-5">
    <MonthControl mes={mes} onChange={navegarMes}/>
    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#526A5B]">{["D","S","T","Q","Q","S","S"].map((x,i)=><div key={i}>{x}</div>)}</div>
    <div className="mt-2 grid grid-cols-7 gap-1">{Array.from({length:offset},(_,i)=><div key={"blank"+i}/>)}{days.map(d=>{const items=byDay[d]||[];const active=selected===d;return <button key={d} type="button" aria-label={d+" · "+items.length+" eventos"} aria-pressed={active} onClick={()=>{setSelected(d);setForm(f=>({...f,dia:d}))}} className={"relative min-h-14 rounded-lg border px-1 py-2 text-center text-sm transition sm:min-h-16 "+(active?"border-emerald-700 bg-[#E7F4EA] font-bold":"border-[#E2EBE4] hover:bg-slate-50")}><span>{Number(d.slice(-2))}</span>{items.length>0&&<span className="mt-1 block text-[10px] text-emerald-800">{items.length} evento(s)</span>}{d===hoje&&<span className="absolute right-1 top-0.5 text-[9px] text-emerald-700">Hoje</span>}</button>})}</div>
    <p className="mt-4 text-xs text-[#526A5B]">Selecione um dia para consultar os eventos registrados.</p>
   </div>
   <div className="rounded-2xl border border-[#D9E5DC] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold text-[#173D29]">Eventos em {selected.split("-").reverse().join("/")}</h2><button type="button" onClick={novaTarefa} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"><Plus size={15}/>Nova tarefa</button></div>
    {loading&&<p className="mt-3 text-sm">Carregando eventos...</p>}
    {!loading&&selectedEvents.length===0&&<p className="mt-3 text-sm text-[#526A5B]">Nenhum evento registrado neste dia.</p>}
    <div className="mt-3 space-y-2">{selectedEvents.map(item=><article key={item.id} className="rounded-xl border border-[#E2EBE4] p-3"><p className={"text-sm font-semibold "+(item.concluida?"line-through text-slate-400":"text-[#173D29]")}>{item.titulo}</p><p className="mt-1 text-xs text-[#526A5B]">{eventDescription(item)}</p>{item.origem==="tarefa"?<div className="mt-2 flex flex-wrap gap-3 text-xs"><button type="button" disabled={saving} onClick={()=>toggle(item.tarefa)} className="font-semibold text-emerald-700">{item.concluida?"Reabrir":"Concluir"}</button><button type="button" onClick={()=>{setActiveView("tarefas");editarTarefa(item.tarefa)}} className="underline">Editar</button><button type="button" disabled={saving} onClick={()=>remove(item.tarefa)} className="text-red-700">Excluir</button></div>:item.origem==="cuidados"?<button type="button" onClick={()=>setActiveView("cuidados")} className="mt-2 text-xs font-semibold text-emerald-700 underline">Abrir cuidados</button>:<button type="button" onClick={()=>onNavigate?.("reproducao")} className="mt-2 text-xs font-semibold text-emerald-700 underline">Abrir reprodução</button>}</article>)}</div>
   </div>
   {showTaskForm&&taskForm}
  </div>

  <div hidden={activeView!=="tarefas"} className="space-y-4">
   <div className="rounded-2xl border border-[#D9E5DC] bg-white p-3 sm:p-4"><MonthControl mes={mes} onChange={navegarMes}/></div>
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-[#173D29]">Tarefas do criatório</h2><p className="text-xs text-[#718477]">Organize manejos, reprodução, saúde e outras atividades.</p></div><button type="button" onClick={novaTarefa} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><Plus size={16}/>Nova tarefa</button></div>
   {showTaskForm&&taskForm}
   <div className="flex flex-wrap gap-2">{[{id:"pendentes",label:"Pendentes"},{id:"concluidas",label:"Concluídas"},{id:"todas",label:"Todas"}].map(f=><button type="button" key={f.id} aria-pressed={taskFilter===f.id} onClick={()=>setTaskFilter(f.id)} className={"rounded-full border px-3 py-1.5 text-xs font-semibold "+(taskFilter===f.id?"border-emerald-700 bg-[#E7F4EA] text-[#173D29]":"border-[#D9E5DC] bg-white text-[#526A5B]")}>{f.label}</button>)}</div>
   {loading&&<p className="text-sm text-[#526A5B]">Carregando tarefas...</p>}
   {!loading&&tarefasFiltradas.length===0&&<div className="rounded-2xl border border-dashed border-[#C9D8CD] bg-white p-8 text-center"><ClipboardList className="mx-auto text-[#78917F]" size={28}/><p className="mt-2 text-sm font-semibold text-[#294B37]">{taskFilter==="pendentes"?"Nenhuma tarefa pendente neste mês.":"Nenhuma tarefa nesta categoria."}</p><p className="mt-1 text-xs text-[#718477]">Quando precisar, use “Nova tarefa” para registrar uma atividade.</p></div>}
   <div className="space-y-2">{tarefasFiltradas.map(t=><article key={t.id} className="rounded-xl border border-[#D9E5DC] bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className={"text-sm font-semibold "+(t.concluida?"text-slate-400 line-through":"text-[#173D29]")}>{t.titulo}</p><p className="mt-1 text-xs text-[#526A5B]">{t.dia.split("-").reverse().join("/")} · {categorias[t.categoria]||"Outro"}{t.observacao?" · "+t.observacao:""}</p></div><span className={"rounded-full px-2 py-1 text-[10px] font-semibold "+(t.concluida?"bg-slate-100 text-slate-500":"bg-amber-50 text-amber-800")}>{t.concluida?"Concluída":"Pendente"}</span></div><div className="mt-3 flex flex-wrap gap-3 text-xs"><button type="button" disabled={saving} onClick={()=>toggle(t)} className="inline-flex items-center gap-1 font-semibold text-emerald-700">{t.concluida?<><RotateCcw size={13}/>Reabrir</>:<><CheckCircle2 size={13}/>Concluir</>}</button><button type="button" onClick={()=>editarTarefa(t)} className="underline">Editar</button><button type="button" disabled={saving} onClick={()=>remove(t)} className="text-red-700">Excluir</button></div></article>)}</div>
  </div>

  <div hidden={activeView!=="cuidados"} className="space-y-3">
   <div className="rounded-xl border border-[#D9E5DC] bg-[#F5F9F5] p-3"><p className="text-sm text-[#315B43]">Aqui ficam somente os registros de medicamentos e vitaminas. O formulário e o histórico não aparecem misturados com as tarefas e o calendário.</p></div>
   <React.Suspense fallback={<p className="rounded-xl border border-[#D9E5DC] bg-white p-4 text-sm text-[#526A5B]">Carregando registros de cuidados...</p>}>
    <CuidadosAves userId={userId} aves={aves} mes={mes} onDataChange={onCuidados} carePrefill={carePrefill} onSaved={onCareSaved}/>
   </React.Suspense>
  </div>
 </section>;
}
