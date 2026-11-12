import React, { useState, useEffect, useRef } from "react";
import { Feather, Loader2, Search, Phone, ArrowLeft, MessageCircle, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  buscarPerdidaPorAnilha, listAnunciosPublicos, listPerfisPublicos,
  incrementarVisualizacaoAnuncio, incrementarCliqueAnuncio, registrarAchadoAnilha, registrarVisita,
} from "../lib/db";
import { Link, usePath, navegar } from "../publico/roteador";
import { useSEO } from "../publico/seo";
import { comprimirEEnviarImagemPublica } from "../features/aves-perdidas/utils/comprimirImagem";
import { PaginaGuias, PaginaGuia, PaginaVideos, GuiasEmDestaque } from "../publico/PaginasConteudo";
import Inicio from "../publico/home/Inicio";
import { AvesPerdidas } from "../features/aves-perdidas";
import { SolicitarCampanha } from "../features/campanhas";

const inputStyle = { background: "#FFFFFF", border: "1px solid #DCE7DE", color: "#1D2B25", borderRadius: 12, padding: "12px 14px", fontSize: 14, outlineColor: "#174B3B", width: "100%" };

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

function BuscaAnilha({ modoClaro = false }) {
  const [anilha, setAnilha] = useState("");
  const [temAnilha, setTemAnilha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultadosPerdidas, setResultadosPerdidas] = useState(null);
  const [mostrarFormAchado, setMostrarFormAchado] = useState(false);
  const [formAchado, setFormAchado] = useState({
    nome: "", telefone: "", endereco: "", dataEncontrada: new Date().toISOString().slice(0, 10),
    especie: "", corMutacao: "", caracteristicas: "", mensagem: "", foto: ""
  });
  const [enviado, setEnviado] = useState(false);

  function escolherTipo(valor) {
    setTemAnilha(valor);
    setError("");
    setResultadosPerdidas(null);
    setMostrarFormAchado(valor === "nao");
    setEnviado(false);
  }

  async function handleFotoAchado(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const foto = await comprimirEEnviarImagemPublica(file, "achados", 350 * 1024);
      setFormAchado((f) => ({ ...f, foto }));
    } catch (err) {
      setError(err?.message || "Não foi possível processar essa foto.");
      e.target.value = "";
    }
  }

  async function buscar(e) {
    e.preventDefault();
    if (!anilha.trim()) {
      setError("Informe o número da anilha para fazer a busca.");
      return;
    }
    setLoading(true);
    setError("");
    setResultadosPerdidas(null);
    setMostrarFormAchado(false);
    setEnviado(false);
    try {
      const achados = await buscarPerdidaPorAnilha(anilha);
      setResultadosPerdidas(achados);
      if (achados.length === 0 || achados.some((r) => r.status === "perdida")) {
        setMostrarFormAchado(true);
      }
    } catch {
      setError("Não foi possível buscar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  async function enviarAchado(e) {
    e.preventDefault();
    if (!formAchado.nome.trim() || !formAchado.telefone.trim() || !formAchado.endereco.trim()) {
      setError("Preencha seus dados de contato e o local onde encontrou a ave.");
      return;
    }
    if (!formAchado.foto) {
      setError("Envie uma foto da ave para ajudar na identificação.");
      return;
    }
    if (!formAchado.especie.trim()) {
      setError("Informe a espécie da ave ou selecione 'Não sei identificar'.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const detalhes = [
        `Tipo de registro: ${temAnilha === "sim" ? "COM ANILHA" : "SEM ANILHA"}`,
        formAchado.especie ? `Espécie: ${formAchado.especie}` : "",
        formAchado.corMutacao ? `Cor/mutação: ${formAchado.corMutacao}` : "",
        formAchado.caracteristicas ? `Características: ${formAchado.caracteristicas}` : "",
        formAchado.dataEncontrada ? `Data em que encontrou: ${new Date(formAchado.dataEncontrada + "T12:00:00").toLocaleDateString("pt-BR")}` : "",
        formAchado.mensagem.trim()
      ].filter(Boolean).join("\n");
      await registrarAchadoAnilha(
        temAnilha === "sim" ? anilha : "",
        formAchado.nome, formAchado.telefone, detalhes, formAchado.endereco, formAchado.foto
      );
      setEnviado(true);
    } catch {
      setError("Não foi possível registrar agora. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  const mostrarFormulario = mostrarFormAchado || resultadosPerdidas?.some((r) => r.status === "perdida");

  return (
    <div className="w-full max-w-2xl mx-auto text-center ui-sans">
      <h1 style={{ color: modoClaro ? "#1D2B25" : "#F4F7F2", fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 700, lineHeight: 1.25 }} className="mb-3">
        Encontrou uma ave?
      </h1>
      <p style={{ color: modoClaro ? "#63736A" : "#C4D5CA" }} className="text-base mb-6">
        Com ou sem anilha, registre a ave encontrada. O Avespet mantém seus dados de contato reservados e faz a intermediação.
      </p>

      <div className="max-w-md mx-auto mb-5 rounded-xl p-4 text-left" style={{ background: modoClaro ? "#FFFFFF" : "rgba(255,255,255,.08)", border: "1px solid " + (modoClaro ? "#E1E9E2" : "rgba(255,255,255,.18)") }}>
        <div className="text-sm font-semibold mb-3" style={{ color: modoClaro ? "#1D2B25" : "#F4F7F2" }}>A ave tem anilha?</div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => escolherTipo("sim")} className="rounded-lg px-3 py-3 text-sm font-semibold" style={{ background: temAnilha === "sim" ? "#174B3B" : (modoClaro ? "#E8F1E9" : "rgba(255,255,255,.12)"), color: temAnilha === "sim" ? "#FFFFFF" : (modoClaro ? "#174B3B" : "#F4F7F2"), border: "1px solid " + (temAnilha === "sim" ? "#174B3B" : (modoClaro ? "#DCE7DE" : "rgba(255,255,255,.2)")) }}>Sim, tem anilha</button>
          <button type="button" onClick={() => escolherTipo("nao")} className="rounded-lg px-3 py-3 text-sm font-semibold" style={{ background: temAnilha === "nao" ? "#174B3B" : (modoClaro ? "#E8F1E9" : "rgba(255,255,255,.12)"), color: temAnilha === "nao" ? "#FFFFFF" : (modoClaro ? "#174B3B" : "#F4F7F2"), border: "1px solid " + (temAnilha === "nao" ? "#174B3B" : (modoClaro ? "#DCE7DE" : "rgba(255,255,255,.2)")) }}>Não tem anilha</button>
        </div>
      </div>

      {temAnilha === "sim" && (
        <form onSubmit={buscar} className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md mx-auto">
          <input style={{ ...inputStyle, fontSize: 16, padding: "14px 16px" }} value={anilha} onChange={(e) => setAnilha(e.target.value)} placeholder="Número da anilha (ex.: FOB 0080)" />
          <button type="submit" disabled={loading} className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold" style={{ background: modoClaro ? "#174B3B" : "#DDEBDD", color: modoClaro ? "#FFFFFF" : "#174B3B" }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />} Buscar
          </button>
        </form>
      )}

      {error && <div className="text-sm mb-4 px-3 py-2 rounded-lg max-w-md mx-auto" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}

      {resultadosPerdidas && resultadosPerdidas.length > 0 && (
        <div className="flex flex-col gap-3 max-w-md mx-auto text-left mb-5">
          {resultadosPerdidas.map((r) => (
            <div key={r.id} className="rounded-lg p-3" style={{ background: "#FFFFFF", border: "1px solid #E1E9E2" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#E8F1E9" }}>
                  {r.foto ? <img src={r.foto} className="w-full h-full object-cover" alt="" /> : null}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm" style={{ color: "#1D2B25" }}>{r.nomeAve}</div>
                  <div className="text-xs" style={{ color: "#63736A" }}>{r.especie} - {r.corMutacao}</div>
                </div>
              </div>
              <div className="text-[10px] px-2 py-0.5 rounded ui-mono inline-block mb-2" style={{ background: r.status === "perdida" ? "#E8F1E9" : "#DDEBDD", color: "#1D2B25" }}>
                {r.status === "perdida" ? "AINDA PERDIDA" : "JÁ FOI ENCONTRADA"}
              </div>
              <p className="text-xs mt-2" style={{ color: "#63736A" }}>O Avespet fará a intermediação do contato para proteger as duas partes.</p>
            </div>
          ))}
        </div>
      )}

      {mostrarFormulario && !enviado && (
        <form onSubmit={enviarAchado} className="flex flex-col gap-3 max-w-md mx-auto text-left rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #E1E9E2" }}>
          <div className="text-sm" style={{ color: "#1D2B25" }}>
            {temAnilha === "nao"
              ? "Registre a ave mesmo sem numeração. Nossa equipe analisará a foto e as características para tentar localizar o responsável."
              : resultadosPerdidas?.some((r) => r.status === "perdida")
                ? "Encontramos um cadastro de ave ainda desaparecida. Informe os dados para nossa equipe confirmar o possível reencontro."
                : "Não encontramos anúncio aprovado com essa anilha. Registre a ave; o responsável ainda poderá cadastrar a perda posteriormente."}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Foto da ave (obrigatória)</span>
            <input type="file" accept="image/*" onChange={handleFotoAchado} className="text-xs" required={!formAchado.foto} />
            {formAchado.foto && <img src={formAchado.foto} alt="Prévia da ave encontrada" className="w-28 h-28 object-cover rounded-lg mt-1" />}
          </label>

          <input style={inputStyle} value={formAchado.especie} onChange={(e) => setFormAchado((f) => ({ ...f, especie: e.target.value }))} placeholder="Espécie (ou 'Não sei identificar')" required />
          <input style={inputStyle} value={formAchado.corMutacao} onChange={(e) => setFormAchado((f) => ({ ...f, corMutacao: e.target.value }))} placeholder="Cor ou mutação (opcional)" />
          <textarea style={{ ...inputStyle, minHeight: 82 }} value={formAchado.caracteristicas} onChange={(e) => setFormAchado((f) => ({ ...f, caracteristicas: e.target.value }))} placeholder="Características para ajudar na identificação (opcional)" />
          <label className="flex flex-col gap-1.5 text-left">
            <span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Data em que encontrou</span>
            <input type="date" style={inputStyle} value={formAchado.dataEncontrada} onChange={(e) => setFormAchado((f) => ({ ...f, dataEncontrada: e.target.value }))} required />
          </label>
          <input style={inputStyle} value={formAchado.endereco} onChange={(e) => setFormAchado((f) => ({ ...f, endereco: e.target.value }))} placeholder="Bairro/região e cidade onde encontrou" required />
          <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#E8F1E9", color: "#174B3B" }}>Seu nome e telefone são solicitados abaixo apenas para o suporte. Eles não serão exibidos publicamente.</div>
          <input style={inputStyle} value={formAchado.nome} onChange={(e) => setFormAchado((f) => ({ ...f, nome: e.target.value }))} placeholder="Seu nome (reservado ao suporte)" required />
          <input style={inputStyle} value={formAchado.telefone} onChange={(e) => setFormAchado((f) => ({ ...f, telefone: e.target.value }))} placeholder="Seu telefone/WhatsApp (reservado ao suporte)" required />
          <textarea style={{ ...inputStyle, minHeight: 70 }} value={formAchado.mensagem} onChange={(e) => setFormAchado((f) => ({ ...f, mensagem: e.target.value }))} placeholder="Observações adicionais (opcional)" />

          <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold" style={{ background: "#174B3B", color: "#FFFFFF" }}>
            {loading && <Loader2 className="animate-spin" size={16} />} Enviar para o suporte Avespet
          </button>
        </form>
      )}

      {resultadosPerdidas?.length > 0 && resultadosPerdidas.every((r) => r.status !== "perdida") && (
        <div className="text-sm px-4 py-4 rounded-lg max-w-md mx-auto text-left" style={{ background: "#E8F1E9", color: "#174B3B", border: "1px solid #DDEBDD" }}>
          <div className="font-semibold text-base mb-2">Que atitude bonita! 💚</div>
          <p className="mb-2">A ave deste cadastro já foi encontrada. Mesmo assim, obrigado por se importar.</p>
          <p>Se encontrou outra ave, você pode iniciar um novo registro escolhendo uma das opções acima.</p>
        </div>
      )}

      {enviado && (
        <div className="text-sm px-4 py-4 rounded-lg max-w-md mx-auto text-left" style={{ background: "#E8F1E9", color: "#174B3B", border: "1px solid #DDEBDD" }}>
          <div className="font-semibold text-base mb-2">Registro enviado ao Avespet! 💚</div>
          <p className="mb-2">Obrigado por ajudar. Nossa equipe administrativa vai analisar as informações e procurar possíveis correspondências.</p>
          <p>Seus dados de contato não serão divulgados publicamente. O Avespet fará a intermediação com o possível responsável.</p>
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
    <div className="rounded-2xl overflow-hidden ui-sans" style={{ background: "#FFFFFF", border: "1px solid #E1E9E2", boxShadow: "0 10px 28px rgba(22,58,42,.05)" }}>
      <div className="w-full aspect-square" style={{ background: "#E8F1E9" }}>
        {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm truncate" style={{ color: "#1D2B25" }}>{anuncio.nomeAve}</div>
        <div className="text-xs mb-1" style={{ color: "#63736A" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"}</div>
        <div className="text-base font-bold mb-2" style={{ color: "#174B3B" }}>{money(anuncio.preco)}</div>
        {anuncio.descricao && <div className="text-xs italic mb-2 line-clamp-2" style={{ color: "#63736A" }}>{anuncio.descricao}</div>}
        {perfil?.cidade && <div className="text-[11px] mb-2" style={{ color: "#63736A" }}>{perfil.cidade}{perfil.uf ? `/${perfil.uf}` : ""}</div>}
        <button onClick={handleInteresse} className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg" style={{ background: "#174B3B", color: "#FFFFFF" }}>
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
    return <div className="flex justify-center py-10"><Loader2 className="animate-spin" color="#174B3B" size={28} /></div>;
  }

  if (anuncios.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-5 py-10 text-center ui-sans text-sm" style={{ color: "#63736A", border: "1px solid #E1E9E2" }}>
        Nenhuma ave disponível para venda no momento.
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
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [telefone, setTelefone] = useState("");
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
        if (!nome.trim() || !sobrenome.trim() || !telefone.trim()) {
          throw new Error("Preencha nome, sobrenome e telefone para criar sua conta.");
        }
        const nomeCompleto = nome.trim() + " " + sobrenome.trim();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nome.trim(), sobrenome: sobrenome.trim(), nomeCompleto, telefone: telefone.trim(), whatsapp: telefone.trim() } },
        });
        if (error) throw error;
        setMessage("Conta criada! Enviamos os dados de confirmação para seu e-mail. Depois de confirmar e entrar, seu perfil de criador será criado automaticamente.");
      }
    } catch (err) {
      setError(err.message || "Nao foi possivel completar essa acao.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(20,12,6,0.6)" }} onClick={onFechar}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8 relative" style={{ background: "#FFFFFF", border: "1px solid #E1E9E2" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onFechar} className="absolute top-3 right-3" style={{ color: "#63736A" }}><X size={18} /></button>
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Feather size={20} color="#A6402B" />
          <div style={{ color: "#1D2B25", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <h2 className="text-center ui-sans font-semibold mb-5" style={{ color: "#1D2B25" }}>{mode === "login" ? "Entrar na sua conta" : mode === "forgot" ? "Recuperar senha" : "Criar conta gratuita"}</h2>
        {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
        {message && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#E8F1E9", color: "#174B3B" }}>{message}</div>}
        {message ? (
          <button type="button" onClick={onFechar} className="ui-sans w-full px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#174B3B", color: "#FFFFFF" }}>
            Voltar para entrar
          </button>
        ) : (
          <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <>
              <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Nome</span><input style={inputStyle} autoComplete="given-name" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" /></label>
              <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Sobrenome</span><input style={inputStyle} autoComplete="family-name" required value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} placeholder="Seu sobrenome" /></label>
              <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Telefone de contato / WhatsApp</span><input style={inputStyle} type="tel" autoComplete="tel" required value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" /></label>
            </>
          )}
          <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>E-mail</span><input style={inputStyle} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {mode !== "forgot" && <label className="ui-sans flex flex-col gap-1.5"><span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Senha</span><input style={inputStyle} type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
          <button type="submit" disabled={loading} className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold mt-1" style={{ background: "#174B3B", color: "#FFFFFF" }}>
            {loading && <Loader2 className="animate-spin" size={16} />}{mode === "login" ? "Entrar" : mode === "forgot" ? "Enviar link de recuperação" : "Criar conta"}
          </button>
        </form>
        {mode === "login" && (
          <button type="button" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }} className="ui-sans text-xs mt-4 w-full text-center underline" style={{ color: "#63736A" }}>
            Esqueceu sua senha?
          </button>
        )}
        <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }} className="ui-sans text-xs mt-5 w-full text-center underline" style={{ color: "#63736A" }}>
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#FFFFFF" }}>
      <div className="w-full max-w-sm rounded-xl p-6 sm:p-8" style={{ background: "#FFFFFF", border: "1px solid #E1E9E2" }}>
        <div className="flex items-center gap-2 mb-5 justify-center">
          <Feather size={20} color="#A6402B" />
          <div style={{ color: "#1D2B25", fontWeight: 700, fontSize: 16, fontFamily: "'Fraunces', serif" }}>Avespet</div>
        </div>
        <h1 className="text-center ui-sans font-semibold mb-5" style={{ color: "#1D2B25" }}>Criar nova senha</h1>
        {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
        {message && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#E8F1E9", color: "#174B3B" }}>{message}</div>}
        {message ? (
          <button type="button" onClick={onConcluir} className="ui-sans w-full px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#174B3B", color: "#FFFFFF" }}>
            Voltar para entrar
          </button>
        ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Nova senha</span>
            <input style={inputStyle} type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <label className="ui-sans flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase" style={{ color: "#63736A" }}>Confirmar nova senha</span>
            <input style={inputStyle} type="password" autoComplete="new-password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </label>
          <button type="submit" disabled={loading} className="ui-sans flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#174B3B", color: "#FFFFFF" }}>
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
  ["/aves-perdidas", "Aves perdidas"],
  ["/campanha-ave-perdida", "Divulgar minha busca"],
];

const SEO_FIXO = {
  "/aves-a-venda": { titulo: "Aves a venda", descricao: "Ring Neck e Calopsita de criadores cadastrados, com contato direto." },
  "/achei-uma-ave": { titulo: "Achei uma ave", descricao: "Encontrou uma ave? Informe a anilha e ajudamos a devolver ao criador." },
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

function NaoEncontrada() {
  return (
    <section className="px-5 pb-16 max-w-3xl mx-auto text-center ui-sans">
      <h1 className="mb-3" style={{ color: "#1D2B25", fontSize: 26, fontWeight: 700 }}>Pagina nao encontrada</h1>
      <Link para="/" style={{ color: "#174B3B", textDecoration: "underline" }}>Voltar para o início</Link>
    </section>
  );
}

function ConteudoDaRota({ caminho, onEntrar }) {
  const guia = caminho.match(/^\/guias\/([a-z0-9-]+)$/);
  if (caminho === "/") return <Inicio BuscaAnilha={BuscaAnilha} VitrinePublica={VitrinePublica} GuiasEmDestaque={GuiasEmDestaque} onEntrar={onEntrar} />;
  if (caminho === "/aves-a-venda") {
    return (
      <div style={{ background: "#F5F7F3", minHeight: "70vh" }}>
        <section className="px-5 py-10 md:py-14 max-w-7xl mx-auto">
          <SeoFixo caminho={caminho} />
          <h1 className="ui-sans mb-3 text-3xl md:text-4xl" style={{ color: "#1D2B25", fontFamily: "'Fraunces', serif", fontWeight: 700 }}>Aves disponíveis agora</h1>
          <p className="ui-sans mb-8 text-sm" style={{ color: "#63736A" }}>Conheça os anúncios publicados por criadores cadastrados no Avespet.</p>
          <VitrinePublica />
        </section>
      </div>
    );
  }
  if (caminho === "/aves-perdidas") return <><SeoFixo caminho={caminho} /><AvesPerdidas onEntrar={onEntrar} /></>;
  if (caminho === "/campanha-ave-perdida") return <><SeoFixo caminho={caminho} /><SolicitarCampanha /></>;
  if (caminho === "/achei-uma-ave") {
    return (
      <div style={{ background: "#F5F7F3", minHeight: "70vh" }}>
        <section className="px-5 py-10 md:py-14">
          <SeoFixo caminho={caminho} />
          <BuscaAnilha modoClaro />
        </section>
      </div>
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
    <div className="min-h-screen w-full" style={{ background: "#F5F7F3", fontFamily: "'Fraunces', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      <header className="sticky top-0 z-40 border-b px-5 pb-3 shadow-sm" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + .75rem)", background: "rgba(255,255,255,.96)", borderColor: "#E1E9E2", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <Link para="/" className="flex items-center gap-2">
            <Feather size={22} color="#174B3B" />
            <span style={{ color: "#174B3B", fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', serif" }}>Avespet</span>
          </Link>
          <button
            onClick={logado ? () => navegar("/") : onEntrar}
            className="ui-sans rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90"
            style={{ background: "#174B3B", color: "#FFFFFF" }}
          >
            {logado ? "Voltar ao sistema" : "Entrar / Criar conta"}
          </button>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl flex-wrap gap-2 ui-sans text-sm" aria-label="Menu principal">
          {MENU.map(([para, nome]) => {
            const ativo = para === "/" ? caminho === "/" : caminho === para || caminho.startsWith(para + "/");
            return (
              <Link key={para} para={para} className="inline-flex rounded-full px-3 py-2 transition" style={{ color: ativo ? "#174B3B" : "#63736A", background: ativo ? "#E8F1E9" : "transparent", fontWeight: ativo ? 700 : 500 }}>
                {nome}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="pt-0">
        <ConteudoDaRota caminho={caminho} onEntrar={onEntrar} />
      </main>

      <footer className="mt-10 border-t px-5 py-8 text-center ui-sans text-xs" style={{ color: "#63736A", background: "#FFFFFF", borderColor: "#E1E9E2" }}>
        {!logado && (
          <div>
            Criador de aves? <button onClick={onEntrar} className="underline" style={{ color: "#174B3B" }}>Cadastre seu plantel gratuitamente</button>
          </div>
        )}
        <div className="mt-2">
          Precisa de ajuda? <a href={SUPORTE_WHATSAPP} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#174B3B" }}>Fale com o suporte</a>
        </div>
      </footer>

      {mostrarLogin && !logado && <LoginModal onFechar={() => setMostrarLogin(false)} />}
    </div>
  );
}
