// Cartoes visuais reutilizaveis do Dashboard.

function StatCard({ label: lbl, value, tone = "default", onClick }) {
  const tones = {
    default: { bg: "#FAF3E6", color: "#2B241C" },
    bad: { bg: "#f0dad4", color: "#a6402b" },
    good: { bg: "#e4ead9", color: "#556b3f" },
    gold: { bg: "#f5e9c8", color: "#8a6f2e" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left w-full"
      style={{ background: t.bg, border: "1px solid #e3d3b4", cursor: onClick ? "pointer" : "default" }}
    >
      <div className="ui-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8a7a63" }}>{lbl}</div>
      <div className="text-2xl font-bold" style={{ color: t.color, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </button>
  );
}

"A venda": "Aves a venda",
  Vendida: "Aves vendidas",
  Falecida: "Aves falecidas",
  casais: "Casais",
  solteiros: "Solteiros (sem parceiro)",
  plantel: "Plantel (sob sua responsabilidade)",
};

function TreeCard({ ave }) {
  if (!ave) return null;
  return (
    <div className="rounded-lg px-4 py-2.5 ui-sans text-center" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", minWidth: 140 }}>
      <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      <div className="text-[11px]" style={{ color: "#8a7a63" }}>{ave.especie} - {ave.sexo}</div>
    </div>
  );
}

export { StatCard, TreeCard };
