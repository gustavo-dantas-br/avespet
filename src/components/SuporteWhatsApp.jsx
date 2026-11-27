import { Headphones, MessageCircle } from "lucide-react";

function SuporteWhatsApp({ showSupportChat = false }) {
  const mensagem = encodeURIComponent("Olá! Preciso de suporte no Avespet.");

  function abrirChatSuporte() {
    window.dispatchEvent(new Event("avespet:abrir-chat-suporte"));
  }

  const buttonBase =
    "inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white no-underline shadow-lg transition-transform hover:scale-[1.03] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:min-w-0";

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+12px)] right-3 z-[9999] flex max-w-[calc(100vw-24px)] flex-col-reverse items-end gap-2 sm:bottom-5 sm:right-5 sm:flex-row sm:items-center sm:gap-2.5"
      aria-label="Canais de atendimento Avespet"
    >
      {showSupportChat && (
        <button
          type="button"
          onClick={abrirChatSuporte}
          aria-label="Abrir chat de suporte Avespet"
          title="Chat de suporte"
          className={`${buttonBase} h-12 w-12 border-0 bg-[#174B3B] p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-3`}
        >
          <Headphones size={21} aria-hidden="true" />
          <span className="hidden sm:inline">Chat de suporte</span>
        </button>
      )}
      <a
        href={`https://wa.me/5511986338898?text=${mensagem}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com o Avespet pelo WhatsApp"
        title="WhatsApp"
        className={`${buttonBase} h-12 w-12 bg-[#25D366] p-0 sm:h-auto sm:w-auto sm:px-4 sm:py-3`}
      >
        <MessageCircle size={22} aria-hidden="true" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </div>
  );
}

export default SuporteWhatsApp;
