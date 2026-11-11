import React, { useState } from "react";
import { calcularCruzamentoGenetico } from "../utils/calcularCruzamentoGenetico";

export default function CalculadoraGenetica({ aves, mutacoes }) {
  const [paiId, setPaiId] = useState("");
  const [maeId, setMaeId] = useState("");
  const [resultado, setResultado] = useState(null);

  const machos = aves.filter((a) => a.sexo === "Macho");
  const femeas = aves.filter((a) => a.sexo === "Femea");

  const pai = aves.find((a) => a.id === paiId);
  const mae = aves.find((a) => a.id === maeId);

  function calcular() {
    if (!pai || !mae) {
      setResultado({
        tipo: "erro",
        mensagem: "Selecione o pai e a mae para calcular.",
      });
      return;
    }

    const calc = calcularCruzamentoGenetico(pai, mae, mutacoes);

    if (calc.semLociRelevantes) {
      setResultado({
        tipo: "erro",
        mensagem:
          "Nenhuma mutacao conhecida (cadastrada no Banco de Genetica) foi encontrada nesse casal. " +
          (calc.naoRegistradas.length
            ? `Cadastre "${calc.naoRegistradas.join('", "')}" em Genetica > Mutacoes pra calcular.`
            : "Cadastre as mutacoes envolvidas em Genetica > Mutacoes."),
      });
      return;
    }

    const possibilidades = calc.resultadoFinal.map((r) => ({
      nome: r.descricao,
      percentual: `${r.percentual.toFixed(1).replace(/\.0$/, "")}%`,
      detalhe: r.sexo,
    }));

    let observacao =
      "Calculo considera os loci registrados no Banco de Genetica (autossomicos e ligados ao sexo), " +
      "tratando cada mutacao como independente das demais.";
    if (calc.naoDefinidos.length) {
      observacao += ` As mutacoes "${calc.naoDefinidos.join('", "')}" ainda estao com tipo de heranca "Nao definido" e nao entraram no calculo.`;
    }
    if (calc.naoRegistradas.length) {
      observacao += ` "${calc.naoRegistradas.join('", "')}" nao esta cadastrada no Banco de Genetica e foi ignorada.`;
    }

    setResultado({
      tipo: "sucesso",
      titulo: "Resultado do cruzamento",
      cruzamento: `${pai.corMutacao || "Sem mutacao"} x ${mae.corMutacao || "Sem mutacao"}`,
      genotipos: `Loci considerados: ${calc.lociConsiderados.join(", ") || "-"}`,
      possibilidades,
      observacao,
    });
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-5"
        style={{
          background: "#FAF3E6",
          border: "1px solid #e3d3b4",
        }}
      >
        <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>
          CALCULADORA GENETICA
        </div>

        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: "#2B241C" }}
        >
          Cruzamento de Ring Neck
        </h2>

        <p className="text-sm" style={{ color: "#6f6254" }}>
          Selecione o pai e a mae cadastrados para calcular as possibilidades
          conhecidas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>
            PAI
          </div>

          <select
            className="w-full rounded-xl px-3 py-3"
            style={{
              border: "1px solid #d8c6a5",
              background: "#fffaf0",
              color: "#2B241C",
            }}
            value={paiId}
            onChange={(e) => {
              setPaiId(e.target.value);
              setResultado(null);
            }}
          >
            <option value="">-- selecione o pai --</option>

            {machos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} - {a.corMutacao || "Sem mutacao"}
              </option>
            ))}
          </select>

          {pai && (
            <div className="mt-4 text-sm" style={{ color: "#5e5143" }}>
              <strong>{pai.nome}</strong>
              <br />
              Mutacao: {pai.corMutacao || "Nao informada"}
              <br />
              Portador de:{" "}
              {(pai.portadores || []).length > 0
                ? pai.portadores.join(", ")
                : "Nenhuma informada"}
            </div>
          )}
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>
            MAE
          </div>

          <select
            className="w-full rounded-xl px-3 py-3"
            style={{
              border: "1px solid #d8c6a5",
              background: "#fffaf0",
              color: "#2B241C",
            }}
            value={maeId}
            onChange={(e) => {
              setMaeId(e.target.value);
              setResultado(null);
            }}
          >
            <option value="">-- selecione a mae --</option>

            {femeas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} - {a.corMutacao || "Sem mutacao"}
              </option>
            ))}
          </select>

          {mae && (
            <div className="mt-4 text-sm" style={{ color: "#5e5143" }}>
              <strong>{mae.nome}</strong>
              <br />
              Mutacao: {mae.corMutacao || "Nao informada"}
              <br />
              Portador de:{" "}
              {(mae.portadores || []).length > 0
                ? mae.portadores.join(", ")
                : "Nenhuma informada"}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={calcular}
        className="px-5 py-3 rounded-xl font-semibold"
        style={{
          background: "#C69A2E",
          color: "#2B241C",
        }}
      >
        Calcular cruzamento
      </button>

      {resultado && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#FAF3E6",
            border: "1px solid #e3d3b4",
          }}
        >
          {resultado.tipo === "erro" && (
            <div style={{ color: "#A6402B" }}>
              {resultado.mensagem}
            </div>
          )}

          {resultado.tipo === "sucesso" && (
            <>
              <div
                className="ui-mono text-xs mb-2"
                style={{ color: "#8a7a63" }}
              >
                {resultado.titulo}
              </div>

              <div
                className="text-xl font-semibold"
                style={{ color: "#2B241C" }}
              >
                {resultado.cruzamento}
              </div>

              <div
                className="mt-2 text-sm"
                style={{ color: "#8a7a63" }}
              >
                Genotipo considerado: {resultado.genotipos}
              </div>

              <div className="mt-4 space-y-3">
                {resultado.possibilidades.map((item, index) => (
                  <div
                    key={`${item.nome}-${item.detalhe}-${index}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background: "#f2e8d4",
                      border: "1px solid #dfcba7",
                    }}
                  >
                    <div>
                      <div className="font-semibold">
                        {item.nome}
                      </div>

                      <div
                        className="text-xs mt-1"
                        style={{ color: "#8a7a63" }}
                      >
                        {item.detalhe}
                      </div>
                    </div>

                    <span className="font-semibold">
                      {item.percentual}
                    </span>
                  </div>
                ))}
              </div>

              <p
                className="mt-4 text-sm"
                style={{ color: "#6f6254" }}
              >
                {resultado.observacao}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
