// Regras puras do conteudo publico (guias e videos). Sem React, sem rede: faceis de testar.

export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ESPECIES_CONTEUDO = ["Geral", "Ring Neck", "Calopsita"];
export const CATEGORIAS_SUGERIDAS = ["Reproducao", "Incubacao", "Filhotes", "Alimentacao", "Saude", "Genetica", "Manejo", "Documentacao"];

export function slugify(texto) {
  return (texto || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

// Aceita so YouTube (evita injetar iframe de qualquer site). Devolve o id de 11 caracteres ou null.
export function youtubeId(url) {
  if (!url || typeof url !== "string") return null;
  let u;
  try { u = new URL(url.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");
  let id = null;
  if (host === "youtu.be") {
    id = u.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") id = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/);
      if (m) id = m[1];
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
}

// Texto -> blocos. Formatos: "## titulo", "### subtitulo", "- item", "1. item", paragrafos.
export function parseCorpo(texto) {
  const blocos = [];
  let atual = null;
  String(texto || "").replace(/\r\n/g, "\n").split("\n").forEach((linha) => {
    const t = linha.trim();
    if (!t) { atual = null; return; }
    let m;
    if ((m = t.match(/^###\s+(.+)$/))) { blocos.push({ tipo: "h3", texto: m[1] }); atual = null; return; }
    if ((m = t.match(/^##\s+(.+)$/))) { blocos.push({ tipo: "h2", texto: m[1] }); atual = null; return; }
    if ((m = t.match(/^[-*]\s+(.+)$/))) {
      if (atual && atual.tipo === "ul") atual.itens.push(m[1]);
      else { atual = { tipo: "ul", itens: [m[1]] }; blocos.push(atual); }
      return;
    }
    if ((m = t.match(/^\d+\.\s+(.+)$/))) {
      if (atual && atual.tipo === "ol") atual.itens.push(m[1]);
      else { atual = { tipo: "ol", itens: [m[1]] }; blocos.push(atual); }
      return;
    }
    if (atual && atual.tipo === "p") atual.texto += " " + t;
    else { atual = { tipo: "p", texto: t }; blocos.push(atual); }
  });
  return blocos;
}

// Dentro de um texto: **negrito** e [texto](https://link). So http/https viram link.
export function parseInline(texto) {
  const partes = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let ultimo = 0, m;
  const s = String(texto || "");
  while ((m = re.exec(s))) {
    if (m.index > ultimo) partes.push({ tipo: "t", texto: s.slice(ultimo, m.index) });
    if (m[1] !== undefined) partes.push({ tipo: "b", texto: m[1] });
    else partes.push({ tipo: "a", texto: m[2], href: m[3] });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) partes.push({ tipo: "t", texto: s.slice(ultimo) });
  return partes;
}

export function textoSimples(corpo) {
  return parseCorpo(corpo)
    .map((b) => (b.itens ? b.itens.join(" ") : b.texto))
    .join(" ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1");
}

export function resumoAutomatico(corpo, max = 160) {
  const t = textoSimples(corpo).replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

export function minutosLeitura(corpo) {
  const palavras = textoSimples(corpo).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

export function isoMenosDias(iso, n) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

// linhas = [{ dia: "2026-10-01", caminho: "/guias", total: 3 }, ...]
export function resumoVisitas(linhas, hojeISO) {
  const desde7 = isoMenosDias(hojeISO, 6);
  const desde30 = isoMenosDias(hojeISO, 29);
  let hoje = 0, ultimos7 = 0, ultimos30 = 0;
  const porPagina = new Map();
  (linhas || []).forEach((l) => {
    const n = Number(l.total) || 0;
    if (l.dia >= desde30 && l.dia <= hojeISO) {
      ultimos30 += n;
      porPagina.set(l.caminho, (porPagina.get(l.caminho) || 0) + n);
    }
    if (l.dia >= desde7 && l.dia <= hojeISO) ultimos7 += n;
    if (l.dia === hojeISO) hoje += n;
  });
  const topPaginas = [...porPagina.entries()].map(([caminho, total]) => ({ caminho, total })).sort((a, b) => b.total - a.total).slice(0, 5);
  return { hoje, ultimos7, ultimos30, topPaginas };
}
