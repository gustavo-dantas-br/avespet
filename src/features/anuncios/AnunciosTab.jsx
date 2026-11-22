import React, { useState } from "react";
import { Trash2, Eye, MousePointerClick } from "lucide-react";
const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };
function NovoAnuncioForm({ ave, onSave, onCancel, Card, Field, inputStyle, emptyAnuncio }) {
  const [form, setForm] = useState({
    ...emptyAnuncio(),
    aveId: ave.id,
    nomeAve: ave.nome,
    especie: ave.especie,
    corMutacao: ave.corMutacao,
    sexo: ave.sexo,
    nascimento: ave.nascimento,
    foto: ave.foto,
  });
  const [error, setError] = useState("");
  const [aceite, setAceite] = useState(false);

  function submit() {
    if (!aceite) { setError("Confirme que leu as responsabilidades do anunciante antes de publicar."); return; }
    const result = onSave({ ...form, aceiteTermosClassificados: { versao: "classificados-2026-11-19", aceitoEm: new Date().toISOString() } });
    if (!result?.ok) setError(result?.error || "Nao consegui salvar.");
  }

  return (
    <Card className="p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
          {ave.foto ? <img src={ave.foto} className="w-full h-full object-cover" alt="" /> : null}
        </div>
        <div className="ui-sans font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <Field label="Preco (R$)">
          <input style={inputStyle} type="number" step="0.01" value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} />
        </Field>
        <Field label="Descricao">
          <input style={inputStyle} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="ex: dócil, já desmamado" />
        </Field>
      </div>
      <div className="ui-sans mb-3 rounded-xl border p-3 text-xs leading-5" style={{ background: "#FFF7E9", borderColor: "#E5C88D", color: "#543F21" }}>
        <strong className="block mb-1">Responsabilidade do anunciante</strong>
        Você negocia diretamente com o comprador. O Avespet apenas divulga o anúncio e não vende,
        não recebe pagamentos, não organiza entregas e não garante negociações. Informe apenas aves
        com origem e documentação legal, e mantenha as informações verdadeiras.
        <a href="/regras-anuncios" target="_blank" rel="noopener noreferrer" className="block mt-2 underline font-bold">Ler regras completas de anúncios</a>
      </div>
      <label className="ui-sans mb-3 flex items-start gap-2 text-sm" style={{ color: "#2B241C" }}>
        <input type="checkbox" className="mt-1" checked={aceite} onChange={(e) => { setAceite(e.target.checked); setError(""); }} />
        <span>Li e concordo com as regras dos anúncios e assumo responsabilidade pelas informações, procedência legal da ave e negociação direta com o comprador.</span>
      </label>
      {error && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} className="ui-sans text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>Publicar anuncio</button>
        <button onClick={onCancel} className="ui-sans text-sm px-4 py-2 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}



 function AnuncioCard({ anuncio, onToggleAtivo, onDelete, Card, money }) {
       const status = anuncio.status || "pendente";
  return (
    <Card className="p-3 flex items-center gap-3 ui-sans">
      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
        {anuncio.foto ? <img src={anuncio.foto} className="w-full h-full object-cover" alt="" /> : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{anuncio.nomeAve}</div>
        <div className="text-xs" style={{ color: "#8a7a63" }}>{anuncio.especie} - {anuncio.corMutacao || "sem mutacao"}</div>
        <div className="text-sm font-semibold" style={{ color: "#556b3f" }}>{money(anuncio.preco)}</div>
        <div className="flex gap-3 mt-1">
          <span className="text-[11px] ui-mono flex items-center gap-1" style={{ color: "#8a7a63" }}><Eye size={11} /> {anuncio.visualizacoes || 0}</span>
          <span className="text-[11px] ui-mono flex items-center gap-1" style={{ color: "#8a7a63" }}><MousePointerClick size={11} /> {anuncio.cliques || 0}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: STATUS_ANUNCIO_TONS[status], color: "#2B241C" }}>
          {STATUS_ANUNCIO_LABEL[status]}
        </span>
        <span className="text-[10px] px-2 py-1 rounded ui-mono" style={{ background: anuncio.ativo ? "#c8dcb8" : "#e3d3b4", color: "#2B241C" }}>
          {anuncio.ativo ? "NO AR" : "PAUSADO"}
        </span>
        <div className="flex gap-1">
          <button onClick={() => onToggleAtivo(anuncio)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>
            {anuncio.ativo ? "Pausar" : "Reativar"}
          </button>
          <button onClick={() => onDelete(anuncio.id)} className="text-xs px-2 py-1 rounded" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /></button>
        </div>
      </div>
    </Card>
  );
}

export default function AnunciosTab({ aves, anuncios, perfil, onSave, onToggleAtivo, onDelete, setTab, Card, Field, SectionTitle, inputStyle, emptyAnuncio, money }) {
  const [criandoParaId, setCriandoParaId] = useState(null);

  const avesAnunciaveis = aves.filter((a) => a.status === "A venda" && !anuncios.some((an) => an.aveId === a.id));
  const perfilIncompleto = perfil.autorizaWhatsappComercial !== true || !String(perfil.whatsappComercial || "").replace(/\D/g,"").match(/^(?:55)?[1-9][0-9]9?[0-9]{8}$/);

  return (
    <div>
      <SectionTitle>Anuncios</SectionTitle>

      {perfilIncompleto && (
        <div className="ui-sans mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          <span>Informe um WhatsApp comercial válido e autorize sua divulgação em Meu perfil antes de publicar. Seu telefone pessoal permanece privado.</span>
          <button onClick={() => setTab("perfil")} className="ui-sans px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0" style={{ background: "#2B1D14", color: "#F1E6D2" }}>Ir pro Perfil</button>
        </div>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>AVES DISPONIVEIS PRA ANUNCIAR</div>
      {avesAnunciaveis.length === 0 ? (
        <Card className="p-4 mb-6 ui-sans text-sm" style={{ color: "#8a7a63" }}>
          Nenhuma ave nova pra anunciar (marca uma ave como "A venda" no cadastro pra ela aparecer aqui).
        </Card>
      ) : (
        <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {avesAnunciaveis.map((a) =>
            criandoParaId === a.id ? (
              <div key={a.id} className="sm:col-span-2">
                <NovoAnuncioForm ave={a} onSave={(form) => { if (perfilIncompleto) return { ok: false, error: "Autorize seu WhatsApp comercial no perfil antes de publicar." }; const r = onSave(form); if (r?.ok) setCriandoParaId(null); return r; }} onCancel={() => setCriandoParaId(null)} Card={Card} Field={Field} inputStyle={inputStyle} emptyAnuncio={emptyAnuncio} />
              </div>
            ) : (
              <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                  {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
                  <div className="text-xs" style={{ color: "#8a7a63" }}>{a.especie}</div>
                </div>
                <button onClick={() => setCriandoParaId(a.id)} className="text-xs px-2 py-1 rounded font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>Anunciar</button>
              </Card>
            )
          )}
        </div>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#173D29" }}>MEUS ANUNCIOS ({anuncios.length})</div>
      {anuncios.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhum anuncio publicado ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {anuncios.map((an) => <AnuncioCard key={an.id} anuncio={an} onToggleAtivo={onToggleAtivo} onDelete={onDelete} Card={Card} money={money} />)}
        </div>
      )}
    </div>
  );
}

