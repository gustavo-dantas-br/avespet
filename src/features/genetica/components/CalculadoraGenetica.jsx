import React, { useMemo, useState } from "react";
import { calcularCruzamentoGenetico } from "../utils/calcularCruzamentoGenetico";

const campo = {
  border: "1px solid #d8c6a5",
  background: "#fffaf0",
  color: "#2B241C",
};

function normalizarLista(valor) {
  return (valor || "").split(",").map((s) => s.trim()).filter(Boolean);
}

export default function CalculadoraGenetica({ aves, mutacoes }) {
  const [modoPai, setModoPai] = useState("cadastro");
  const [modoMae, setModoMae] = useState("cadastro");
  const [paiId, setPaiId] = useState("");
  const [maeId, setMaeId] = useState("");
  const [paiManual, setPaiManual] = useState({ nome: "Pai simulado", corMutacao: "", corBase: "", mutacoesVisuais: [], portadores: [], fatoresGeneticos: { darkFactor: "", violetFactor: "" } });
  const [maeManual, setMaeManual] = useState({ nome: "Mae simulada", corMutacao: "", corBase: "", mutacoesVisuais: [], portadores: [], fatoresGeneticos: { darkFactor: "", violetFactor: "" } });
  const [resultado, setResultado] = useState(null);

  const machos = useMemo(() => aves.filter((a) => a.sexo === "Macho"), [aves]);
  const femeas = useMemo(() => aves.filter((a) => a.sexo === "Femea"), [aves]);
  const pai = modoPai === "cadastro" ? aves.find((a) => a.id === paiId) : { ...paiManual, sexo: "Macho" };
  const mae = modoMae === "cadastro" ? aves.find((a) => a.id === maeId) : { ...maeManual, sexo: "Femea" };
  const mutacoesRingNeck = mutacoes.filter((m) => !m.especie || m.especie === "Ring Neck");

  function calcular() {
    if (!pai || !mae || (modoPai === "cadastro" && !paiId) || (modoMae === "cadastro" && !maeId)) {
      setResultado({ tipo: "erro", mensagem: "Selecione ou informe o pai e a mae." });
      return;
    }
    const calc = calcularCruzamentoGenetico(pai, mae, mutacoesRingNeck);
    if (calc.semLociRelevantes) {
      setResultado({ tipo: "erro", mensagem: "Nenhum locus selecionado possui uma regra de heranca liberada para calculo. " + (calc.bloqueadas?.length ? "Bloqueadas por validacao pendente: " + calc.bloqueadas.join(", ") + ". " : "") + (calc.naoDefinidos?.length ? "Heranca ainda nao implementada: " + calc.naoDefinidos.join(", ") + ". " : "") + "Cadastre ou selecione uma mutacao com regra validada no Banco de Genetica." });
      return;
    }
    const possibilidades = calc.resultadoFinal.map((r) => ({
      nome: r.descricao,
      percentual: `${r.percentual.toFixed(1).replace(/\.0$/, "")}%`,
      detalhe: r.sexo,
    }));
    const observacoes = [
      "Esta versao inicial calcula somente os loci que estao cadastrados e identificados pelo motor atual.",
      "Os loci ainda sao tratados pelo motor legado. A cor-base, Dark/Violet SF/DF, combinacoes alelicas Pallid/Ino e ligacao/recombinacao entre genes sex-linked estao em registro, mas ainda nao entram integralmente nos percentuais.",
      calc.bloqueadas?.length ? `Bloqueadas ate validacao: ${calc.bloqueadas.join(", ")}.` : "",
      calc.naoDefinidos?.length ? `Fora do calculo por heranca nao definida: ${calc.naoDefinidos.join(", ")}.` : "",
      calc.naoRegistradas?.length ? `Nomes nao encontrados no catalogo: ${calc.naoRegistradas.join(", ")}.` : "",
    ].filter(Boolean);
    setResultado({
      tipo: "sucesso",
      cruzamento: `${pai.nome || "Pai"} (${pai.corBase || "cor-base nao informada"}; ${pai.corMutacao || "mutacao principal nao informada"}) × ${mae.nome || "Mae"} (${mae.corBase || "cor-base nao informada"}; ${mae.corMutacao || "mutacao principal nao informada"})`,
      genotipos: calc.lociConsiderados.join(", "),
      possibilidades,
      observacoes,
    });
  }

  function renderGenitor(tipo) {
    const isPai = tipo === "pai";
    const modo = isPai ? modoPai : modoMae;
    const setModo = isPai ? setModoPai : setModoMae;
    const registro = isPai ? pai : mae;
    const manual = isPai ? paiManual : maeManual;
    const setManual = isPai ? setPaiManual : setMaeManual;
    const opcoes = isPai ? machos : femeas;
    const id = isPai ? paiId : maeId;
    const setId = isPai ? setPaiId : setMaeId;
    const titulo = isPai ? "PAI" : "MAE";

    return (
      <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>{titulo}</div>
        <div className="flex gap-2 mb-4">
          <button type="button" onClick={() => { setModo("cadastro"); setResultado(null); }} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: modo === "cadastro" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Ave cadastrada</button>
          <button type="button" onClick={() => { setModo("manual"); setResultado(null); }} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: modo === "manual" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Simular manualmente</button>
        </div>
        {modo === "cadastro" ? (
          <>
            <select className="w-full rounded-xl px-3 py-3" style={campo} value={id} onChange={(e) => { setId(e.target.value); setResultado(null); }}>
              <option value="">-- selecione {isPai ? "o pai" : "a mae"} --</option>
              {opcoes.map((a) => <option key={a.id} value={a.id}>{a.nome} — {a.corMutacao || a.corBase || "Cor nao informada"}</option>)}
            </select>
            {registro && <div className="mt-4 text-sm" style={{ color: "#5e5143" }}><strong>{registro.nome}</strong><br />Cor-base: {registro.corBase || "Nao informada"}<br />Fatores: Dark {registro.fatoresGeneticos?.darkFactor || "—"} / Violet {registro.fatoresGeneticos?.violetFactor || "—"}<br />Mutacoes visuais: {[registro.corMutacao, ...(registro.mutacoesVisuais || [])].filter(Boolean).join(", ") || "Nao informadas"}<br />Portadores: {(registro.portadores || []).join(", ") || "Nao informados"}</div>}
          </>
        ) : (
          <div className="space-y-3">
            <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder="Nome ou identificacao" value={manual.nome} onChange={(e) => setManual((v) => ({ ...v, nome: e.target.value }))} />
            <select className="w-full rounded-xl px-3 py-3" style={campo} value={manual.corBase || ""} onChange={(e) => setManual((v) => ({ ...v, corBase: e.target.value }))}>
              <option value="">Cor-base nao informada</option>
              <option>Green (Verde)</option><option>Blue (Azul)</option><option>Turquoise Blue (Azul Turquesa)</option><option>Turquoise (Turquesa)</option>
            </select>
            <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder="Mutacao visual principal (nome exato)" value={manual.corMutacao} onChange={(e) => setManual((v) => ({ ...v, corMutacao: e.target.value }))} />
            <div className="rounded-xl p-3" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
              <div className="text-xs font-semibold mb-2">Mutacoes visuais adicionais</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mutacoesRingNeck.map((m) => <label key={m.id || m.nome} className="flex gap-2 text-xs">
                  <input type="checkbox" checked={(manual.mutacoesVisuais || []).includes(m.nome)} onChange={(e) => setManual((v) => ({ ...v, mutacoesVisuais: e.target.checked ? [...new Set([...(v.mutacoesVisuais || []), m.nome])] : (v.mutacoesVisuais || []).filter((n) => n !== m.nome) }))} />
                  {m.nome}
                </label>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Dark Factor
                <select className="w-full rounded-xl px-3 py-2 mt-1" style={campo} value={manual.fatoresGeneticos?.darkFactor || ""} onChange={(e) => setManual((v) => ({ ...v, fatoresGeneticos: { ...(v.fatoresGeneticos || {}), darkFactor: e.target.value } }))}>
                  <option value="">Nao informado</option><option value="SF">SF</option><option value="DF">DF</option>
                </select>
              </label>
              <label className="text-xs">Violet Factor
                <select className="w-full rounded-xl px-3 py-2 mt-1" style={campo} value={manual.fatoresGeneticos?.violetFactor || ""} onChange={(e) => setManual((v) => ({ ...v, fatoresGeneticos: { ...(v.fatoresGeneticos || {}), violetFactor: e.target.value } }))}>
                  <option value="">Nao informado</option><option value="SF">SF</option><option value="DF">DF</option>
                </select>
              </label>
            </div>
            <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder="Portadores separados por virgula" value={(manual.portadores || []).join(", ")} onChange={(e) => setManual((v) => ({ ...v, portadores: normalizarLista(e.target.value) }))} />
            <p className="text-xs" style={{ color: "#8a7a63" }}>A cor-base e as mutacoes visuais adicionais ficam registradas para a proxima etapa do motor. Nao marque femeas como portadoras ocultas de genes ligados ao sexo.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>CALCULADORA GENETICA</div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: "#2B241C" }}>Cruzamento de Ring Neck</h2>
        <p className="text-sm" style={{ color: "#6f6254" }}>Use aves do plantel ou simule um casal sem precisar cadastrar os reprodutores.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{renderGenitor("pai")}{renderGenitor("mae")}</div>
      <button onClick={calcular} className="px-5 py-3 rounded-xl font-semibold" style={{ background: "#C69A2E", color: "#2B241C" }}>Calcular cruzamento</button>
      {resultado && <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        {resultado.tipo === "erro" ? <div style={{ color: "#A6402B" }}>{resultado.mensagem}</div> : <>
          <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>RESULTADO TEORICO</div>
          <div className="text-xl font-semibold" style={{ color: "#2B241C" }}>{resultado.cruzamento}</div>
          <div className="mt-2 text-sm" style={{ color: "#8a7a63" }}>Loci considerados: {resultado.genotipos || "—"}</div>
          <div className="mt-4 space-y-3">{resultado.possibilidades.map((item, index) => <div key={`${item.nome}-${item.detalhe}-${index}`} className="flex items-center justify-between rounded-xl px-4 py-3 gap-3" style={{ background: "#f2e8d4", border: "1px solid #dfcba7" }}>
            <div><div className="font-semibold">{item.nome}</div><div className="text-xs mt-1" style={{ color: "#8a7a63" }}>{item.detalhe}</div></div><span className="font-semibold">{item.percentual}</span>
          </div>)}</div>
          <div className="mt-5 rounded-xl p-4" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
            <div className="font-semibold text-sm mb-2" style={{ color: "#2B241C" }}>Entenda o resultado</div>
            <p className="text-sm" style={{ color: "#6f6254" }}>As porcentagens sao probabilidades teoricas por filhote, nao garantias. Machos e femeas aparecem separados quando a heranca ligada ao sexo entra no calculo. Portador significa que o filhote pode carregar um gene sem mostrar a mutacao.</p>
          </div>
          <ul className="mt-3 space-y-1 text-xs" style={{ color: "#8a7a63" }}>{resultado.observacoes.map((obs, i) => <li key={i}>• {obs}</li>)}</ul>
        </>}
      </div>}
    </div>
  );
}
