import React, { useEffect, useRef, useState } from "react";
import { Bird, X, Pencil, GitBranch, Dna, Egg, Info, ClipboardList, ChevronLeft, Eye } from "lucide-react";
import { idadeDaAve, sexoVisual } from "../utils/resumoAve";
import { listarHistoricoReprodutivo, formatarDataReproducao } from "../utils/historicoReprodutivo";
import { agruparFilhotesPorNascimento } from "../utils/agruparFilhotes";
import { mostrarNomePopularRingNeck } from "../../genetica/data/nomenclaturaRingNeck";

const texto = (valor) => valor === null || valor === undefined || valor === "" ? "Não informado" : String(valor);
const nomeAve = (ave) => ave?.nome || "Ave não identificada";
function Identificacao({ ave, legenda, onOpen }) {
  const sexo = sexoVisual(ave?.sexo);
  return <div className="rounded-xl border p-3" style={{background:sexo.fundo,borderColor:sexo.borda}}>
    <p className="text-xs font-semibold" style={{color:sexo.texto}}>{legenda} · {sexo.simbolo} {sexo.rotulo}</p>
    <p className="mt-1 break-words text-sm font-bold" style={{color:sexo.texto}}>{nomeAve(ave)}</p>
    {ave?.anilha && <p className="mt-1 text-xs text-slate-600">Anilha {ave.anilha}</p>}
    <p className="mt-1 text-xs text-slate-600">Nascimento: {ave?.nascimento ? formatarDataReproducao(ave.nascimento) : "não informado"}</p>
    {onOpen && <button type="button" onClick={onOpen} aria-label={`Consultar ficha de ${nomeAve(ave)}`} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:shadow" style={{color:sexo.texto}}><Eye size={13} aria-hidden="true"/> Consultar ficha</button>}
  </div>;
}
function Dado({ rotulo, valor }) {
  return <div className="min-w-0"><dt className="text-xs text-slate-500">{rotulo}</dt><dd className="mt-0.5 break-words text-sm font-semibold text-slate-800">{texto(valor)}</dd></div>;
}
function Secao({ titulo, icon: Icone, children }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-900"><Icone size={18} aria-hidden="true"/>{titulo}</h3>{children}
  </section>;
}
export default function FichaAve({ ave: aveInicial, aves = [], posturas = [], onClose, onEdit }) {
  const [aba, setAba] = useState("dados");
  const [historicoNavegacao, setHistoricoNavegacao] = useState([]);
  const [aveAtualId, setAveAtualId] = useState(() => aveInicial?.id);
  // Usa somente aves já disponíveis no plantel; referências externas não viram fichas fictícias.
  const ave = aves.find((item) => String(item.id) === String(aveAtualId)) || (String(aveInicial?.id) === String(aveAtualId) ? aveInicial : null);
  const consultarVinculo = (destino) => {
    if (!destino?.id || !aves.some((item) => String(item.id) === String(destino.id)) || String(destino.id) === String(aveAtualId)) return;
    setHistoricoNavegacao((items) => [...items, { id: aveAtualId, aba }]);
    setAveAtualId(destino.id);
    setAba("dados");
  };
  const voltarFicha = () => {
    const anterior = historicoNavegacao[historicoNavegacao.length - 1];
    if (!anterior) return;
    setAveAtualId(anterior.id);
    setAba(anterior.aba);
    setHistoricoNavegacao((items) => items.slice(0, -1));
  };
  const fecharRef = useRef(null);
  useEffect(() => {
    const onKey = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    fecharRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!ave) return null;

  const localizar = (id) => aves.find((item) => String(item.id) === String(id));
  const pai = ave.paiId ? localizar(ave.paiId) : null;
  const mae = ave.maeId ? localizar(ave.maeId) : null;
  const parceiro = ave.parceiroId ? localizar(ave.parceiroId) : null;
  const filhotes = aves.filter((item) => String(item.paiId) === String(ave.id) || String(item.maeId) === String(ave.id));
  const gruposFilhotes = agruparFilhotesPorNascimento(filhotes);
  const posturasDaAve = posturas.filter((p) => String(p.paiId) === String(ave.id) || String(p.maeId) === String(ave.id));
  const ovos = posturasDaAve.reduce((total, p) => total + (p.ovos?.length || 0), 0);
  const historicoReprodutivo = listarHistoricoReprodutivo(ave, posturas, aves);
  const sexo = sexoVisual(ave.sexo);
  const aparencia = ave.corMutacao === "Ino"
    ? (String(ave.corBase || "").toLowerCase().includes("turquoise") ? "Cremino (Ino)" :
       String(ave.corBase || "").toLowerCase().includes("blue") ? "Albino (Ino)" :
       String(ave.corBase || "").toLowerCase().includes("green") ? "Lutino (Ino)" : "Ino (série não informada)")
    : mostrarNomePopularRingNeck(ave.corMutacao || ave.corBase || "");
  const nomes = (arr) => arr?.length ? arr.map((valor) => mostrarNomePopularRingNeck(valor)).join(" · ") : "Não informado";
  const abas = [{id:"dados",nome:"Identificação"},{id:"genetica",nome:"Genética"},{id:"familia",nome:"Família e reprodução"},{id:"historico",nome:"Histórico"}];

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-2 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label={`Ficha de ${nomeAve(ave)}`} className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-white p-4 sm:p-5">
        {historicoNavegacao.length > 0 && <button type="button" onClick={voltarFicha} aria-label="Voltar à ficha anterior" className="mt-2 flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><ChevronLeft size={16}/> Voltar</button>}
        <div className="flex min-w-0 items-center gap-3">
          {ave.foto ? <img src={ave.foto} alt={`Foto cadastrada de ${nomeAve(ave)}`} className="h-16 w-16 rounded-xl object-cover"/> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Bird size={30}/></div>}
          <div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Ficha da ave · somente consulta</p><h2 className="truncate text-xl font-bold text-slate-900">{nomeAve(ave)}</h2><p className="text-xs text-slate-600">{ave.especie || "Espécie não informada"} · {ave.status || "No plantel"}</p></div>
        </div>
        <button ref={fecharRef} type="button" onClick={onClose} aria-label="Fechar ficha" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><X size={22}/></button>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-2" role="tablist" aria-label="Seções da ficha">
        {abas.map(({id,nome})=><button key={id} type="button" role="tab" aria-selected={aba===id} onClick={()=>setAba(id)} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${aba===id?"bg-emerald-700 text-white":"bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{nome}</button>)}
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-5">
        {aba==="dados" && <>
          <Secao titulo="Dados principais" icon={Info}>
            <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-lg border px-3 py-1 text-xs font-bold" style={{background:sexo.fundo,borderColor:sexo.borda,color:sexo.texto}}>{sexo.simbolo} {sexo.rotulo}</span><span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold">{idadeDaAve(ave.nascimento)||"Idade não informada"}</span><span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">{ave.status||"No plantel"}</span></div>
            <dl className="grid gap-3 sm:grid-cols-2"><Dado rotulo="Espécie" valor={ave.especie}/><Dado rotulo="Aparência" valor={aparencia}/><Dado rotulo="Nascimento informado" valor={ave.nascimento}/><Dado rotulo="Número da anilha" valor={ave.anilha}/><Dado rotulo="Cor da anilha" valor={ave.corAnilha}/><Dado rotulo="Sexagem" valor={ave.sexado?"Sexagem registrada":"Não registrada"}/><Dado rotulo="Origem" valor={ave.origemTipo || ave.origem}/><Dado rotulo="Criatório" valor={ave.criador}/></dl>
          </Secao>
        </>}
        {aba==="genetica" && <Secao titulo="Informações genéticas cadastradas" icon={Dna}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Dado rotulo="Aparência / mutação" valor={aparencia}/><Dado rotulo="Série de cor" valor={ave.corBase}/>
            <Dado rotulo="Genótipo confirmado" valor={ave.serieCorGenotipo}/><Dado rotulo="Fator escuro" valor={ave.fatoresGeneticos?.darkFactor}/><Dado rotulo="Fator violeta" valor={ave.fatoresGeneticos?.violetFactor}/>
            <Dado rotulo="Portadores informados" valor={nomes(ave.portadores)}/><Dado rotulo="Mutações visuais adicionais" valor={nomes(ave.mutacoesVisuais)}/>
          </dl>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Estes são dados registrados pelo criador, não confirmação laboratorial de genótipos.</p>
        </Secao>}
        {aba==="familia" && <>
          <Secao titulo="Referências de parentesco" icon={GitBranch}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Identificacao legenda="Pai" ave={pai || (ave.paiExterno ? {nome:ave.paiExterno,sexo:"Macho"} : {nome:"Não informado",sexo:"Macho"})} onOpen={pai ? () => consultarVinculo(pai) : undefined}/>
              <Identificacao legenda="Mãe" ave={mae || (ave.maeExterno ? {nome:ave.maeExterno,sexo:"Fêmea"} : {nome:"Não informado",sexo:"Fêmea"})} onOpen={mae ? () => consultarVinculo(mae) : undefined}/>
            </div>
            <div className="mt-3"><Dado rotulo="Parceiro cadastrado" valor={parceiro?.nome || ave.casalLabel}/>{parceiro && <button type="button" onClick={() => consultarVinculo(parceiro)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Eye size={14}/> Consultar parceiro</button>}</div>
            <div className="mt-4">
              <p className="mb-1 text-xs font-bold text-slate-700">Filhotes vinculados ({filhotes.length})</p>
              <p className="mb-3 text-xs text-slate-500">Separados por casal e proximidade das datas. Os grupos são sugestões visuais, não ninhadas confirmadas.</p>
              {gruposFilhotes.length ? <div className="space-y-4">
                {gruposFilhotes.map((grupo, i) => (
                  <section key={grupo.chave} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">{grupo.titulo} {grupo.estimado ? `#${i+1}` : ""}</h4>
                        <p className="text-xs text-emerald-800">{grupo.periodo}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{grupo.aves.length} {grupo.aves.length === 1 ? "filhote" : "filhotes"}</span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">{grupo.aves.map((f) => <Identificacao key={f.id} legenda="Filhote" ave={f} onOpen={() => consultarVinculo(f)}/>)}</div>
                  </section>
                ))}
              </div> : <p className="text-sm text-slate-500">Nenhum filhote vinculado no plantel.</p>}
            </div>
          </Secao>
          <Secao titulo="Histórico reprodutivo" icon={Egg}>
            <dl className="mb-4 grid grid-cols-2 gap-3"><Dado rotulo="Posturas vinculadas" valor={posturasDaAve.length}/><Dado rotulo="Ovos registrados" valor={ovos}/></dl>
            {historicoReprodutivo.length === 0 ? <p className="text-sm text-slate-500">Nenhuma postura registrada para esta ave.</p> :
              <div className="space-y-3">
                {historicoReprodutivo.map((postura, indice) => (
                  <details key={postura.id || `postura-${indice}`} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3" open={indice === 0}>
                    <summary className="cursor-pointer text-sm font-bold text-emerald-900">
                      {postura.casalLabel || `${postura.pai?.nome || "Macho não identificado"} × ${postura.mae?.nome || "Fêmea não identificada"}`}
                      <span className="mt-1 block text-xs font-normal text-slate-600">Primeiro ovo: {formatarDataReproducao(postura.primeiraData)} · {postura.resumo.total} ovos · {postura.resumo.nascidos} nascimentos</span>
                    </summary>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
                      <span className="rounded-lg bg-white px-2 py-1">Incubando: {postura.resumo.incubando}</span>
                      <span className="rounded-lg bg-white px-2 py-1">Férteis: {postura.resumo.ferteis}</span>
                      <span className="rounded-lg bg-white px-2 py-1">Inférteis: {postura.resumo.inferteis}</span>
                      <span className="rounded-lg bg-white px-2 py-1">Perdidos: {postura.resumo.perdidos}</span>
                      <span className="rounded-lg bg-white px-2 py-1">Nascidos: {postura.resumo.nascidos}</span>
                    </div>
                    {postura.viveiro && <p className="mt-2 text-xs text-slate-600">Viveiro: {postura.viveiro}</p>}
                    {postura.ovosDetalhados.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nenhum ovo registrado.</p> :
                      <div className="mt-3 space-y-2">
                        {postura.ovosDetalhados.map((ovo, i) => (
                          <div key={ovo.n ?? i} className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                            <div className="flex flex-wrap justify-between gap-2"><strong>Ovo {ovo.n ?? i + 1}</strong><span className="font-semibold text-emerald-800">{ovo.status || "Status não informado"}</span></div>
                            <p className="mt-1">Postura: {formatarDataReproducao(ovo.dataPostura)}</p>
                            {ovo.previsao && <p>Previsão aproximada de eclosão: {ovo.previsao}</p>}
                            {ovo.dataEclosao && <p>Eclosão registrada: {formatarDataReproducao(ovo.dataEclosao)}</p>}
                            {ovo.filhote && <button type="button" onClick={() => consultarVinculo(ovo.filhote)} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-800 hover:bg-emerald-100"><Eye size={13}/> Consultar filhote {nomeAve(ovo.filhote)}</button>}
                            {ovo.status === "Nasceu" && !ovo.filhote && <p className="mt-1 text-amber-800">Nascimento registrado, mas sem ficha de filhote vinculada disponível.</p>}
                          </div>
                        ))}
                      </div>}
                  </details>
                ))}
              </div>}
            <p className="mt-3 text-xs text-slate-500">Dados consultivos do módulo Reprodução. As previsões são estimadas e nenhum registro será alterado aqui.</p>
          </Secao>
        </>}
        {aba==="historico" && <Secao titulo="Informações de origem e movimentação" icon={ClipboardList}>
          <dl className="grid gap-3 sm:grid-cols-2"><Dado rotulo="Situação" valor={ave.status}/><Dado rotulo="Data da compra" valor={ave.dataCompra}/><Dado rotulo="Fornecedor" valor={ave.fornecedorNome}/><Dado rotulo="Data da venda" valor={ave.dataVenda}/><Dado rotulo="Valor de compra registrado" valor={ave.valorCompra}/><Dado rotulo="Valor de venda registrado" valor={ave.valorVenda}/><Dado rotulo="Data de entrega" valor={ave.dataEntrega}/><Dado rotulo="Status do pós-venda" valor={ave.statusPosVenda}/><Dado rotulo="Observações do pós-venda" valor={ave.obsPosVenda}/></dl>
          <p className="mt-3 text-xs text-slate-500">Exibição somente de informações já cadastradas. Não representa uma linha do tempo completa de auditoria.</p>
        </Secao>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
        <span className="text-xs text-slate-500">Nenhuma informação é alterada nesta ficha.</span>
        <div className="flex gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Fechar</button><button type="button" onClick={()=>onEdit(ave)} className="flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white"><Pencil size={15}/> Editar cadastro</button></div>
      </div>
    </section>
  </div>;
}
