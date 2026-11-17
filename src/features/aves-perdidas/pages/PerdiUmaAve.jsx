import React, { useCallback, useEffect, useRef, useState } from "react";
import { atualizarMeuAnuncioPerdida, criarAnuncioPerdida, listarMinhasAvesPerdidas } from "../services/avesPerdidasService";
import { comprimirEEnviarImagemPublica } from "../utils/comprimirImagem";
import { supabase } from "../../../supabaseClient";
import { guardarCadastroPendente, lerCadastroPendente, marcarConfirmacaoSolicitada } from "../services/cadastroPendenteAvePerdida";

const input = { width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #e3d3b4", background: "#fff", color: "#2B241C" };
const STATUS = {
  pendente: { label: "Aguardando aprovação", cor: "#8a5a12", fundo: "#f0dab0" },
  aprovado: { label: "Publicado", cor: "#405331", fundo: "#e4ead9" },
  rejeitado: { label: "Não aprovado", cor: "#a6402b", fundo: "#f0dad4" },
  encerrado: { label: "Busca encerrada", cor: "#6b5638", fundo: "#e3d3b4" },
};

const FORM_INICIAL = { nomeAve: "", especie: "Ring Neck", cor: "", sexo: "", idadeAproximada: "", caracteristicas: "", anilha: "", cidade: "", uf: "SP", dataPerda: "", descricao: "", contatoNome: "", whatsapp: "", bairro: "", foto: "" };

export default function PerdiUmaAve({ userId: userIdInicial, onEntrar }) {
  const formularioRef = useRef(null);
  const [userId, setUserId] = useState(userIdInicial ?? undefined);
  const [form, setForm] = useState({ ...FORM_INICIAL });
  const [edicaoId, setEdicaoId] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [anuncios, setAnuncios] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [anuncioCriadoId, setAnuncioCriadoId] = useState("");
  const [erro, setErro] = useState("");
  const [contaEmail, setContaEmail] = useState(() => lerCadastroPendente()?.email || "");
  const [contaSenha, setContaSenha] = useState("");
  const [modoConta, setModoConta] = useState("cadastro");
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(
    () => Boolean(lerCadastroPendente()?.confirmacaoSolicitada)
  );
  const [reenviandoConfirmacao, setReenviandoConfirmacao] = useState(false);
  const [ultimoReenvio, setUltimoReenvio] = useState(0);
  const [emailNovo, setEmailNovo] = useState(false);
  const alterar = (campo, valor) => setForm((atual) => ({ ...atual, [campo]: valor }));

  useEffect(() => {
    if (userIdInicial !== undefined) return;
    let ativa = true;
    supabase.auth.getUser()
      .then(({ data }) => ativa && setUserId(data.user?.id || null))
      .catch(() => ativa && setUserId(null));
    return () => { ativa = false; };
  }, [userIdInicial]);

  const carregarAnuncios = useCallback(async () => {
    if (!userId) { setCarregando(false); return; }
    try {
      const lista = await listarMinhasAvesPerdidas(userId);
      setAnuncios(lista);
    } catch (e) {
      setErro(e?.message || "Não foi possível carregar seus anúncios.");
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { if (userId !== undefined) carregarAnuncios(); }, [carregarAnuncios, userId]);
  useEffect(() => {
    if (!userId) return;
    const atualizar = () => carregarAnuncios();
    window.addEventListener("avespet:anuncio-perdida-criado", atualizar);
    return () => window.removeEventListener("avespet:anuncio-perdida-criado", atualizar);
  }, [userId, carregarAnuncios]);

  function iniciarEdicao(anuncio) {
    const dados = anuncio.data || {};
    setForm({ ...FORM_INICIAL, ...dados });
    setEdicaoId(anuncio.id);
    setAnuncioCriadoId("");
    setMensagem("");
    setErro("");
    formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelarEdicao() {
    setForm({ ...FORM_INICIAL });
    setEdicaoId(null);
    setAnuncioCriadoId("");
    setMensagem("");
    setErro("");
  }

  async function enviar(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");
    if (!form.contatoNome.trim() || !form.whatsapp.trim() || !form.cidade.trim()) {
      setErro("Preencha nome, WhatsApp e cidade para publicar.");
      return;
    }
    if (enviandoFoto) {
      setErro("Aguarde o carregamento da foto antes de salvar.");
      return;
    }
    setEnviando(true);
    try {
      if (!userId) {
        // O anúncio só será enviado quando existir uma conta autenticada.
        // Guarda o rascunho temporário sem armazenar a senha.
        const email = contaEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new Error("Informe um e-mail válido para acompanhar o anúncio.");
        }
        if (contaSenha.length < 8) {
          throw new Error("Informe uma senha com pelo menos 8 caracteres.");
        }
        const anterior = lerCadastroPendente();
        const novoId = anterior?.email === email ? anterior.anuncio.id : globalThis.crypto.randomUUID();
        guardarCadastroPendente(email, { ...form, id: novoId, criadoEm: new Date().toISOString() });
        if (modoConta === "entrar") {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email, password: contaSenha
          });
          if (signInError) throw new Error("Não foi possível entrar. Confira e-mail e senha ou recupere a senha no login.");
          setMensagem("Conta identificada. Estamos vinculando o anúncio ao seu perfil.");
        } else {
          const nomeCompleto = form.contatoNome.trim();
          const partes = nomeCompleto.split(/\s+/);
          const nome = partes.shift() || nomeCompleto;
          const sobrenome = partes.join(" ");
          const { data, error: signupError } = await supabase.auth.signUp({
            email,
            password: contaSenha,
            options: {
              emailRedirectTo: window.location.origin + "/",
              data: {
                nome, sobrenome, nomeCompleto,
                telefone: form.whatsapp.trim(),
                whatsapp: form.whatsapp.trim(),
              },
            },
          });
          if (signupError) throw signupError;
          if (data?.session) {
            setMensagem("Conta criada. Estamos enviando seu anúncio para análise.");
          } else {
            marcarConfirmacaoSolicitada(email);
            setAguardandoConfirmacao(true);
            setMensagem("");
            setErro("");
          }
        }
        setContaSenha("");
        return;
      }
      if (edicaoId) {
        await atualizarMeuAnuncioPerdida(userId, edicaoId, { ...form, id: edicaoId });
        setAnuncioCriadoId("");
        setMensagem("Atualização enviada! O anúncio ficará temporariamente fora da página pública enquanto nossa equipe revisa as alterações.");
      } else {
        const novoId = globalThis.crypto.randomUUID();
        await criarAnuncioPerdida(userId || null, { ...form, id: novoId, criadoEm: new Date().toISOString() });
        setAnuncioCriadoId(novoId);
        setMensagem("Recebemos seu anúncio! Ele ficará aguardando análise e só aparecerá na página pública depois da aprovação.");
      }
      setForm({ ...FORM_INICIAL });
      setEdicaoId(null);
      if (userId) await carregarAnuncios();
    } catch (e) {
      const excess = e?.status === 429 || e?.code === "over_email_send_rate_limit" ||
        /email rate limit exceeded/i.test(e?.message || "");
      if (excess) {
        setErro("Os envios de confirmação de e-mail estão temporariamente limitados. Seus dados da ave ficaram salvos neste navegador. Não é necessário preencher tudo novamente. A equipe Avespet está ajustando o envio das confirmações. Se você já possui conta confirmada, escolha 'Já tenho conta'.");
      } else {
        setErro(e?.message || "Não foi possível salvar. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  }

  async function reenviarConfirmacao() {
    const email = contaEmail.trim().toLowerCase();
    if (!email || reenviandoConfirmacao || Date.now() - ultimoReenvio < 60000) return;
    setReenviandoConfirmacao(true);
    setErro("");
    setMensagem("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin + "/" },
      });
      if (error) throw error;
      setUltimoReenvio(Date.now());
      setMensagem("Solicitação de reenvio recebida! Confira sua caixa de entrada, spam e lixo eletrônico.");
    } catch (e) {
      const limite = e?.status === 429 || /rate limit|security purposes/i.test(e?.message || "");
      setErro(limite
        ? "Muitas tentativas de envio. Aguarde um pouco antes de reenviar o e-mail."
        : "Não conseguimos reenviar agora. Confira seu endereço de e-mail ou tente novamente mais tarde.");
    } finally {
      setReenviandoConfirmacao(false);
    }
  }

  function trocarEmailCadastro() {
    // Permite refazer o cadastro em outro endereço sem perder os dados digitados.
    // O usuário não consegue alterar o endereço de uma conta não confirmada sem acesso a ela.
    setAguardandoConfirmacao(false);
    setModoConta("cadastro");
    setEmailNovo(true);
    setContaSenha("");
    setMensagem("Se você não tem mais acesso ao e-mail anterior, informe outro endereço e crie uma nova conta. Os dados da ave continuam preenchidos.");
    setErro("");
  }

  async function fotoSelecionada(e) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setErro("");
    setEnviandoFoto(true);
    try {
      // O bucket público atual aceita somente JPEG com até 160 KiB.
      const foto = await comprimirEEnviarImagemPublica(arquivo, "perdidas", 150 * 1024);
      alterar("foto", foto);
    } catch (err) {
      setErro(err?.message || "Não foi possível processar essa foto.");
      e.target.value = "";
    } finally {
      setEnviandoFoto(false);
    }
  }

  if (!userId && aguardandoConfirmacao) {
    return <section ref={formularioRef} className="ui-sans mx-auto max-w-2xl">
      <div role="status" className="rounded-2xl bg-white p-6 text-center shadow-lg sm:p-10" style={{ border: "2px solid #B2D8BF", color: "#1D2B25" }}>
        <div aria-hidden="true" className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl" style={{ background: "#E8F1E9" }}>✉️</div>
        <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: "#174B3B" }}>Confirme seu e-mail para ativar a conta</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-7">Enviamos um link de confirmação para <strong className="break-all">{contaEmail}</strong>.</p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6" style={{ color: "#526A5B" }}>Abra sua caixa de entrada e clique no link. Verifique também o spam e a lixeira.</p>
        <div className="mt-6 rounded-xl p-4 text-left text-sm leading-6" style={{ background: "#F1F7F2", color: "#294D39" }}>
          <strong>Seus dados da ave foram preservados neste navegador.</strong> O anúncio ainda não foi enviado à moderação. Depois de confirmar o e-mail, entre na sua conta para concluir o envio automaticamente.
        </div>
        {erro && <p role="alert" className="mt-4 rounded-lg p-3 text-sm" style={{ color: "#9D3F30", background: "#FFF1ED" }}>{erro}</p>}
        {mensagem && <p className="mt-4 rounded-lg p-3 text-sm" style={{ color: "#174B3B", background: "#E8F1E9" }}>{mensagem}</p>}
        <div className="mt-7 flex flex-col gap-3">
          <button type="button" onClick={() => onEntrar ? onEntrar() : window.location.assign("/")} className="rounded-xl px-5 py-3.5 text-base font-bold text-white" style={{ background: "#174B3B" }}>Já confirmei — entrar na minha conta</button>
          <button type="button" disabled={reenviandoConfirmacao || Date.now() - ultimoReenvio < 60000} onClick={reenviarConfirmacao} className="rounded-xl border px-5 py-3 text-sm font-bold disabled:opacity-60" style={{ borderColor: "#B2D8BF", color: "#174B3B" }}>
            {reenviandoConfirmacao ? "Reenviando..." : "Não recebi o e-mail — reenviar confirmação"}
          </button>
          <button type="button" onClick={trocarEmailCadastro} className="px-3 py-2 text-sm font-semibold underline" style={{ color: "#526A5B" }}>Digitei o e-mail errado ou não tenho mais acesso</button>
        </div>
      </div>
    </section>;
  }

  return <section ref={formularioRef} className="ui-sans max-w-3xl">
    <h1 className="mb-2" style={{ color: "#F1E6D2", fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 700 }}>{edicaoId ? "Editar anúncio de ave perdida" : "Cadastrar ave perdida"}</h1>
    <p className="mb-6" style={{ color: "#b09a78" }}>{edicaoId ? "Atualize a foto e os dados da sua ave. Após salvar, o anúncio será reenviado para análise do Avespet." : "Preencha os dados da ave gratuitamente. No final, crie sua conta Avespet para acompanhar o anúncio e fazer alterações."}</p>
    <form onSubmit={enviar} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: "#FAF3E6" }}>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">Nome da ave<input style={input} value={form.nomeAve} onChange={e=>alterar("nomeAve",e.target.value)} placeholder="Ex.: Mel" /></label>
        <label className="text-sm">Espécie<select style={input} value={form.especie} onChange={e=>alterar("especie",e.target.value)}><option>Ring Neck</option><option>Calopsita</option><option>Agapornis</option><option>Papagaio</option><option>Outra</option></select></label>
        <label className="text-sm">Cor / mutação<input style={input} value={form.cor} maxLength={80} onChange={e=>alterar("cor",e.target.value)} placeholder="Ex.: azul, violeta, verde" /></label>
        <label className="text-sm">Sexo (se souber)<select style={input} value={form.sexo} onChange={e=>alterar("sexo",e.target.value)}><option value="">Não informado</option><option value="Macho">Macho</option><option value="Fêmea">Fêmea</option><option value="Não sei">Não sei</option></select></label>
        <label className="text-sm">Idade aproximada (opcional)<input style={input} value={form.idadeAproximada} maxLength={50} onChange={e=>alterar("idadeAproximada",e.target.value)} placeholder="Ex.: 2 anos" /></label>
        <label className="text-sm">Número da anilha (opcional, não será público)<input style={input} value={form.anilha} onChange={e=>alterar("anilha",e.target.value)} placeholder="Ex.: FOB 0080" /></label>
        <label className="text-sm">Data em que desapareceu<input type="date" style={input} value={form.dataPerda} onChange={e=>alterar("dataPerda",e.target.value)} /></label>
        <label className="text-sm">Bairro ou região<input style={input} value={form.bairro} onChange={e=>alterar("bairro",e.target.value)} placeholder="Ex.: Vila Mariana" /></label>
        <label className="text-sm">Cidade<input required style={input} value={form.cidade} onChange={e=>alterar("cidade",e.target.value)} /></label>
        <label className="text-sm">Estado<input maxLength="2" style={input} value={form.uf} onChange={e=>alterar("uf",e.target.value.toUpperCase())} /></label>
      </div>
      <label className="text-sm">Características para reconhecer a ave (opcional)<textarea style={input} rows="3" maxLength={400} value={form.caracteristicas} onChange={e=>alterar("caracteristicas",e.target.value)} placeholder="Ex.: ponta da cauda mais escura, atende pelo nome Bluu, imita sons..." /></label>
      <p className="text-xs" style={{color:"#8a7a63"}}>Essas características poderão aparecer no anúncio público. Não informe aqui telefone, endereço exato nem a numeração completa da anilha.</p>
      <label className="text-sm">Conte como e onde desapareceu<textarea style={input} rows="3" value={form.descricao} onChange={e=>alterar("descricao",e.target.value)} /></label>
      <label className="text-sm">Foto da ave (opcional)<input className="block w-full mt-1 text-sm" type="file" accept="image/*" onChange={fotoSelecionada} disabled={enviandoFoto || enviando} /></label>
      {enviandoFoto && <p className="text-sm" style={{color:"#405331"}}>Preparando e enviando a foto...</p>}
      {form.foto && <img src={form.foto} alt="Prévia da ave" className="w-28 h-28 rounded-lg object-cover" />}
      <div className="border-t pt-3 mt-1" style={{ borderColor: "#e3d3b4" }}>
        <p className="font-semibold mb-2">Contato reservado ao suporte Avespet</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Seu nome<input required style={input} value={form.contatoNome} onChange={e=>alterar("contatoNome",e.target.value)} /></label>
          <label className="text-sm">Seu WhatsApp<input required style={input} value={form.whatsapp} onChange={e=>alterar("whatsapp",e.target.value)} placeholder="DDD + número" /></label>
        </div>
        <p className="text-xs mt-2" style={{color:"#8a7a63"}}>Esses dados não serão exibidos no anúncio público. O e-mail da conta será usado para avisos sobre o andamento da busca.</p>
        {!userId && !edicaoId && <div className="mt-5 rounded-xl p-4" style={{ background: "#E8F1E9", border: "1px solid #CAE1D0" }}>
          <h2 className="font-bold" style={{ color: "#174B3B" }}>Crie sua conta gratuita para acompanhar o anúncio</h2>
          <p className="mt-1 text-xs leading-5" style={{ color: "#405D49" }}>Vamos aproveitar seu nome e WhatsApp informados acima. Você só precisa acrescentar e-mail e senha.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setModoConta("cadastro"); setAguardandoConfirmacao(false); setErro(""); }} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: modoConta === "cadastro" ? "#174B3B" : "#FFFFFF", color: modoConta === "cadastro" ? "#FFFFFF" : "#174B3B" }}>Criar conta grátis</button>
            <button type="button" onClick={() => { setModoConta("entrar"); setAguardandoConfirmacao(false); setErro(""); }} className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: modoConta === "entrar" ? "#174B3B" : "#FFFFFF", color: modoConta === "entrar" ? "#FFFFFF" : "#174B3B" }}>Já tenho conta</button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold" style={{ color: "#1D2B25" }}>
              <span>Seu e-mail</span>
              <input type="email" required autoComplete="email" maxLength={254} style={input} value={contaEmail} onChange={(e) => setContaEmail(e.target.value)} placeholder="voce@exemplo.com" />
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold" style={{ color: "#1D2B25" }}>
              <span>{modoConta === "cadastro" ? "Crie sua senha" : "Sua senha"}</span>
              <input type="password" required minLength={8} autoComplete={modoConta === "cadastro" ? "new-password" : "current-password"} style={input} value={contaSenha} onChange={(e) => setContaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </label>
          </div>
          <p className="mt-3 text-xs leading-5" style={{ color: "#405D49" }}>O cadastro e a publicação para análise são gratuitos. Enviaremos apenas avisos relacionados ao anúncio; nenhuma campanha paga será contratada automaticamente. Se for necessária confirmação por e-mail, volte a este navegador depois de confirmar para concluir o envio.</p>
        </div>}
      </div>
      {erro && <p role="alert" className="text-sm" style={{color:"#a6402b"}}>{erro}</p>}
      {mensagem && <div role="status" className="text-sm p-3 rounded-lg" style={{background:"#e4ead9",color:"#405331"}}><p>{mensagem}</p>{anuncioCriadoId && <a href={`/campanha-ave-perdida?anuncio=${anuncioCriadoId}`} className="inline-block mt-2 font-semibold underline" style={{color:"#405331"}}>Quero ampliar a divulgação da minha busca</a>}</div>}
      <button disabled={enviando || enviandoFoto || userId === undefined || aguardandoConfirmacao} className="rounded-lg py-3 font-semibold disabled:opacity-60" style={{background:"#C69A2E",color:"#2B1D14"}}>{enviando ? "Processando..." : edicaoId ? "Salvar e enviar para análise" : !userId ? (modoConta === "entrar" ? "Entrar e enviar anúncio" : "Criar conta e enviar anúncio") : "Enviar para análise"}</button>
      {aguardandoConfirmacao && !userId && <button type="button" onClick={() => { setModoConta("entrar"); setAguardandoConfirmacao(false); setMensagem("Depois de confirmar seu e-mail, entre na conta para concluir o envio do anúncio."); }} className="rounded-lg px-4 py-2 text-sm font-semibold" style={{background:"#e4ead9",color:"#405331"}}>Já confirmei o e-mail — entrar na conta</button>}
      {edicaoId && <button type="button" disabled={enviando || enviandoFoto} onClick={cancelarEdicao} className="rounded-lg py-2 text-sm font-semibold" style={{background:"#e3d3b4",color:"#2B1D14"}}>Cancelar edição</button>}
      <p className="text-xs" style={{color:"#8a7a63"}}>O anúncio será enviado para análise após a autenticação da conta. Toda alteração em anúncio publicado passará por nova análise.</p>
    </form>

    {userId && (
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-3" style={{color:"#F1E6D2"}}>Meus anúncios de aves perdidas</h2>
        {carregando ? <p style={{color:"#b09a78"}}>Carregando seus anúncios...</p> : anuncios.length === 0 ? <p style={{color:"#b09a78"}}>Você ainda não cadastrou nenhuma ave perdida.</p> : <div className="grid gap-3">
          {anuncios.map((anuncio) => {
            const dados = anuncio.data || {};
            const status = STATUS[anuncio.status] || STATUS.pendente;
            const faltando = [
              !dados.foto && "foto",
              !dados.bairro && "bairro",
              !dados.cor && "cor",
              !dados.caracteristicas && "características",
            ].filter(Boolean);
            return <article key={anuncio.id} className="rounded-lg p-3 flex gap-3 items-start" style={{background:"#FAF3E6",color:"#2B241C"}}>
              {dados.foto && <img src={dados.foto} alt="" className="w-20 h-20 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{dados.nomeAve || dados.especie}</div>
                <div className="text-xs mt-1">{dados.cidade}{dados.uf ? "/"+dados.uf : ""}</div>
                <span className="inline-block text-xs rounded px-2 py-1 mt-2" style={{background:status.fundo,color:status.cor}}>{status.label}</span>
                {anuncio.status !== "encerrado" && faltando.length > 0 && <p className="text-xs mt-2" style={{color:"#8a5a12"}}>Para ajudar na busca, complete: {faltando.join(", ")}.</p>}
                {anuncio.status !== "encerrado" && <button type="button" onClick={() => iniciarEdicao(anuncio)} className="block mt-3 rounded-lg px-3 py-2 text-sm font-semibold" style={{background:"#405331",color:"#fff"}}>Editar anúncio</button>}
              </div>
            </article>;
          })}
        </div>}
      </div>
    )}
  </section>;
}
