import { Bird, Trash2 } from "lucide-react";
import { Card } from "../../../components/ui/SharedUI";

function AveCard({ a, onEdit, onDelete, onSync }) {
  return (
    <Card className="overflow-hidden flex">
      <div className="w-24 shrink-0" style={{ background: "#3a2a1c" }}>
        {a.foto ? <img src={a.foto} alt={a.nome} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center"><Bird size={22} color="#8a7a63" /></div>
        )}
      </div>
      <div className="flex-1 p-3 ui-sans min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
          <span className="ui-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: a.sexado ? "#e4ead9" : "#f0e6d2", color: a.sexado ? "#556b3f" : "#8a6f2e" }}>
            {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
          </span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#7a6a52" }}>{a.especie} - {a.sexo}</div>
        <div className="text-xs" style={{ color: "#7a6a52" }}>{a.corMutacao || "sem mutacao"}</div>
        <div className="ui-mono text-[11px] mt-1" style={{ color: "#a6402b" }}>{a.anilha || "sem anilha"}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded ui-mono" style={{ background: "#e3d3b4", color: "#5a4a30" }}>{a.status || "No plantel"}</span>
          {a.status === "Vendida" && a.valorVenda && <span className="text-[10px] ui-mono" style={{ color: "#556b3f" }}>R$ {a.valorVenda}</span>}
        </div>
        {a.synced === false && <div className="text-[10px] mt-1 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => onEdit(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
          <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          {a.synced === false && <button onClick={() => onSync(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e4ead9", color: "#556b3f" }}>Sincronizar</button>}
        </div>
      </div>
    </Card>
  );
}

export default AveCard;
