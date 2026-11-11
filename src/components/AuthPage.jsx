import React, { useState, useEffect, useRef } from "react";
import { Feather, Loader2, Search, Phone, ArrowLeft, MessageCircle, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  buscarPerdidaPorAnilha, getPerfil, listAnunciosPublicos, listPerfisPublicos,
  incrementarVisualizacaoAnuncio, incrementarCliqueAnuncio, registrarAchadoAnilha, registrarVisita,
} from "../lib/db";
import { Link, usePath, navegar } from "../publico/roteador";
import { useSEO } from "../publico/seo";
import { comprimirEEnviarImagemPublica } from "../features/aves-perdidas/utils/comprimirImagem";
import { PaginaGuias, PaginaGuia, PaginaVideos, GuiasEmDestaque } from "../publico/PaginasConteudo";
import { PerdiUmaAve, AvesPerdidas } from "../features/aves-perdidas";
import { SolicitarCampanha } from "../features/campanhas";

const inputStyle = { background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", width: "100%" };

const SUPORTE_WHATSAPP = "https://wa.me/5511986338898?text=" + encodeURIComponent("Ola! Preciso de ajuda com o site Avespet.");

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function whatsappUrl(telefone, mensagem) {
  let digitos = (telefone || "").replace(/\D/g, "");
  if (!digitos) return null;
  if (digitos.length <= 11) digitos = "55" + digitos;
  const base = `https://wa.me/${digitos}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// ---------------------------------------------------------------------------
// Busca por anilha - achado direto (perdidas) ou registro mediado pelo admin
// ---------------------------------------------------------------------------

function BuscaAnilha() {
  const [anilha, setAnilha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultadosPerdidas, setResultadosPerdidas] = useState(null);
  const [perfisPorUser, setPerfisPorUser] = useState({});
  const [mostrarFormAchado, setMostrarFormAchado] = useState(false);
  const [formAchado, setFormAchado] = useState({ nome: "", telefone: "", endereco: "", dataEncontrada: new Date().toISOString().slice(0, 10), mensagem: "", foto: "" });
  const [enviado, setEnviado] = useState(false);

  async function handleFotoAchado(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const foto = await comprimirEEnviarImagemPublica(file, "achados", 160 * 1024);
      setFormAchado((f) => ({ ...f, foto }));
    } catch (err) {
      setError(err?.message || "Não foi possível processar essa foto.");
      e.target.value = "";
    }
  }

  async function buscar(e) {
    e.preventDefault();
    if (!anilha.trim()) return;
    setLoading(true);
    setError("");
    setResultadosPerdidas(null);
    setMostrarFormAchado(false);
    setEnviado(false);
    try {
      const achados = await buscarPerdidaPorAnilha(anilha);
      setResultadosPerdidas(achados);
      if (achados.length > 0) {
        const perfis = {};
        await Promise.all(
          [...new Set(achados.map((a) => a.userId))].map(async (uidUser) => {
            try {
              perfis[uidUser] = await getPerfil(uidUser);
            } catch {
              // segue sem contato desse criador se der erro
            }
          })
        );
        setPerfisPorUser(perfis);
      } else {
        setMostrarFormAchado(true);
      }
    } catch {
      setError("Nao foi possivel buscar agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  async function enviarAchado(e) {
    e.preventDefault();
    if (!formAchado.nome.trim() || !formAchado.telefone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const detalhes = [formAchado.dataEncontrada ? `Data em que encontrou: ${new Date(formAchado.dataEncontrada + "T12:00:00").toLocaleDateString("pt-BR")}` : "", formAchado.mensagem.trim()].filter(Boolean).join("\n");
      await registrarAchadoAnilha(
        anilha, formAchado.nome, formAchado.telefone, detalhes, formAchado.endereco, formAchado.foto
      );
      setEnviado(true);
    } catch {
      setError("Nao consegui registrar agora. Tenta de novo em instantes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-center ui-sans">
      <h1 style={{ color: "#F1E6D2", fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, lineHeight: 1.25 }} className="mb-3">
        Encontrou uma ave?
      </h1>
      <p style={{ color: "#b09a78" }} className="text-base mb-6">
        Digite o numero da anilha. Vamos verificar e, se for de algum criador cadastrado, entramos em contato pra devolver.
      </p>

      <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md mx-auto">
        <input style={{ ...inputStyle, fontSize: 16, padding: "14px 16px" }} value={anilha} onChange={(e) => setAnilha(e.target.value)} placeholder="ex: FOB 0080" />
        <button type="submit" disabled={loading} className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Buscar
        </button>
      </form>

      {error && <div className="text-sm mb-4 px-3 py-2 rounded-lg max-w-md mx-auto" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}

      {resultadosPerdidas && resultadosPerdidas.length > 0 && (
        <div className="flex flex-col gap-3 max-w-md mx-auto text-left">
          {resultadosPerdidas.map((r) => {
            const perfil = perfisPorUser[r.userId];
            return (
              <div key={r.id} className="rounded-lg p-3" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                    {r.foto ? <img src={r.foto} className="w-full h-full object-cover" alt="" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{r.nomeAve}</div>
                    <div className="text-xs" style={{ color: "#8a7a63" }}>{r.especie} - {r.corMutacao}</div>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded ui-mono inline-block mb-2" style={{ background: r.status === "perdida" ? "#f0dab0" : "#c8dcb8", color: "#2B241C" }}>
                  {r.status === "perdida" ? "AINDA PERDIDA" : "JA FOI ENCONTRADA"}
                </div>
                {perfil?.whatsapp && (
                  <a href={whatsappUrl(perfil.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg justify-center" style={{ background: "#556b3f", color: "#F1E6D2" }}>
                    <Phone size={14} /> Falar com {perfil.nomeCriatorio || "o criador"}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {(mostrarFormAchado || (resultadosPerdidas && resultadosPerdidas.length > 0)) && !enviado && (
        <form onSubmit={enviarAchado} className="flex flex-col gap-3 max-w-md mx-auto text-left rounded-lg p-4" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
          <div className="text-sm" style={{ color: "#2B241C" }}>
            {resultadosPerdidas && resultadosPerdidas.length > 0
              ? "Encontramos um cadastro relacionado a essa anilha. Se esta com a ave, informe os dados abaixo para ajudarmos na devolucao."
              : "Essa anilha nao apareceu como perdida. Mesmo assim, se voce encontrou essa ave, informe os dados abaixo para ajudarmos a localizar o responsavel."}
          </div>

          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Foto da ave (opcional)</span>
            <input type="file" accept="image/*" onChange={handleFotoAchado} className="text-xs" />
            {formAchado.foto && (
              <img src={formAchado.foto} alt="" className="w-24 h-24 object-cover rounded-lg mt-1" />
            )}
          </label>

          <input style={inputStyle} value={formAchado.nome} onChange={(e) => setFormAchado((f) => ({ ...f, nome: e.target.value }))} placeholder="Seu nome" required />
          <input style={inputStyle} value={formAchado.telefone} onChange={(e) => setFormAchado((f) => ({ ...f, telefone: e.target.value }))} placeholder="Seu telefone/WhatsApp" required />
          <label className="ui-sans flex flex-col gap-1.5 text-left">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Data em que encontrou</span>
            <input type="date" style={inputStyle} value={formAchado.dataEncontrada} onChange={(e) => setFormAchado((f) => ({ ...f, dataEncontrada: e.target.value }))} required />
          </label>
          <input style={inputStyle} value={formAchado.endereco} onChange={(e) => setFormAchado((f) => ({ ...f, endereco: e.target.value }))} placeholder="Onde encontrou (endereco/bairro/cidade)" required />
          <input style={inputStyle} value={formAchado.mensagem} onChange={(e) => setFormAchado((f) => ({ ...f, mensagem: e.target.value }))} placeholder="Observacoes (opcional)" />

          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {loading && <Loader2 className="animate-spin" size={16} />} Enviar
          </button>
        </form>
      )}

      {enviado && (
        <div className="text-sm px-4 py-3 rounded-lg max-w-md mx-auto text-left" style={{ background: "#e4ead9", color: "#556b3f" }}>
          Muito obrigado por se importar! 💚 Sabemos que uma ave é um animal de estimação, e muita gente tem um carinho enorme pelo seu bichinho —
          o seu cuidado em tentar devolver faz toda a diferença. Vamos verificar essa anilha e entrar em contato pelo telefone informado assim que possível.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vitrine publica de anuncios
// ---------------------------------------------------------------------------

function AnuncioVitrineCard({ anuncio, perfil }) {
  async function handleInteresse() {
    try { await incrementarCliqueAnuncio(anuncio.id); } catch { /* nao bloqueia o usuario por isso */ }
    const msg = `Oi! Vi o anuncio ${anuncio.nomeAve ? `d${anuncio.sexo === "Femea" ? "a" : "o"} ${anuncio.nomeAve}` : "de uma ave"} no site e tenho interesse.`;
    const url = whatsappUrl(perfil?.whatsapp, msg);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="rounded-xl overflow-hidden ui-sans" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      <div className="w-full aspect-square" style={{ background: "#3a2a1c" }}>
        {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{anuncio.nomeAve}</div>
        <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"}</div>
        <div className="text-base font-bold mb-2" style={{ color: "#556b3f" }}>{money(anuncio.preco)}</div>
        {anuncio.descricao && <div className="text-xs italic mb-2 line-clamp-2" style={{ color: "#7a6a52" }}>{anuncio.descricao}</div>}
        {perfil?.cidade && <div className="text-[11px] mb-2" style={{ color: "#8a7a63" }}>{perfil.cidade}{perfil.uf ? `/${perfil.uf}` : ""}</div>}
        <button onClick={handleInteresse} className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg" style={{ background: "#556b3f", color: "#F1E6D2" }}>
          <MessageCircle size={14} /> Tenho interesse
        </button>
      </div>
    </div>
  );
}

function VitrinePublica() {
  const [anuncios, setAnuncios] = useState([]);
  const [perfis, setPerfis] = useState({});
  const [loading, setLoading] = useState(true);
  const jaVistos = useRef(new Set());

  useEffect(() => {
    (async () => {
      try {
        const [listaAnuncios, listaPerfis] = await Promise.all([listAnunciosPublicos(), listPerfisPublicos()]);
        setAnuncios(listaAnuncios);
        const mapa = {};
        listaPerfis.forEach((p) => { mapa[p.userId] = p; });
        setPerfis(mapa);
        listaAnuncios.forEach((a) => {
          if (!jaVistos.current.has(a.id)) {
            jaVistos.current.add(a.id);
            incrementarVisualizacaoAnuncio(a.id).catch(() => {});
          }
        });
      } catch {
        // silencioso - se der erro, a vitrine so fica vazia
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" color="#C69A2E" size={28} /></div>;
  }

  if (anuncios.length === 0) {
    return (
      <div className="text-center ui-sans text-sm py-8" style={{ color: "#b09a78" }}>
        Nenhuma ave disponivel pra venda no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
      {anuncios.map((a) => <AnuncioVitrineCard key={a.id} anuncio={a} perfil={perfis[a.userId]} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login / criar conta - modal, acionado pelo canto
// ---------------------------------------------------------------------------

function LoginModal({ onFechar }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        setMessage("Se esse e-mail estiver cadastrado, enviaremos um link para redefinir sua senha. Confira também o spam.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Conta criada! Verifica seu e-mail pra confirmar antes de entrar.");
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel completar essa acao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,12,6,0.6)" }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 relative" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} className="absolute top-3 right-3" style={{ color: "#8a7a63" }}><X size={18} /></button>
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Feather size={20} color="#A6402B" />
          <div style={{ color: "#2B241C", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <h2 className="text-center ui-sans font-semibold mb-5" style={{ color: "#2B241C" }}>{mode === "login" ? "Entrar na sua conta" : mode === "forgot" ? "Recuperar senha" : "Criar conta gratuita"}</h2>
        {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
        {message && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>{message}</div>}
        {message ? (
          <button type="button" onClick={onFechar} className="ui-sans w-full px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            Voltar para entrar
          </button>
        ) : (
          <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>E-mail</span><input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {mode !== "forgot" && <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Senha</span><input style={inputStyle} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          <button type="submit" disabled={loading} className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-1" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {loading && <Loader2 className="animate-spin" size={16} />}{mode === "login" ? "Entrar" : mode === "forgot" ? "Enviar link de recuperação" : "Criar conta"}
          </button>
        </form>
        {mode === "login" && (
          <button type="button" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="ui-sans text-xs mt-4 w-full text-center underline" style={{ color: "#8a7a63" }}>
            Esqueceu sua senha?
          </button>
        )}
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} className="ui-sans text-xs mt-5 w-full text-center underline" style={{ color: "#8a7a63" }}>
          {mode === "login" ? "Nao tem conta? Criar uma gratuita" : "Voltar para entrar"}
        </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Redefinicao de senha apos o link enviado pelo Supabase Auth
// ---------------------------------------------------------------------------

function RedefinirSenha({ onConcluir }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas nao conferem.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Senha alterada com sucesso! Voce ja pode entrar com a nova senha.");
      await supabase.auth.signOut();
    } catch (err) {
      setError(err.message || "Nao foi possivel alterar a senha. Solicite um novo link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#2B1D14" }}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Feather size={20} color="#A6402B" />
          <div style={{ color: "#2B241C", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <h1 className="text-center ui-sans font-semibold mb-5" style={{ color: "#2B241C" }}>Criar nova senha</h1>
        {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
        {message && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>{message}</div>}
        {message ? (
          <button type="button" onClick={onConcluir} className="ui-sans w-full px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            Voltar para entrar
          </button>
        ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Nova senha</span>
            <input style={inputStyle} type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#8a7a63" }}>Confirmar nova senha</span>
            <input style={inputStyle} type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {loading && <Loader2 className="animate-spin" size={16} />} Salvar nova senha
          </button>
        </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagina publica principal
// ---------------------------------------------------------------------------

const MENU = [
  ["/", "Inicio"],
  ["/aves-a-venda", "Aves a venda"],
  ["/guias", "Guias"],
  ["/videos", "Videos"],
  ["/achei-uma-ave", "Achei uma ave"],
  ["/perdi-uma-ave", "Perdi uma ave"],
  ["/aves-perdidas", "Aves perdidas"],
  ["/campanha-ave-perdida", "Divulgar minha busca"],
];

const SEO_FIXO = {
  "/aves-a-venda": { titulo: "Aves a venda", descricao: "Ring Neck e Calopsita de criadores cadastrados, com contato direto." },
  "/achei-uma-ave": { titulo: "Achei uma ave", descricao: "Encontrou uma ave? Informe a anilha e ajudamos a devolver ao criador." },
  "/perdi-uma-ave": { titulo: "Perdi minha ave", descricao: "Publique gratuitamente o desaparecimento da sua ave e ajude-a a voltar para casa." },
  "/aves-perdidas": { titulo: "Aves perdidas", descricao: "Veja anúncios de aves perdidas e ajude a reunir aves e suas famílias." },
  "/campanha-ave-perdida": { titulo: "Divulgação regional de ave perdida", descricao: "Solicite orçamento para ampliar a divulgação regional da busca pela sua ave." },
};

function SeoFixo({ caminho }) {
  useSEO({ ...SEO_FIXO[caminho], caminho });
  return null;
}

// Conta 1 visita por pagina por sessao do navegador (sem cookie, sem dado pessoal).
function contarVisita(caminho) {
  try {
    const chave = `visita:${caminho}`;
    if (window.sessionStorage.getItem(chave)) return;
    window.sessionStorage.setItem(chave, "1");
  } catch {
    // sem sessionStorage: conta mesmo assim
  }
  registrarVisita(caminho).catch(() => {});
}

function Inicio() {
  return (
    <>
      {/* Hero principal */}
      <section className="px-5 pt-10 pb-8 md:pt-16 md:pb-10 max-w-5xl mx-auto text-center">
        <div className="ui-sans mb-3" style={{ color: "#C69A2E", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Avespet
        </div>

        <h1
          style={{
            color: "#F1E6D2",
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(34px, 5vw, 52px)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 18,
          }}
        >
          Organize o cadastro do seu plantel, de graça.
        </h1>

        <p
          className="ui-sans mx-auto"
          style={{
            color: "#b09a78",
            fontSize: 16,
            lineHeight: 1.7,
            maxWidth: 720,
            marginBottom: 30,
          }}
        >
          Sistema completo pra criadores de aves cuidarem do cadastro,
          financeiro e identificação do plantel — cada criador com o
          próprio espaço, privado e gratuito.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto text-left">
          {[
            "Cadastro de cada ave com foto",
            "Árvore genealógica automática",
            "Controle financeiro de compra e venda",
            "Gerador de placa de identificação",
            "Acompanhamento de pós-venda",
            "Clientes, fornecedores e indicações",
          ].map((item) => (
            <div
              key={item}
              className="ui-sans rounded-lg px-4 py-3"
              style={{
                background: "#3a2314",
                border: "1px solid #4b3523",
                color: "#F1E6D2",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: "#C69A2E", marginRight: 7 }}>✓</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-8 md:py-12">
        <BuscaAnilha />
      </section>

      <section className="px-5 pb-16 max-w-6xl mx-auto">
        <h2 className="ui-sans text-center mb-6" style={{ color: "#F1E6D2", fontSize: 22, fontWeight: 700 }}>
          Aves disponiveis agora
        </h2>
        <VitrinePublica />
      </section>

      <GuiasEmDestaque />
    </>
  );
}

function NaoEncontrada() {
  return (
    <section className="px-5 pb-16 max-w-3xl mx-auto text-center ui-sans">
      <h1 className="mb-3" style={{ color: "#F1E6D2", fontSize: 26, fontWeight: 700 }}>Pagina nao encontrada</h1>
      <Link para="/" style={{ color: "#C69A2E", textDecoration: "underline" }}>Voltar para o inicio</Link>
    </section>
  );
}

function ConteudoDaRota({ caminho, onEntrar }) {
  const guia = caminho.match(/^\/guias\/([a-z0-9-]+)$/);
  if (caminho === "/") return <Inicio />;
  if (caminho === "/aves-a-venda") {
    return (
      <section className="px-5 pb-16 max-w-6xl mx-auto">
        <SeoFixo caminho={caminho} />
        <h1 className="ui-sans mb-6" style={{ color: "#F1E6D2", fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700 }}>Aves disponiveis agora</h1>
        <VitrinePublica />
      </section>
    );
  }
  if (caminho === "/perdi-uma-ave") return <><SeoFixo caminho={caminho} /><PerdiUmaAve /></>;
  if (caminho === "/aves-perdidas") return <><SeoFixo caminho={caminho} /><AvesPerdidas /></>;
  if (caminho === "/campanha-ave-perdida") return <><SeoFixo caminho={caminho} /><SolicitarCampanha /></>;
  if (caminho === "/achei-uma-ave") {
    return (
      <section className="px-5 py-8">
        <SeoFixo caminho={caminho} />
        <BuscaAnilha />
      </section>
    );
  }
  if (caminho === "/guias") return <PaginaGuias />;
  if (guia) return <PaginaGuia slug={guia[1]} onEntrar={onEntrar} />;
  if (caminho === "/videos") return <PaginaVideos />;
  return <NaoEncontrada />;
}

// logado = o criador abriu um guia estando dentro do sistema (so troca o botao do canto)
export default function AuthPage({ logado = false, redefinirSenha = false, onSenhaAtualizada }) {
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const caminho = usePath();

  useEffect(() => {
    if (!logado) contarVisita(caminho);
  }, [caminho, logado]);

  if (redefinirSenha) return <RedefinirSenha onConcluir={onSenhaAtualizada} />;

  const onEntrar = logado ? () => navegar("/") : () => setMostrarLogin(true);

  return (
    <div className="min-h-screen w-full" style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <header className="px-5 pt-4 pb-2 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <Link para="/" className="flex items-center gap-2">
            <Feather size={22} color="#C69A2E" />
            <span style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', serif" }}>Avespet</span>
          </Link>
          <button
            onClick={logado ? () => navegar("/") : onEntrar}
            className="ui-sans text-sm px-5 py-3 rounded-lg font-semibold"
            style={{ background: "#3a2314", color: "#C69A2E" }}
          >
            {logado ? "Voltar ao sistema" : "Entrar / Criar conta"}
          </button>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 mt-3 ui-sans text-sm" aria-label="Menu principal">
          {MENU.map(([para, nome]) => {
            const ativo = para === "/" ? caminho === "/" : caminho === para || caminho.startsWith(para + "/");
            return (
              <Link key={para} para={para} style={{ color: ativo ? "#C69A2E" : "#b09a78", fontWeight: ativo ? 600 : 400 }}>
                {nome}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="pt-6">
        <ConteudoDaRota caminho={caminho} onEntrar={onEntrar} />
      </main>

      <footer className="text-center ui-sans text-xs py-6" style={{ color: "#6b5638" }}>
        {!logado && (
          <div>
            Criador de aves? <button onClick={onEntrar} className="underline" style={{ color: "#C69A2E" }}>Cadastre seu plantel gratuitamente</button>
          </div>
        )}
        <div className="mt-2">
          Precisa de ajuda? <a href={SUPORTE_WHATSAPP} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#C69A2E" }}>Fale com o suporte</a>
        </div>
      </footer>

      {mostrarLogin && !logado && <LoginModal onFechar={() => setMostrarLogin(false)} />}
    </div>
  );
}
