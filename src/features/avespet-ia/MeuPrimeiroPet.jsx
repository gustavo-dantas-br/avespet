import React, { useEffect, useRef, useState } from "react";
import { Bird, BookOpen, CalendarDays, ChevronDown, ChevronRight, Dna, Egg, GraduationCap, HeartHandshake, Info, MessageCircle, Send, ShieldCheck, Sparkles, UserRound, Leaf } from "lucide-react";
import { FASES } from "./motorEducativo";
import PerfilMinhaAve from "./PerfilMinhaAve";
import { PERFIL_VAZIO, idadePerfil, perfilDaAve, contextoDoPerfil, lerPerfilLocal, salvarPerfilLocal, validarEdicao, normalizarPerfil } from "./perfilAve.js";
import { conversarLocal, contextoInicial } from "./conversaLocal";
import { CHAT_GENERATIVO_ATIVO, conversarComModelo, verificarDisponibilidadeGemini } from "./chatGenerativo";
import DiarioFilhote from "./DiarioFilhote";
import FontesEducativas from "./FontesEducativas";
import GuiaIniciante from "./GuiaIniciante";
import { buscarPerguntaIniciante, respostaGuiaIniciante, contextoGuiaIniciante } from "./guiaIniciante.js";

// Usa a fotografia de Ring Neck já utilizada na home pública do Avespet.
// Não confundir esta imagem ilustrativa com a ave selecionada pelo criador.
const FOTO_RINGNECK = "https://images.pexels.com/photos/1463295/pexels-photo-1463295.jpeg?auto=compress&cs=tinysrgb&w=1400";
const inicial = PERFIL_VAZIO;
const campo = "mt-1 block w-full rounded-xl border border-[#DAE6DD] bg-white px-3 py-2.5 text-base text-[#234332] outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const temas = [
  { id: "primeiro", nome: "Meu Primeiro Pet", descricao: "Está começando agora? Vamos orientar você.", icon: Bird },
  { id: "guia", nome: "Guia para Iniciantes", descricao: "Perguntas e respostas para cuidar da sua primeira ave.", icon: GraduationCap },
  { id: "desenvolvimento", nome: "Acompanhar desenvolvimento", descricao: "Registre o dia a dia e acompanhe o histórico.", icon: CalendarDays },
  { id: "alimentacao", nome: "Alimentação e papa", descricao: "Informações educativas e cuidados seguros.", icon: HeartHandshake },
  { id: "genetica", nome: "Genética com IA", descricao: "Entenda mutações e herança genética.", icon: Dna },
  { id: "biblioteca", nome: "Biblioteca de conteúdos", descricao: "Guias, artigos e fontes em curadoria.", icon: BookOpen },
];

const mensagensTema = {
  primeiro: ["Meu Primeiro Pet", "Vamos começar! 🦜 Você já tem uma ave ou está pensando em adquirir a primeira?"],
  desenvolvimento: ["Acompanhar desenvolvimento", "Podemos acompanhar o peso, a alimentação e o comportamento pelo diário. Qual é a espécie da sua ave e a idade dela?"],
  alimentacao: ["Alimentação e papa", "Vamos conversar sobre alimentação. Sua ave ainda recebe papinha ou já se alimenta sozinha?"],
  genetica: ["Genética com IA", "Quer entender uma mutação ou descobrir as possibilidades de um cruzamento? A calculadora genética também está disponível abaixo."],
  biblioteca: ["Biblioteca de conteúdos", "Sobre qual espécie ou assunto você gostaria de aprender? Você também pode consultar os materiais disponíveis abaixo."],
};
const sugestoes = [
  "Como acompanhar o desenvolvimento?",
  "Como organizar o ambiente da minha ave?",
  "Quando procurar um veterinário de aves?",
];

export default function MeuPrimeiroPet({ aves = [], userId = "", onOpenGenetica }) {
  const [area, setArea] = useState("primeiro");
  const [perfil, setPerfil] = useState(inicial);
  const [pergunta, setPergunta] = useState("");
  const [historico, setHistorico] = useState([]);
  const [contexto, setContexto] = useState(() => contextoInicial());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aveId, setAveId] = useState("");
  const [perfilAberto, setPerfilAberto] = useState(true);
  const [perfilStatus, setPerfilStatus] = useState("");
  const [perfilErro, setPerfilErro] = useState("");
  const [perfilSalvo, setPerfilSalvo] = useState(inicial);
  const [aveIdSalvo, setAveIdSalvo] = useState("");
  const [diarioAberto, setDiarioAberto] = useState(false);
  const [fontesAbertas, setFontesAbertas] = useState(false);
  const [modeloIndisponivel, setModeloIndisponivel] = useState(true);
  const [verificandoModelo, setVerificandoModelo] = useState(CHAT_GENERATIVO_ATIVO);
  const [avisoModelo, setAvisoModelo] = useState("");
  const conversaRef = useRef(null);
  const secaoChatRef = useRef(null);
  const guiaInicianteRef = useRef(null);
  const atualizarDisponibilidade = async () => {
    if (!CHAT_GENERATIVO_ATIVO) return;
    setVerificandoModelo(true);
    const liberado = await verificarDisponibilidadeGemini().catch(() => false);
    setModeloIndisponivel(!liberado);
    setAvisoModelo(liberado ? "" : "O Gemini ainda não está habilitado nesta conta. Você pode continuar com o assistente local.");
    setVerificandoModelo(false);
  };
  useEffect(() => {
    if (!CHAT_GENERATIVO_ATIVO) return;
    let ativo = true;
    verificarDisponibilidadeGemini().then((liberado) => {
      if (!ativo) return;
      setModeloIndisponivel(!liberado);
      setAvisoModelo(liberado ? "" : "O Gemini não está disponível para esta conta no momento.");
      setVerificandoModelo(false);
    }).catch(() => {
      if (ativo) { setModeloIndisponivel(true); setVerificandoModelo(false); }
    });
    return () => { ativo = false; };
  }, []);
  useEffect(() => {
    const painel = conversaRef.current;
    if (!painel || historico.length === 0) return;
    const quadro = requestAnimationFrame(() => { painel.scrollTop = painel.scrollHeight; });
    return () => cancelAnimationFrame(quadro);
  }, [historico, enviando]);
  const aveSelecionada = aves.find((ave) => String(ave.id) === aveId) || null;
  const idade = idadePerfil(perfilSalvo);
  const aveAtiva = aves.find(a=>String(a.id)===aveIdSalvo)||null;
  useEffect(() => {
    const salvo = lerPerfilLocal(userId, typeof window !== "undefined" ? window.localStorage : null);
    const p = salvo?.perfil || inicial;
    setPerfil(p); setPerfilSalvo(p); setAveId(salvo?.aveId||""); setAveIdSalvo(salvo?.aveId||"");
    setContexto(salvo ? contextoDoPerfil(p) : contextoInicial()); setHistorico([]); setPerfilErro("");
    setPerfilStatus(salvo ? "Perfil recuperado neste navegador." : "");
  }, [userId]);
  const selecionarAve = id => {
    if(enviando)return;
    const ave=aves.find(a=>String(a.id)===id);
    setAveId(id);
    setPerfil(atual=>ave?perfilDaAve(ave,atual.nivel,id===aveIdSalvo?perfilSalvo:{}):{...inicial,nivel:atual.nivel});
    setPerfilErro(""); setPerfilStatus("Seleção alterada. Salve para aplicar ao chat.");
  };
  const salvarPerfil = () => {
    if(enviando)return;
    const e=validarEdicao(perfil);
    if(e){setPerfilErro(e);return;}
    if(aveId&&!aveSelecionada){setPerfilErro("Esta ave não está disponível no plantel. Selecione outra.");return;}
    const p=normalizarPerfil(perfil);
    try { salvarPerfilLocal(userId,p,aveId,window.localStorage); }
    catch {setPerfilErro("Não foi possível gravar neste navegador. Verifique o armazenamento e tente novamente.");return;}
    setPerfilSalvo(p);setAveIdSalvo(aveId);setPerfil(p);setContexto(contextoDoPerfil(p));setHistorico([]);setErro("");setPerfilErro("");
    setPerfilStatus("Perfil salvo neste navegador e aplicado à conversa.");
  };

  const atualizar = (chave, valor) => {
    setPerfil((atual) => ({ ...atual, [chave]: valor }));
    setPerfilErro(""); setPerfilStatus("Alterações ainda não salvas.");
  };

  const consultar = async (event) => {
    event.preventDefault();
    if (enviando) return;
    if (!pergunta.trim()) { setErro("Escreva sua pergunta antes de enviar."); return; }
    const texto = pergunta.trim();
    const local = conversarLocal(perfilSalvo, texto, contexto);
    setContexto(local.contexto);
    setPergunta("");
    setErro("");
    setEnviando(true);
    // Casos de alerta permanecem no motor educativo: não esperar pela API externa.
    const permiteModelo = CHAT_GENERATIVO_ATIVO && !modeloIndisponivel && !verificandoModelo &&
      !local.localSomente && local.resposta.tipo !== "urgente" && local.resposta.tipo !== "atencao";
    try {
      const resposta = permiteModelo
        ? await conversarComModelo({ pergunta: texto, historico, contexto: local.contexto }) || local.resposta
        : local.resposta;
      setHistorico((atual) => [...atual, { pergunta: texto, resposta }].slice(-60));
    } catch (falha) {
      // Não confundir falha da API Google com ausência de autorização do usuário.
      const status = falha?.status;
      const codigo = falha?.codigo;
      const bloqueado = [401, 403].includes(status) || ["DESATIVADO", "CONFIGURACAO"].includes(codigo);
      if (bloqueado) setModeloIndisponivel(true);
      setHistorico((atual) => [...atual, { pergunta: texto, resposta: local.resposta }].slice(-60));
      const aviso = codigo === "COTA_GEMINI" || status === 429
        ? "O Gemini atingiu seu limite de uso. Continue no assistente local."
        : codigo === "CHAVE_GEMINI"
        ? "O Google recusou a chave Gemini. É necessário verificar o acesso no Google AI Studio."
        : codigo === "MODELO_GEMINI"
        ? "O Google não reconheceu o modelo configurado para esta conta."
        : bloqueado
        ? "O Gemini não foi liberado nesta conta. A conversa continua no assistente local."
        : "Não foi possível consultar o Gemini agora. A conversa continua no assistente local.";
      setErro(aviso);
      setAvisoModelo(aviso);
    } finally {
      setEnviando(false);
    }
  };
  const selecionarTema = (id) => {
    if (enviando) return;
    if (id === "guia") {
      setArea(id);
      requestAnimationFrame(() => guiaInicianteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    if (!mensagensTema[id]) return;
    setArea(id);
    if (id === "desenvolvimento") setDiarioAberto(true);
    if (id === "biblioteca") setFontesAbertas(true);
    const [titulo, mensagem] = mensagensTema[id];
    setContexto(atual => ({ ...atual, etapa: "tema_" + id }));
    setHistorico(atual => [...atual, { pergunta: titulo, resposta: { tipo: "conversa", titulo: "Avespet IA", mensagem, fontes: [], aviso: "", tema: id } }]);
    requestAnimationFrame(() => {
      secaoChatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };
  const responderGuia = (id) => {
    if (enviando) return;
    const item = buscarPerguntaIniciante(id);
    if (!item) return;
    setContexto(atual => contextoGuiaIniciante(atual, item));
    setHistorico(atual => [...atual, { pergunta: item.pergunta, resposta: respostaGuiaIniciante(item, contexto) }].slice(-60));
    requestAnimationFrame(() => secaoChatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const abrirSugestao = (texto) => {
    setPergunta(texto);
    const campoPergunta = document.getElementById("avespet-ia-pergunta");
    campoPergunta?.focus();
  };

  return <section className="mx-auto w-full min-w-0 max-w-[1500px] space-y-4 overflow-x-clip px-0 text-[#213D2E]">
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Sparkles className="text-emerald-600" size={26} />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">Avespet IA</h1>
          <p className="text-xs text-[#65766A]">{verificandoModelo ? "Verificando disponibilidade do Gemini..." : CHAT_GENERATIVO_ATIVO && !modeloIndisponivel ? "Gemini disponível em teste · conversa com contexto" : "Assistente educativo local · Gemini não disponível nesta sessão"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-[#E6F5EC] px-3 py-2 text-xs font-semibold text-[#236548]">
        <GraduationCap size={17} /> Suporte educacional <Info size={14} />
      </div>
    </header>
    {CHAT_GENERATIVO_ATIVO && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D7E6DA] bg-[#F7FAF7] px-3 py-2 text-xs text-[#3A5B46]" role="status">
      <span>{verificandoModelo ? "Verificando a configuração do Gemini..." : avisoModelo || (modeloIndisponivel ? "Assistente local ativo." : "Gemini configurado para a conta de testes; a resposta real depende do Google.")}</span>
      <button type="button" disabled={verificandoModelo} onClick={atualizarDisponibilidade} className="shrink-0 rounded-lg border border-[#BCD8C5] bg-white px-3 py-2 font-semibold text-emerald-800 disabled:opacity-50">Verificar novamente</button>
    </div>}

    <div className="relative isolate overflow-hidden rounded-[22px] border border-[#D6EBDC] bg-[#E8F8ED] shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(200px,34%)] sm:items-stretch">
        <div className="relative z-10 flex min-w-0 flex-col justify-center px-4 py-5 sm:px-8 sm:py-7">
          <h2 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#142C24] sm:text-3xl lg:text-4xl">Olá, sou o Avespet IA <Sparkles size={23} className="inline text-emerald-600" /></h2>
          <p className="mt-2 text-sm leading-6 text-[#3D5346] sm:text-base">Estou aqui para ajudar a conhecer suas aves, acompanhar o desenvolvimento e encontrar informações educativas com referências.</p>
          <div className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-[#28533A] lg:flex">
            <span>✓ Conhecimento por espécie</span><span>✓ Diário de desenvolvimento</span><span>✓ Fontes verificáveis</span>
          </div>
        </div>
        <div className="relative h-[165px] overflow-hidden bg-[#D1EAD8] sm:h-auto sm:min-h-[215px]" aria-label="Fotografia ilustrativa de Ring Neck verde">
          <img src={FOTO_RINGNECK} alt="Ring Neck verde ilustrando o assistente Avespet IA" loading="eager" decoding="async" className="h-full w-full object-cover object-[center_42%] sm:absolute sm:inset-0" />
        </div>
      </div>
    </div>

    <nav aria-label="Áreas do Avespet IA" className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 xl:grid-cols-6">
      {temas.map(({ id, nome, descricao, icon: Icon }) => <button type="button" key={id} onClick={() => selecionarTema(id)} disabled={enviando} aria-pressed={area === id}
        className={`flex min-h-[126px] w-[154px] shrink-0 snap-start flex-col items-center rounded-2xl border px-3 py-3 text-center shadow-sm transition sm:min-h-[143px] sm:w-auto sm:shrink sm:py-4 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${area === id ? "border-emerald-500 bg-[#E5F9E7] ring-1 ring-emerald-300" : "border-[#DEE7DF] bg-white hover:bg-[#F7FBF7]"}`}>
        <Icon size={28} strokeWidth={1.8} className="mb-2 text-[#16834D]" />
        <strong className="text-sm leading-[1.3] text-[#173428]">{nome}</strong>
        <span className="mt-1.5 text-[11px] leading-4 text-[#586B5F]">{descricao}</span>
      </button>)}
    </nav>

    {area === "guia" && <div ref={guiaInicianteRef} className="scroll-mt-4"><GuiaIniciante onPergunta={responderGuia} disabled={enviando}/></div>}

    <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)]">
      <div className="min-w-0 space-y-4">
        <section ref={secaoChatRef} className="min-w-0 scroll-mt-4 overflow-hidden rounded-2xl border border-[#DEE7DF] bg-white shadow-sm" aria-label="Conversa com Avespet IA">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EDE8] px-3 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <MessageCircle size={27} className="text-emerald-700" />
              <div><h2 className="text-lg font-extrabold">Converse com o Avespet IA</h2><p className="text-xs text-[#586B5F]">{contexto.especie ? "Contexto atual: "+contexto.especie+(contexto.idadeDias!==null?" · "+contexto.idadeDias+" dias":"") : "Conversa geral · nenhuma espécie em foco"}</p></div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ECF8EE] px-3 py-1.5 text-xs text-[#236548]"><GraduationCap size={15}/> Educativo</span>
          </div>
          <div className="h-[min(54dvh,480px)] min-h-[240px] space-y-4 overflow-y-auto overscroll-contain bg-[#FCFDFC] px-3 py-4 sm:h-[min(62dvh,560px)] sm:min-h-[320px] sm:px-6 sm:py-5" aria-live="polite" ref={conversaRef}>
            <div className="flex items-start gap-2.5">
              <img src={FOTO_RINGNECK} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-[#E0EDE3] object-cover" loading="lazy"/>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-[#E3EAE5] bg-white p-3 shadow-sm sm:max-w-[90%] sm:flex-none sm:p-4">
                <p className="text-sm font-bold text-[#173428]">Avespet IA <Sparkles size={13} className="inline text-emerald-500"/></p>
                <p className="mt-1 text-[15px] leading-6 text-[#3E5145]">Olá! 🦜 Sou o Avespet IA. Como posso ajudar você hoje?</p>
              </div>
            </div>
            {historico.map((item, i) => <React.Fragment key={i}>
              <div className="ml-auto flex max-w-[94%] min-w-0 items-start justify-end gap-2 sm:max-w-[88%]">
                <div className="min-w-0 break-words rounded-2xl rounded-tr-sm bg-[#E5F5EB] px-3 py-3 text-[15px] leading-6 text-[#244735] sm:px-4">{item.pergunta}</div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><UserRound size={16}/></span>
              </div>
              <div className="flex items-start gap-2.5">
                <img src={FOTO_RINGNECK} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-[#E0EDE3] object-cover" loading="lazy"/>
                <div className={`min-w-0 flex-1 break-words rounded-2xl rounded-tl-sm border p-3 text-[15px] shadow-sm sm:max-w-[90%] sm:flex-none sm:p-4 ${item.resposta.tipo === "urgente" ? "border-red-200 bg-red-50" : item.resposta.tipo === "atencao" ? "border-amber-200 bg-amber-50" : "border-[#E3EAE5] bg-white"}`}>
                  <strong className="block text-[#173428]">{item.resposta.titulo}</strong>
                  <p className="mt-2 whitespace-pre-wrap break-words leading-[1.7] text-[#405449]">{item.resposta.mensagem}</p>
                  {item.resposta.guia && <button type="button" onClick={() => { setArea("guia"); requestAnimationFrame(() => guiaInicianteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="mt-3 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">Ver outras perguntas do guia</button>}
                  {item.resposta.tema === "genetica" && onOpenGenetica && <button type="button" onClick={onOpenGenetica} className="mt-3 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">Abrir calculadora genética</button>}
                  {item.resposta.tema === "desenvolvimento" && <button type="button" onClick={() => { setDiarioAberto(true); requestAnimationFrame(() => document.getElementById("avespet-ia-diario")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="mt-3 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">Abrir diário</button>}
                  {item.resposta.tema === "biblioteca" && <button type="button" onClick={() => { setArea("biblioteca"); setFontesAbertas(true); requestAnimationFrame(() => document.getElementById("avespet-ia-biblioteca")?.scrollIntoView({ behavior: "smooth", block: "start" })); }} className="mt-3 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">Consultar biblioteca</button>}
                  {item.resposta.fontes?.length > 0 && <div className="mt-3 border-t pt-2 text-xs">{item.resposta.fontes.map((f,j)=><a key={f.url+j} href={f.url} target="_blank" rel="noopener noreferrer" className="block break-words text-emerald-700 underline">{f.titulo}</a>)}</div>}
                  {["urgente", "atencao"].includes(item.resposta.tipo) && item.resposta.aviso && <p className="mt-2 text-xs text-[#66786B]">{item.resposta.aviso}</p>}
                </div>
              </div>
            </React.Fragment>)}
            {enviando && <p role="status" className="pl-12 text-xs text-[#567260]">Avespet IA está preparando a resposta...</p>}

          </div>

          <div className="border-t border-[#E4ECE5] bg-white px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-4">
            <div className="mb-3 flex snap-x gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {sugestoes.map((texto) => <button type="button" key={texto} onClick={() => abrirSugestao(texto)} className="shrink-0 snap-start whitespace-nowrap rounded-full border border-[#D7E6DA] bg-[#F9FCF9] px-3 py-2 text-xs text-[#355E42] transition hover:bg-[#E6F4E9]"><MessageCircle className="mr-1 inline" size={13}/>{texto}</button>)}
            </div>
            <form onSubmit={consultar}>
              <label htmlFor="avespet-ia-pergunta" className="sr-only">Digite sua dúvida para o Avespet IA</label>
              <div className="flex min-w-0 items-end gap-2">
                <textarea id="avespet-ia-pergunta" value={pergunta} onChange={(e)=>setPergunta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !enviando) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
                  rows={2} maxLength={2000} enterKeyHint="send" placeholder="Digite sua mensagem..."
                  className="min-h-[56px] max-h-36 w-full min-w-0 flex-1 resize-y rounded-xl border border-[#D7E4DA] bg-white p-3 text-base leading-6 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/>
                <button type="submit" disabled={enviando} aria-label="Enviar pergunta" title="Enviar pergunta" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50"><Send size={19}/></button>
              </div>
              <p className="mt-1.5 text-[11px] text-[#607366]">Enter envia · Shift + Enter pula linha · Orientações educativas não substituem veterinário.</p>
              {erro && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{erro}</p>}
            </form>
          </div>
        </section>
        {area === "alimentacao" && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm"><h3 className="font-bold">Alimentação e papa</h3><p className="mt-2 leading-6">Conteúdo prático de alimentação manual ainda precisa de revisão veterinária. Não serão mostradas temperaturas, horários, doses ou volumes sem validação específica. Em caso de dificuldade com o filhote, procure um veterinário com experiência em aves.</p></section>}
        {area === "genetica" && <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm"><h3 className="font-bold">Genética</h3><p className="mt-2">A calculadora genética existente continua sendo a referência para previsões. O assistente não inventa percentuais nem genótipos.</p>{onOpenGenetica && <button type="button" onClick={onOpenGenetica} className="mt-3 rounded-xl bg-violet-700 px-4 py-2.5 font-semibold text-white">Abrir calculadora genética</button>}</section>}
        {area === "biblioteca" && <div id="avespet-ia-biblioteca" className="scroll-mt-4"><FontesEducativas/></div>}
      </div>

      <aside className="min-w-0 space-y-3">
        <PerfilMinhaAve perfil={perfil} aves={aves} aveId={aveId} onSelecionar={selecionarAve} onAtualizar={atualizar} onSalvar={salvarPerfil} status={perfilStatus} erro={perfilErro} disabled={enviando} aberto={perfilAberto} onToggle={()=>setPerfilAberto(v=>!v)}/>
        <section id="avespet-ia-diario" className="scroll-mt-4 overflow-hidden rounded-2xl border border-[#DEE7DF] bg-white shadow-sm">
          <button type="button" onClick={()=>setDiarioAberto(x=>!x)} aria-expanded={diarioAberto} className="flex w-full items-center justify-between gap-3 p-4 text-left">
            <span className="inline-flex items-center gap-2 font-bold"><CalendarDays size={20} className="text-emerald-700"/> Diário de desenvolvimento</span>
            {diarioAberto ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
          </button>
          <div className="flex items-center gap-3 border-t border-[#EBF0EC] px-4 py-3">
            <img src={FOTO_RINGNECK} alt="Foto ilustrativa de Ring Neck" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy"/>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{aveAtiva?.nome || perfilSalvo.nome || perfilSalvo.especie || "Nenhuma ave selecionada"}</p><span className="inline-flex rounded-full bg-[#C8F0D5] px-2 py-0.5 text-[11px] font-semibold text-emerald-800">{perfilSalvo.fase === "incerta" ? "Fase a identificar" : FASES.find(f=>f.id===perfilSalvo.fase)?.label}</span><p className="mt-1 text-xs text-[#607366]">{idade !== null ? `Idade informada: ${idade} dias` : "Idade não informada"}</p></div>
          </div>
          {diarioAberto && <div className="space-y-3 border-t border-[#EBF0EC] p-3">
            <p className="text-xs text-[#607366]">O diário usa a ave do perfil salvo acima. A gravação permanente do diário está em preparação.</p>
            <DiarioFilhote key={aveIdSalvo || "demo"} aveNome={aveAtiva?.nome || perfilSalvo.nome || "Minha ave"} aveId={aveAtiva?.id || ""} userId={userId}/>
          </div>}
          {!diarioAberto && <button type="button" onClick={()=>{setDiarioAberto(true);setArea("desenvolvimento");}} className="w-full border-t border-[#EBF0EC] px-4 py-2.5 text-left text-xs font-semibold text-emerald-700">Abrir diário e gráfico de peso →</button>}
        </section>
        <section className="rounded-2xl border border-[#DEE7DF] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2"><Leaf size={20} className="text-emerald-700"/><h3 className="font-bold">Evolução de peso</h3></div>
          <p className="mt-2 text-xs leading-5 text-[#607366]">Adicione duas pesagens no diário para visualizar o gráfico. Os valores da arte eram ilustrativos; aqui só exibimos dados registrados.</p>
          <button type="button" onClick={()=>{setDiarioAberto(true);setArea("desenvolvimento");}} className="mt-3 rounded-lg border border-[#D7E6DA] px-3 py-2 text-xs font-semibold text-emerald-700">Ver evolução registrada</button>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#DEE7DF] bg-white shadow-sm">
          <button type="button" onClick={()=>setFontesAbertas(x=>!x)} aria-expanded={fontesAbertas} className="flex w-full items-center justify-between p-4 text-left"><span className="inline-flex items-center gap-2 font-bold"><BookOpen size={20} className="text-emerald-700"/> Fontes e referências</span>{fontesAbertas ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}</button>
          {fontesAbertas ? <div className="px-3 pb-3"><FontesEducativas/></div> : <p className="border-t border-[#EBF0EC] px-4 py-3 text-xs leading-5 text-[#607366]">Materiais em curadoria, baseados em referências verificáveis e sujeitos a aprovação.</p>}
        </section>
      </aside>
    </div>
    <footer className="flex items-start gap-2 border-t border-[#DCE7DF] px-2 py-3 text-xs text-[#496754]"><ShieldCheck size={17} className="shrink-0 text-emerald-700"/><span><strong>Importante:</strong> o Avespet IA oferece conteúdo educativo, não realiza atendimento veterinário. Registros do diário podem ser temporários ou vinculados à ave. O Gemini é experimental e só funciona mediante autorização no servidor; não compartilhe dados sensíveis na conversa.</span></footer>
  </section>;
}
