function normTxtGen(s) {
  return (s || "").trim().toLowerCase();
}

function alelosAutossomico(ave, mutNome, dominante) {
  const expressa = normTxtGen(ave.corMutacao) === normTxtGen(mutNome) ||
    (ave.mutacoesVisuais || []).some((m) => normTxtGen(m) === normTxtGen(mutNome));
  const carrega = (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(mutNome));
  if (dominante) return expressa ? ["M", "N"] : ["N", "N"];
  if (expressa) return ["m", "m"];
  if (carrega) return ["N", "m"];
  return ["N", "N"];
}

function classificarAutossomico(par, dominante, codominante) {
  const countMut = par.filter((a) => a === "M" || a === "m").length;
  if (codominante) {
    if (countMut === 2) return "visual (duplo fator)";
    if (countMut === 1) return "visual (fator simples)";
    return "normal";
  }
  if (dominante) return countMut >= 1 ? "visual" : "normal";
  if (countMut === 2) return "visual";
  if (countMut === 1) return "portador";
  return "normal";
}

function alelosZ(ave, mutNome, dominante) {
  const expressa = normTxtGen(ave.corMutacao) === normTxtGen(mutNome);
  const carrega = (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(mutNome));
  const alvo = dominante ? "M" : "m";
  if (ave.sexo === "Macho") {
    if (expressa) return [alvo, alvo];
    if (carrega) return [alvo, "N"];
    return ["N", "N"];
  }
  // Femea e hemizigota (so um Z) - nao existe estado "portador" pra ela
  return expressa ? [alvo] : ["N"];
}

function classificarSexLigado(sexoFilho, alelos, dominante) {
  const alvo = dominante ? "M" : "m";
  const countMut = alelos.filter((a) => a === alvo).length;
  if (sexoFilho === "Macho") {
    if (dominante) return countMut >= 1 ? "visual" : "normal";
    if (countMut === 2) return "visual";
    if (countMut === 1) return "portador";
    return "normal";
  }
  return countMut >= 1 ? "visual" : "normal";
}

// Calcula o cruzamento considerando todos os loci relevantes (mutacoes que
// pai OU mae expressam ou carregam), usando o tipo de heranca cadastrado
// no Banco de Genetica pra cada uma.
function calcularCruzamentoGenetico(pai, mae, mutacoes) {
  const relevantes = mutacoes
    .filter((m) => m.tipoHeranca !== "Cor base (selvagem)")
    .filter((m) => {
      const envolve = (ave) =>
        normTxtGen(ave.corMutacao) === normTxtGen(m.nome) ||
        (ave.mutacoesVisuais || []).some((v) => normTxtGen(v) === normTxtGen(m.nome)) ||
        (ave.portadores || []).some((p) => normTxtGen(p) === normTxtGen(m.nome));
      return envolve(pai) || envolve(mae);
    });
  const bloqueadas = relevantes.filter((m) => m.calculadoraAtiva === false).map((m) => m.nome);
  const calculaveis = relevantes.filter((m) => m.calculadoraAtiva !== false);

  const naoRegistradas = [pai.corMutacao, mae.corMutacao]
    .filter(Boolean)
    .filter((nome, i, arr) => arr.indexOf(nome) === i)
    .filter((nome) => !mutacoes.some((m) => normTxtGen(m.nome) === normTxtGen(nome)));

  if (calculaveis.length === 0) {
    return { semLociRelevantes: true, naoRegistradas, bloqueadas };
  }

  const autossomicos = calculaveis.filter((m) =>
    ["Autossomica recessiva", "Autossomica dominante", "Codominante"].includes(m.tipoHeranca)
  );
  const sexLigados = calculaveis.filter((m) =>
    ["Ligada ao sexo (recessiva)", "Ligada ao sexo (dominante)"].includes(m.tipoHeranca)
  );
  const naoDefinidos = relevantes
    .filter((m) => !autossomicos.includes(m) && !sexLigados.includes(m))
    .map((m) => m.nome);

  // combinacoes: cada item = { prob, partes: [descricoes de locus], sexo }
  let combinacoes = [{ prob: 1, partes: [], sexo: null }];

  autossomicos.forEach((m) => {
    const dominante = m.tipoHeranca === "Autossomica dominante";
    const codominante = m.tipoHeranca === "Codominante";
    const aPai = alelosAutossomico(pai, m.nome, dominante);
    const aMae = alelosAutossomico(mae, m.nome, dominante);
    const porClasse = new Map();
    aPai.forEach((p) =>
      aMae.forEach((mm) => {
        const cls = classificarAutossomico([p, mm], dominante, codominante);
        porClasse.set(cls, (porClasse.get(cls) || 0) + 0.25);
      })
    );
    const novas = [];
    combinacoes.forEach((comb) => {
      porClasse.forEach((prob, cls) => {
        novas.push({
          prob: comb.prob * prob,
          partes: cls === "normal" ? comb.partes : [...comb.partes, `${cls} ${m.nome}`],
          sexo: comb.sexo,
        });
      });
    });
    combinacoes = novas;
  });

  const sexos = [{ sexo: "Macho", prob: 0.5 }, { sexo: "Femea", prob: 0.5 }];

  if (sexLigados.length > 0) {
    const novas = [];
    combinacoes.forEach((comb) => {
      sexos.forEach(({ sexo, prob: probSexo }) => {
        let subCombos = [{ prob: 1, partes: [] }];
        sexLigados.forEach((m) => {
          const dominante = m.tipoHeranca === "Ligada ao sexo (dominante)";
          const zPai = alelosZ(pai, m.nome, dominante);
          const zMae = alelosZ(mae, m.nome, dominante);
          const novosSub = [];
          subCombos.forEach((sub) => {
            zPai.forEach((pz) => {
              const alelosFilho = sexo === "Macho" ? [pz, zMae[0]] : [pz];
              const cls = classificarSexLigado(sexo, alelosFilho, dominante);
              novosSub.push({
                prob: sub.prob * 0.5,
                partes: cls === "normal" ? sub.partes : [...sub.partes, `${cls} ${m.nome}`],
              });
            });
          });
          subCombos = novosSub;
        });
        subCombos.forEach((sub) => {
          novas.push({
            prob: comb.prob * probSexo * sub.prob,
            partes: [...comb.partes, ...sub.partes],
            sexo,
          });
        });
      });
    });
    combinacoes = novas;
  } else {
    const novas = [];
    combinacoes.forEach((comb) => {
      sexos.forEach(({ sexo, prob }) => {
        novas.push({ ...comb, prob: comb.prob * prob, sexo });
      });
    });
    combinacoes = novas;
  }

  const agrupado = new Map();
  combinacoes.forEach((c) => {
    const desc = c.partes.length ? c.partes.join(", ") : "Normal (sem mutacoes visiveis conhecidas)";
    const key = `${c.sexo}|${desc}`;
    agrupado.set(key, (agrupado.get(key) || 0) + c.prob);
  });

  const resultadoFinal = Array.from(agrupado.entries())
    .map(([key, prob]) => {
      const [sexo, desc] = key.split("|");
      return { sexo, descricao: desc, percentual: prob * 100 };
    })
    .sort((a, b) => b.percentual - a.percentual);

  return {
    semLociRelevantes: false,
    naoDefinidos,
    naoRegistradas,
    lociConsiderados: [...autossomicos, ...sexLigados].map((m) => m.nome),
    resultadoFinal,
  };
}


export { calcularCruzamentoGenetico };
