import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Wallet, CalendarDays, Bird, UserRound, CheckCircle2, Clock3, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "../../supabaseClient";

const moneyBR = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateBR = (v) => v ? new Date(v + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export default function ReservasTab({ userId, clientes = [], aves = [], posturas = [], Card, SectionTitle }) {
  const [reservas, setReservas] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("ativas");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ tipo: "ave_existente", cliente_id: "", ave_id: "", postura_id: "", descricao_futura: "", valor_total: "", valor_sinal: "", data_reserva: new Date().toISOString().slice(0,10), previsao_nascimento: "", observacoes: "" });
  const [pagamentoForm, setPagamentoForm] = useState({});
  const [expandida, setExpandida] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true); setErro("");
    const [r, p] = await Promise.all([
      supabase.from("reservas_aves").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("reserva_pagamentos").select("*").eq("user_id", userId).order("data_pagamento", { ascending: false }),
    ]);
    if (r.error || p.error) setErro("Não foi possível carregar as reservas. " + (r.error?.message || p.error?.message || ""));
    else { setReservas(r.data || []); setPagamentos(p.data || []); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = useMemo(() => reservas.reduce((acc, r) => {
    const pagos = pagamentos.filter(p => p.reserva_id === r.id && p.status === "recebido").reduce((s,p) => s + Number(p.valor || 0), 0);
    if (!["concluida","cancelada"].includes(r.status)) acc.ativas += 1;
    acc.recebido += pagos;
    acc.saldo += Math.max(0, Number(r.valor_total || 0) - pagos);
    return acc;
  }, { ativas: 0, recebido: 0, saldo: 0 }), [reservas, pagamentos]);

  const criar = async (e) => {
    e.preventDefault(); setErro("");
    const total = Number(String(form.valor_total).replace(",", "."));
    const sinal = Number(String(form.valor_sinal || 0).replace(",", "."));
    if (!form.cliente_id || !(total > 0) || sinal < 0 || sinal > total) { setErro("Selecione o cliente e informe valores válidos. O sinal não pode superar o valor total."); return; }
    if (form.tipo === "ave_existente" && !form.ave_id) { setErro("Selecione a ave que está sendo reservada."); return; }
    if (form.tipo === "antecipada" && !form.descricao_futura.trim() && !form.postura_id) { setErro("Informe o casal/ninhada ou selecione uma postura."); return; }
    setSaving(true);
    const payload = {
      user_id: userId, cliente_id: form.cliente_id, ave_id: form.tipo === "ave_existente" ? form.ave_id : null,
      postura_id: form.postura_id || null, tipo: form.tipo, descricao_futura: form.descricao_futura.trim() || null,
      valor_total: total, status: form.tipo === "antecipada" ? "aguardando_nascimento" : sinal > 0 ? "reservada" : "aguardando_sinal",
      data_reserva: form.data_reserva, previsao_nascimento: form.previsao_nascimento || null, observacoes: form.observacoes.trim() || null,
    };
    const { data, error } = await supabase.from("reservas_aves").insert(payload).select().single();
    if (error) setErro("Não foi possível criar a reserva: " + error.message);
    else {
      if (sinal > 0) {
        const { error: payError } = await supabase.from("reserva_pagamentos").insert({ reserva_id: data.id, user_id: userId, valor: sinal, data_pagamento: form.data_reserva, descricao: "Sinal da reserva", status: "recebido" });
        if (payError) setErro("Reserva criada, mas o sinal não foi registrado. Abra a reserva e registre o pagamento: " + payError.message);
      }
      setForm({ tipo: "ave_existente", cliente_id: "", ave_id: "", postura_id: "", descricao_futura: "", valor_total: "", valor_sinal: "", data_reserva: new Date().toISOString().slice(0,10), previsao_nascimento: "", observacoes: "" });
      setMostrarForm(false); await carregar();
    }
    setSaving(false);
  };

  const adicionarPagamento = async (reserva) => {
    const f = pagamentoForm[reserva.id] || {};
    const valor = Number(String(f.valor || "").replace(",", "."));
    const recebido = pagamentos.filter(p => p.reserva_id === reserva.id && p.status === "recebido").reduce((s,p) => s + Number(p.valor || 0), 0);
    const saldo = Number(reserva.valor_total || 0) - recebido;
    if (!(valor > 0) || valor > saldo) { setErro("Informe um pagamento maior que zero e não superior ao saldo restante."); return; }
    setSaving(true); setErro("");
    const { error } = await supabase.from("reserva_pagamentos").insert({ reserva_id: reserva.id, user_id: userId, valor, data_pagamento: f.data || new Date().toISOString().slice(0,10), forma_pagamento: f.forma || null, descricao: f.descricao || null, status: "recebido" });
    if (error) setErro("Não foi possível registrar o pagamento: " + error.message);
    else { setPagamentoForm(v => ({ ...v, [reserva.id]: {} })); await carregar(); }
    setSaving(false);
  };

  const atualizarStatus = async (r, status) => {
    const { error } = await supabase.from("reservas_aves").update({ status, updated_at: new Date().toISOString() }).eq("id", r.id).eq("user_id", userId);
    if (error) setErro("Não foi possível atualizar a reserva: " + error.message); else await carregar();
  };

  const visiveis = reservas.filter(r => filtro === "todas" || (filtro === "ativas" ? !["concluida","cancelada"].includes(r.status) : r.status === filtro));
  const nomeCliente = (id) => clientes.find(c => c.id === id)?.nome || "Cliente não localizado";
  const nomeAve = (id) => aves.find(a => a.id === id)?.nome || "Ave não vinculada";
  const nomePostura = (id) => { const p = posturas.find(x => x.id === id); return p ? [p.casalLabel, p.nomeCasal, p.identificacao].filter(Boolean).join(" · ") || "Postura vinculada" : ""; };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><SectionTitle>Reservas</SectionTitle><p className="-mt-4 text-sm" style={{color:"#587061"}}>Controle sinais, pagamentos e valores pendentes dos seus clientes.</p></div>
      <button onClick={() => setMostrarForm(v => !v)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold" style={{background:"#18764B",color:"#fff"}}><Plus size={17}/>{mostrarForm ? "Fechar formulário" : "Nova reserva"}</button>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[["Reservas ativas", resumo.ativas, Clock3],["Total recebido", moneyBR(resumo.recebido), Wallet],["Saldo pendente", moneyBR(resumo.saldo), CalendarDays]].map(([label,value,Icon]) => <Card key={label} className="p-4"><div className="flex items-center gap-2 text-xs font-semibold" style={{color:"#668071"}}><Icon size={16}/>{label}</div><div className="mt-2 text-xl font-extrabold" style={{color:"#203B2C"}}>{value}</div></Card>)}
    </div>
    {erro && <div className="rounded-xl border px-4 py-3 text-sm" style={{background:"#FFF1EF",borderColor:"#F1D0CB",color:"#9B5148"}}>{erro}</div>}
    {mostrarForm && <Card className="p-4 sm:p-5"><h3 className="mb-4 font-bold" style={{color:"#244532"}}>Dados da reserva</h3>
      <form onSubmit={criar} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Tipo de reserva<select value={form.tipo} onChange={e=>setForm(v=>({...v,tipo:e.target.value,ave_id:""}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="ave_existente">Ave já nascida</option><option value="antecipada">Futura ninhada / ave ainda não nascida</option></select></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Cliente<select required value={form.cliente_id} onChange={e=>setForm(v=>({...v,cliente_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Selecione o cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}{c.telefone ? " · "+c.telefone : ""}</option>)}</select></label>
        {form.tipo === "ave_existente" ? <label className="text-xs font-semibold sm:col-span-2" style={{color:"#496653"}}>Ave<select required value={form.ave_id} onChange={e=>setForm(v=>({...v,ave_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Selecione a ave</option>{aves.filter(a=>!["Vendida","Falecida","Perdida"].includes(a.status)).map(a=><option key={a.id} value={a.id}>{a.nome || "Sem nome"} · {a.especie || "Espécie não informada"}</option>)}</select></label> :
          <><label className="text-xs font-semibold" style={{color:"#496653"}}>Postura / ninhada (opcional)<select value={form.postura_id} onChange={e=>setForm(v=>({...v,postura_id:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}><option value="">Não vincular agora</option>{posturas.map(p=><option key={p.id} value={p.id}>{nomePostura(p.id) || "Postura"}</option>)}</select></label><label className="text-xs font-semibold" style={{color:"#496653"}}>Casal / descrição da futura ave<input value={form.descricao_futura} onChange={e=>setForm(v=>({...v,descricao_futura:e.target.value}))} placeholder="Ex.: filhote do casal Mel × Zazur" className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label></>}
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Valor total combinado (R$)<input required type="number" min="0.01" step="0.01" value={form.valor_total} onChange={e=>setForm(v=>({...v,valor_total:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Sinal recebido agora (R$)<input type="number" min="0" step="0.01" value={form.valor_sinal} onChange={e=>setForm(v=>({...v,valor_sinal:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <label className="text-xs font-semibold" style={{color:"#496653"}}>Data da reserva / sinal<input type="date" value={form.data_reserva} onChange={e=>setForm(v=>({...v,data_reserva:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        {form.tipo === "antecipada" && <label className="text-xs font-semibold" style={{color:"#496653"}}>Previsão de nascimento<input type="date" value={form.previsao_nascimento} onChange={e=>setForm(v=>({...v,previsao_nascimento:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>}
        <label className="text-xs font-semibold sm:col-span-2" style={{color:"#496653"}}>Observações<textarea value={form.observacoes} onChange={e=>setForm(v=>({...v,observacoes:e.target.value}))} rows="2" className="mt-1 w-full rounded-xl border p-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2"><button disabled={saving} className="rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50" style={{background:"#18764B",color:"#fff"}}>{saving ? "Salvando..." : "Salvar reserva"}</button><button type="button" onClick={()=>setMostrarForm(false)} className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{borderColor:"#D8E5DB",color:"#496653"}}>Cancelar</button></div>
      </form>
    </Card>}
    <div className="flex flex-wrap gap-2">{[["ativas","Ativas"],["todas","Todas"],["aguardando_nascimento","Aguardando nascimento"],["concluida","Concluídas"],["cancelada","Canceladas"]].map(([id,label])=><button key={id} onClick={()=>setFiltro(id)} className="rounded-full px-3 py-2 text-xs font-bold" style={{background:filtro===id?"#18764B":"#fff",color:filtro===id?"#fff":"#496653",border:"1px solid "+(filtro===id?"#18764B":"#D8E5DB")}}>{label}</button>)}</div>
    {loading ? <Card className="p-8 text-center text-sm" >Carregando reservas...</Card> : visiveis.length === 0 ? <Card className="p-8 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{background:"#EAF4ED",color:"#287A50"}}><CalendarDays size={24}/></div><h3 className="font-bold" style={{color:"#244532"}}>Nenhuma reserva encontrada</h3><p className="mt-1 text-sm" style={{color:"#668071"}}>Cadastre a primeira reserva para acompanhar sinais e pagamentos.</p></Card> :
      <div className="space-y-3">{visiveis.map(r=>{const pays=pagamentos.filter(p=>p.reserva_id===r.id);const recebido=pays.filter(p=>p.status==="recebido").reduce((s,p)=>s+Number(p.valor||0),0);const saldo=Math.max(0,Number(r.valor_total||0)-recebido);const cliente=clientes.find(c=>c.id===r.cliente_id);const aberta=expandida===r.id;return <Card key={r.id} className="overflow-hidden"><button onClick={()=>setExpandida(aberta?"":r.id)} className="w-full p-4 text-left sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold" style={{color:"#203B2C"}}>{r.tipo==="antecipada"?"Reserva antecipada":nomeAve(r.ave_id)}</span><span className="rounded-full px-2 py-1 text-[10px] font-bold" style={{background:r.status==="concluida"?"#EAF4ED":r.status==="cancelada"?"#FCEFED":"#FFF4DF",color:r.status==="concluida"?"#287A50":r.status==="cancelada"?"#A64F45":"#95651A"}}>{({aguardando_nascimento:"Aguardando nascimento",aguardando_sinal:"Aguardando sinal",reservada:"Reservada",concluida:"Concluída",cancelada:"Cancelada"})[r.status]||r.status}</span></div><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{color:"#668071"}}><span className="inline-flex items-center gap-1"><UserRound size={13}/>{nomeCliente(r.cliente_id)}</span><span>{dateBR(r.data_reserva)}</span></div>{r.tipo==="antecipada"&&<p className="mt-1 text-xs" style={{color:"#52705D"}}>{r.descricao_futura || nomePostura(r.postura_id) || "Futura ninhada"}</p>}</div><div className="grid grid-cols-2 gap-4 text-right sm:min-w-[230px]"><div><div className="text-[10px]" style={{color:"#668071"}}>Recebido</div><div className="font-bold" style={{color:"#287A50"}}>{moneyBR(recebido)}</div></div><div><div className="text-[10px]" style={{color:"#668071"}}>Saldo</div><div className="font-bold" style={{color:"#203B2C"}}>{moneyBR(saldo)}</div></div></div></div></button>
        {aberta&&<div className="border-t px-4 py-4 sm:px-5" style={{borderColor:"#E2EBE4"}}><div className="grid gap-3 text-sm sm:grid-cols-3"><div><span className="text-xs" style={{color:"#668071"}}>Valor combinado</span><div className="font-bold" style={{color:"#203B2C"}}>{moneyBR(r.valor_total)}</div></div><div><span className="text-xs" style={{color:"#668071"}}>Cliente / contato</span><div className="font-semibold" style={{color:"#203B2C"}}>{cliente?.nome||"—"}</div><div className="text-xs" style={{color:"#668071"}}>{cliente?.telefone||"Telefone não cadastrado"}</div></div><div><span className="text-xs" style={{color:"#668071"}}>Previsão nascimento</span><div className="font-semibold" style={{color:"#203B2C"}}>{dateBR(r.previsao_nascimento)}</div></div></div>
        {r.observacoes&&<p className="mt-3 rounded-lg p-3 text-xs" style={{background:"#F5F8F5",color:"#52705D"}}>{r.observacoes}</p>}
        <h4 className="mt-4 text-xs font-bold uppercase tracking-wide" style={{color:"#496653"}}>Histórico de pagamentos</h4>{pays.length===0?<p className="mt-2 text-xs" style={{color:"#668071"}}>Nenhum pagamento registrado.</p>:<div className="mt-2 space-y-2">{pays.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-2 rounded-lg px-3 py-2 text-xs" style={{background:"#F5F8F5",color:"#496653"}}><span>{dateBR(p.data_pagamento)} · {p.descricao||p.forma_pagamento||"Pagamento"}</span><strong>{moneyBR(p.valor)}</strong></div>)}</div>}
        {saldo>0&&!["concluida","cancelada"].includes(r.status)&&<div className="mt-4 rounded-xl p-3" style={{background:"#F5F8F5"}}><h4 className="mb-2 text-xs font-bold" style={{color:"#496653"}}>Registrar novo pagamento</h4><div className="grid gap-2 sm:grid-cols-[1fr_150px_1fr_auto]"><input type="number" min="0.01" max={saldo} step="0.01" placeholder="Valor recebido" value={pagamentoForm[r.id]?.valor||""} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],valor:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><input type="date" value={pagamentoForm[r.id]?.data||new Date().toISOString().slice(0,10)} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],data:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><input placeholder="Forma / observação" value={pagamentoForm[r.id]?.forma||""} onChange={e=>setPagamentoForm(v=>({...v,[r.id]:{...v[r.id],forma:e.target.value}}))} className="min-h-10 rounded-lg border px-3 text-sm" style={{borderColor:"#D8E5DB",color:"#203B2C"}}/><button disabled={saving} onClick={()=>adicionarPagamento(r)} className="rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50" style={{background:"#18764B",color:"#fff"}}>Registrar</button></div></div>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><div className="text-xs" style={{color:"#668071"}}>Situação da reserva</div><select value={r.status} onChange={e=>atualizarStatus(r,e.target.value)} className="min-h-9 rounded-lg border px-3 text-xs font-semibold" style={{borderColor:"#D8E5DB",color:"#496653"}}><option value="aguardando_nascimento">Aguardando nascimento</option><option value="aguardando_sinal">Aguardando sinal</option><option value="reservada">Reservada</option><option value="concluida">Concluída</option><option value="cancelada">Cancelada</option></select></div>
        </div>}
      </Card>})}</div>}
    <div className="flex justify-end"><button onClick={carregar} className="inline-flex items-center gap-2 text-xs font-semibold" style={{color:"#52705D"}}><RefreshCw size={14}/> Atualizar lista</button></div>
  </div>;
}
