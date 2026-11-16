import { Bird, Trash2, Pencil, RefreshCw } from "lucide-react";
import { Card } from "../../../components/ui/SharedUI";

function AveCard({ a, onEdit, onDelete, onSync }) {
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

  return (
    <Card className="group flex min-w-0 overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative w-24 shrink-0 self-stretch sm:w-28" style={{ background: "#EAF2EC", minHeight: 150 }}>
        {a.foto ? (
          <img src={a.foto} alt={a.nome || "Ave do plantel"} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#7A9A84" }}><Bird size={30} strokeWidth={1.6} /></div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold sm:text-base" style={{ color: "#203B2C" }}>{a.nome || "Ave sem nome"}</h3>
            <p className="mt-0.5 truncate text-xs" style={{ color: "#668071" }}>{a.especie || "Espécie não informada"} · {a.sexo || "Sexo não informado"}</p>
          </div>
          <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold tracking-wide" style={{ background: a.sexado ? "#EAF4ED" : "#F5F1E8", color: a.sexado ? "#287A50" : "#806B3E" }}>
            {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md px-2 py-1 text-[11px] font-medium" style={{ background: tone.bg, color: tone.color }}>{status}</span>
          {a.corMutacao && <span className="rounded-md px-2 py-1 text-[11px]" style={{ background: "#F1F6F2", color: "#52705D" }}>{a.corMutacao}</span>}
          {a.status === "Vendida" && a.valorVenda && <span className="text-[11px] font-semibold" style={{ color: "#287A50" }}>R$ {a.valorVenda}</span>}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "#71877A" }}>
          <span className="font-mono">{a.anilha || "Sem anilha"}</span>
          {a.synced === false && <span className="font-bold" style={{ color: "#A45E24" }}>Aguardando sincronização</span>}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <button onClick={() => onEdit(a)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition hover:bg-[#DDEEE2]" style={{ background: "#EAF4ED", color: "#216B43" }}><Pencil size={13} /> Editar</button>
          {a.synced === false && <button onClick={() => onSync(a)} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition hover:bg-[#E4F1E8]" style={{ background: "#F0F7F1", color: "#287A50" }}><RefreshCw size={13} /> Sincronizar</button>}
          <button onClick={() => onDelete(a.id)} className="ml-auto inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition hover:bg-[#FCEFED]" style={{ background: "#F7F1F0", color: "#9B5148" }}><Trash2 size={13} /> Remover</button>
        </div>
      </div>
    </Card>
  );
}

export default AveCard;
