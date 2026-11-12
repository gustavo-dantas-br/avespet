import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function MasterBootstrap() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordValid =
    password.length >= 12 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  async function resetMasterPassword(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!passwordValid) {
      setError("Use no mínimo 12 caracteres, com letras maiúsculas, minúsculas e números.");
      return;
    }
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!window.confirm("Atualizar a senha da conta Master gustavosvaio@gmail.com? A conta e as permissões serão preservadas.")) {
      return;
    }

    setLoading(true);
    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "master-reset-password",
        { body: { password } }
      );
      if (functionError) {
        let detail = data?.error || functionError.message;
        try {
          const context = functionError.context;
          if (context && typeof context.json === "function") {
            const body = await context.json();
            detail = body?.error || detail;
          }
        } catch {
          // Mantém a mensagem original do SDK.
        }
        throw new Error(detail || "Não foi possível atualizar a senha.");
      }
      if (!data?.success) {
        throw new Error(data?.error || "O servidor não confirmou a alteração.");
      }
      setPassword("");
      setConfirmation("");
      setMessage("Senha da conta Master atualizada. O usuário e a autorização Master foram preservados. Agora saia da conta Yahoo e entre com gustavosvaio@gmail.com.");
    } catch (e) {
      setError(e?.message || "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#2B1D14" }}>
      <section style={{ maxWidth: 520, width: "100%", padding: 28, borderRadius: 18, background: "#FAF3E6", color: "#2B241C" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#A27B2E" }}>AVESPET · ACESSO ADMINISTRATIVO</div>
        <h1 style={{ fontSize: 25, fontWeight: 800, marginTop: 12 }}>Redefinir senha da conta Master</h1>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
          Esta operação altera somente a senha do usuário existente <strong>gustavosvaio@gmail.com</strong>.
          O cadastro, o identificador e a permissão Master serão mantidos.
        </p>

        <form onSubmit={resetMasterPassword} style={{ marginTop: 22, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
            Nova senha
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={12}
              maxLength={128}
              required
              style={{ width: "100%", padding: 12, border: "1px solid #cbbd9f", borderRadius: 8, background: "#fffdf8", color: "#2B241C" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
            Confirmar nova senha
            <input
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              minLength={12}
              maxLength={128}
              required
              style={{ width: "100%", padding: 12, border: "1px solid #cbbd9f", borderRadius: 8, background: "#fffdf8", color: "#2B241C" }}
            />
          </label>
          <p style={{ fontSize: 12, color: "#806f58", margin: 0 }}>
            Requisitos: 12 caracteres ou mais, incluindo letras maiúsculas, minúsculas e números.
          </p>

          {message && <p role="status" style={{ padding: 12, background: "#e4ead9", color: "#405735", borderRadius: 8, fontSize: 13 }}>{message}</p>}
          {error && <p role="alert" style={{ padding: 12, background: "#f0dad4", color: "#8c3025", borderRadius: 8, fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !passwordValid || password !== confirmation}
            style={{ marginTop: 8, width: "100%", padding: 13, borderRadius: 9, background: "#2B1D14", color: "#FAF3E6", fontWeight: 700, opacity: loading || !passwordValid || password !== confirmation ? 0.55 : 1 }}
          >
            {loading ? "Atualizando senha…" : "Atualizar senha Master"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#806f58", marginTop: 18 }}>
          Acesso restrito à identidade administrativa Yahoo já autorizada. Esta tela é temporária; não compartilhe o endereço.
        </p>
      </section>
    </main>
  );
}
