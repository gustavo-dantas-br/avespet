// Componentes visuais compartilhados do painel Avespet.

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ background: "#FFFFFF", border: "1px solid #DCE8DF", boxShadow: "0 3px 12px rgba(28, 67, 43, 0.055)", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <div className="mb-6 border-b pb-4" style={{ borderColor: "#DCE8DF" }}><h2 className="ui-sans text-2xl md:text-[28px] font-bold tracking-tight" style={{ color: "#173D29" }}>{children}</h2></div>;
}

const inputStyle = {
  background: "#FFFFFF",
  border: "1px solid #A9BDAF",
  color: "#172F22",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  minHeight: 42,
};

function Field({ label: lbl, children }) {
  return (
    <label className="flex flex-col gap-2 ui-sans">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#294D38" }}>{lbl}</span>
      {children}
    </label>
  );
}

export { Card, SectionTitle, inputStyle, Field };
