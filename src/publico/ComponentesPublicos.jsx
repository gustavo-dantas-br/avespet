import React from "react";
import { Link } from "./roteador";

export const TEMA_PUBLICO = {
  verde: "#174B3B",
  verdeEscuro: "#12372D",
  verdeClaro: "#E8F1E9",
  fundo: "#F5F7F3",
  superficie: "#FFFFFF",
  tinta: "#1D2B25",
  texto: "#63736A",
  borda: "#E1E9E2",
  destaque: "#DDEBDD",
};

export function PaginaPublica({ children, largura = "max-w-7xl", className = "" }) {
  return <section className={`mx-auto w-full ${largura} px-5 py-10 md:px-8 md:py-14 ${className}`} style={{ color: TEMA_PUBLICO.tinta }}>{children}</section>;
}

export function CabecalhoPublico({ etiqueta, titulo, descricao, acao, destino }) {
  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
      <div className="max-w-3xl">
        {etiqueta && <span className="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-bold" style={{ background: TEMA_PUBLICO.verdeClaro, color: TEMA_PUBLICO.verde }}>{etiqueta}</span>}
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: TEMA_PUBLICO.tinta, fontFamily: "'Fraunces', Georgia, serif", lineHeight: 1.12 }}>{titulo}</h1>
        {descricao && <p className="mt-3 max-w-2xl text-sm leading-7 md:text-base" style={{ color: TEMA_PUBLICO.texto }}>{descricao}</p>}
      </div>
      {acao && destino && <Link para={destino} className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold" style={{ background: TEMA_PUBLICO.verde, color: "#FFFFFF" }}>{acao} <span className="ml-2">→</span></Link>}
    </div>
  );
}

export function CartaoPublico({ children, className = "" }) {
  return <article className={`overflow-hidden rounded-2xl ${className}`} style={{ background: TEMA_PUBLICO.superficie, border: `1px solid ${TEMA_PUBLICO.borda}`, boxShadow: "0 10px 28px rgba(22,58,42,.05)" }}>{children}</article>;
}
