import React from "react";
import { Bird, Save, UserRound, ChevronDown, ChevronRight } from "lucide-react";
import { ESPECIES, NIVEIS, idadePerfil } from "./perfilAve.js";
import { FASES } from "./motorEducativo.js";
const input="mt-1 block w-full rounded-xl border border-[#DAE6DD] bg-white px-3 py-2.5 text-sm text-[#234332] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:bg-stone-50";
export default function PerfilMinhaAve({perfil,aves,aveId,onSelecionar,onAtualizar,onSalvar,status,erro,disabled,aberto,onToggle}) {
 const idade=idadePerfil(perfil);
 const atual=aves.find(a=>String(a.id)===aveId);
 return <section className="overflow-hidden rounded-2xl border border-[#DEE7DF] bg-white shadow-sm" aria-label="Conhecendo minha ave">
  <button type="button" onClick={onToggle} aria-expanded={aberto} className="flex w-full items-center justify-between gap-3 p-4 text-left">
   <span className="flex min-w-0 items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><Bird size={23}/></span><span className="min-w-0"><strong className="block text-base">Conhecendo minha ave</strong><span className="block truncate text-xs text-[#607366]">{perfil.nome||perfil.especie||"Conversa geral"}{idade!==null?" · "+idade+" dias":""}</span></span></span>
   <span className="flex shrink-0 items-center gap-2">{aberto?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</span>
  </button>
  {aberto&&<div className="space-y-4 border-t border-[#E7EDE8] p-4">
   <div className="rounded-xl bg-[#F4FAF5] p-3"><label className="block text-xs font-semibold">Ave em acompanhamento<select className={input} value={aveId} disabled={disabled} onChange={e=>onSelecionar(e.target.value)}><option value="">Perfil manual / conversa geral</option>{aves.map(a=><option key={a.id} value={String(a.id)}>{a.nome||a.anilha||"Ave sem nome"} · {a.especie||"Espécie não informada"}</option>)}</select></label><p className="mt-2 text-xs text-[#607366]">{atual?"Nome, espécie, sexo, mutação e nascimento vêm do plantel. Edite esses dados no cadastro oficial.":"Informe os dados básicos sem precisar cadastrar uma ave no plantel."}</p></div>
   <div><h4 className="mb-2 flex items-center gap-2 text-sm font-bold"><UserRound size={16} className="text-emerald-700"/> Seu perfil</h4><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{NIVEIS.map(n=><button key={n.id} type="button" aria-pressed={perfil.nivel===n.id} disabled={disabled} onClick={()=>onAtualizar("nivel",n.id)} className={"rounded-xl border p-3 text-left text-xs font-semibold "+(perfil.nivel===n.id?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-[#DEE7DF] text-[#586B5F]")}>{n.label}</button>)}</div></div>
   <div><h4 className="mb-2 text-sm font-bold">Dados da ave</h4><div className="grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-semibold">Nome (opcional)<input maxLength={60} className={input} disabled={disabled||!!atual} value={perfil.nome} onChange={e=>onAtualizar("nome",e.target.value)} placeholder="Ex.: Luna"/></label>
    <label className="text-xs font-semibold">Espécie<select className={input} disabled={disabled||!!atual} value={perfil.especie} onChange={e=>onAtualizar("especie",e.target.value)}><option value="">Ainda não informada</option>{ESPECIES.map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="text-xs font-semibold">Sexo<select className={input} disabled={disabled||!!atual} value={perfil.sexo} onChange={e=>onAtualizar("sexo",e.target.value)}><option value="">Não informado</option>{["Macho","Fêmea","Não identificado"].map(x=><option key={x}>{x}</option>)}</select></label>
    <label className="text-xs font-semibold">Mutação / cor<input maxLength={80} className={input} disabled={disabled||!!atual} value={perfil.mutacao} onChange={e=>onAtualizar("mutacao",e.target.value)} placeholder="Ex.: azul"/></label>
    <label className="text-xs font-semibold">Nascimento (se conhecido)<input type="date" className={input} disabled={disabled||!!atual} value={perfil.nascimento} onChange={e=>onAtualizar("nascimento",e.target.value)}/></label>
    <label className="text-xs font-semibold">Idade em dias<input type="number" min="0" max="30000" step="1" className={input} disabled={disabled||!!perfil.nascimento} value={perfil.nascimento?(idade??""):perfil.idadeDias} onChange={e=>onAtualizar("idadeDias",e.target.value)} placeholder="Opcional"/></label>
    <label className="text-xs font-semibold">Etapa de vida<select className={input} disabled={disabled} value={perfil.etapaVida} onChange={e=>onAtualizar("etapaVida",e.target.value)}><option value="">Não identificada</option><option value="filhote">Filhote</option><option value="jovem">Jovem</option><option value="adulto">Adulta</option></select></label>
    <label className="text-xs font-semibold">Fase alimentar<select className={input} disabled={disabled} value={perfil.fase} onChange={e=>onAtualizar("fase",e.target.value)}>{FASES.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label>
   </div></div>
   {erro&&<p role="alert" className="text-xs font-semibold text-red-700">{erro}</p>}
   <button type="button" disabled={disabled} onClick={onSalvar} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Save size={17}/> Salvar e usar no chat</button>
   <p role="status" className="text-xs text-[#496754]">{status||"Ao trocar de ave e salvar, uma nova conversa é iniciada. Seus dados educativos são mantidos por ave. A gravação nesta etapa é neste navegador, por conta; sincronização em outros dispositivos ainda não está ativa."}</p>
   <p className="text-xs leading-5 text-[#607366]">O Gemini, quando autorizado, recebe mensagens e informações educativas necessárias (espécie, idade e fase). Não envie dados pessoais sensíveis. O perfil não comprova diagnóstico nem maturidade reprodutiva.</p>
  </div>}
 </section>;
}
