import React, { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

function normalizarPesos(pesos) {
  return (pesos || [])
    .filter((p) => p && p.data && Number(p.gramas) > 0)
    .map((p) => ({ data: p.data, gramas: Number(p.gramas) }))
    .sort((a, b) => a.data.localeCompare(b.data));
}

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dataBR(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtGramas(n) {
  return (Math.round(n * 10) / 10).toString().replace(".", ",");
}

function GraficoPeso({ pontos }) {
  const W = 320, H = 130, padX = 34, padY = 22;
  const xs = pontos.map((p) => new Date(`${p.data}T12:00:00`).getTime());
  const ys = pontos.map((p) => p.gramas);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  let yMin = Math.min(...ys), yMax = Math.max(...ys);
  if (yMax === yMin) { yMin -= 1; yMax += 1; }
  const sx = (x) => xMax === xMin ? W / 2 : padX + ((x - xMin) / (xMax - xMin)) * (W - padX - 10);
  const sy = (y) => H - padY - ((y - yMin) / (yMax - yMin)) * (H - 2 * padY);
  const coords = pontos.map((p, i) => [sx(xs[i]), sy(ys[i])]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" role="img" aria-label="Gráfico do peso ao longo do tempo">
      <polyline points={coords.map((c) => c.join(",")).join(" ")} fill="none" stroke="#556b3f" strokeWidth="2" />
      {coords.map((c, i) => <circle key={pontos[i].data} cx={c[0]} cy={c[1]} r="3.5" fill="#C69A2E" />)}
      <text x="4" y="14" fontSize="10" fill="#8a7a63">{fmtGramas(yMax)} g</text>
      <text x="4" y={H - 5} fontSize="10" fill="#8a7a63">{fmtGramas(yMin)} g</text>
      <text x={padX} y={H - 5} fontSize="9" fill="#8a7a63">{dataBR(pontos[0].data)}</text>
      <text x={W - 10} y={H - 5} textAnchor="end" fontSize="9" fill="#8a7a63">{dataBR(pontos[pontos.length - 1].data)}</text>
    </svg>
  );
}

export default function PesoHistorico({ pesos, onChange, inputStyle }) {
  const [data, setData] = useState(hojeISO);
  const [gramas, setGramas] = useState("");
  const lista = useMemo(() => normalizarPesos(pesos), [pesos]);
  const ultimo = lista[lista.length - 1];
  const anterior = lista[lista.length - 2];
  const delta = ultimo && anterior ? ultimo.gramas - anterior.gramas : null;

  function adicionar() {
    const g = Number(String(gramas).replace(",", "."));
    if (!data || !(g > 0) || !Number.isFinite(g)) return;
    onChange(normalizarPesos([...lista.filter((p) => p.data !== data), { data, gramas: g }]));
    setGramas("");
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold ui-sans" style={{ color: "#8a7a63" }}>Data da pesagem</span>
          <input style={inputStyle} type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-semibold ui-sans" style={{ color: "#8a7a63" }}>Peso (g)</span>
          <input style={{ ...inputStyle, width: 110 }} inputMode="decimal" value={gramas} onChange={(e) => setGramas(e.target.value)} placeholder="ex: 38,5" />
        </label>
        <button type="button" onClick={adicionar} className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Plus size={13} /> Adicionar peso
        </button>
      </div>
      {ultimo ? (
        <div className="ui-sans text-sm mb-3" style={{ color: "#2B241C" }}>
          Último peso: <strong>{fmtGramas(ultimo.gramas)} g</strong> em {dataBR(ultimo.data)}
          {delta !== null && <span style={{ color: delta < 0 ? "#a6402b" : "#556b3f" }}> ({delta > 0 ? "+" : delta < 0 ? "-" : ""}{fmtGramas(Math.abs(delta))} g desde {dataBR(anterior.data).slice(0, 5)})</span>}
        </div>
      ) : (
        <div className="ui-sans text-xs mb-3" style={{ color: "#8a7a63" }}>Nenhuma pesagem registrada ainda. Lembre de clicar em Salvar no fim do formulário.</div>
      )}
      {lista.length >= 2 && <div className="mb-3"><GraficoPeso pontos={lista} /></div>}
      {lista.length > 0 && (
        <div className="max-h-44 overflow-y-auto rounded-lg" style={{ border: "1px solid #e3d3b4" }}>
          {[...lista].reverse().map((p) => (
            <div key={p.data} className="ui-sans flex items-center justify-between text-sm px-3 py-1.5" style={{ background: "#fff", borderBottom: "1px solid #f0e6d2", color: "#2B241C" }}>
              <span>{dataBR(p.data)} - {fmtGramas(p.gramas)} g</span>
              <button type="button" onClick={() => onChange(lista.filter((x) => x.data !== p.data))} className="p-1 rounded" style={{ background: "#f0dad4" }} title="Remover pesagem" aria-label={`Remover pesagem de ${dataBR(p.data)}`}>
                <Trash2 size={11} color="#a6402b" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
