// Componentes visuais reutilizados nas diferentes abas do sistema.

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="mb-5" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>{children}</h2>;
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #e3d3b4",
  color: "#2B241C",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  outline: "none",
};

function Field({ label: lbl, children }) {
  return (
    <label className="flex flex-col gap-1.5 ui-sans">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8a7a63" }}>{lbl}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------

export { Card, SectionTitle, inputStyle, Field };
