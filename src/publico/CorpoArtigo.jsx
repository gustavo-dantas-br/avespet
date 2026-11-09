import React from "react";
import { parseCorpo, parseInline } from "./conteudo";

// Renderiza o texto do guia SEM injetar HTML: tudo vira elemento React (escapado por padrao).
function Inline({ texto }) {
  return parseInline(texto).map((p, i) => {
    if (p.tipo === "b") return <strong key={i}>{p.texto}</strong>;
    if (p.tipo === "a") {
      return (
        <a key={i} href={p.href} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "#8a6f2e", textDecoration: "underline" }}>
          {p.texto}
        </a>
      );
    }
    return <React.Fragment key={i}>{p.texto}</React.Fragment>;
  });
}

export default function CorpoArtigo({ corpo }) {
  const blocos = parseCorpo(corpo);
  return (
    <div className="ui-sans" style={{ color: "#2B241C", fontSize: 16, lineHeight: 1.75 }}>
      {blocos.map((b, i) => {
        if (b.tipo === "h2") return <h2 key={i} style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, margin: "28px 0 10px" }}>{b.texto}</h2>;
        if (b.tipo === "h3") return <h3 key={i} style={{ fontSize: 18, fontWeight: 700, margin: "20px 0 8px" }}>{b.texto}</h3>;
        if (b.tipo === "ul") return <ul key={i} style={{ listStyle: "disc", paddingLeft: 22, margin: "10px 0" }}>{b.itens.map((it, j) => <li key={j} style={{ marginBottom: 4 }}><Inline texto={it} /></li>)}</ul>;
        if (b.tipo === "ol") return <ol key={i} style={{ listStyle: "decimal", paddingLeft: 22, margin: "10px 0" }}>{b.itens.map((it, j) => <li key={j} style={{ marginBottom: 4 }}><Inline texto={it} /></li>)}</ol>;
        return <p key={i} style={{ margin: "12px 0" }}><Inline texto={b.texto} /></p>;
      })}
    </div>
  );
}
