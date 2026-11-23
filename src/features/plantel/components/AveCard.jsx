import { Bird, Trash2, Pencil, RefreshCw, Eye } from "lucide-react";
import { Card } from "../../../components/ui/SharedUI";
import { mostrarNomePopularRingNeck } from "../../genetica/data/nomenclaturaRingNeck";
import { idadeDaAve, sexoVisual } from "../utils/resumoAve";

function AveCard({ a, onEdit, onDelete, onSync, onView }) {
  const status = a.status || "No plantel";
  const statusColors = {
    "No plantel": { bg: "#EAF4ED", color: "#287A50" },
    "A venda": { bg: "#FFF4DF", color: "#95651A" },
    "Reservada": { bg: "#EEF0FF", color: "#555FA3" },
    "Vendida": { bg: "#EAF0F8", color: "#42648A" },
    "Falecida": { bg: "#F2EEEE", color: "#776767" },
    "Perdida": { bg: "#FCEFED", color: "#A64F45" },
  };
  const tone = statusColors[status] || statusColors["No plantel"];
  const sexo = sexoVisual(a.sexo);
  const idade = idadeDaAve(a.nascimento);
  const aparencia = a.corMutacao === "Ino" ? (String(a.corBase || "").toLowerCase().includes("turquoise") ? "Cremino (Ino)" : String(a.corBase || "").toLowerCase().includes("blue") ? "Albino (Ino)" : String(a.corBase || "").toLowerCase().includes("green") ? "Lutino (Ino)" : "Ino (série não informada)") : mostrarNomePopularRingNeck(a.corMutacao || a.corBase || "");

  return (
    <Card className="group flex min-w-0 overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative w-24 shrink-0 self-stretch sm:w-28" style={{ background: "#EAF2EC", minHeight: 150 }}>
        {a.foto ? (
          <img src={a.foto} alt={a.nome || "Ave do plantel"} loading="lazy" className="absolute inset-0 h-full w-full object-contain" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#7A9A84" }}><Bird size={30} strokeWidth={1.6} /></div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold sm:text-base" style={{ color: "#203B2C" }}>{a.nome || "Ave sem nome"}</h3>
            <p className="mt-0.5 truncate text-xs" style={{ color: "#668071" }}>{a.especie || "Espécie não informada"}</p>
          </div>
          <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold tracking-wide" style={{ background: a.sexado ? "#EAF4ED" : "#F5F1E8", color: a.sexado ? "#287A50" : "#806B3E" }}>
            {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg border px-2 py-1 text-[11px] font-bold" style={{background:sexo.fundo,borderColor:sexo.borda,color:sexo.texto}}>{sexo.simbolo} {sexo.rotulo}</span>
          <span className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700">{idade || "Idade não informada"}</span>
          <span className="rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: tone.bg, color: tone.color }}>{status}</span>
        </div>
        {aparencia && <p className="mt-2 line-clamp-2 text-xs font-medium" style={{color:"#446450"}} title={aparencia}>{aparencia}</p>}
        {a.status === "Vendida" && a.valorVenda && <p className="mt-1 text-xs font-semibold" style={{color:"#287A50"}}>Valor de venda: R$ {a.valorVenda}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "#71877A" }}>
          <span className="font-mono">{a.anilha || "Sem anilha"}</span>
          {a.synced === false && <span className="font-bold" style={{ color: "#A45E24" }}>Aguardando sincronização</span>}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button type="button" onClick={() => onView(a)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-bold text-white transition hover:bg-emerald-800"><Eye size={14}/> Consultar</button>
          <button onClick={() => onEdit(a)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition hover:bg-[#DDEEE2]" style={{ background: "#EAF4ED", color: "#216B43" }}><Pencil size={13} /> Editar</button>
          {a.synced === false && <button onClick={() => onSync(a)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition hover:bg-[#E4F1E8]" style={{ background: "#F0F7F1", color: "#287A50" }}><RefreshCw size={13} /> Sincronizar</button>}
          <button onClick={() => onDelete(a.id)} className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition hover:bg-[#FCEFED]" style={{ background: "#F7F1F0", color: "#9B5148" }}><Trash2 size={13} /> Remover</button>
        </div>
      </div>
    </Card>
  );
}

export default AveCard;
