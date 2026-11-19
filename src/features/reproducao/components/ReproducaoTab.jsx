import React, { useState } from "react";
import { Plus, Save, Trash2, Pencil, Mars, Venus, Egg, CalendarDays, AlertTriangle } from "lucide-react";

const CORES_CASAL = Object.freeze({
  macho: { fundo: "#eff6ff", borda: "#aacded", texto: "#235b95" },
  femea: { fundo: "#fff2f7", borda: "#f2bcd2", texto: "#a63970" },
});
function IdentidadeCasal({ nome, sexo, detalhe }) {
  const macho = sexo === "Macho";
  const tema = macho ? CORES_CASAL.macho : CORES_CASAL.femea;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border p-3" style={{background:tema.fundo,borderColor:tema.borda}}>
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white" style={{color:tema.texto}}>
        {macho ? <Mars size={22}/> : <Venus size={22}/>}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold" style={{color:tema.texto}}>{macho ? "♂ Macho" : "♀ Fêmea"}</p>
        <p className="break-words text-sm font-bold" style={{color:tema.texto}}>{nome || "Ave não informada"}</p>
        {detalhe && <p className="text-xs text-slate-600">{detalhe}</p>}
      </div>
    </div>
  );
}

const STATUS_OVO = ["Incubando", "Fertil", "Infertil", "Perdido"]; // "Nasceu" so entra por "Registrar nascimento"
const OVO_ATIVO = ["Incubando", "Fertil"];
const DIAS_INCUBACAO_PADRAO = { "Ring Neck": 24, Calopsita: 20 };
const OVO_TONS = { Incubando: "#f0dab0", Fertil: "#c8dcb8", Infertil: "#e3d3b4", Perdido: "#f0c9c0", Nasceu: "#c9dcee" };

function semSynced(obj) {
  const { synced, ...resto } = obj;
  return resto;
}

function emptyPostura() {
  return { id: null, paiId: "", maeId: "", casalLabel: "", viveiro: "", diasIncubacao: 24, observacoes: "", ovos: [], criadoEm: "" };
}

// ----- datas (sempre no fuso local, sem passar por UTC) -----
function partesISO(iso) {
  const [y, m, d] = (iso || "").split("-").map(Number);
  return { y, m, d };
}
function dataLocal(iso) {
  const { y, m, d } = partesISO(iso);
  return new Date(y, (m || 1) - 1, d || 1);
}
function isoLocal(date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}
function hojeLocalISO() {
  return isoLocal(new Date());
}
function addDiasISO(iso, dias) {
  const dt = dataLocal(iso);
  dt.setDate(dt.getDate() + Number(dias || 0));
  return isoLocal(dt);
}
function diffDiasISO(deIso, ateIso) {
  return Math.round((dataLocal(ateIso) - dataLocal(deIso)) / 86400000);
}
function formatarDataBR(iso) {
  if (!iso) return "";
  const { y, m, d } = partesISO(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

// ----- regras de reproducao -----
function previsaoEclosao(postura, ovo) {
  if (!ovo.dataPostura || !OVO_ATIVO.includes(ovo.status)) return null;
  return addDiasISO(ovo.dataPostura, postura.diasIncubacao || 24);
}

function resumoPostura(postura) {
  const ovos = postura.ovos || [];
  const c = (s) => ovos.filter((o) => o.status === s).length;
  return { total: ovos.length, incubando: c("Incubando"), ferteis: c("Fertil"), inferteis: c("Infertil"), nasceram: c("Nasceu"), perdidos: c("Perdido") };
}

export function resumoReproducao(posturas, hoje = hojeLocalISO()) {
  let incubando = 0, previstos7 = 0, atrasados = 0;
  posturas.forEach((p) =>
    (p.ovos || []).forEach((o) => {
      const prev = previsaoEclosao(p, o);
      if (!prev) return;
      incubando++;
      const d = diffDiasISO(hoje, prev);
      if (d < 0) atrasados++;
      else if (d <= 7) previstos7++;
    })
  );
  return { incubando, previstos7, atrasados };
}

// Casais = pares de aves ligadas pelo campo "Parceiro/casal" do cadastro
function casaisDetectados(aves) {
  const vistos = new Set();
  const pares = [];
  aves.forEach((a) => {
    if (!a.parceiroId) return;
    const b = aves.find((x) => x.id === a.parceiroId);
    if (!b) return;
    const chave = [a.id, b.id].sort().join("|");
    if (vistos.has(chave)) return;
    vistos.add(chave);
    const macho = a.sexo === "Macho" ? a : b.sexo === "Macho" ? b : null;
    const femea = a.sexo === "Femea" ? a : b.sexo === "Femea" ? b : null;
    if (!macho || !femea) return;
    const casalLabel = macho.casalLabel || femea.casalLabel || "";
    pares.push({
      paiId: macho.id,
      maeId: femea.id,
      casalLabel,
      especie: macho.especie || femea.especie,
      label: `${macho.nome} x ${femea.nome}${casalLabel ? ` (${casalLabel})` : ""}`,
    });
  });
  return pares;
}

const REPRODUCAO_HELPERS = {
  STATUS_OVO, OVO_ATIVO, DIAS_INCUBACAO_PADRAO, OVO_TONS,
  emptyPostura, hojeLocalISO, diffDiasISO, formatarDataBR,
  previsaoEclosao, resumoPostura, resumoReproducao, casaisDetectados,
};

function PosturaForm({ inicial, aves, onSave, onCancel, Card, Field, inputStyle, helpers }) {
  const [f, setF] = useState(inicial);
  const [error, setError] = useState("");
  const machos = aves.filter((a) => a.sexo === "Macho");
  const femeas = aves.filter((a) => a.sexo === "Femea");
  const casais = helpers.casaisDetectados(aves);
  const novo = !inicial.id;

  function diasPara(especie, atual) {
    return novo && helpers.DIAS_INCUBACAO_PADRAO[especie] ? helpers.DIAS_INCUBACAO_PADRAO[especie] : atual;
  }
  function escolherCasal(idx) {
    if (idx === "") return;
    const c = casais[Number(idx)];
    setF((x) => ({ ...x, paiId: c.paiId, maeId: c.maeId, casalLabel: c.casalLabel, diasIncubacao: diasPara(c.especie, x.diasIncubacao) }));
  }
  function escolherAve(campo, id) {
    const ave = aves.find((a) => a.id === id);
    setF((x) => ({ ...x, [campo]: id, diasIncubacao: diasPara(ave?.especie, x.diasIncubacao) }));
  }
  function salvar() {
    if (!f.paiId || !f.maeId) {
      setError("Escolha o pai (macho) e a mae (femea).");
      return;
    }
    onSave({ ...f, diasIncubacao: Number(f.diasIncubacao) || 24 });
  }

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>{novo ? "NOVA POSTURA" : "EDITAR POSTURA"}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {novo && (
          <Field label="Casal (atalho)">
            <select style={inputStyle} defaultValue="" onChange={(e) => escolherCasal(e.target.value)}>
              <option value="">{casais.length ? "-- escolher casal cadastrado --" : "(nenhum casal vinculado ainda)"}</option>
              {casais.map((c, i) => <option key={i} value={i}>{c.label}</option>)}
            </select>
          </Field>
        )}
        <div className="rounded-xl border p-3" style={{background:CORES_CASAL.macho.fundo,borderColor:CORES_CASAL.macho.borda}}>
          <Field label="♂ Pai (macho)">
            <select style={{...inputStyle,background:"#fff"}} value={f.paiId} onChange={(e) => escolherAve("paiId", e.target.value)}>
              <option value="">Selecione o macho</option>
              {machos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <p className="mt-2 text-xs" style={{color:CORES_CASAL.macho.texto}}>Identificação visual do reprodutor</p>
        </div>
        <div className="rounded-xl border p-3" style={{background:CORES_CASAL.femea.fundo,borderColor:CORES_CASAL.femea.borda}}>
          <Field label="♀ Mãe (fêmea)">
            <select style={{...inputStyle,background:"#fff"}} value={f.maeId} onChange={(e) => escolherAve("maeId", e.target.value)}>
              <option value="">Selecione a fêmea</option>
              {femeas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <p className="mt-2 text-xs" style={{color:CORES_CASAL.femea.texto}}>Identificação visual da reprodutora</p>
        </div>
        <Field label="Viveiro (opcional)">
          <input style={inputStyle} value={f.viveiro} onChange={(e) => setF((x) => ({ ...x, viveiro: e.target.value }))} placeholder="ex: Viveiro 03" />
        </Field>
        <Field label="Dias de incubacao">
          <input style={inputStyle} type="number" min="1" value={f.diasIncubacao} onChange={(e) => setF((x) => ({ ...x, diasIncubacao: e.target.value }))} />
        </Field>
      </div>
      <Field label="Observacoes">
        <input style={inputStyle} value={f.observacoes} onChange={(e) => setF((x) => ({ ...x, observacoes: e.target.value }))} placeholder="opcional" />
      </Field>
      <div className="ui-sans text-xs mt-2" style={{ color: "#8a7a63" }}>
        A previsao de eclosao usa esses dias a partir da data de cada ovo. E aproximada - ajuste conforme a sua experiencia.
      </div>
      {error && <div className="ui-sans text-sm mt-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-3 mt-4">
        <button onClick={salvar} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar
        </button>
        <button onClick={onCancel} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}

function OvoRow({ postura, ovo, ave, onChange, onRemove, onNascimento, inputStyle, helpers }) {
  const [abrirNasc, setAbrirNasc] = useState(false);
  const [nome, setNome] = useState("");
  const [dataEclosao, setDataEclosao] = useState(helpers.hojeLocalISO());
  const prev = helpers.previsaoEclosao(postura, ovo);
  const dias = prev ? helpers.diffDiasISO(helpers.hojeLocalISO(), prev) : null;
  const nasceu = ovo.status === "Nasceu";

  let previsaoTxt = "";
  let previsaoCor = "#8a7a63";
  if (prev) {
    const quando = dias > 0 ? `em ${dias} dia${dias === 1 ? "" : "s"}` : dias === 0 ? "hoje" : `${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"} de atraso`;
    previsaoTxt = `Previsto ${helpers.formatarDataBR(prev)} (${quando})`;
    previsaoCor = dias < 0 ? "#a6402b" : dias <= 3 ? "#8a6f2e" : "#8a7a63";
  }

  return (
    <div className="rounded-lg p-3 mb-2 ui-sans" style={{ background: "#fff", border: "1px solid #e3d3b4" }}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="ui-mono text-xs font-semibold" style={{ color: "#2B241C" }}>Ovo {ovo.n}</span>
        <span className="text-xs" style={{ color: "#8a7a63" }}>posto em {helpers.formatarDataBR(ovo.dataPostura) || "-"}</span>
        <span className="text-[10px] px-2 py-0.5 rounded ui-mono" style={{ background: helpers.OVO_TONS[ovo.status] || "#e3d3b4", color: "#2B241C" }}>{(ovo.status || "").toUpperCase()}</span>
        <button
          onClick={() => { if (confirm(nasceu ? "Remover esse ovo da lista? O filhote ja cadastrado continua no seu plantel." : "Remover esse ovo?")) onRemove(); }}
          className="ml-auto p-1.5 rounded" style={{ background: "#f0dad4" }} title="Remover ovo"
        >
          <Trash2 size={12} color="#a6402b" />
        </button>
      </div>

      {nasceu ? (
        <div className="text-sm" style={{ color: "#2B241C" }}>
          Filhote: <strong>{ave ? ave.nome : "(ave removida do cadastro)"}</strong>
          {ovo.dataEclosao ? ` - nasceu em ${helpers.formatarDataBR(ovo.dataEclosao)}` : ""}
          {ovo.peso ? ` - ovo pesava ${ovo.peso} g` : ""}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
            <select style={inputStyle} value={ovo.status} onChange={(e) => onChange({ status: e.target.value })}>
              {helpers.STATUS_OVO.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input
              key={`peso-${ovo.n}-${ovo.peso}`} style={inputStyle} type="number" step="0.1" placeholder="peso do ovo (g)"
              defaultValue={ovo.peso || ""} onBlur={(e) => { if (e.target.value !== (ovo.peso || "")) onChange({ peso: e.target.value }); }}
            />
            <input
              key={`obs-${ovo.n}-${ovo.observacao}`} style={inputStyle} placeholder="observacao (opcional)"
              defaultValue={ovo.observacao || ""} onBlur={(e) => { if (e.target.value !== (ovo.observacao || "")) onChange({ observacao: e.target.value }); }}
            />
          </div>
          {previsaoTxt && <div className="text-xs mb-2" style={{ color: previsaoCor }}>{previsaoTxt}</div>}

          {helpers.OVO_ATIVO.includes(ovo.status) && !abrirNasc && (
            <button onClick={() => setAbrirNasc(true)} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "#556b3f", color: "#F1E6D2" }}>
              Registrar nascimento
            </button>
          )}
          {abrirNasc && (
            <div className="rounded-lg p-3 mt-1" style={{ background: "#f5f0e4", border: "1px solid #e3d3b4" }}>
              <div className="text-xs mb-2" style={{ color: "#8a7a63" }}>Isso cria o filhote no seu cadastro de aves, ja com pai, mae e data de nascimento.</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="nome do filhote (opcional)" />
                <input style={inputStyle} type="date" value={dataEclosao} onChange={(e) => setDataEclosao(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onNascimento(postura, ovo.n, { nome, dataEclosao }); setAbrirNasc(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}
                >
                  Criar filhote
                </button>
                <button onClick={() => setAbrirNasc(false)} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PosturaCard({ postura, aves, onSave, onDelete, onNascimento, onEditar, Card, inputStyle, helpers }) {
  const [novaData, setNovaData] = useState(helpers.hojeLocalISO());
  const [novoPeso, setNovoPeso] = useState("");
  const r = helpers.resumoPostura(postura);
  const ovos = [...(postura.ovos || [])].sort((a, b) => a.n - b.n);
  const primeira = ovos.map((o) => o.dataPostura).filter(Boolean).sort()[0];

  function addOvo() {
    if (!novaData) return;
    const n = Math.max(0, ...ovos.map((o) => o.n)) + 1;
    onSave({ ...postura, ovos: [...ovos, { n, dataPostura: novaData, peso: novoPeso, status: "Incubando", observacao: "", aveId: "", dataEclosao: "" }] });
    setNovoPeso("");
  }
  function mudarOvo(n, patch) {
    onSave({ ...postura, ovos: ovos.map((o) => (o.n === n ? { ...o, ...patch } : o)) });
  }
  function removerOvo(n) {
    onSave({ ...postura, ovos: ovos.filter((o) => o.n !== n) });
  }

  const chips = [
    ["ovos", r.total], ["incubando", r.incubando], ["ferteis", r.ferteis],
    ["inferteis", r.inferteis], ["nasceram", r.nasceram], ["perdidos", r.perdidos],
  ];

  return (
    <Card className="p-4 mb-3 ui-sans">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div className="text-sm" style={{ color: "#2B241C" }}>
          <strong>Postura{primeira ? ` de ${helpers.formatarDataBR(primeira)}` : ""}</strong>
          <span className="text-xs" style={{ color: "#8a7a63" }}>
            {postura.viveiro ? ` - ${postura.viveiro}` : ""} - incubacao de {postura.diasIncubacao || 24} dias
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEditar(postura)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            <Pencil size={12} /> Editar
          </button>
          <button
            onClick={() => { if (confirm("Remover essa postura e a lista de ovos? Filhotes ja cadastrados continuam no plantel.")) onDelete(postura.id); }}
            className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}
          >
            <Trash2 size={12} /> Remover
          </button>
        </div>
      </div>
      {postura.observacoes && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>{postura.observacoes}</div>}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {chips.map(([nome, valor]) => (
          <span key={nome} className="text-[10px] px-2 py-0.5 rounded ui-mono" style={{ background: "#f0e6d2", color: "#5a4a30" }}>{valor} {nome}</span>
        ))}
      </div>

      {ovos.map((o) => (
        <OvoRow
          key={o.n} postura={postura} ovo={o} ave={aves.find((a) => a.id === o.aveId)}
          onChange={(patch) => mudarOvo(o.n, patch)} onRemove={() => removerOvo(o.n)} onNascimento={onNascimento} inputStyle={inputStyle} helpers={helpers}
        />
      ))}

      <div className="flex flex-wrap items-end gap-2 mt-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold" style={{ color: "#8a7a63" }}>Data da postura</span>
          <input style={inputStyle} type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold" style={{ color: "#8a7a63" }}>Peso (g)</span>
          <input style={{ ...inputStyle, width: 90 }} type="number" step="0.1" value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} placeholder="opcional" />
        </label>
        <button onClick={addOvo} className="text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Plus size={13} /> Adicionar ovo
        </button>
      </div>
    </Card>
  );
}

export default function ReproducaoTab({ aves, posturas, onSave, onDelete, onNascimento, Card, Field, inputStyle, SectionTitle }) {
  const helpers = REPRODUCAO_HELPERS;
  const [form, setForm] = useState(null);
  const sumario = helpers.resumoReproducao(posturas);
  const temCasalPossivel = aves.some((a) => a.sexo === "Macho") && aves.some((a) => a.sexo === "Femea");

  const grupos = new Map();
  posturas.forEach((p) => {
    const k = `${p.paiId}|${p.maeId}`;
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(p);
  });
  const lista = Array.from(grupos.entries())
    .map(([k, ps]) => ({ k, ps: [...ps].sort((a, b) => (b.criadoEm || "").localeCompare(a.criadoEm || "")) }))
    .sort((a, b) => (b.ps[0].criadoEm || "").localeCompare(a.ps[0].criadoEm || ""));

  function salvarForm(postura) {
    onSave(postura);
    setForm(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Reproducao</SectionTitle>
        {!form && (
          <button
            onClick={() => setForm(helpers.emptyPostura())} disabled={!temCasalPossivel}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: temCasalPossivel ? "#C69A2E" : "#6b5638", color: "#2B1D14" }}
          >
            <Plus size={16} /> Nova postura
          </button>
        )}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3" aria-label="Resumo de reprodução">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><Egg size={16} aria-hidden="true"/> Ovos incubando</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{sumario.incubando}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-blue-800"><CalendarDays size={16} aria-hidden="true"/> Próximos 7 dias</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{sumario.previstos7}</p>
          <p className="text-xs text-blue-800">Eclosões previstas</p>
        </div>
        <div className={`rounded-2xl border p-4 ${sumario.atrasados > 0 ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700"><AlertTriangle size={16} aria-hidden="true"/> Prazo estimado ultrapassado</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{sumario.atrasados}</p>
        </div>
      </div>
      <p className="mb-5 text-xs text-slate-500">As datas são estimativas de manejo, não garantias de eclosão. Azul e rosa identificam o sexo das aves, não sua cor genética.</p>

      {!temCasalPossivel && (
        <Card className="p-4 mb-5 ui-sans text-sm" style={{ color: "#8a6f2e" }}>
          Pra registrar uma postura voce precisa ter pelo menos um macho e uma femea cadastrados.
        </Card>
      )}

      {form && (
        <PosturaForm key={form.id || "novo"} inicial={form} aves={aves} onSave={salvarForm} onCancel={() => setForm(null)} Card={Card} Field={Field} inputStyle={inputStyle} helpers={helpers} />
      )}

      {lista.length === 0 && !form ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhuma postura registrada ainda. Clique em "Nova postura" quando o casal comecar a botar.
        </Card>
      ) : (
        lista.map(({ k, ps }) => {
          const pai = aves.find((a) => a.id === ps[0].paiId);
          const mae = aves.find((a) => a.id === ps[0].maeId);
          const tot = ps.reduce((acc, p) => {
            const r = resumoPostura(p);
            Object.keys(r).forEach((c) => { acc[c] = (acc[c] || 0) + r[c]; });
            return acc;
          }, {});
          return (
            <div key={k} className="mb-6">
              <section className="mb-3 rounded-2xl border border-emerald-100 bg-white p-3 sm:p-4 shadow-sm" aria-label="Casal reprodutor">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-800"><Egg size={18} aria-hidden="true"/> Casal reprodutor</div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <IdentidadeCasal nome={pai?.nome || "(macho removido)"} sexo="Macho" detalhe={pai?.especie}/>
                  <span aria-hidden="true" className="text-center text-lg font-bold text-emerald-600">×</span>
                  <IdentidadeCasal nome={mae?.nome || "(fêmea removida)"} sexo="Femea" detalhe={mae?.especie}/>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-900">
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{ps.length} {ps.length === 1 ? "postura" : "posturas"}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{tot.total || 0} ovos</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{tot.nasceram || 0} nascimentos</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{tot.inferteis || 0} inférteis</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1">{tot.perdidos || 0} perdidos</span>
                </div>
              </section>
              {ps.map((p) => (
                <PosturaCard key={p.id} postura={p} aves={aves} onSave={onSave} onDelete={onDelete} onNascimento={onNascimento} onEditar={setForm} Card={Card} inputStyle={inputStyle} helpers={helpers} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Autenticacao
// ---------------------------------------------------------------------------


