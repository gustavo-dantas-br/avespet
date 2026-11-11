import React, { useState, useEffect } from "react";
import { Save } from "lucide-react";
const UF_LISTA = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function PerfilTab({ perfil, privado, email, onSave, onSavePrivado, onUpdateEmail, Card, Field, SectionTitle, inputStyle }) {
  const [form, setForm] = useState(perfil);
  const [endereco, setEndereco] = useState(privado);
  const [novoEmail, setNovoEmail] = useState(email || "");
  const [salvo, setSalvo] = useState(false);
  useEffect(() => setForm(perfil), [perfil]);
  useEffect(() => setEndereco(privado || {}), [privado]);
  useEffect(() => setNovoEmail(email || ""), [email]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    onSave({ ...form, email: novoEmail });
    onSavePrivado(endereco);
    if (novoEmail.trim() && novoEmail.trim() !== email) onUpdateEmail(novoEmail.trim());
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="max-w-xl">
      <SectionTitle>Perfil do Criador</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Nome do criatorio, cidade, UF e WhatsApp podem aparecer nos anuncios. Seu endereco completo e seu e-mail ficam privados.
      </p>
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome"><input style={inputStyle} value={form.nome || ""} onChange={set("nome")} /></Field>
          <Field label="Sobrenome"><input style={inputStyle} value={form.sobrenome || ""} onChange={set("sobrenome")} /></Field>
          <Field label="Nome do criatório"><input style={inputStyle} value={form.nomeCriatorio} onChange={set("nomeCriatorio")} placeholder="ex: Criatório Avespet" /></Field>
          <Field label="WhatsApp de contato"><input style={inputStyle} value={form.whatsapp} onChange={set("whatsapp")} placeholder="ex: (11) 99999-9999" /></Field>
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
        <div className="ui-sans text-sm font-semibold mb-3" style={{ color: "#2B241C" }}>Endereco completo (privado)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {["cep", "endereco", "numero", "complemento", "bairro", "cidade", "uf"].map((campo) => (
            <Field key={campo} label={campo === "uf" ? "UF do endereco" : campo[0].toUpperCase() + campo.slice(1)}>
              <input style={inputStyle} value={endereco[campo] || ""} onChange={(e) => setEndereco((p) => ({ ...p, [campo]: e.target.value }))} />
            </Field>
          ))}
        </div>
        {form.synced === false && <div className="ui-sans text-xs mb-3" style={{ color: "#a6402b" }}>Salvando no banco...</div>}
        {salvo && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>Perfil salvo.</div>}
        <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar perfil
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anuncios (Fase 8C)
// ---------------------------------------------------------------------------

