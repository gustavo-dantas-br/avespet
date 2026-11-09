import React, { useEffect, useState } from "react";

// Roteador minimo (sem biblioteca): so o que a area publica precisa.
export function caminhoAtual() {
  const p = window.location.pathname.replace(/\/+$/, "");
  return p || "/";
}

export function navegar(para) {
  if (para !== caminhoAtual()) {
    window.history.pushState({}, "", para);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  window.scrollTo(0, 0);
}

export function usePath() {
  const [caminho, setCaminho] = useState(caminhoAtual());
  useEffect(() => {
    const atualizar = () => setCaminho(caminhoAtual());
    window.addEventListener("popstate", atualizar);
    return () => window.removeEventListener("popstate", atualizar);
  }, []);
  return caminho;
}

// <a href> de verdade (bom pro Google e pra abrir em nova aba), mas navega sem recarregar a pagina.
export function Link({ para, children, onClick, ...resto }) {
  return (
    <a
      href={para}
      {...resto}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        if (onClick) onClick(e);
        navegar(para);
      }}
    >
      {children}
    </a>
  );
}
