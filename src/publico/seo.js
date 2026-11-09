import { useEffect } from "react";

const NOME_SITE = "Avespet";
const DESCRICAO_PADRAO = "Guias, videos e ferramentas para criadores de Ring Neck e Calopsita: reproducao, filhotes, alimentacao e cadastro do plantel.";
const original = { titulo: null };

function definirMeta(atributo, chave, valor) {
  let el = document.head.querySelector(`meta[${atributo}="${chave}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(atributo, chave); document.head.appendChild(el); }
  el.setAttribute("content", valor || "");
}

function definirCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", "canonical"); document.head.appendChild(el); }
  el.setAttribute("href", href);
}

export function aplicarSEO({ titulo, descricao, caminho, tipo = "website" }) {
  const tituloCompleto = titulo ? `${titulo} | ${NOME_SITE}` : `${NOME_SITE} - gestao e comunidade para criadores de aves`;
  const desc = descricao || DESCRICAO_PADRAO;
  document.title = tituloCompleto;
  definirMeta("name", "description", desc);
  definirMeta("property", "og:title", tituloCompleto);
  definirMeta("property", "og:description", desc);
  definirMeta("property", "og:type", tipo);
  definirMeta("property", "og:site_name", NOME_SITE);
  if (caminho) {
    const url = window.location.origin + caminho;
    definirMeta("property", "og:url", url);
    definirCanonical(url);
  }
}

export function useSEO({ titulo, descricao, caminho, tipo }) {
  useEffect(() => {
    if (original.titulo === null) original.titulo = document.title;
    aplicarSEO({ titulo, descricao, caminho, tipo });
    return () => { if (original.titulo !== null) document.title = original.titulo; };
  }, [titulo, descricao, caminho, tipo]);
}
