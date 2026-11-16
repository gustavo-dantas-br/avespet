// Cartões visuais reutilizáveis do Dashboard Avespet.

function StatCard({ label: lbl, value, tone = "default", onClick }) {
  const tones = {
    default: { bg: "#FFFFFF", color: "#173D29", accent: "#2B8A57" },
    bad: { bg: "#FFF7F5", color: "#9C3028", accent: "#C94C42" },
    good: { bg: "#F2FAF4", color: "#17633D", accent: "#29945D" },
    gold: { bg: "#FFFAEF", color: "#80520D", accent: "#C18A24" },
  };
  const t = tones[tone] || tones.default;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl p-4 md:p-5 text-left w-full transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
      style={{ background: t.bg, border: "1px solid #D9E5DC", borderLeft: `4px solid ${t.accent}`, boxShadow: "0 2px 8px rgba(28, 67, 43, 0.045)", cursor: onClick ? "pointer" : "default", minHeight: 104 }}
    >
      <div className="ui-sans text-[11px] md:text-xs font-bold uppercase tracking-[0.08em] mb-2" style={{ color: "#425D4B" }}>{lbl}</div>
      <div className="text-[26px] md:text-3xl font-bold leading-none" style={{ color: t.color, fontFamily: "'Inter', sans-serif" }}>{value}</div>
      {onClick && <div className="mt-2 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: t.accent }}>Ver detalhes →</div>}
    </button>
  );
}

function TreeCard({ ave }) {
  if (!ave) return null;
  return (
    <div className="rounded-xl px-4 py-3 ui-sans text-center" style={{ background: "#FFFFFF", border: "1px solid #D9E5DC", minWidth: 140, boxShadow: "0 2px 8px rgba(28, 67, 43, 0.04)" }}>
      <div className="font-bold text-sm" style={{ color: "#173D29" }}>{ave.nome}</div>
      <div className="text-xs mt-1" style={{ color: "#425D4B" }}>{ave.especie} · {ave.sexo}</div>
    </div>
  );
}

export { StatCard, TreeCard };
