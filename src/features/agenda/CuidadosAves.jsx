import React,{useCallback,useEffect,useState} from "react";
import {supabase} from "../../supabaseClient";
import {diaLocal} from "./utils/agenda";
import {registroValido,prepararNovaAdministracao,mesSeguinte,montarLoteCuidados} from "./utils/cuidados";
const blank=()=>({ave_id:"",tipo:"vitamina",produto:"",data_aplicacao:diaLocal(),proxima_data:"",quantidade_informada:"",observacao:""});
const br=d=>d?d.split("-").reverse().join("/"):"—";
export default function CuidadosAves({userId,aves=[],mes,onDataChange,carePrefill,onSaved}){
 const [selectedBirds,setSelectedBirds]=useState([]),[repeatBirds,setRepeatBirds]=useState([]),[filterBirds,setFilterBirds]=useState("");
 const [rows,setRows]=useState([]),[form,setForm]=useState(blank),[editId,setEditId]=useState(null),[saving,setSaving]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const ids=new Set(aves.map(a=>String(a.id)));
 const load=useCallback(async()=>{
  if(!userId||!mes)return;
  setLoading(true);setError("");
  const start=mes+"-01",end=mesSeguinte(mes)+"-01";
  const cols="id,ave_id,tipo,produto,data_aplicacao,proxima_data,quantidade_informada,observacao";
  const [historic,monthly]=await Promise.all([
    supabase.from("ave_cuidados_registros").select(cols).eq("user_id",userId).order("data_aplicacao",{ascending:false}).limit(100),
    supabase.from("ave_cuidados_registros").select(cols).eq("user_id",userId)
      .or(`and(data_aplicacao.gte.${start},data_aplicacao.lt.${end}),and(proxima_data.gte.${start},proxima_data.lt.${end})`)
      .limit(500)
  ]);
  setLoading(false);
  if(historic.error||monthly.error){setError("Não foi possível consultar o histórico e os lembretes.");return;}
  setRows(historic.data||[]);
  const merged=new Map();
  for(const item of [...(historic.data||[]),...(monthly.data||[])])merged.set(item.id,item);
  onDataChange?.([...merged.values()]);
 },[userId,mes,onDataChange]);
 useEffect(()=>{load()},[load]);
 useEffect(()=>{
  if(!carePrefill?.ave_id)return;
  setEditId(null);setForm({...blank(),ave_id:carePrefill.ave_id,tipo:carePrefill.tipo,produto:carePrefill.produto});
  setSelectedBirds([String(carePrefill.ave_id)]);setRepeatBirds([]);
 },[carePrefill?.token]);
 const update=(key,value)=>setForm(s=>({...s,[key]:value}));
 const submit=async e=>{
  e.preventDefault();
  let payload;
  try{
    if(editId){
      if(!registroValido(form,ids))throw Error("Confira a ave, produto e datas.");
      payload={user_id:userId,ave_id:form.ave_id,tipo:form.tipo,produto:form.produto.trim(),
        data_aplicacao:form.data_aplicacao,proxima_data:form.proxima_data||null,
        quantidade_informada:form.quantidade_informada.trim()||null,observacao:form.observacao.trim()||null};
    }else payload=montarLoteCuidados(form,selectedBirds,repeatBirds,userId,ids);
  }catch(e){setError(e.message);return;}
  setSaving(true);setError("");
  const r=editId?await supabase.from("ave_cuidados_registros").update(payload).eq("id",editId).eq("user_id",userId):
    await supabase.from("ave_cuidados_registros").insert(payload);
  setSaving(false);
  if(r.error){setError("Não foi possível salvar todos os registros. Confira os dados.");return;}
  setEditId(null);setForm(blank());setSelectedBirds([]);setRepeatBirds([]);await load();onSaved?.();
 };
 const remove=async r=>{if(!window.confirm("Excluir este registro do histórico?"))return;setSaving(true);const {error:e}=await supabase.from("ave_cuidados_registros").delete().eq("id",r.id).eq("user_id",userId);setSaving(false);if(e)setError("Não foi possível excluir o registro.");else await load();};
 const names=new Map(aves.map(a=>[String(a.id),a.nome||a.anilha||"Ave"]));
 return <section className="rounded-2xl border border-[#D9E5DC] bg-white p-4 sm:p-5 space-y-4"><div><h2 className="text-lg font-bold text-[#173D29]">Medicamentos e vitaminas</h2><p className="mt-1 text-xs text-[#526A5B]">Histórico por ave e próxima data informada por você. Não define doses, tratamentos nem frequência.</p></div>
 <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><fieldset className="sm:col-span-2 rounded-xl border border-[#E2EBE4] p-3"><legend className="px-1 text-sm font-bold text-[#173D29]">{editId?"Ave do registro":"Quais aves receberam o produto?"}</legend>
 {editId?<select className="mt-1 w-full rounded-lg border p-2" required value={form.ave_id} onChange={e=>update("ave_id",e.target.value)}><option value="">Selecione</option>{aves.map(a=><option key={a.id} value={a.id}>{a.nome||a.anilha||"Ave"}{a.anilha?" · "+a.anilha:""}</option>)}</select>:<>
 <div className="my-2 flex flex-wrap gap-3"><button type="button" className="text-xs font-semibold text-emerald-700 underline" onClick={()=>setSelectedBirds(aves.map(a=>String(a.id)))}>Selecionar todas</button><button type="button" className="text-xs underline" onClick={()=>{setSelectedBirds([]);setRepeatBirds([])}}>Limpar seleção</button><span className="text-xs text-[#526A5B]">{selectedBirds.length} selecionada(s)</span></div>
 <input aria-label="Buscar ave por nome ou anilha" placeholder="Buscar por nome ou anilha" className="mb-2 w-full rounded-lg border p-2 text-sm" value={filterBirds} onChange={e=>setFilterBirds(e.target.value)}/>
 <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-1 sm:grid-cols-2">{aves.filter(a=>String(a.nome||"").toLowerCase().includes(filterBirds.toLowerCase())||String(a.anilha||"").toLowerCase().includes(filterBirds.toLowerCase())).map(a=>{const id=String(a.id);return <label key={id} className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={selectedBirds.includes(id)} onChange={e=>{setSelectedBirds(prev=>e.target.checked?[...prev,id]:prev.filter(x=>x!==id));if(!e.target.checked)setRepeatBirds(prev=>prev.filter(x=>x!==id))}}/><span>{a.nome||"Ave"}{a.anilha?" · "+a.anilha:""}</span></label>})}</div>
 </>}</fieldset><label className="text-sm">Tipo<select className="mt-1 w-full rounded-lg border p-2" value={form.tipo} onChange={e=>update("tipo",e.target.value)}><option value="vitamina">Vitamina / suplemento</option><option value="medicamento">Medicamento</option></select></label><label className="text-sm sm:col-span-2">Nome do produto<input maxLength={140} required className="mt-1 w-full rounded-lg border p-2" value={form.produto} onChange={e=>update("produto",e.target.value)} placeholder="Produto utilizado"/></label><label className="text-sm">Quando foi administrado<input required type="date" className="mt-1 w-full rounded-lg border p-2" value={form.data_aplicacao} onChange={e=>update("data_aplicacao",e.target.value)}/></label><label className="text-sm">Próxima data (opcional)<input type="date" min={form.data_aplicacao} className="mt-1 w-full rounded-lg border p-2" value={form.proxima_data} onChange={e=>update("proxima_data",e.target.value)}/></label>
 {!editId&&<fieldset className="sm:col-span-2 rounded-xl border border-[#E2EBE4] p-3"><legend className="px-1 text-sm font-bold text-[#173D29]">Quais aves devem ter um lembrete para a próxima aplicação?</legend>
 <p className="mb-2 text-xs text-[#526A5B]">Somente as selecionadas abaixo receberão a próxima data na Agenda. Não é administração confirmada.</p>
 <div className="mb-2 flex flex-wrap gap-3"><button type="button" className="text-xs font-semibold text-emerald-700 underline" onClick={()=>setRepeatBirds([...selectedBirds])}>Todas as aves selecionadas</button><button type="button" className="text-xs underline" onClick={()=>setRepeatBirds([])}>Nenhuma</button><span className="text-xs text-[#526A5B]">{repeatBirds.length} com lembrete</span></div>
 <div className="max-h-44 overflow-y-auto grid gap-1 sm:grid-cols-2">{aves.filter(a=>selectedBirds.includes(String(a.id))).map(a=>{const id=String(a.id);return <label className="flex items-center gap-2 rounded-lg p-2 text-sm hover:bg-slate-50" key={id}><input type="checkbox" checked={repeatBirds.includes(id)} onChange={e=>setRepeatBirds(prev=>e.target.checked?[...prev,id]:prev.filter(x=>x!==id))}/>{a.nome||"Ave"}{a.anilha?" · "+a.anilha:""}</label>})}</div>
 {repeatBirds.length>0&&!form.proxima_data&&<p className="mt-2 text-xs text-amber-700">Informe a próxima data para essas aves ou retire a seleção.</p>}
 </fieldset>}<label className="text-sm sm:col-span-2">Quantidade administrada (opcional, apenas registro)<input className="mt-1 w-full rounded-lg border p-2" maxLength={120} value={form.quantidade_informada} onChange={e=>update("quantidade_informada",e.target.value)} placeholder="Conforme orientação veterinária"/></label><label className="text-sm sm:col-span-2">Observações<textarea className="mt-1 w-full rounded-lg border p-2" rows={2} maxLength={1000} value={form.observacao} onChange={e=>update("observacao",e.target.value)}/></label><div className="sm:col-span-2 flex flex-wrap gap-2"><button disabled={saving||!aves.length} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?"Salvando...":editId?"Salvar alterações":selectedBirds.length>1?`Registrar para ${selectedBirds.length} aves`:"Registrar administração"}</button>{editId&&<button type="button" onClick={()=>{setForm(blank());setEditId(null);setSelectedBirds([]);setRepeatBirds([])}} className="text-sm underline">Cancelar</button>}</div></form>
 {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 <div><h3 className="font-semibold text-[#173D29]">Histórico de administrações</h3>{loading&&<p className="text-sm">Carregando...</p>}{!loading&&rows.length===0&&<p className="mt-2 text-sm text-[#526A5B]">Nenhum registro cadastrado.</p>}<div className="mt-2 space-y-2">{rows.map(r=><article className="rounded-xl border border-[#E2EBE4] p-3" key={r.id}><div className="flex flex-wrap items-start justify-between gap-2"><div className="text-sm"><strong>{r.produto}</strong><p className="text-xs text-[#526A5B]">{names.get(String(r.ave_id))||"Ave"} · {r.tipo==="vitamina"?"Vitamina":"Medicamento"}</p><p className="mt-1">Administrado: {br(r.data_aplicacao)} · Próxima data: {br(r.proxima_data)}</p>{r.quantidade_informada&&<p className="text-xs text-[#526A5B]">Quantidade registrada: {r.quantidade_informada}</p>}</div><div className="flex gap-3 text-xs"><button type="button" disabled={saving} onClick={()=>{setEditId(null);setForm(prepararNovaAdministracao(r,diaLocal()));setSelectedBirds([String(r.ave_id)]);setRepeatBirds([])}} className="font-semibold text-emerald-700">Registrar novamente</button><button type="button" onClick={()=>{setEditId(r.id);setSelectedBirds([]);setRepeatBirds([]);setForm({...r,proxima_data:r.proxima_data||"",quantidade_informada:r.quantidade_informada||"",observacao:r.observacao||""})}} className="font-semibold text-emerald-700">Editar</button><button type="button" disabled={saving} onClick={()=>remove(r)} className="text-red-700">Excluir</button></div></div></article>)}</div><p className="mt-2 text-xs text-[#526A5B]">Exibimos até 100 administrações recentes e todos os eventos encontrados para o mês consultado (até 500). Uma nova administração deve ser registrada novamente. A próxima data funciona como lembrete, não confirma que o produto foi administrado.</p></div></section>
}
