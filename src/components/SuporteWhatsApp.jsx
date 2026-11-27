import { Headphones, MessageCircle } from "lucide-react";

function SuporteWhatsApp({ showSupportChat = false }) {
  const mensagem = encodeURIComponent("Olá! Preciso de suporte no Avespet.");

  function abrirChatSuporte() {
    window.dispatchEvent(new Event("avespet:abrir-chat-suporte"));
  }

  const buttonBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "13px 17px",
    borderRadius: "999px",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.22)",
    whiteSpace: "nowrap",
    minHeight: "48px",
  };

  return (
    <div style={{
      position: "fixed",
      right: "20px",
      bottom: "20px",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: "10px",
      maxWidth: "calc(100vw - 32px)",
    }}>
      {showSupportChat && (
        <button
          type="button"
          onClick={abrirChatSuporte}
          aria-label="Abrir chat de suporte Avespet"
          style={{ ...buttonBase, border: "none", cursor: "pointer", background: "#174B3B" }}
        >
          <Headphones size={21} />
          Chat de suporte
        </button>
      )}
      <a
        href={`https://wa.me/5511986338898?text=${mensagem}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com o Avespet pelo WhatsApp"
        style={{ ...buttonBase, background: "#25D366" }}
      >
        <MessageCircle size={22} />
        WhatsApp
      </a>
    </div>
  );
}

export default SuporteWhatsApp;
