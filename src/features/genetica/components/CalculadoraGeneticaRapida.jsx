import React, { useMemo, useState } from "react";
import {
  CORES_RAPIDAS_RING_NECK,
  criarSelecaoDeAve,
  calcularCriasRingNeck,
} from "../utils/previsaoSimplesRingNeck";

const campo = {
  background: "#fff", color: "#2a3528", border: "1px solid #d7e1d4",
};
const botao = (ativo) => ({
  background: ativo ? "#245f42" : "#eef4ed",
  color: ativo ? "#fff" : "#29513e",
});
const MUTACOES = [
  { titulo: "Cores e aparências", ids: ["green","blue","turquoise","turquoise-blue","violet","cobalt","mauve","grey","grey-green"] },
  { titulo: "Ino e Pallid (ligadas ao sexo)", ids: ["lutino","albino","pallid","pallid-blue","pallidino"] },
];
const NOVA = () => ({ cor: "", extras: {} });
const FRA = (n) => Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))).replace(".", ",");

function selecaoInicial(ave, sexo) {
  return criarSelecaoDeAve(ave, sexo);
}

function QuadroPai({ titulo, sexo, aves, selecionada, onChange }) {
  const [modo, setModo] = useState("manual");
  const [idAve, setIdAve] = useState("");
  const [aberto, setAberto] = useState(false);
  const lista = aves.filter((ave) => sexo === "Macho" ? ave.sexo === "Macho" : ["Femea", "Fêmea"].includes(ave.sexo));
  const update = (campo, valor) => onChange((p) => ({...p, extras:{...(p.extras||{}),[campo]:valor}}));
  const dose = (campo, id) => {
    const atual = selecionada.extras?.[campo];
    const padrao = selecionada.cor === "violet" && campo === "violet" ? 1 :
      selecionada.cor === "cobalt" && campo === "dark" ? 1 :
      selecionada.cor === "mauve" && campo === "dark" ? 2 :
      (["grey", "grey-green"].includes(selecionada.cor) && campo === "grey" ? 1 : 0);
    return atual == null || atual === "" ? padrao : Number(atual);
  };
  const selectCor = (cor) => {
    onChange({ cor, extras:{} });
  };
  const choices = MUTACOES.map((grupo) => ({
    ...grupo,
    ids: grupo.ids.filter((id) => sexo === "Macho" || id !== "pallidino"),
  }));
  const selectedName = CORES_RAPIDAS_RING_NECK.find(x => x.id === selecionada.cor)?.label;
  const isGreen = selecionada.cor === "green" || selecionada.cor === "grey-green";
  const currentIno = selecionada.extras?.ino || "";
  const selectedPreset = ["lutino","albino","pallid","pallid-blue","pallidino"].includes(selecionada.cor);
  return (
    <div className="rounded-2xl border p-4 space-y-3" style={{borderColor:"#d4e2d3", background:"#fcfdfb"}}>
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-bold text-lg" style={{color:"#214d39"}}>{titulo}</h3>
          <p className="text-xs" style={{color:"#67796b"}}>{sexo === "Macho" ? "Reprodutor macho" : "Reprodutora fêmea"}</p>
        </div>
        {selectedName && <span className="text-xs rounded-full px-3 py-1" style={{background:"#e3f2e7",color:"#245f42"}}>{selectedName}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button className="px-3 py-2 text-sm font-semibold rounded-lg" style={botao(modo==="manual")}
          onClick={() => {setModo("manual");setIdAve("");onChange(NOVA());}}>Escolher cor</button>
        <button className="px-3 py-2 text-sm font-semibold rounded-lg" style={botao(modo==="plantel")}
          onClick={() => {setModo("plantel");setIdAve("");onChange(NOVA());}}>Meu plantel</button>
      </div>
      {modo === "plantel" ? (
        <>
          <select aria-label={"Ave do plantel — "+titulo} className="w-full rounded-lg px-3 py-3 text-sm" style={campo}
            value={idAve} onChange={(e) => {
              setIdAve(e.target.value);
              const ave=lista.find(a=>String(a.id)===e.target.value);
              onChange(ave ? selecaoInicial(ave,sexo) : NOVA());
            }}>
            <option value="">Selecionar ave cadastrada</option>
            {lista.map(a=><option key={a.id} value={String(a.id)}>{a.nome} — {a.corMutacao || a.corBase || "Cor não informada"}</option>)}
          </select>
          {idAve && selecionada.cor && <p className="text-xs" style={{color:"#647669"}}>Usando as informações genéticas cadastradas no plantel.</p>}
          {idAve && !selecionada.cor && <p className="text-xs" style={{color:"#9b582d"}}>Não foi possível identificar uma cor padrão dessa ave. Confira o cadastro genético.</p>}
        </>
      ) : (
        <select aria-label={"Cor ou aparência — "+titulo} className="w-full rounded-lg px-3 py-3 text-sm" style={campo}
          value={selecionada.cor || ""} onChange={e=>selectCor(e.target.value)}>
          <option value="">Selecione a cor ou mutação</option>
          {choices.map(g=><optgroup key={g.titulo} label={g.titulo}>
            {g.ids.map(id=> {
              const item=CORES_RAPIDAS_RING_NECK.find(x=>x.id===id);
              return item ? <option value={id} key={id}>{item.label}</option> : null;
            })}
          </optgroup>)}
        </select>
      )}
      {selecionada.cor && (
        <div>
          <button className="flex gap-2 items-center text-sm font-semibold" style={{color:"#2c684d"}} onClick={()=>setAberto(!aberto)}
            aria-expanded={aberto}>
            <span>{aberto ? "−" : "+"}</span> Portadores, SF/DF e outras características
            {Object.values(selecionada.extras||{}).some(v=>v!==""&&v!=null) ? <span>•</span> : null}
          </button>
          {aberto && (
            <div className="mt-3 p-3 rounded-xl space-y-3" style={{background:"#eff6ed"}}>
              <p className="text-xs" style={{color:"#67796b"}}>Campos opcionais. A ausência de informação mantém a hipótese padrão da cor. Somente declare portadores confirmados.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {id:"violet",label:"Violet (Violeta)"},
                  {id:"grey",label:"Grey (Cinza)"},
                  {id:"dark",label:"Dark (Fator escuro)"},
                ].map(f=>(
                  <label className="text-xs font-medium" key={f.id} style={{color:"#435d4c"}}>
                    {f.label}
                    <select className="block w-full mt-1 p-2 rounded-lg" style={campo}
                      value={dose(f.id)} onChange={e=>update(f.id,Number(e.target.value))}>
                      <option value={0}>Sem fator</option>
                      <option value={1}>SF — uma cópia</option>
                      <option value={2}>DF — duas cópias</option>
                    </select>
                  </label>
                ))}
                {isGreen && (
                  <label className="text-xs font-medium" style={{color:"#435d4c"}}>
                    Portador da série de cor
                    <select className="block w-full mt-1 p-2 rounded-lg" style={campo}
                      value={selecionada.extras?.split || ""} onChange={e=>update("split",e.target.value)}>
                      <option value="">Nenhum conhecido</option>
                      <option value="blue">Blue (Azul)</option>
                      <option value="turquoise">Turquoise (Turquesa)</option>
                    </select>
                  </label>
                )}
                <label className="text-xs font-medium sm:col-span-2" style={{color:"#435d4c"}}>
                  Ino / Pallid (mesmo locus ligado ao sexo)
                  <select className="block w-full mt-1 p-2 rounded-lg" style={campo}
                    value={currentIno || (selectedPreset ? "" : "normal")}
                    onChange={e=>update("ino",e.target.value)}>
                    {selectedPreset && <option value="">Padrão da aparência selecionada</option>}
                    <option value="normal">Sem Ino / Pallid conhecidos</option>
                    {sexo === "Macho" ? <>
                      <option value="split_ino">Portador de Ino (Lutino/Albino)</option>
                      <option value="split_pallid">Portador de Pallid</option>
                      <option value="pallidino">PallidIno (um alelo de cada)</option>
                    </> : null}
                    <option value="ino">Ino visual</option>
                    <option value="pallid">Pallid visual</option>
                  </select>
                </label>
              </div>
              <p className="text-xs" style={{color:"#637366"}}>Ino/Pallid e outras mutações ligadas ao sexo podem mascarar a cor-base. Quando o genótipo real não for conhecido, os resultados são condicionais.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListaCrias({titulo,lista}) {
  return <section className="rounded-xl p-4 space-y-3" style={{background:"#fff", border:"1px solid #e0e7df"}}>
    <div className="flex justify-between items-baseline gap-2">
      <h3 className="font-bold" style={{color:"#214d39"}}>{titulo}</h3>
      <span className="text-xs" style={{color:"#6d8274"}}>{lista.length} {lista.length===1?"possibilidade":"possibilidades"}</span>
    </div>
    {lista.length === 0 ? <p className="text-sm" style={{color:"#6d8274"}}>Aguardando informações válidas do casal.</p> :
      lista.map((r,i)=><div key={r.nome} className="flex gap-4 items-start py-2"
        style={{borderTop:i?"1px solid #edf1ed":"none"}}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{color:"#263e30"}}>{r.nome}</p>
          <p className="text-xs mt-1" style={{color:"#697b70"}}>{r.detalhes}</p>
        </div>
        <div className="text-right shrink-0">
          <strong className="text-lg" style={{color:"#276747"}}>{FRA(r.percentual)}%</strong>
          <p className="text-xs" style={{color:"#738478"}}>{r.proporcao}</p>
        </div>
      </div>)}
  </section>;
}

export default function CalculadoraGeneticaRapida({ aves = [], mutacoes = [] }) {
  const [pai,setPai] = useState(NOVA);
  const [mae,setMae] = useState(NOVA);
  const calculo = useMemo(() => pai.cor && mae.cor ? calcularCriasRingNeck(pai,mae) : null, [pai,mae]);
  const completo = calculo?.status === "completo";
  const parcial = calculo?.status === "parcial";
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <header>
        <h2 className="text-2xl font-bold" style={{color:"#214d39"}}>Calculadora Genética — Ring Neck</h2>
        <p className="text-sm mt-1" style={{color:"#607363"}}>Escolha a cor do pai e da mãe. As crias esperadas aparecem automaticamente.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuadroPai titulo="Pai" sexo="Macho" aves={aves} selecionada={pai} onChange={setPai}/>
        <QuadroPai titulo="Mãe" sexo="Femea" aves={aves} selecionada={mae} onChange={setMae}/>
      </div>
      <section className="rounded-2xl p-4 sm:p-5 space-y-4" style={{background:"#f0f6ef",border:"1px solid #d5e5d4"}}>
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div>
            <h2 className="text-xl font-bold" style={{color:"#214d39"}}>Crias esperadas</h2>
            <p className="text-xs mt-1" style={{color:"#6a806d"}}>Percentuais entre os filhotes de cada sexo, como no Birds Evolution.</p>
          </div>
          {calculo && <span className="rounded-full text-xs px-3 py-1 font-semibold"
            style={{color:completo?"#235b3e":"#905d28",background:completo?"#dcf0df":"#fce9ce"}}>
            {completo?"Estimativa genética":"Previsão parcial"}
          </span>}
        </div>
        {!calculo ? <p className="rounded-xl p-4 text-sm" style={{color:"#647a69",background:"#fff"}}>Selecione o pai e a mãe acima para ver as possibilidades.</p> : (
          <>
            {calculo.mensagem && <p className="rounded-lg p-3 text-sm" style={{background:"#fff7e8",color:"#845927"}}>{calculo.mensagem}</p>}
            {parcial && calculo.serie?.length > 0 && <div className="rounded-xl p-3" style={{background:"#fff"}}>
              <h3 className="text-sm font-semibold mb-2">Série de cor calculável</h3>
              {calculo.serie.map(x=><div key={x.nome} className="flex justify-between text-sm py-1"><span>{x.nome}</span><strong>{FRA(x.percentual)}%</strong></div>)}
            </div>}
            {(calculo.machos.length > 0 || calculo.femeas.length > 0) && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ListaCrias titulo="♂ Machos jovens" lista={calculo.machos}/>
              <ListaCrias titulo="♀ Fêmeas jovens" lista={calculo.femeas}/>
            </div>}
            <details className="rounded-xl p-3" style={{background:"#fff"}}>
              <summary className="font-semibold text-sm cursor-pointer" style={{color:"#375c45"}}>Entenda o resultado e as premissas</summary>
              <div className="mt-3 space-y-2 text-sm" style={{color:"#5d7262"}}>
                {(calculo.premissas||[]).map((item,i)=><p key={i}>• {item}</p>)}
                <p>As proporções descrevem probabilidades, não uma garantia da quantidade de filhotes. Uma fêmea é ZW e um macho é ZZ; por isso heranças ligadas ao sexo podem produzir resultados diferentes.</p>
                <p>Quando a ave é conhecida apenas pela aparência, a base escondida por Ino/Pallid pode mudar os resultados. Confirme a genética dos pais para usar a previsão como planejamento de reprodução.</p>
              </div>
            </details>
          </>
        )}
      </section>
    </div>
  );
}
