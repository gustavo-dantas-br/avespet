import React, { useState, useEffect } from "react";
import { Save, Mail } from "lucide-react";
import { supabase } from "../../supabaseClient";
const UF_LISTA = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function PerfilTab({ perfil, privado, email, onSave, onSavePrivado, onUpdateEmail, Card, Field, SectionTitle, inputStyle }) {
  const [form, setForm] = useState(perfil);
  const [endereco, setEndereco] = useState(privado);
  const [novoEmail, setNovoEmail] = useState(email || "");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [emailNews, setEmailNews] = useState(false);
  const [emailNewsLoading, setEmailNewsLoading] = useState(true);
  const [emailNewsSaving, setEmailNewsSaving] = useState(false);
  const [emailNewsFeedback, setEmailNewsFeedback] = useState("");
  useEffect(() => {
    let alive = true;
    setEmailNewsLoading(true);
    supabase.from("email_news_preferences").select("opted_in").maybeSingle().then(({data,error}) => {
      if (!alive) return;
      if (error) setEmailNewsFeedback("Não foi possível consultar suas preferências de e-mail.");
      else setEmailNews(Boolean(data?.opted_in));
      setEmailNewsLoading(false);
    }).catch(() => {
      if (alive) { setEmailNewsLoading(false); setEmailNewsFeedback("Não foi possível consultar suas preferências."); }
    });
    return () => { alive = false; };
  }, [email]);
  async function salvarNovidades() {
    if (emailNewsSaving || emailNewsLoading) return;
    setEmailNewsSaving(true);
    setEmailNewsFeedback("");
    try {
      const { data, error } = await supabase.rpc("set_email_news_opt_in", { wants_emails: emailNews });
      if (error || typeof data !== "boolean") throw new Error("Falha ao salvar preferência.");
      setEmailNewsFeedback(data ? "Inscrição confirmada! Você poderá cancelar quando quiser." : "Inscrição cancelada. Você não receberá dicas e novidades por e-mail.");
    } catch(err) {
      setEmailNewsFeedback(err?.message || "Não foi possível salvar a preferência.");
    } finally { setEmailNewsSaving(false); }
  }
  useEffect(() => setForm(perfil), [perfil]);
  useEffect(() => setEndereco(privado || {}), [privado]);
  useEffect(() => setNovoEmail(email || ""), [email]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function carregarLogo(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Escolha um arquivo de imagem."); return; }
    if (file.size > 8 * 1024 * 1024) { alert("A imagem deve ter no máximo 8 MB."); return; }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const escala = Math.min(1, 600 / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(img.width * escala));
            canvas.height = Math.max(1, Math.round(img.height * escala));
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setForm((f) => ({ ...f, logoUrl: dataUrl }));
    } catch { alert("Não foi possível carregar essa imagem. Tente outro arquivo."); }
  }

  async function submit() {
    if (salvando) return;
    setSalvando(true);
    setMensagem("");
    setErro("");
    try {
      await Promise.all([
        onSave({ ...form, email: novoEmail }),
        onSavePrivado(endereco),
      ]);
      let retorno = "Perfil e endereço salvos com sucesso.";
      const emailSolicitado = novoEmail.trim();
      if (emailSolicitado && emailSolicitado !== email) {
        const respostaEmail = await onUpdateEmail(emailSolicitado);
        if (respostaEmail) retorno += " " + respostaEmail;
      }
      setMensagem(retorno);
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar o perfil. Confira a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-xl">
      <SectionTitle>Perfil do Criador</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#334155" }}>
        Nome do criatório, cidade, UF e logo podem aparecer nos anúncios. Seu telefone pessoal, endereço e e-mail ficam privados. O WhatsApp comercial só será divulgado com sua autorização.
      </p>
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome"><input style={inputStyle} value={form.nome || ""} onChange={set("nome")} /></Field>
          <Field label="Sobrenome"><input style={inputStyle} value={form.sobrenome || ""} onChange={set("sobrenome")} /></Field>
          <Field label="Nome do criatório"><input style={inputStyle} value={form.nomeCriatorio} onChange={set("nomeCriatorio")} placeholder="ex: Criatório Avespet" /></Field>
          <Field label="Telefone pessoal (privado)"><input type="tel" autoComplete="tel" style={inputStyle} value={form.whatsapp || ""} onChange={set("whatsapp")} placeholder="ex: (11) 99999-9999" /></Field>
          <Field label="WhatsApp comercial (opcional)"><input type="tel" style={inputStyle} value={form.whatsappComercial || ""} onChange={e => setForm(f => ({ ...f, whatsappComercial: e.target.value, autorizaWhatsappComercial: false }))} placeholder="Número para compradores" /></Field>
          <label className="sm:col-span-2 flex items-start gap-2 rounded-lg border p-3 text-sm" style={{ borderColor: "#D7E4DA", color: "#294D39" }}>
            <input type="checkbox" className="mt-1" checked={form.autorizaWhatsappComercial === true} disabled={!String(form.whatsappComercial || "").replace(/\D/g,"").match(/^(?:55)?[1-9][0-9]9?[0-9]{8}$/)} onChange={e=>setForm(f=>({...f,autorizaWhatsappComercial:e.target.checked}))}/>
            <span>Autorizo a divulgação deste WhatsApp comercial nos meus anúncios ativos e aprovados. Compradores poderão entrar em contato diretamente comigo. Posso revogar esta autorização a qualquer momento, salvando o perfil.</span>
          </label>
          <Field label="Cidade"><input style={inputStyle} value={form.cidade} onChange={set("cidade")} placeholder="ex: Barueri" /></Field>
          <Field label="E-mail da conta (privado)"><input style={inputStyle} type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} /></Field>
          <Field label="UF">
            <select style={inputStyle} value={form.uf} onChange={set("uf")}>
              <option value="">--</option>
              {UF_LISTA.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-sans text-sm font-semibold mb-2" style={{ color: "#2B241C" }}>Logo do criatório</div>
        <p className="ui-sans text-xs mb-3" style={{ color: "#756B5E" }}>Essa imagem será usada no comprovante de reserva para identificar seu criatório.</p>
        <div className="flex flex-wrap items-center gap-4 mb-5">
          {form.logoUrl ? <img src={form.logoUrl} alt="Logo do criatório" className="h-20 w-20 rounded-xl border object-contain p-1" style={{ borderColor: "#e3d3b4", background: "#fff" }} /> : <div className="h-20 w-20 rounded-xl border flex items-center justify-center text-xs text-center px-2" style={{ borderColor: "#e3d3b4", color: "#8b806f" }}>Sem logo</div>}
          <div className="flex flex-wrap gap-2">
            <label className="ui-sans cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: "#e4ead9", color: "#405a35" }}>Escolher imagem<input type="file" accept="image/*" className="hidden" onChange={e => { carregarLogo(e.target.files?.[0]); e.target.value = ""; }} /></label>
            {form.logoUrl && <button type="button" onClick={() => setForm(f => ({ ...f, logoUrl: "" }))} className="ui-sans rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "#e3d3b4", color: "#8b4b3c" }}>Remover logo</button>}
          </div>
        </div>
        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-sans text-sm font-semibold mb-3" style={{ color: "#2B241C" }}>Endereco completo (privado)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {["cep", "endereco", "numero", "complemento", "bairro", "cidade", "uf"].map((campo) => (
            <Field key={campo} label={campo === "uf" ? "UF do endereco" : campo[0].toUpperCase() + campo.slice(1)}>
              <input style={inputStyle} value={endereco[campo] || ""} onChange={(e) => setEndereco((p) => ({ ...p, [campo]: e.target.value }))} />
            </Field>
          ))}
        </div>
        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: "#2B241C" }}><Mail size={17} /> Novidades e dicas do Avespet</div>
        <p className="ui-sans mb-3 text-xs leading-5" style={{ color: "#756B5E" }}>Receba conteúdo educativo sobre suas espécies e avisos de novidades do Avespet. Caso fique mais de 5 dias sem acessar, podemos enviar um lembrete útil. No máximo um e-mail por período de inatividade e respeitando intervalo mínimo de 30 dias. Cadastro opcional, sem cobrança.</p>
        <label className="ui-sans flex items-start gap-3 rounded-lg border p-3 text-sm" style={{ borderColor: "#e3d3b4", color: "#2B241C" }}>
          <input type="checkbox" checked={emailNews} disabled={emailNewsLoading || emailNewsSaving} onChange={e=>{setEmailNews(e.target.checked);setEmailNewsFeedback("");}} className="mt-1 h-4 w-4" />
          <span>Quero receber dicas, cuidados com minhas aves e novidades por e-mail. Posso cancelar a qualquer momento.</span>
        </label>
        <button type="button" onClick={salvarNovidades} disabled={emailNewsLoading || emailNewsSaving}
          className="ui-sans mt-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: "#405a35", color: "#fff" }}>
          {emailNewsSaving ? "Salvando..." : emailNewsLoading ? "Carregando..." : "Salvar preferência de e-mails"}
        </button>
        {emailNewsFeedback && <p role="status" className="ui-sans mt-2 text-xs" style={{ color: "#405a35" }}>{emailNewsFeedback}</p>}
        {form.synced === false && <div className="ui-sans text-xs mb-3" style={{ color: "#a6402b" }}>Salvando no banco...</div>}
        {mensagem && <div role="status" className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>{mensagem}</div>}
        {erro && <div role="alert" className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f5dfda", color: "#8b3d30" }}>{erro}</div>}
        <button onClick={submit} disabled={salvando} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> {salvando ? "Salvando..." : "Salvar perfil"}
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anuncios (Fase 8C)
// ---------------------------------------------------------------------------

