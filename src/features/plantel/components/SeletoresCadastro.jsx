import React, { useState } from "react";

function SeletorComprador({ form, setForm, clientes }) {
  const [modo, setModo] = useState("existente"); // "existente" | "novo"
  const [busca, setBusca] = useState("");

  const resultados = busca.trim()
    ? clientes.filter((c) => {
        const q = busca.trim().toLowerCase();
        return (c.nome || "").toLowerCase().includes(q) || (c.telefone || "").includes(q);
      })
    : clientes;

  function selecionar(c) {
    setForm((f) => ({ ...f, compradorNome: c.nome, compradorTelefone: c.telefone, compradorEndereco: c.endereco, clienteId: c.id }));
    setBusca(`${c.nome}${c.telefone ? " - " + c.telefone : ""}`);
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "existente" ? "#556b3f" : "#e3d3b4", color: modo === "existente" ? "#F1E6D2" : "#2B241C" }}
        >
          ­🔎 Selecionar cliente existente
        </button>
        <button
          type="button"
          onClick={() => setModo("novo")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "novo" ? "#556b3f" : "#e3d3b4", color: modo === "novo" ? "#F1E6D2" : "#2B241C" }}
        >
          + Novo cliente
        </button>
      </div>

      {modo === "existente" && (
        <div className="mb-2">
          {clientes.length === 0 ? (
            <div className="ui-sans text-xs" style={{ color: "#8a7a63" }}>
              Voce ainda nao tem clientes cadastrados. Cadastre em "Clientes", ou usa "+ Novo cliente" aqui do lado.
            </div>
          ) : (
            <>
              <input
                style={inputStyle}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente por nome ou telefone..."
                className="w-full mb-2"
              />
              {busca.trim() && resultados.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {resultados.slice(0, 6).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => selecionar(c)}
                        className="ui-sans text-left text-sm px-3 py-2 rounded-lg flex items-center justify-between gap-2"
                        style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
                      >
                        <span>{c.nome}</span>
                        {c.telefone && <span className="ui-mono text-xs" style={{ color: "#8a7a63" }}>{c.telefone}</span>}
                      </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SeletorFornecedor({ form, setForm, fornecedores }) {
  const [modo, setModo] = useState("existente");
  const [busca, setBusca] = useState("");

  const resultados = busca.trim()
    ? fornecedores.filter((f) => {
        const q = busca.trim().toLowerCase();
        return (f.nome || "").toLowerCase().includes(q) || (f.telefone || "").includes(q);
      })
    : fornecedores;

  function selecionar(f) {
    setForm((form) => ({ ...form, fornecedorNome: f.nome, fornecedorTelefone: f.telefone, fornecedorEndereco: f.endereco, fornecedorId: f.id }));
    setBusca(`${f.nome}${f.telefone ? " - " + f.telefone : ""}`);
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setModo("existente")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "existente" ? "#556b3f" : "#e3d3b4", color: modo === "existente" ? "#F1E6D2" : "#2B241C" }}
        >
          ­🔎 Selecionar fornecedor existente
        </button>
        <button
          type="button"
          onClick={() => setModo("novo")}
          className="ui-sans text-xs px-3 py-1.5 rounded-lg font-semibold"
          style={{ background: modo === "novo" ? "#556b3f" : "#e3d3b4", color: modo === "novo" ? "#F1E6D2" : "#2B241C" }}
        >
          + Novo fornecedor
        </button>
      </div>

      {modo === "existente" && (
        <div className="mb-2">
          {fornecedores.length === 0 ? (
            <div className="ui-sans text-xs" style={{ color: "#8a7a63" }}>
              Voce ainda nao tem fornecedores cadastrados. Cadastre em "Fornecedores", ou usa "+ Novo fornecedor" aqui do lado.
            </div>
          ) : (
            <>
              <input
                style={inputStyle}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar fornecedor por nome ou telefone..."
                className="w-full mb-2"
              />
              {busca.trim() && resultados.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-2">
                  {resultados.slice(0, 6).map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => selecionar(f)}
                        className="ui-sans text-left text-sm px-3 py-2 rounded-lg flex items-center justify-between gap-2"
                        style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
                      >
                        <span>{f.nome}</span>
                        {f.telefone && <span className="ui-mono text-xs" style={{ color: "#8a7a63" }}>{f.telefone}</span>}
                      </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { SeletorComprador, SeletorFornecedor };
