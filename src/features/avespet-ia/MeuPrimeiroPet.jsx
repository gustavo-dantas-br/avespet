import React, { useState } from "react";
import { ESPECIES_INICIAIS, FASES, validarPerfil } from "./motorEducativo";
import { responderComBiblioteca } from "./respostasComFontes";
import DiarioFilhote from "./DiarioFilhote";
import FontesEducativas from "./FontesEducativas";

// Tela independente, sem escrita no Supabase até aprovação do schema/RLS.
// O estado é transitório: fechar ou recarregar descarta os dados.
const inicial = { nivel: "iniciante", especie: "Ring Neck", fase: "incerta", idadeDias: "" };
const campo = "w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-stone-900";

export default function MeuPrimeiroPet({ aves = [], userId = "" }) {
  const [perfil, setPerfil] = useState(inicial);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState("");
  const [aveId, setAveId] = useState("");
  const aveSelecionada = aves.find((ave) => String(ave.id) === aveId) || null;
  const atualizar = (chave, valor) => {
    setPerfil((atual) => ({ ...atual, [chave]: valor }));
    setResposta(null);
    setErro("");
  };
  const consultar = (event) => {
    event.preventDefault();
    const validacao = validarPerfil(perfil);
    if (validacao) { setErro(validacao); return; }
    setErro("");
    setResposta(responderComBiblioteca(perfil, pergunta));
  };
  return (
    <section className="mx-auto max-w-6xl space-y-5 rounded-2xl bg-emerald-50 p-5 text-stone-900">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Avespet IA · Versão educativa</p>
        <h1 className="text-2xl font-bold">Avespet IA — Meu Primeiro Pet</h1>
        <p className="mt-2 text-sm">Conheça a fase da sua ave e organize dúvidas de manejo. Esta versão funciona sem inteligência artificial externa.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {["Meu Primeiro Pet", "Desenvolvimento", "Guias educativos"].map((rotulo, indice) => <div key={rotulo} className="rounded-xl border border-emerald-100 bg-white p-4"><p className="text-sm font-bold text-emerald-900">{rotulo}</p><p className="mt-1 text-xs text-stone-600">{["Apresente sua ave e tire dúvidas", "Registre evolução e observações", "Conteúdos revisados antes da publicação"][indice]}</p></div>)}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <form onSubmit={consultar} className="space-y-4 rounded-xl bg-white p-4">
        <label className="block text-sm font-medium">Experiência
          <select className={campo} value={perfil.nivel} onChange={(e) => atualizar("nivel", e.target.value)}>
            <option value="iniciante">Minha primeira ave</option>
            <option value="intermediario">Já tenho experiência</option>
            <option value="experiente">Sou criador experiente</option>
          </select>
        </label>
        <label className="block text-sm font-medium">Espécie
          <select className={campo} value={perfil.especie} onChange={(e) => atualizar("especie", e.target.value)}>
            {ESPECIES_INICIAIS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Fase de desenvolvimento
          <select className={campo} value={perfil.fase} onChange={(e) => atualizar("fase", e.target.value)}>
            {FASES.map((fase) => <option key={fase.id} value={fase.id}>{fase.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">Idade em dias (opcional)
          <input className={campo} type="number" min="0" max="30000" step="1" value={perfil.idadeDias} onChange={(e) => atualizar("idadeDias", e.target.value)} placeholder="Ex.: 45" />
        </label>
        <label className="block text-sm font-medium">O que você gostaria de saber?
          <textarea className={campo} maxLength={2000} rows={3} value={pergunta} onChange={(e) => setPergunta(e.target.value)} placeholder="Conte uma dúvida ou alteração observada" />
        </label>
        {erro && <p role="alert" className="text-sm font-medium text-red-700">{erro}</p>}
        <button type="submit" className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Consultar biblioteca educativa</button>
      </form>
      {resposta && <article role="status" aria-live="polite" className={`space-y-3 rounded-xl border p-4 ${resposta.tipo === "urgente" ? "border-red-400 bg-red-50" : resposta.tipo === "atencao" ? "border-amber-400 bg-amber-50" : "border-emerald-200 bg-white"}`}>
        <h2 className="text-lg font-bold">{resposta.titulo}</h2>
        <p className="text-sm leading-relaxed">{resposta.mensagem}</p>
        {resposta.fontes?.length > 0 && <div className="border-t pt-3 text-xs"><p className="font-semibold">Fontes do guia</p>{resposta.fontes.map((f, i) => <a key={f.url + i} href={f.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-words text-emerald-800 underline">{f.titulo}</a>)}</div>}
        <p className="border-t pt-3 text-xs text-stone-600">{resposta.aviso}</p>
      </article>}
      <div className="space-y-4">
        {aves.length > 0 && <label className="block text-sm font-medium">Consultar ave do meu plantel (somente leitura)
          <select className={campo} value={aveId} onChange={(e) => setAveId(e.target.value)}>
            <option value="">Usar cadastro de demonstração</option>
            {aves.map((ave) => <option key={ave.id} value={String(ave.id)}>{ave.nome || ave.anilha || "Ave sem nome"} · {ave.especie || "Espécie não informada"}</option>)}
          </select>
        </label>}
        <DiarioFilhote key={aveId || "demonstracao"} aveNome={aveSelecionada?.nome || "Minha ave"} aveId={aveSelecionada?.id || ""} userId={userId} />
      </div>
      </div>
      <FontesEducativas />
      <p className="text-xs text-stone-600">Protótipo em desenvolvimento: não salva dados, não envia perguntas para serviços externos e não substitui um veterinário especializado em aves.</p>
    </section>
  );
}
