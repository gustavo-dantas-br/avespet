import React, { useEffect, useMemo, useState } from "react";
import { calcularCruzamentoGenetico } from "../utils/calcularCruzamentoGenetico";
import { CATALOGO_MUTACOES_RING_NECK, normalizarChaveGenetica } from "../data/catalogoRingNeck";
import DetalhesGeneticosInline from "./DetalhesGeneticosInline";
import { genotipoSerieDaAve, cruzarSerieCor, dosagemFatorDaAve, cruzarDosagemFator, nomeFenotipoComFatoresRingNeck, descricaoGenotipoSerie, APARENCIAS_PADRAO_RING_NECK, cruzarAparenciasPadraoRingNeck } from "../utils/serieCorRingNeck";

const campo = {
  border: "1px solid #d8c6a5",
  background: "#fffaf0",
  color: "#2B241C",
};

const CORES_BASE = [
  { value: "Green (Verde)", label: "Verde" },
  { value: "Blue (Azul)", label: "Azul" },
  { value: "Turquoise (Turquesa)", label: "Turquesa" },
  { value: "Turquoise Blue (Azul Turquesa)", label: "Azul turquesa" },
];

function novaAve(nome) {
  return {
    nome,
    corMutacao: "",
    corBase: "",
    mutacoesVisuais: [],
    portadores: [],
    fatoresGeneticos: { darkFactor: "", violetFactor: "" },
  };
}

export default function CalculadoraGenetica({ aves, mutacoes }) {
  const [modoPai, setModoPai] = useState("manual");
  const [modoMae, setModoMae] = useState("manual");
  const [paiId, setPaiId] = useState("");
  const [maeId, setMaeId] = useState("");
  const [paiManual, setPaiManual] = useState(novaAve("Pai"));
  const [maeManual, setMaeManual] = useState(novaAve("Mãe"));
  const [resultado, setResultado] = useState(null);
  const [cenarioSelecionado, setCenarioSelecionado] = useState("");

  const machos = useMemo(() => aves.filter((a) => a.sexo === "Macho"), [aves]);
  const femeas = useMemo(() => aves.filter((a) => a.sexo === "Femea"), [aves]);
  const pai = modoPai === "cadastro" ? aves.find((a) => a.id === paiId) : { ...paiManual, sexo: "Macho" };
  const mae = modoMae === "cadastro" ? aves.find((a) => a.id === maeId) : { ...maeManual, sexo: "Femea" };
  // O mesmo catálogo está disponível no Plantel e no preenchimento manual
  // da calculadora, mesmo antes de ser importado pelo criador.
  // Registros próprios do Banco de Genética prevalecem quando já cadastrados.
  const mutacoesRingNeck = useMemo(() => {
    const map = new Map();
    const codigo = (nome) => normalizarChaveGenetica(String(nome || "").split(" (")[0]);
    CATALOGO_MUTACOES_RING_NECK.forEach((m) => map.set(codigo(m.nome), m));
    mutacoes.filter((m) => (!m.especie || m.especie === "Ring Neck") && m.categoria !== "cor_base")
      .forEach((m) => map.set(codigo(m.nome), m));
    return [...map.values()];
  }, [mutacoes]);

  function atualizarManual(setManual, campoNome, valor) {
    setManual((atual) => ({ ...atual, [campoNome]: valor }));
    setResultado(null);
  }

  function calcular() {
    setCenarioSelecionado("");
    if (!pai || !mae || (modoPai === "cadastro" && !paiId) || (modoMae === "cadastro" && !maeId)) {
      setResultado({ tipo: "erro", mensagem: "Escolha uma ave para o pai e outra para a mãe." });
      return;
    }
    const paiParaCalculo = { ...pai, corMutacao: pai.corMutacao || pai.corLivre || "" };
    const maeParaCalculo = { ...mae, corMutacao: mae.corMutacao || mae.corLivre || "" };
    const padrao = cruzarAparenciasPadraoRingNeck(paiParaCalculo, maeParaCalculo);
    if (padrao) {
      setResultado({ tipo: "padrao", cruzamento: (pai.nome || "Pai") + " × " + (mae.nome || "Mãe"), ...padrao });
      return;
    }
    // Série parblue e fatores Dark/Violet são calculados em módulos próprios.
    // Não devem entrar novamente como mutações autossômicas genéricas.
    const mutacoesDoMotor = mutacoesRingNeck.filter((m) => {
      // Série de cor e fatores são calculados exclusivamente pelo módulo
      // Ring Neck, nunca como mutações genéricas (inclusive registros duplicados).
      const normalizar = (valor) => String(valor || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
      const nomes = [m.nome, m.nomeAlternativo, m.key, m.chave, m.gene]
        .map(normalizar).filter(Boolean);
      const especial = nomes.some((nome) =>
        /(?:^|[^a-z])(azul|blue|turquesa|turquoise|cobalto|cobalt|mauve|malva|violeta|violet)(?:$|[^a-z])/.test(nome) ||
        nome.includes("dark factor") || nome.includes("violet factor")
      );
      return !especial;
    });
    const calc = calcularCruzamentoGenetico(paiParaCalculo, maeParaCalculo, mutacoesDoMotor);
    const genotipoPai = genotipoSerieDaAve(paiParaCalculo);
    const genotipoMae = genotipoSerieDaAve(maeParaCalculo);
    const serieCor = genotipoPai && genotipoMae ? cruzarSerieCor(genotipoPai, genotipoMae) : null;
    // Quando a série de cor está escondida por Ino (Lutino/Albino), mostrar
    // cenários condicionais possíveis sem atribuir probabilidades inventadas.
    const genotiposDaAparencia = (ave) => {
      const texto = [ave.corAparencia, ave.corMutacao, ...(ave.mutacoesVisuais || []), ave.corBase]
        .filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      // Ino mascara a série parblue; não é possível deduzir a cor-base pela aparência Lutino/Albino.
      if (texto.includes("ino") || texto.includes("lutino") || texto.includes("albino")) {
        return ["G/G", "G/T", "G/B", "T/T", "T/B", "B/B"];
      }
      if (texto.includes("turquoise blue") || texto.includes("azul turquesa")) return ["T/B"];
      if (texto.includes("turquoise") || texto.includes("turquesa")) return ["T/T", "T/B"];
      if (texto.includes("blue") || texto.includes("azul")) return ["B/B"];
      if (texto.includes("green") || texto.includes("verde")) return ["G/G", "G/T", "G/B"];
      return [];
    };
    const genotiposPossiveisMae = genotiposDaAparencia(maeParaCalculo);
    const genotiposPossiveisPai = genotiposDaAparencia(paiParaCalculo);
    const cenariosSerieCor = genotipoPai && !genotipoMae
      ? genotiposPossiveisMae.map((genotipoMaePossivel) => ({
          genotipoMae: genotipoMaePossivel,
          resultados: cruzarSerieCor(genotipoPai, genotipoMaePossivel.split("/")),
        }))
      : !genotipoPai && genotipoMae
        ? genotiposPossiveisPai.map((genotipoPaiPossivel) => ({
            genotipoPai: genotipoPaiPossivel,
            resultados: cruzarSerieCor(genotipoPaiPossivel.split("/"), genotipoMae),
          }))
        : [];
    const fatores = ["darkFactor", "violetFactor"].map((chave) => {
      const nome = chave === "darkFactor" ? "Dark Factor (Fator escuro)" : "Violet Factor (Fator violeta)";
      const dosePai = dosagemFatorDaAve(paiParaCalculo, chave);
      const doseMae = dosagemFatorDaAve(maeParaCalculo, chave);
      return { nome, resultados: cruzarDosagemFator(dosePai, doseMae, nome), conhecido: dosePai !== null && doseMae !== null };
    });
    // Não apresentar apenas portadores ou 100% de cada sexo como resultado
    // completo quando a série de cor dos pais ainda é desconhecida.
    const cruzamentoVioletaSemBase = [paiParaCalculo, maeParaCalculo].some((ave) => {
      const texto = [ave.corMutacao, ave.corAparencia, ave.corLivre]
        .filter(Boolean).join(" ").toLowerCase();
      return /violeta|violet/.test(texto) && !genotipoSerieDaAve(ave);
    });
    if (cruzamentoVioletaSemBase && !serieCor) {
      const violetaPai = /violeta|violet/i.test([paiParaCalculo.corMutacao, paiParaCalculo.corAparencia, paiParaCalculo.corLivre].filter(Boolean).join(" "));
      const aveVioleta = violetaPai ? paiParaCalculo : maeParaCalculo;
      const outraAve = violetaPai ? maeParaCalculo : paiParaCalculo;
      const outraSerie = genotipoSerieDaAve(outraAve);
      const cenarios = outraSerie
        ? ["G/G", "G/T", "G/B", "T/T", "T/B", "B/B"].map((genotipo) => ({
            genotipo,
            resultados: violetaPai
              ? cruzarSerieCor(genotipo.split("/"), outraSerie)
              : cruzarSerieCor(outraSerie, genotipo.split("/")),
          }))
        : [];
      setResultado({
        tipo: "condicional",
        cruzamento: `${pai.nome || "Pai"} × ${mae.nome || "Mãe"}`,
        cenarios,
        violetaPai,
        fatorVioleta: dosagemFatorDaAve(aveVioleta, "violetFactor"),
        fatorOutro: dosagemFatorDaAve(outraAve, "violetFactor"),
        serieOutraConhecida: Boolean(outraSerie),
        outraSerieAzul: outraSerie?.every((alelo) => alelo === "B") || false,
        coresPossiveis: [...new Set(cenarios.flatMap((cenario) =>
          cenario.resultados.map((item) => item.nome)
        ))],
      });
      return;
    }
    if (calc.semLociRelevantes && !serieCor && !cenariosSerieCor.length && !fatores.some((f) => f.conhecido && f.resultados.length)) {
      const detalhes = [
        calc.bloqueadas?.length ? "Ainda estamos validando: " + calc.bloqueadas.join(", ") + "." : "",
        calc.naoDefinidos?.length ? "A regra genética ainda não está pronta para: " + calc.naoDefinidos.join(", ") + "." : "",
      ].filter(Boolean).join(" ");
      setResultado({
        tipo: "erro",
        mensagem: "Ainda não conseguimos calcular esse cruzamento com segurança. " + detalhes + " Você pode cadastrar as informações, mas elas não entram no cálculo até a regra ser validada.",
      });
      return;
    }
    // Combina série e fatores apenas quando não há ligação genética conhecida
    // que torne a multiplicação simples de percentuais inadequada.
    const serieParaFenotipo = serieCor || [];
    const dark = fatores.find((f) => f.nome.startsWith("Dark Factor"));
    const violet = fatores.find((f) => f.nome.startsWith("Violet Factor"));
    const darkConhecido = Boolean(dark?.resultados?.length);
    const violetConhecido = Boolean(violet?.resultados?.length);
    const resultadosDark = darkConhecido ? dark.resultados : [{ dosagem: null, percentual: 100 }];
    const resultadosViolet = violetConhecido ? violet.resultados : [{ dosagem: null, percentual: 100 }];
    // Dark e azul/parblue apresentam ligação física no mesmo cromossomo.
    // Sem fase/haplótipo dos pais, não multiplicar esses percentuais como loci independentes.
    const darkSegregando = darkConhecido && dark.resultados.some((item) => item.dosagem > 0);
    const combinacaoDarkSeriePendente = darkSegregando && serieParaFenotipo.length > 0;
    const fenotiposCombinados = serieParaFenotipo.length && !combinacaoDarkSeriePendente
      ? serieParaFenotipo.flatMap((cor) =>
          resultadosDark.flatMap((fatorDark) =>
            resultadosViolet.map((fatorViolet) => {
              const nomeBase = nomeFenotipoComFatoresRingNeck(
                cor.genotipo,
                fatorDark.dosagem,
                fatorViolet.dosagem
              );
              const pendencias = [
                !darkConhecido ? "Dark não determinado" : "",
                !violetConhecido ? "Violet não determinado" : "",
              ].filter(Boolean);
              return {
                nome: pendencias.length ? `${nomeBase} (${pendencias.join("; ")})` : nomeBase,
                percentual: cor.percentual * fatorDark.percentual * fatorViolet.percentual / 10000,
              };
            })
          )
        ).filter((item) => item.percentual > 0)
      : [];

    const possibilidades = (calc.resultadoFinal || []).map((r) => {
      // O motor retorna percentual sobre todos os filhotes (inclui 50% de cada sexo).
      // Exibir também a chance dentro do sexo evita confundir 50% total com 100% dos machos.
      const percentualTotal = r.percentual;
      const percentualNoSexo = percentualTotal / 50 * 100;
      const fmt = (n) => `${n.toFixed(1).replace(/\.0$/, "")}%`;
      return {
        nome: r.descricao,
        percentual: `${fmt(percentualNoSexo)} dos ${r.sexo === "Macho" ? "machos" : "fêmeas"}`,
        detalhe: `${fmt(percentualTotal)} do total de filhotes`,
      };
    });
    const observacoes = [
      "O resultado é uma estimativa genética, não uma garantia do que vai nascer.",
      calc.bloqueadas?.length ? `Não incluídas porque ainda estão em validação: ${calc.bloqueadas.join(", ")}.` : "",
      calc.naoDefinidos?.filter((nome) => !/violet|violeta|dark factor|fator escuro|fator violeta/i.test(nome)).length
        ? `Não calculadas porque a regra ainda está em estudo: ${calc.naoDefinidos.filter((nome) => !/violet|violeta|dark factor|fator escuro|fator violeta/i.test(nome)).join(", ")}.`
        : "",
      calc.naoRegistradas?.length ? `Não encontradas no catálogo: ${calc.naoRegistradas.join(", ")}.` : "",
    ].filter(Boolean);

    const normalizarNome = (valor) => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const nomesEquivalentes = (mutacao) => [mutacao.nome, mutacao.nomeAlternativo].filter(Boolean).map(normalizarNome);
    const estadoDoGene = (ave, mutacao) => {
      const equivalentes = nomesEquivalentes(mutacao);
      const visuais = [ave.corMutacao, ...(ave.mutacoesVisuais || [])].filter(Boolean).map(normalizarNome);
      const portadores = (ave.portadores || []).map(normalizarNome);
      if (visuais.some((nome) => equivalentes.includes(nome))) return "apresenta visualmente";
      if (portadores.some((nome) => equivalentes.includes(nome))) return "foi informado como portador";
      return "não foi informado como portador nem como visual";
    };

    const explicacoes = [...new Set((calc.lociConsiderados || []).map((nome) => normalizarNome(nome)))].map((nomeNormalizado) => {
      const nome = (calc.lociConsiderados || []).find((item) => normalizarNome(item) === nomeNormalizado);
      const mutacao = mutacoesRingNeck.find((m) => nomesEquivalentes(m).includes(normalizarNome(nome)));
      if (!mutacao) return "";
      const heranca = mutacao.tipoHeranca || "";
      let motivo = "O filhote recebe uma combinação de genes dos dois pais.";
      if (heranca === "Autossomica recessiva") {
        motivo = "Para essa característica aparecer, o filhote precisa receber o gene dos dois pais. Se receber de apenas um, poderá ser portador sem mostrar a mutação.";
      } else if (heranca === "Ligada ao sexo (recessiva)") {
        motivo = "Essa característica é ligada ao sexo. Machos e fêmeas recebem combinações diferentes, por isso as possibilidades são separadas por sexo.";
      } else if (heranca === "Autossomica dominante" || heranca === "Ligada ao sexo (dominante)") {
        motivo = "Nessa herança, uma cópia do gene já pode ser suficiente para a característica aparecer.";
      } else if (heranca === "Codominante") {
        motivo = "Uma ou duas cópias desse fator podem produzir resultados visuais diferentes.";
      }
      return `${mutacao.nome}: ${motivo} Pai: ${estadoDoGene(paiParaCalculo, mutacao)}; mãe: ${estadoDoGene(maeParaCalculo, mutacao)}.`;
    }).filter(Boolean);
    if (serieCor) {
      explicacoes.push("Série de cor: os percentuais abaixo vêm da combinação dos genótipos informados ou inferidos para pai e mãe. Quando a série de um dos pais não pode ser identificada, o sistema não inventa percentuais para ela.");
    }
    if (dark?.resultados?.length) {
      const resumoDark = dark.resultados.map((item) => `${item.percentual}%: ${item.dosagem === 0 ? "sem fator escuro" : item.dosagem === 1 ? "fator escuro simples" : "fator escuro duplo"}`).join("; ");
      explicacoes.push(`Fator escuro: Cobalto corresponde a uma cópia do fator Dark e Mauve a duas cópias na série azul. Neste cruzamento: ${resumoDark}.`);
    }
    if (violet?.resultados?.length) {
      const resumoViolet = violet.resultados.map((item) => `${item.percentual}%: ${item.dosagem === 0 ? "sem fator violeta" : item.dosagem === 1 ? "Violet Factor SF" : "Violet Factor DF"}`).join("; ");
      explicacoes.push(`Fator violeta: a aparência Violeta confirma a presença do fator, mas não permite distinguir sozinha SF de DF. Sem dosagem confirmada, o cálculo fica pendente; não presumimos uma dose. Neste cruzamento: ${resumoViolet}.`);
    }
    setResultado({
      tipo: "sucesso",
      cruzamento: `${pai.nome || "Pai"} × ${mae.nome || "Mãe"}`,
      genotipos: [
        ...(serieCor ? ["Série de cor azul"] : []),
        ...(dark?.resultados?.length ? ["Dark Factor"] : []),
        ...(violet?.resultados?.length ? ["Violet Factor"] : []),
        ...(calc.lociConsiderados || []),
      ].join(", "),
      serieCor,
      fenotiposCombinados,
      combinacaoDarkSeriePendente,
      cenariosSerieCor,
      genotipoPai,
      genotipoMae,
      fatores,
      possibilidades,
      explicacoes,
      observacoes,
    });
  }

  // Atualiza a previsão imediatamente ao selecionar os pais; evita um
  // segundo botão e mantém o resultado sincronizado com os campos.
  useEffect(() => {
    const preenchida = (ave) => Boolean(
      ave?.corMutacao || ave?.corBase || ave?.corAparencia || ave?.corLivre ||
      ave?.serieCorGenotipo || (ave?.mutacoesVisuais || []).length
    );
    const paiOk = modoPai === "cadastro" ? Boolean(paiId) : preenchida(paiManual);
    const maeOk = modoMae === "cadastro" ? Boolean(maeId) : preenchida(maeManual);
    if (!paiOk || !maeOk) {
      setResultado(null);
      return;
    }
    calcular();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoPai, modoMae, paiId, maeId, paiManual, maeManual, aves, mutacoesRingNeck]);

  function renderGenitor(tipo) {
    const isPai = tipo === "pai";
    const modo = isPai ? modoPai : modoMae;
    const setModo = isPai ? setModoPai : setModoMae;
    const registro = isPai ? pai : mae;
    const manual = isPai ? paiManual : maeManual;
    const setManual = isPai ? setPaiManual : setMaeManual;
    const opcoes = isPai ? machos : femeas;
    const id = isPai ? paiId : maeId;
    const setId = isPai ? setPaiId : setMaeId;
    const titulo = isPai ? "Pai" : "Mãe";
    const extras = mutacoesRingNeck.filter((m) => m.permitePortador !== false);

    return (
      <section className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <h3 className="text-lg font-semibold mb-1" style={{ color: "#2B241C" }}>{titulo}</h3>
        <p className="text-xs mb-3" style={{ color: "#8a7a63" }}>{isPai ? "Reprodutor macho" : "Reprodutora fêmea"}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button type="button" onClick={() => { setModo("cadastro"); setResultado(null); }} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: modo === "cadastro" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Escolher do meu plantel</button>
          <button type="button" onClick={() => { setModo("manual"); setResultado(null); }} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ background: modo === "manual" ? "#C69A2E" : "#f2e8d4", color: "#2B241C" }}>Informar outra ave</button>
        </div>

        {modo === "cadastro" ? (
          <>
            <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Selecione {isPai ? "o macho" : "a fêmea"}</label>
            <select className="w-full rounded-xl px-3 py-3" style={campo} value={id} onChange={(e) => { setId(e.target.value); setResultado(null); }}>
              <option value="">Escolha uma ave cadastrada</option>
              {opcoes.map((a) => <option key={a.id} value={a.id}>{a.nome} — {a.corMutacao || a.corBase || "Cor não informada"}</option>)}
            </select>
            {registro && (
              <div className="mt-3 rounded-xl p-3 text-sm" style={{ background: "#fffaf0", color: "#5e5143" }}>
                <strong>{registro.nome}</strong>
                <p className="mt-1">Cor: {registro.corBase || "não informada"}</p>
                <p>Mutação visível: {[registro.corMutacao, ...(registro.mutacoesVisuais || [])].filter(Boolean).join(", ") || "não informada"}</p>
                <p>Portador de: {(registro.portadores || []).join(", ") || "não informado"}</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Nome (opcional)</label>
              <input className="w-full rounded-xl px-3 py-3" style={campo} placeholder={titulo} value={manual.nome} onChange={(e) => atualizarManual(setManual, "nome", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#5e5143" }}>Qual é a cor ou aparência da ave?</label>
              <select
                className="w-full rounded-xl px-3 py-3"
                style={campo}
                value={
                  manual.aparenciaOutra
                    ? "__outra__"
                    : manual.corAparencia === "Lutino"
                    ? "popular|Lutino"
                    : manual.corAparencia === "Albino"
                      ? "popular|Albino"
                      : manual.corMutacao === "Ino"
                        ? "popular|Lutino"
                      : manual.corMutacao === "Cremino"
                      ? "popular|Cremino"
                      : manual.corMutacao
                        ? (APARENCIAS_PADRAO_RING_NECK.some((cor) => cor.value === manual.corMutacao) ||
                           extras.some((m) => m.nome === manual.corMutacao)
                          ? manual.corMutacao : "__outra__")
                        : manual.corBase || ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "__outra__") {
                    setManual((atual) => ({ ...atual, corMutacao: "", corLivre: "", aparenciaOutra: true }));
                    setResultado(null);
                  } else if (value.startsWith("popular|")) {
                    const popular = value.split("|")[1];
                    setManual((atual) => ({
                      ...atual,
                      aparenciaOutra: false,
                      corLivre: "",
                      corMutacao: popular === "Lutino" || popular === "Albino" ? "Ino" : popular,
                      corAparencia: popular === "Lutino" || popular === "Albino" ? popular : "",
                      // Ino esconde a série de cor: não presumir Verde para Lutino nem Azul para Albino.
                      corBase: popular === "Lutino" || popular === "Albino" ? "" : atual.corBase || "",
                    }));
                    setResultado(null);
                  } else if (CORES_BASE.some((c) => c.value === value)) {
                    setManual((atual) => ({ ...atual, corBase: value, corMutacao: "", corAparencia: "", corLivre: "", aparenciaOutra: false, serieCorGenotipo: "", mutacoesVisuais: [], fatoresGeneticos: { darkFactor: "", violetFactor: "" } }));
                    setResultado(null);
                  } else {
                    setManual((atual) => ({
                      ...atual,
                      corMutacao: value,
                      corBase: "",
                      serieCorGenotipo: "",
                      mutacoesVisuais: [],
                      fatoresGeneticos: { darkFactor: "", violetFactor: "" },
                      corLivre: "",
                      aparenciaOutra: false,
                    }));
                    setResultado(null);
                  }
                }}
              >
                <option value="">Não sei informar</option>
                <optgroup label="Cores-base">
                  {APARENCIAS_PADRAO_RING_NECK.filter((c) => !["Violeta", "Cobalto", "Mauve"].includes(c.value)).map((cor) => <option key={cor.value} value={cor.value}>{cor.label}</option>)}
                </optgroup>
                <optgroup label="Aparências conhecidas">
                  <option value="popular|Lutino">Lutino</option>
                  <option value="popular|Albino">Albino</option>
                  <option value="popular|Cremino">Cremino</option>
                  {APARENCIAS_PADRAO_RING_NECK.filter((c) => ["Violeta", "Cobalto", "Mauve"].includes(c.value)).map((cor) => (
                    <option key={cor.value} value={cor.value}>{cor.label}</option>
                  ))}
                  {mutacoesRingNeck.filter((m) => m.nome !== "Ino").map((m) => (
                    <option key={m.id || m.nome} value={m.nome}>{m.nome}</option>
                  ))}
                </optgroup>
                <option value="__outra__">Outra (digitar)</option>
              </select>
              {manual.aparenciaOutra && (
                <input
                  className="w-full rounded-xl px-3 py-3 mt-2"
                  style={campo}
                  placeholder="Digite a cor ou mutação"
                  value={manual.corLivre || ""}
                  onChange={(e) => atualizarManual(setManual, "corLivre", e.target.value)}
                />
              )}
            </div>
            <DetalhesGeneticosInline
              ave={manual}
              setAve={setManual}
              mutacoes={mutacoesRingNeck}
              ehPai={isPai}
            />
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        <div className="text-xs font-semibold mb-2" style={{ color: "#8a7a63" }}>CALCULADORA GENÉTICA</div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: "#2B241C" }}>Quais filhotes esse casal pode gerar?</h2>
        <p className="text-sm" style={{ color: "#6f6254" }}>Escolha o pai e a mãe. Se eles não estiverem cadastrados, informe apenas o que você sabe. Os detalhes avançados são opcionais.</p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Cor</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>É a cor que você vê na ave, como verde ou azul.</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Mutação</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>É uma característica genética que muda a aparência, como lutino ou albino.</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#fffaf0" }}>
            <strong className="text-sm" style={{ color: "#2B241C" }}>Portador</strong>
            <p className="text-xs mt-1" style={{ color: "#6f6254" }}>A ave carrega uma mutação, mas não mostra essa característica. Só informe se tiver certeza.</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{renderGenitor("pai")}{renderGenitor("mae")}</div>
      {!resultado && <p className="text-sm" style={{ color: "#6f6254" }}>Selecione a cor do pai e da mãe para ver os filhotes automaticamente.</p>}
      {resultado && <div className="rounded-2xl p-5" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
        {resultado.tipo === "erro" ? (
          <div style={{ color: "#A6402B" }}>
            <div className="font-semibold mb-1">Ainda não é possível calcular esse casal.</div>
            <p className="text-sm">{resultado.mensagem}</p>
          </div>
        ) : resultado.tipo === "padrao" ? (
          <div className="space-y-3" style={{ color: "#2B241C" }}>
            <div className="text-xs font-semibold" style={{ color: "#54764b" }}>CRUZAMENTO DE CORES SIMPLES</div>
            <div className="text-xl font-semibold">{resultado.cruzamento}</div>
            {resultado.resultados?.length ? (
              <div className="rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
                <div className="font-semibold mb-2">Filhotes possíveis</div>
                {resultado.resultados.map((item) => (
                  <div key={item.nome} className="flex items-center justify-between py-2 gap-3 text-sm">
                    <strong>{item.nome}</strong><strong>{item.percentual}%</strong>
                  </div>
                ))}
                <p className="text-xs mt-2" style={{ color: "#6f6254" }}>As porcentagens se aplicam igualmente a machos e fêmeas.</p>
              </div>
            ) : (
              <div className="rounded-xl p-4 text-sm" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
                As séries e fatores são calculados separadamente neste cruzamento, pois a ligação genética impede combinar porcentagens com segurança.
                {resultado.serie?.map((item) => <div key={item.genotipo} className="flex justify-between py-1"><span>{item.nome}</span><strong>{item.percentual}%</strong></div>)}
              </div>
            )}
            <details className="rounded-xl p-3" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
              <summary className="cursor-pointer font-semibold text-sm">Entenda o resultado e as premissas</summary>
              <ul className="mt-3 space-y-1 text-sm">
                {resultado.premissas.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <p className="text-xs mt-2">Estimativa para cada nascimento, não garantia do número de filhotes.</p>
            </details>
          </div>
        ) : resultado.tipo === "condicional" ? (
          <div className="space-y-4" style={{ color: "#2B241C" }}>
            <div className="text-xs font-semibold" style={{ color: "#8a7a63" }}>PREVISÃO PARCIAL — DADOS A CONFIRMAR</div>
            <div className="text-xl font-semibold">{resultado.cruzamento}</div>
            <div className="rounded-xl p-4 space-y-2" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
              <div className="font-semibold">O que já podemos dizer?</div>
              <p className="text-sm">Uma das aves apresenta o fator Violeta, mas sua cor-base ainda não foi confirmada. Não é possível dar porcentagens definitivas das cores dos filhotes.</p>
              {resultado.outraSerieAzul && (
                <p className="text-sm">Como a outra ave é Azul, ela transmite o alelo Azul aos filhotes. Dependendo dos genes da ave Violeta, podem nascer aves da série <strong>Azul, Azul-turquesa ou Verde portador de Azul</strong>.</p>
              )}
              {!resultado.outraSerieAzul && resultado.coresPossiveis.length > 0 && (
                <p className="text-sm">Considerando apenas a série de cor, os cenários abaixo incluem estas possibilidades: <strong>{resultado.coresPossiveis.join(", ")}</strong>.</p>
              )}
              <p className="text-sm"><strong>Machos e fêmeas:</strong> todas essas possibilidades de série de cor podem ocorrer nos dois sexos. Ter o fator Violeta também não depende do sexo.</p>
            </div>
            <div className="rounded-xl p-4 space-y-2" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
              <div className="font-semibold">E o fator Violeta?</div>
              {resultado.fatorVioleta === null && resultado.fatorOutro === 0 ? (
                <>
                  <p className="text-sm">A ave Violeta pode ter uma cópia do fator (SF) ou duas (DF). Como a ausência do fator na outra ave foi confirmada:</p>
                  <p className="text-sm">• <strong>Se for SF:</strong> 50% dos filhotes herdam o fator Violeta.</p>
                  <p className="text-sm">• <strong>Se for DF:</strong> 100% dos filhotes herdam o fator Violeta (SF).</p>
                  <p className="text-xs" style={{ color: "#8a7a63" }}>Estas são hipóteses de herança do fator, não percentuais das cores visíveis.</p>
                </>
              ) : resultado.fatorVioleta !== null && resultado.fatorOutro !== null ? (
                <>
                  {cruzarDosagemFator(resultado.fatorVioleta, resultado.fatorOutro, "Violet Factor").map((item) => (
                    <div key={item.dosagem} className="flex justify-between gap-2 text-sm">
                      <span>{item.nome}</span><strong>{item.percentual}%</strong>
                    </div>
                  ))}
                  <p className="text-xs" style={{ color: "#8a7a63" }}>Percentuais apenas do fator Violeta, sem prever o fenótipo completo.</p>
                </>
              ) : (
                <p className="text-sm">A aparência Violeta não revela se o fator é simples (SF) ou duplo (DF). Uma ave descrita apenas como Azul também não está comprovadamente sem Violeta. Sem esses dados, não podemos afirmar que 50% ou 100% dos filhotes serão violetas. Se conhecer a dosagem dos pais, informe em “Se souber mais detalhes (opcional)”.</p>
              )}
            </div>
            {resultado.cenarios.length ? (
              <details className="rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
                <summary className="cursor-pointer font-semibold">Simular uma cor-base para a ave Violeta (opcional)</summary>
                <p className="text-xs mt-3 mb-2" style={{ color: "#8a7a63" }}>Escolha apenas uma hipótese. O Avespet não considera nenhuma delas confirmada, nem atribui a todas a mesma chance.</p>
                <select
                  aria-label="Hipótese genética da ave Violeta"
                  className="w-full rounded-xl px-3 py-3"
                  style={campo}
                  value={cenarioSelecionado}
                  onChange={(e) => setCenarioSelecionado(e.target.value)}
                >
                  <option value="">Escolher uma hipótese para simular</option>
                  {resultado.cenarios.map((cenario) => (
                    <option key={cenario.genotipo} value={cenario.genotipo}>{descricaoGenotipoSerie(cenario.genotipo)} ({cenario.genotipo})</option>
                  ))}
                </select>
                {resultado.cenarios.filter((cenario) => cenario.genotipo === cenarioSelecionado).map((cenario) => (
                  <div key={cenario.genotipo} className="rounded-lg p-3 mt-3 space-y-2" style={{ background: "#f2e8d4" }}>
                    <div className="font-semibold text-sm">Se a ave Violeta tiver este genótipo:</div>
                    {cenario.resultados.map((item) => (
                      <div key={item.genotipo} className="flex justify-between gap-2 text-sm">
                        <span>{item.nome}</span><strong>{item.percentual}%</strong>
                      </div>
                    ))}
                    <p className="text-xs" style={{ color: "#6f6254" }}>Percentuais somente da série de cor nesta hipótese, sem incluir Dark, Violeta nem outras mutações. Não são porcentagens finais do cruzamento.</p>
                  </div>
                ))}
              </details>
            ) : (
              <p className="text-sm">A série de cor da outra ave também não foi confirmada. Informe uma cor-base para explorar hipóteses.</p>
            )}
            <div className="rounded-xl p-4 space-y-2" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
              <div className="font-semibold">Entenda o resultado</div>
              <p className="text-sm">A cor que vemos não mostra todos os genes de uma ave. Os percentuais só ficam completos quando sabemos quais variantes cada pai pode transmitir.</p>
              <p className="text-sm">Você não precisa adivinhar: se não souber a cor-base ou SF/DF, pode deixar em branco. As hipóteses acima servem para aprender, e não para garantir o nascimento de uma cor.</p>
            </div>
          </div>
        ) : <>
          <div className="text-xs font-semibold mb-2" style={{ color: "#8a7a63" }}>POSSIBILIDADES TEÓRICAS</div>
          <div className="text-xl font-semibold" style={{ color: "#2B241C" }}>{resultado.cruzamento}</div>

          {resultado.fenotiposCombinados?.length ? (
            <div className="mt-4 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
              <div className="font-semibold text-base mb-1" style={{ color: "#2B241C" }}>Probabilidade de cada tipo de filhote</div>
              <p className="text-xs mb-3" style={{ color: "#8a7a63" }}>As cores da série e os fatores Dark/Violet não são ligados ao sexo: cada possibilidade pode nascer macho ou fêmea. Os percentuais abaixo representam a chance no total da ninhada.</p>
              <div className="space-y-3">{resultado.fenotiposCombinados.map((item) => <div key={item.nome} className="flex items-center justify-between gap-3 text-sm" style={{ color: "#5e5143" }}><span className="font-medium">{item.nome}</span><strong className="text-lg">{item.percentual}%</strong></div>)}</div>
            </div>
          ) : resultado.combinacaoDarkSeriePendente ? (
            <div className="mt-4 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
              <div className="font-semibold text-base mb-2" style={{ color: "#2B241C" }}>Resultados calculados separadamente</div>
              <p className="text-xs mb-3" style={{ color: "#8a7a63" }}>A série de cor e o fator Dark foram calculados separadamente. Não exibimos uma porcentagem combinada porque esses genes têm ligação física e o cálculo correto depende da fase genética dos pais.</p>
              {resultado.serieCor.map((r) => <div key={r.genotipo} className="flex justify-between gap-3 py-1 text-sm" style={{ color: "#5e5143" }}><span>{r.nome} ({r.genotipo})</span><strong>{r.percentual}%</strong></div>)}
              {resultado.fatores.find((f) => f.nome.startsWith("Dark"))?.resultados.map((r) => <div key={r.dosagem} className="flex justify-between gap-3 py-1 text-sm" style={{ color: "#5e5143" }}><span>{r.nome}</span><strong>{r.percentual}%</strong></div>)}
            </div>
          ) : resultado.fatores.some((f) => f.nome.startsWith("Violet") && f.conhecido && f.resultados.length) ? (
            <div className="mt-4 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
              <div className="font-semibold text-base mb-2" style={{ color: "#2B241C" }}>Probabilidade genética já calculável</div>
              <p className="text-xs mb-3" style={{ color: "#8a7a63" }}>O fator Violet pode ser calculado, mas a cor-base do macho Violeta ainda não foi confirmada. Por isso, estes percentuais não devem ser apresentados como cores finais dos filhotes.</p>
              {resultado.fatores.find((f) => f.nome.startsWith("Violet"))?.resultados.map((r) => <div key={r.dosagem} className="flex justify-between gap-3 py-1 text-sm" style={{ color: "#5e5143" }}><span>{r.dosagem === 0 ? "Sem fator Violet" : r.dosagem === 1 ? "Violet SF" : "Violet DF"}</span><strong>{r.percentual}%</strong></div>)}
            </div>
          ) : null}

          <details className="mt-3 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
            <summary className="cursor-pointer font-semibold text-sm" style={{ color: "#2B241C" }}>Ver detalhes dos fatores Dark e Violet</summary>
            {resultado.fatores.map((fator) => <div key={fator.nome} className="mb-2">
              <div className="text-sm font-medium" style={{ color: "#5e5143" }}>{fator.nome}</div>
              {fator.conhecido && fator.resultados.length ? fator.resultados.map((r) => <div key={r.dosagem} className="flex justify-between text-xs mt-1" style={{ color: "#6f6254" }}><span>{r.nome}</span><strong>{r.percentual}%</strong></div>) : <p className="text-xs" style={{ color: "#8a7a63" }}>Não calculado: informe a dosagem dos dois pais, inclusive “sem fator” quando confirmada.</p>}
            </div>)}
          </details>
          <details className="mt-3 rounded-xl p-4" style={{ background: "#fffaf0", border: "1px solid #dfcba7" }}>
            <summary className="cursor-pointer font-semibold text-sm" style={{ color: "#2B241C" }}>Ver características genéticas consideradas</summary>
            <p className="mt-2 text-xs" style={{ color: "#8a7a63" }}>{resultado.genotipos || "Nenhuma característica adicional informada."}</p>
          </details>
          <div className="mt-4 space-y-3">{resultado.possibilidades.length === 0 ? <p className="text-sm" style={{ color: "#6f6254" }}>{resultado.serieCor?.length ? "Não há mutações adicionais com herança validada informadas para este casal. As cores e os fatores calculados aparecem nas seções acima." : "Não há mutações adicionais com herança validada informadas para este casal. O fator Violet foi calculado; para prever as cores dos filhotes, informe também a cor-base da ave Violeta."}</p> : resultado.possibilidades.map((item, index) => <div key={`${item.nome}-${item.detalhe}-${index}`} className="flex items-center justify-between rounded-xl px-4 py-3 gap-3" style={{ background: "#f2e8d4", border: "1px solid #dfcba7" }}>
            <div><div className="font-semibold">{item.nome}</div><div className="text-xs mt-1" style={{ color: "#8a7a63" }}>{item.detalhe}</div></div><span className="font-semibold">{item.percentual}</span>
          </div>)}</div>
          <div className="mt-5 rounded-xl p-4" style={{ background: "#f5e9c8", border: "1px solid #dfcba7" }}>
            <div className="font-semibold text-sm mb-2" style={{ color: "#2B241C" }}>Entenda o resultado</div>
            <div className="space-y-2 mb-3">
              {resultado.explicacoes?.length ? resultado.explicacoes.map((explicacao, i) => (
                <p key={i} className="text-sm" style={{ color: "#6f6254" }}>{explicacao}</p>
              )) : (
                <p className="text-sm" style={{ color: "#6f6254" }}>O sistema considerou as informações genéticas cadastradas para o pai e a mãe. Se alguma mutação ou condição de portador não foi informada, ela não pode ser presumida no cálculo.</p>
              )}
            </div>
            <p className="text-sm mb-2" style={{ color: "#6f6254" }}>As porcentagens mostram possibilidades para cada filhote, não uma garantia da quantidade que nascerá.</p>
            <p className="text-sm mb-2" style={{ color: "#6f6254" }}>Por exemplo, 25% significa que a expectativa estatística é cerca de 1 em cada 4 filhotes ao longo de muitas ninhadas. Cada filhote, porém, pode ser diferente.</p>
            <p className="text-sm mb-1" style={{ color: "#6f6254" }}><strong>Visual:</strong> o filhote apresenta a mutação na aparência.</p>
            <p className="text-sm mb-1" style={{ color: "#6f6254" }}><strong>Portador:</strong> o filhote pode carregar a mutação, mesmo sem mostrar essa cor.</p>
            <p className="text-sm" style={{ color: "#6f6254" }}><strong>Normal:</strong> não apresenta a mutação considerada no cálculo.</p>
          </div>
          <ul className="mt-3 space-y-1 text-xs" style={{ color: "#8a7a63" }}>{resultado.observacoes.map((obs, i) => <li key={i}>• {obs}</li>)}</ul>
        </>}
      </div>}
    </div>
  );
}
