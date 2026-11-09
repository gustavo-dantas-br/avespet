import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ExternalLink, Save, Loader2 } from "lucide-react";
import { Card, Field, SectionTitle, inputStyle } from "../components/ui";
import { listArtigosAdmin, saveArtigo, deleteArtigo, listVisitas } from "../lib/db";
import { slugify, SLUG_VALIDO, youtubeId, ESPECIES_CONTEUDO, CATEGORIAS_SUGERIDAS, resumoVisitas } from "../publico/conteudo";
import CorpoArtigo from "../publico/CorpoArtigo";

function hojeLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const vazio = () => ({ id: null, slug: "", titulo: "", resumo: "", corpo: "", especie: "Geral", categoria: "", videoUrl: "", publicado: false, publicadoEm: "" });

function ArtigoForm({ inicial, onSalvar, onCancelar }) {
  const [f, setF] = useState(inicial);
  const [slugManual, setSlugManual] = useState(!!inicial.id);
  const [preview, setPreview] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  function mudarTitulo(e) {
    const titulo = e.target.value;
    setF((x) => ({ ...x, titulo, slug: slugManual ? x.slug : slugify(titulo) }));
  }

  async function salvar() {
    setErro("");
    if (!f.titulo.trim()) return setErro("Escreva o titulo.");
    if (!SLUG_VALIDO.test(f.slug)) return setErro("O endereco (slug) so pode ter letras minusculas, numeros e hifens. Ex: epoca-de-criacao.");
    if (!f.corpo.trim()) return setErro("Escreva o texto do guia.");
    if (f.videoUrl.trim() && !youtubeId(f.videoUrl)) return setErro("O video precisa ser um link do YouTube (youtube.com ou youtu.be).");
    setSalvando(true);
    try {
      await onSalvar({ ...f, titulo: f.titulo.trim(), videoUrl: f.videoUrl.trim() });
    } catch (e) {
      const duplicado = e?.code === "23505" || /duplicate key|unique/i.test(e?.message || "");
      setErro(duplicado ? "Ja existe um guia com esse endereco (slug). Troque o endereco." : `Nao consegui salvar (${e?.message || "erro desconhecido"}). Se as tabelas ainda nao existem, rode o schema_fase_conteudo.sql no Supabase.`);
      setSalvando(false);
    }
  }

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>{f.id ? "EDITAR GUIA" : "NOVO GUIA"}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Titulo"><input style={inputStyle} value={f.titulo} onChange={mudarTitulo} placeholder="ex: Epoca de criacao do Ring Neck" maxLength={200} /></Field>
        <Field label="Endereco (slug)">
          <input style={inputStyle} value={f.slug} onChange={(e) => { setSlugManual(true); setF((x) => ({ ...x, slug: e.target.value })); }} placeholder="epoca-de-criacao-ring-neck" maxLength={80} />
        </Field>
        <Field label="Especie">
          <select style={inputStyle} value={f.especie} onChange={set("especie")}>{ESPECIES_CONTEUDO.map((e) => <option key={e}>{e}</option>)}</select>
        </Field>
        <Field label="Categoria">
          <input style={inputStyle} list="categorias-guia" value={f.categoria} onChange={set("categoria")} placeholder="ex: Filhotes" maxLength={60} />
          <datalist id="categorias-guia">{CATEGORIAS_SUGERIDAS.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
      </div>
      <div className="grid gap-4 mb-4">
        <Field label="Resumo (aparece nos cartoes e no Google)"><input style={inputStyle} value={f.resumo} onChange={set("resumo")} maxLength={400} placeholder="1 ou 2 frases" /></Field>
        <Field label="Video do YouTube (opcional)"><input style={inputStyle} value={f.videoUrl} onChange={set("videoUrl")} placeholder="https://www.youtube.com/watch?v=..." maxLength={300} /></Field>
        <Field label="Texto">
          <textarea style={{ ...inputStyle, minHeight: 240, fontFamily: "inherit", lineHeight: 1.5 }} value={f.corpo} onChange={set("corpo")} />
        </Field>
      </div>
      <div className="ui-sans text-xs mb-4 p-3 rounded-lg" style={{ background: "#f5f0e4", color: "#7a6a52" }}>
        <strong>Como formatar:</strong> <code>## Titulo de secao</code> - <code>### Subtitulo</code> - <code>- item de lista</code> - <code>1. item numerado</code> - <code>**negrito**</code> - <code>[texto do link](https://endereco)</code>. Linha em branco separa paragrafos.
      </div>

      <label className="flex items-center gap-2 ui-sans text-sm mb-4" style={{ color: "#2B241C" }}>
        <input type="checkbox" checked={f.publicado} onChange={(e) => setF((x) => ({ ...x, publicado: e.target.checked }))} />
        Publicado (visivel para qualquer visitante do site)
      </label>

      {preview && (
        <div className="rounded-lg p-4 mb-4" style={{ background: "#fff", border: "1px solid #e3d3b4" }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: "#2B241C" }}>{f.titulo || "(sem titulo)"}</div>
          <CorpoArtigo corpo={f.corpo} />
        </div>
      )}
      {erro && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{erro}</div>}
      <div className="flex flex-wrap gap-3">
        <button onClick={salvar} disabled={salvando} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          {salvando ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Salvar
        </button>
        <button onClick={() => setPreview((p) => !p)} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>{preview ? "Esconder previa" : "Ver previa"}</button>
        <button onClick={onCancelar} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}

function CartaoVisitas({ linhas, indisponivel }) {
  const r = resumoVisitas(linhas, hojeLocalISO());
  return (
    <Card className="p-4 mb-6 ui-sans">
      <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>VISITAS AO SITE (anonimas, sem cookies)</div>
      {indisponivel ? (
        <div className="text-sm" style={{ color: "#8a6f2e" }}>Contador indisponivel. Rode o schema_fase_conteudo.sql no Supabase.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-6 mb-3">
            {[["Hoje", r.hoje], ["7 dias", r.ultimos7], ["30 dias", r.ultimos30]].map(([nome, n]) => (
              <div key={nome}><div style={{ fontSize: 26, fontWeight: 700, color: "#2B241C" }}>{n}</div><div className="text-xs" style={{ color: "#8a7a63" }}>{nome}</div></div>
            ))}
          </div>
          {r.topPaginas.length > 0 && (
            <div className="text-xs" style={{ color: "#5a4a30" }}>
              Mais vistas (30 dias): {r.topPaginas.map((p) => `${p.caminho} (${p.total})`).join(" - ")}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function ConteudoAdmin() {
  const [artigos, setArtigos] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [visitasIndisponiveis, setVisitasIndisponiveis] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState("");
  const [editando, setEditando] = useState(null);

  async function carregar() {
    try { setArtigos(await listArtigosAdmin()); setErroLista(""); }
    catch { setErroLista("Nao consegui carregar os guias. Se as tabelas ainda nao existem, rode o schema_fase_conteudo.sql no Supabase."); }
    try { setVisitas(await listVisitas(30)); setVisitasIndisponiveis(false); } catch { setVisitasIndisponiveis(true); }
    setCarregando(false);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar(artigo) {
    await saveArtigo(artigo);
    setEditando(null);
    await carregar();
  }
  async function alternarPublicacao(a) {
    try { await saveArtigo({ ...a, publicado: !a.publicado }); await carregar(); } catch { setErroLista("Nao consegui alterar a publicacao."); }
  }
  async function remover(a) {
    if (!confirm(`Excluir o guia "${a.titulo}"? Isso nao pode ser desfeito.`)) return;
    try { await deleteArtigo(a.id); await carregar(); } catch { setErroLista("Nao consegui excluir."); }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Conteudo do site</SectionTitle>
        {!editando && (
          <button onClick={() => setEditando(vazio())} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={16} /> Novo guia
          </button>
        )}
      </div>

      <CartaoVisitas linhas={visitas} indisponivel={visitasIndisponiveis} />

      {editando && <ArtigoForm key={editando.id || "novo"} inicial={editando} onSalvar={salvar} onCancelar={() => setEditando(null)} />}
      {erroLista && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{erroLista}</div>}

      {carregando ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" color="#C69A2E" size={24} /></div> : artigos.length === 0 && !editando ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhum guia ainda. Clique em "Novo guia".</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {artigos.map((a) => (
            <Card key={a.id} className="p-3 ui-sans flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.titulo}</div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>/guias/{a.slug} - {a.especie}{a.categoria ? ` - ${a.categoria}` : ""}{youtubeId(a.videoUrl) ? " - com video" : ""}</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: a.publicado ? "#c8dcb8" : "#e3d3b4", color: "#2B241C" }}>{a.publicado ? "PUBLICADO" : "RASCUNHO"}</span>
              <div className="flex gap-1">
                {a.publicado && <a href={`/guias/${a.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded" style={{ background: "#e3d3b4" }} title="Ver no site"><ExternalLink size={13} /></a>}
                <button onClick={() => alternarPublicacao(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>{a.publicado ? "Despublicar" : "Publicar"}</button>
                <button onClick={() => setEditando(a)} className="p-1.5 rounded" style={{ background: "#e3d3b4" }} title="Editar"><Pencil size={13} /></button>
                <button onClick={() => remover(a)} className="p-1.5 rounded" style={{ background: "#f0dad4" }} title="Excluir"><Trash2 size={13} color="#a6402b" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
