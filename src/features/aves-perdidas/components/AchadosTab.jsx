import React, { useState } from "react";
import { Phone } from "lucide-react";

const STATUS_ACHADO_LABEL = { novo: "NOVO", contatado: "CONTATADO", resolvido: "RESOLVIDO" };
const STATUS_ACHADO_TONS = { novo: "#f0dab0", contatado: "#c9dcee", resolvido: "#c8dcb8" };

function AchadoCard({ achado, criador, onAtualizar }) {
  return (
    <article className="rounded-xl p-4 ui-sans" style={{ background: "#FAF3E6", color: "#2B241C" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>ANILHA BUSCADA</div>
          <div className="font-semibold text-sm">{achado.anilha_buscada}</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded ui-mono shrink-0" style={{ background: STATUS_ACHADO_TONS[achado.status] || "#e3d3b4", color: "#2B241C" }}>
          {STATUS_ACHADO_LABEL[achado.status] || achado.status}
        </span>
      </div>
      {achado.owner_user_id ? (
        <div className="text-sm mb-2 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>
          ✓ Anilha encontrada! Ave: <strong>{achado.ave_nome}</strong><br />
          Criador: {criador?.nomeCriatorio || "(perfil incompleto)"} {criador?.whatsapp ? `- ${criador.whatsapp}` : ""}
        </div>
      ) : (
        <div className="text-sm mb-2 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>
          Anilha não encontrada em nenhum cadastro no momento da busca.
        </div>
      )}
      <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>Quem entrou em contato:</div>
      <div className="text-sm font-semibold">{achado.nome_encontrador}</div>
      <div className="text-xs flex items-center gap-1 mb-2" style={{ color: "#8a7a63" }}><Phone size={11} /> {achado.telefone_encontrador}</div>
      {achado.endereco && <div className="text-xs mb-2">📍 Encontrada em: {achado.endereco}</div>}
      {achado.mensagem && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>"{achado.mensagem}"</div>}
      {achado.foto && <img src={achado.foto} alt="Foto da ave encontrada" className="w-full max-w-[200px] rounded-lg mb-3" />}
      <div className="flex flex-wrap gap-2">
        {achado.status !== "contatado" && <button type="button" onClick={() => onAtualizar(achado.id, "contatado")} className="text-xs px-2 py-2 rounded" style={{ background: "#c9dcee", color: "#1c3a5c" }}>Marcar contatado</button>}
        {achado.status !== "resolvido" && <button type="button" onClick={() => onAtualizar(achado.id, "resolvido")} className="text-xs px-2 py-2 rounded" style={{ background: "#c8dcb8", color: "#2B241C" }}>Marcar resolvido</button>}
      </div>
    </article>
  );
}

export default function AchadosTab({ achados = [], perfis = [], onAtualizar }) {
  const [filtro, setFiltro] = useState("novo");
  const perfisPorUser = new Map(perfis.map((p) => [p.userId, p]));
  const filtrados = achados.filter((a) => a.status === filtro);
  return (
    <section>
      <h2 className="mb-2" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>Achados por Anilha</h2>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Pessoas que buscaram uma anilha no site público e deixaram contato. Você confere de qual criador é a ave e faz a ponte.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        {["novo", "contatado", "resolvido"].map((status) => (
          <button key={status} type="button" onClick={() => setFiltro(status)} className="ui-sans text-xs px-3 py-2 rounded-lg font-semibold"
            style={{ background: filtro === status ? "#C69A2E" : "#3a2314", color: filtro === status ? "#2B1D14" : "#b09a78" }}>
            {STATUS_ACHADO_LABEL[status]} ({achados.filter((a) => a.status === status).length})
          </button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="rounded-xl p-8 text-center ui-sans" style={{ background: "#FAF3E6", color: "#8a7a63" }}>Nenhum registro nesse status.</div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {filtrados.map((achado) => <AchadoCard key={achado.id} achado={achado} criador={perfisPorUser.get(achado.owner_user_id)} onAtualizar={onAtualizar} />)}
        </div>
      )}
    </section>
  );
}
