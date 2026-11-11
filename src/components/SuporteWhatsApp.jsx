import { MessageCircle } from "lucide-react";

function SuporteWhatsApp() {
  const mensagem = encodeURIComponent(
    "Olá! Preciso de suporte no Avespet."
  );

  return (
    <a
      href={`https://wa.me/5511986338898?text=${mensagem}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com o suporte do Avespet pelo WhatsApp"
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "13px 18px",
        borderRadius: "999px",
        background: "#25D366",
        color: "#FFFFFF",
        fontWeight: 700,
        fontSize: "14px",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
      }}
    >
      <MessageCircle size={22} />
      Suporte
    </a>
  );
}

export default SuporteWhatsApp;
