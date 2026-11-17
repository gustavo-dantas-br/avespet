import React from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

/**
 * Protege os menus do criador de erros de renderização e de chunks
 * desatualizados após um novo deploy. Não altera nenhum dado do usuário.
 */
export default class PanelErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Não incluir dados pessoais ou do plantel nas mensagens de erro.
    console.error("[Avespet] Falha ao carregar área do painel:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || "");
    const staleChunk = /dynamically imported module|loading chunk|failed to fetch|importing a module script|chunkloaderror/i.test(message);

    return (
      <section role="alert" className="mx-auto my-5 max-w-2xl rounded-2xl border border-amber-200 bg-white p-5 text-slate-800 shadow-sm sm:p-7">
        <div className="flex items-center gap-2 text-amber-700">
          <AlertTriangle size={22} aria-hidden="true" />
          <h2 className="text-lg font-bold">Não foi possível abrir {this.props.area || "esta área"}</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {staleChunk
            ? "O Avespet foi atualizado e esta aba ainda pode estar usando arquivos de uma versão anterior."
            : "Encontramos uma falha ao carregar este menu. Seus cadastros não foram apagados."}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Atualize o aplicativo para carregar a versão mais recente. Caso persista, informe qual menu apresentou o erro.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white">
            <RefreshCw size={16} /> Atualizar Avespet
          </button>
          {this.props.onGoHome && (
            <button type="button" onClick={this.props.onGoHome} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">
              <ArrowLeft size={16} /> Voltar ao painel
            </button>
          )}
        </div>
      </section>
    );
  }
}
