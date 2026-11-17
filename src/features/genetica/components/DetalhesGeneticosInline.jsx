import React from "react";
import { normalizarChaveGenetica } from "../data/catalogoRingNeck";

const estilo = { border: "1px solid #d8c6a5", background: "#fffaf0", color: "#2B241C" };
const chave = (nome) => normalizarChaveGenetica(String(nome || "").split(" (")[0]);
const fatoresOuCores = /^(green|verde|blue|azul|turquoise|turquesa|violet|violeta|dark factor|fator escuro|cobalto|cobalt|mauve|malva)$/;

/**
 * Os detalhes de SF/DF, portadores e mutações visuais ficam logo após
 * a cor principal, no mesmo painel do pai ou da mãe.
 * Aqui só são coletados dados; o cálculo continua a cargo do motor genético.
 */
export default function DetalhesGeneticosInline({ ave, setAve, mutacoes, ehPai }) {
  if (!ave.corBase && !ave.corMutacao && !ave.corLivre && !ave.aparenciaOutra) return null;

  const corVerde = ["green", "verde"].includes(chave(ave.corBase));
  const portadores = [
    ...(corVerde ? [
      { nome: "Blue", label: "Blue (Azul)" },
      { nome: "Turquoise", label: "Turquoise (Turquesa)" },
    ] : []),
    ...mutacoes
      .filter((m) => m.permitePortador !== false && !fatoresOuCores.test(chave(m.nome)))
      .filter((m) => {
        const heranca = normalizarChaveGenetica(m.tipoHeranca);
        return heranca.includes("recessiva") && (ehPai || !heranca.includes("ligada ao sexo"));
      })
      .map((m) => ({ nome: m.nome, label: m.nome })),
  ].filter((m, i, todas) => todas.findIndex((x) => chave(x.nome) === chave(m.nome)) === i)
    .filter((m) => chave(m.nome) !== chave(ave.corMutacao))
    .filter((m) => !(ave.mutacoesVisuais || []).some((n) => chave(n) === chave(m.nome)));

  const visuais = mutacoes
    .filter((m) => m.categoria !== "cor_base" && !fatoresOuCores.test(chave(m.nome)))
    .filter((m) => chave(m.nome) !== chave(ave.corMutacao));
  const carrega = (nome) => (ave.portadores || []).some((n) => chave(n) === chave(nome));
  const visual = (nome) => (ave.mutacoesVisuais || []).some((n) => chave(n) === chave(nome));

  function alternarPortador(nome, selecionado) {
    setAve((atual) => {
      let lista = (atual.portadores || []).filter((n) => chave(n) !== chave(nome));
      if (selecionado) {
        // Os alelos Blue e Turquoise competem no mesmo locus parblue.
        if (["blue", "turquoise"].includes(chave(nome))) {
          lista = lista.filter((n) => !["blue", "turquoise"].includes(chave(n)));
        }
        lista.push(nome);
      }
      return { ...atual, portadores: lista };
    });
  }

  function alternarVisual(nome, selecionado) {
    setAve((atual) => ({
      ...atual,
      mutacoesVisuais: selecionado
        ? [...(atual.mutacoesVisuais || []).filter((n) => chave(n) !== chave(nome)), nome]
        : (atual.mutacoesVisuais || []).filter((n) => chave(n) !== chave(nome)),
      portadores: selecionado
        ? (atual.portadores || []).filter((n) => chave(n) !== chave(nome))
        : atual.portadores || [],
    }));
  }

  function mudarDark(valor) {
    setAve((atual) => ({
      ...atual,
      // Cobalto é a apresentação azul do Dark SF; Mauve é Dark DF.
      corMutacao: ["Cobalto", "Mauve"].includes(atual.corMutacao) && ["SF", "DF"].includes(valor)
        ? (valor === "DF" ? "Mauve" : "Cobalto")
        : atual.corMutacao,
      fatoresGeneticos: { ...(atual.fatoresGeneticos || {}), darkFactor: valor },
    }));
  }

  const ehVioleta = ave.corMutacao === "Violeta";
  const darkPuro = ["Cobalto", "Mauve"].includes(ave.corMutacao);
  return (
    <div className="rounded-xl p-3 space-y-4" style={{ background: "#fffaf0", border: "1px solid #d8c6a5" }}>
      <div>
        <p className="font-semibold text-sm" style={{ color: "#2B241C" }}>Completar genética (opcional)</p>
        <p className="text-xs mt-1" style={{ color: "#6f6254" }}>
          Fatores, portadores e outras mutações podem ser informados aqui mesmo.
          Se não souber, mantenha o padrão da cor selecionada.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm" style={{ color: "#5e5143" }}>
          Violet Factor (Fator violeta)
          <select className="w-full rounded-xl px-3 py-2 mt-1" style={estilo}
            value={ave.fatoresGeneticos?.violetFactor || ""}
            onChange={(e) => setAve((atual) => ({
              ...atual,
              fatoresGeneticos: { ...(atual.fatoresGeneticos || {}), violetFactor: e.target.value },
            }))}>
            <option value="">{ehVioleta ? "SF — padrão Violeta" : "Padrão da cor"}</option>
            {!ehVioleta && <option value="NONE">Sem fator — confirmado</option>}
            <option value="SF">SF — Fator simples</option>
            <option value="DF">DF — Duplo fator</option>
          </select>
        </label>
        <label className="text-sm" style={{ color: "#5e5143" }}>
          Dark Factor (Fator escuro)
          <select className="w-full rounded-xl px-3 py-2 mt-1" style={estilo}
            value={ave.fatoresGeneticos?.darkFactor || ""}
            onChange={(e) => mudarDark(e.target.value)}>
            <option value="">{ave.corMutacao === "Cobalto" ? "SF — padrão Cobalto" :
              ave.corMutacao === "Mauve" ? "DF — padrão Mauve" : "Padrão da cor"}</option>
            {!darkPuro && <option value="NONE">Sem fator — confirmado</option>}
            <option value="SF">SF — Fator simples</option>
            <option value="DF">DF — Duplo fator</option>
          </select>
        </label>
      </div>
      {ehVioleta && (
        <p className="text-xs rounded-lg p-2" style={{ background: "#e8f1e5", color: "#40613a" }}>
          Violeta simples = Blue (Azul) com fator Violet SF. Para Violeta DF, escolha DF acima.
        </p>
      )}
      <div>
        <p className="font-semibold text-sm" style={{ color: "#5e5143" }}>Portador de (se souber)</p>
        <p className="text-xs mt-1 mb-2" style={{ color: "#8a7a63" }}>
          Marque o que a ave carrega sem mostrar. Pode selecionar vários genes.
          SF/DF é dosagem de fator, não é ser portador.
        </p>
        {portadores.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 max-h-44 overflow-y-auto rounded-lg p-2"
            style={{ border: "1px solid #dfcba7" }}>
            {portadores.map((m) => (
              <label key={m.nome} className="flex items-start gap-2 py-1 text-sm" style={{ color: "#4f4336" }}>
                <input type="checkbox" className="mt-1" checked={carrega(m.nome)}
                  onChange={(e) => alternarPortador(m.nome, e.target.checked)} />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        ) : <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>Nenhum portador aplicável à seleção atual.</p>}
        {!ehPai && <p className="text-xs mt-1" style={{ color: "#8a7a63" }}>
          Nas mutações recessivas ligadas ao sexo, fêmeas não são portadoras ocultas.
        </p>}
      </div>
      <details className="rounded-lg p-3" style={{ background: "#f5e9c8" }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "#5e5143" }}>
          Outras mutações visuais (opcional)
          {(ave.mutacoesVisuais || []).length > 0 &&
            " · " + (ave.mutacoesVisuais || []).length + " selecionada(s)"}
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 max-h-44 overflow-y-auto">
          {visuais.map((m) => (
            <label key={m.id || m.nome} className="flex gap-2 items-start text-sm" style={{ color: "#4f4336" }}>
              <input type="checkbox" className="mt-1" checked={visual(m.nome)}
                onChange={(e) => alternarVisual(m.nome, e.target.checked)} />
              <span>{m.nome}</span>
            </label>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: "#8a7a63" }}>
          Mutações com regras ainda não validadas podem ser informadas, mas não entram no cálculo.
        </p>
      </details>
      <details className="rounded-lg p-3" style={{ background: "#f5e9c8" }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "#5e5143" }}>
          Informações técnicas (opcional)
        </summary>
        <div className="space-y-3 mt-3">
          <label className="block text-sm" style={{ color: "#5e5143" }}>
            Genótipo da série de cor (se confirmado)
            <select className="w-full rounded-xl px-3 py-2 mt-1" style={estilo}
              value={ave.serieCorGenotipo || ""}
              onChange={(e) => setAve((atual) => ({ ...atual, serieCorGenotipo: e.target.value }))}>
              <option value="">Não informado</option>
              <option value="G/G">G/G — Verde</option>
              <option value="G/T">G/T — Verde portador de Turquesa</option>
              <option value="G/B">G/B — Verde portador de Azul</option>
              <option value="T/T">T/T — Turquesa</option>
              <option value="T/B">T/B — Azul-turquesa</option>
              <option value="B/B">B/B — Azul</option>
            </select>
          </label>
          <label className="block text-sm" style={{ color: "#5e5143" }}>
            Portadores não listados (digite os nomes, separados por vírgula)
            <input className="w-full rounded-xl px-3 py-2 mt-1" style={estilo}
              value={(ave.portadores || []).join(", ")}
              onChange={(e) => setAve((atual) => ({
                ...atual,
                portadores: e.target.value.split(",").map((n) => n.trim()).filter(Boolean),
              }))} />
          </label>
        </div>
      </details>
    </div>
  );
}
