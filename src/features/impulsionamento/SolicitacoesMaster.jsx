import React, { useEffect, useMemo, useState } from "react";
import { listarCampanhasAdmin, atualizarCampanhaAdmin } from "../campanhas/services/campanhasService";
import { PACOTES_CAMPANHA, STATUS_CAMPANHA } from "../campanhas/config/pacotes";

// Apenas estados operacionais preliminares. "paga" e "em_execucao" exigem
// confirmação financeira e autorização no servidor antes de serem oferecidos.
export const STATUS_TRIAGEM = Object.freeze([
  { id: "solicitada", nome: "Solicitada" },
  { id: "em_orcamento", nome: "Em orçamento" },
  { id: "aguardando_pagamento", nome: "Aguardando pagamento" },
  { id: "cancelada", nome: "Cancelada" },
]);
const filtros = [{ id: "todos", nome: "Todos" }, ...STATUS_TRIAGEM, { id: "outros", nome: "Outros status" }];
const input = "w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800";

function TriagemPedido({ item, aoSalvar }) {
  const [status, setStatus] = useState(item.status);
  const [observacoes, setObservacoes] = useState(item.observacoes_admin || "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const editavel = STATUS_TRIAGEM.some((s) => s.id === item.status);

  async function salvar() {
    if (!editavel || salvando) return;
    if (!window.confirm("Salvar status de triagem e observações internas? Esta ação não confirma pagamento nem inicia campanha.")) return;
    setSalvando(true);
    setErro("");
    setSucesso(false);
    try {
      await atualizarCampanhaAdmin(item.id, { status, observacoes_admin: observacoes.slice(0, 3000) });
      await aoSalvar();
      setSucesso(true);
    } catch (error) {
      setErro(error?.message || "Não foi possível salvar a triagem.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{item.nome_contato || "Contato sem nome"}</h3>
          <p className="text-xs text-slate-500">{item.cidade || "Cidade não informada"}{item.uf ? `/${item.uf}` : ""} · {item.created_at ? new Date(item.created_at).toLocaleString("pt-BR") : "Sem data"}</p>
          <p className="mt-1 text-xs text-slate-600">Pacote legado: {PACOTES_CAMPANHA.find((p) => p.id === item.pacote)?.nome || item.pacote || "Não informado"}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{STATUS_CAMPANHA[item.status] || item.status}</span>
      </div>
      <p className="mt-3 text-sm text-slate-700">Região: {item.area_alvo || "Não informada"}</p>
      {item.descricao_ave && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.descricao_ave}</p>}
      <p className="mt-2 text-xs text-slate-500">Anúncio vinculado: {item.anuncio_id || "Solicitação avulsa"} · Orçamento legado: {item.valor == null ? "A definir" : Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-semibold text-slate-700">Status de triagem
          <select className={input} value={status} disabled={!editavel || salvando} onChange={(e) => setStatus(e.target.value)}>
            {!editavel && <option value={item.status}>{STATUS_CAMPANHA[item.status] || item.status}</option>}
            {STATUS_TRIAGEM.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-700">Notas internas (não públicas)
          <textarea className={input} rows={3} maxLength={3000} value={observacoes} disabled={!editavel || salvando} onChange={(e) => setObservacoes(e.target.value)} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!editavel || salvando || (status === item.status && observacoes === (item.observacoes_admin || ""))} onClick={salvar}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
          {salvando ? "Salvando..." : "Salvar triagem"}
        </button>
        {!editavel && <p className="text-xs text-amber-800">Status financeiro ou de execução: edição bloqueada nesta tela.</p>}
        {erro && <p role="alert" className="text-xs text-red-700">{erro}</p>}
        {sucesso && <p role="status" className="text-xs text-emerald-700">Triagem atualizada.</p>}
      </div>
    </article>
  );
}

export default function SolicitacoesMaster() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const carregar = async () => {
    setLoading(true);
    setErro("");
    try { setPedidos(await listarCampanhasAdmin()); }
    catch { setErro("Não foi possível consultar os pedidos. Verifique as permissões Master e a conexão."); }
    finally { setLoading(false); }
  };
  useEffect(() => { carregar(); }, []);
  const filtrados = useMemo(() => pedidos.filter((pedido) => {
    const matchesStatus = filtro === "todos" || (filtro === "outros" ? !STATUS_TRIAGEM.some((s) => s.id === pedido.status) : pedido.status === filtro);
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    const matchesTerm = !term || [pedido.nome_contato, pedido.cidade, pedido.uf, pedido.area_alvo, pedido.pacote].some((v) => String(v || "").toLocaleLowerCase("pt-BR").includes(term));
    return matchesStatus && matchesTerm;
  }), [pedidos, filtro, busca]);
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-lg font-semibold text-slate-900">Solicitações e triagem</h2><p className="mt-1 text-xs text-slate-600">Pedidos de orçamento recebidos pelo formulário atual. Não há cobrança nem ativação de anúncios nesta área.</p></div>
        <button type="button" onClick={carregar} disabled={loading} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">Atualizar pedidos</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <label className="grid min-w-[180px] flex-1 gap-1 text-xs text-slate-600">Pesquisar nome ou região<input className={input} value={busca} maxLength={100} onChange={(e) => setBusca(e.target.value)} /></label>
        <label className="grid min-w-[180px] gap-1 text-xs text-slate-600">Situação<select className={input} value={filtro} onChange={(e) => setFiltro(e.target.value)}>{filtros.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
      </div>
      {erro && <p role="alert" className="mt-4 text-sm text-red-700">{erro}</p>}
      {loading ? <p className="mt-4 text-sm text-slate-600">Carregando...</p> : !filtrados.length ? <p className="mt-4 text-sm text-slate-600">Nenhuma solicitação neste filtro.</p> : <div className="mt-4 grid gap-3">{filtrados.map((item) => <TriagemPedido key={item.id} item={item} aoSalvar={carregar} />)}</div>}
    </section>
  );
}
