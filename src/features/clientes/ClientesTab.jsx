import React, { useState } from "react";
import { Phone, Pencil, Save, Trash2, MessageCircle, Plus, Search, Users } from "lucide-react";

function normalizeTelefone(t) {
  return (t || "").replace(/\\D/g, "");
}

function historicoCliente(cliente, aves) {
  const porId = aves.filter((a) => a.status === "Vendida" && a.clienteId === cliente.id);
  let compras = porId;

  if (compras.length === 0) {
    // fallback pra vendas antigas que ainda nao tem o vinculo direto (clienteId)
    const tel = normalizeTelefone(cliente.telefone);
    const nome = (cliente.nome || "").trim().toLowerCase();
    compras = aves.filter((a) => {
      if (a.status !== "Vendida" || a.clienteId) return false; // ja vinculada a outro cliente, nao conta aqui
      if (tel) return normalizeTelefone(a.compradorTelefone) === tel;
      if (nome) return (a.compradorNome || "").trim().toLowerCase() === nome;
      return false;
    });
  }

  const totalAves = compras.length;
  const totalGasto = compras.reduce((s, a) => s + (parseFloat(a.valorVenda) || 0), 0);
  const ultimaCompra = compras.reduce((max, a) => ((a.dataVenda || "") > max ? a.dataVenda : max), "");
  return { compras: [...compras].sort((a, b) => (b.dataVenda || "").localeCompare(a.dataVenda || "")), totalAves, totalGasto, ultimaCompra };
}


// Varre as vendas ja cadastradas (aves com status Vendida) e acha compradores
// que ainda nao viraram Cliente - pra poder importar sem duplicar.
function clientesCandidatosDeVendas(aves, clientes) {
  const telsExistentes = new Set(clientes.map((c) => normalizeTelefone(c.telefone)).filter(Boolean));
  const nomesExistentes = new Set(clientes.map((c) => (c.nome || "").trim().toLowerCase()).filter(Boolean));

  const vistos = new Map(); // chave -> candidato
  aves.forEach((a) => {
    if (a.status !== "Vendida") return;
    const nome = (a.compradorNome || "").trim();
    const tel = normalizeTelefone(a.compradorTelefone);
    if (!nome && !tel) return;
    const chave = tel || nome.toLowerCase();
    if (tel && telsExistentes.has(tel)) return;
    if (!tel && nomesExistentes.has(nome.toLowerCase())) return;
    if (!vistos.has(chave)) {
      vistos.set(chave, {
        nome: nome || "(sem nome)",
        telefone: a.compradorTelefone || "",
        endereco: a.compradorEndereco || "",
        observacoes: "Importado automaticamente de uma venda ja cadastrada.",
      });
    }
  });
  return Array.from(vistos.values());
}


function ClienteCard({ c, historico, onOpen, onEdit }) {
  return (
    <Card className="p-4 ui-sans">
      <div className="cursor-pointer" onClick={() => onOpen(c.id)}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-semibold" style={{ color: "#2B241C" }}>{c.nome}</div>
          {c.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</span>}
        </div>
        {c.telefone && (
          <div className="text-xs flex items-center gap-1 mb-1" style={{ color: "#8a7a63" }}>
            <Phone size={11} /> {c.telefone}
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <span className="text-xs ui-mono" style={{ color: "#556b3f" }}>{historico.totalAves} {historico.totalAves === 1 ? "compra" : "compras"}</span>
          <span className="text-xs ui-mono" style={{ color: "#a6402b" }}>{money(historico.totalGasto)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(c)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#e3d3b4", color: "#2B241C" }}>
          <Pencil size={12} /> Editar
        </button>
        <button onClick={() => onOpen(c.id)} className="text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
          Ver historico
        </button>
      </div>
    </Card>
  );
}

function ClienteForm({ inicial, onSave, onCancel, error }) {
  const [c, setC] = useState(inicial);
  const set = (k) => (e) => setC((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Card className="p-4 sm:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field label="Nome"><input style={inputStyle} value={c.nome} onChange={set("nome")} placeholder="ex: Joao da Silva" /></Field>
        <Field label="Telefone"><input style={inputStyle} value={c.telefone} onChange={set("telefone")} placeholder="ex: (11) 99999-9999" /></Field>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Field label="Endereco"><input style={inputStyle} value={c.endereco} onChange={set("endereco")} placeholder="opcional" /></Field>
        <Field label="Observacoes"><input style={inputStyle} value={c.observacoes} onChange={set("observacoes")} placeholder="opcional" /></Field>
      </div>
      {error && <div className="ui-sans text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-3">
        <button onClick={() => onSave(c)} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar
        </button>
        <button onClick={onCancel} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}

function ClienteDetalhe({ cliente, historico, onBack, onEdit, onDelete }) {
  const [mostrarIndicacao, setMostrarIndicacao] = useState(false);

  const primeiroNome = (cliente.nome || "").trim().split(" ")[0] || cliente.nome;
  const ultimaAve = historico.compras[0]?.nome;
  const mensagemPadrao =
    `Oi, ${primeiroNome}! Tudo bem? ­😊\n\n` +
    `Queria saber como ${ultimaAve ? `o(a) ${ultimaAve} esta` : "a ave esta"} se adaptando a nova casa.\n\n` +
    `Ficamos muito felizes em fazer parte desse momento! ­ƒÉª­ƒÆÖ\n\n` +
    `Se voce estiver satisfeito com nosso atendimento e conhecer alguem procurando uma ave, pode indicar o Criatorio Dantas. Sera um prazer atender sua indicacao!`;

  const [mensagem, setMensagem] = useState(mensagemPadrao);

  return (
    <div>
      <button onClick={onBack} className="ui-sans text-xs mb-4 px-3 py-1.5 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>← Voltar pra lista</button>
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-xl font-bold ui-sans" style={{ color: "#2B241C" }}>{cliente.nome}</div>
            {cliente.telefone && <div className="text-sm flex items-center gap-1 mt-1" style={{ color: "#8a7a63" }}><Phone size={13} /> {cliente.telefone}</div>}
            {cliente.endereco && <div className="text-sm mt-1 ui-sans" style={{ color: "#8a7a63" }}>{cliente.endereco}</div>}
            {cliente.observacoes && <div className="text-sm mt-1 italic ui-sans" style={{ color: "#8a7a63" }}>{cliente.observacoes}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => onEdit(cliente)} className="text-xs px-2 py-1 rounded ui-sans" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
            <button onClick={() => onDelete(cliente.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1 ui-sans" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          </div>
        </div>

        {cliente.telefone ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <a
              href={whatsappUrl(cliente.telefone)}
              target="_blank" rel="noopener noreferrer"
              className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#556b3f", color: "#F1E6D2" }}
            >
              <MessageCircle size={15} /> Falar com cliente
            </a>
            <button
              onClick={() => setMostrarIndicacao((v) => !v)}
              className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#C69A2E", color: "#2B1D14" }}
            >
              ­🤝 Pedir indicacao
            </button>
          </div>
        ) : (
          <div className="ui-sans text-xs mb-4" style={{ color: "#8a7a63" }}>
            Cadastra um telefone pra esse cliente pra poder falar por WhatsApp direto daqui.
          </div>
        )}

        {mostrarIndicacao && cliente.telefone && (
          <div className="mb-2 p-3 rounded-lg" style={{ background: "#f5f0e4", border: "1px solid #e3d3b4" }}>
            <div className="ui-mono text-xs mb-2" style={{ color: "#8a7a63" }}>MENSAGEM (edite antes de enviar)</div>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              className="ui-sans w-full rounded-lg p-2 text-sm"
              style={{ background: "#fff", border: "1px solid #e3d3b4", color: "#2B241C", resize: "vertical" }}
            />
            <div className="flex gap-2 mt-2">
              <a
                href={whatsappUrl(cliente.telefone, mensagem)}
                target="_blank" rel="noopener noreferrer"
                className="ui-sans flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#556b3f", color: "#F1E6D2" }}
              >
                <MessageCircle size={15} /> Abrir WhatsApp com essa mensagem
              </a>
              <button
                onClick={() => setMensagem(mensagemPadrao)}
                className="ui-sans text-xs px-3 py-2 rounded-lg"
                style={{ background: "#e3d3b4", color: "#2B241C" }}
              >
                Restaurar sugestao
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-3 mb-2 mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <SummaryCard label="Total de aves compradas" value={historico.totalAves} />
          <SummaryCard label="Total gasto" value={money(historico.totalGasto)} tone="good" />
          <SummaryCard label="Ultima compra" value={historico.ultimaCompra || "-"} />
        </div>
      </Card>

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>HISTORICO DE COMPRAS</div>
      {historico.compras.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhuma compra encontrada com esse telefone ainda. Se esse cliente ja comprou uma ave, confere se o telefone bate com o que foi preenchido na venda.
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {historico.compras.map((a) => (
            <Card key={a.id} className="p-3 flex items-center gap-3 ui-sans">
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: "#3a2a1c" }}>
                {a.foto ? <img src={a.foto} className="w-full h-full object-cover" alt="" /> : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: "#2B241C" }}>{a.nome} <span className="font-normal" style={{ color: "#8a7a63" }}>({a.especie})</span></div>
                <div className="text-xs" style={{ color: "#8a7a63" }}>{a.dataVenda || "sem data"}</div>
              </div>
              <div className="text-sm font-semibold" style={{ color: "#556b3f" }}>{money(a.valorVenda)}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClientesTab({ clientes, aves, onSave, onDelete, onImportar, Card, Field, SectionTitle, SummaryCard, money, whatsappUrl, emptyCliente }) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalheId, setDetalheId] = useState(null);
  const [formError, setFormError] = useState("");

  const candidatos = clientesCandidatosDeVendas(aves, clientes);

  const filtrados = clientes.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (c.nome || "").toLowerCase().includes(q) || (c.telefone || "").includes(q);
  });

  function salvar(cliente) {
    const result = onSave(cliente);
    if (result?.ok) {
      setShowForm(false);
      setEditando(null);
      setFormError("");
    } else {
      setFormError(result?.error || "Nao consegui salvar.");
    }
  }

  const clienteDetalhe = detalheId ? clientes.find((c) => c.id === detalheId) : null;
  if (clienteDetalhe) {
    const historico = historicoCliente(clienteDetalhe, aves);
    return (
      <div>
        <SectionTitle>Clientes</SectionTitle>
        <ClienteDetalhe
          cliente={clienteDetalhe}
          historico={historico}
          onBack={() => setDetalheId(null)}
          onEdit={(c) => { setDetalheId(null); setEditando(c); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onDelete={(id) => { onDelete(id); setDetalheId(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>Clientes</SectionTitle>
        {!showForm && (
          <button
            onClick={() => { setEditando(emptyCliente()); setShowForm(true); setFormError(""); }}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#C69A2E", color: "#2B1D14" }}
          >
            <Plus size={16} /> Novo cliente
          </button>
        )}
      </div>

      {showForm && (
        <ClienteForm
          inicial={editando || emptyCliente()}
          onSave={salvar}
          onCancel={() => { setShowForm(false); setEditando(null); setFormError(""); }}
          error={formError}
        />
      )}

      {candidatos.length > 0 && !showForm && (
        <Card className="p-4 mb-6">
          <div className="ui-sans text-sm mb-3" style={{ color: "#2B241C" }}>
            Encontramos <strong>{candidatos.length}</strong> {candidatos.length === 1 ? "comprador" : "compradores"} em vendas ja cadastradas que ainda {candidatos.length === 1 ? "nao esta" : "nao estao"} na lista de clientes:
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {candidatos.map((c, i) => (
              <span key={i} className="ui-mono text-xs px-2 py-1 rounded" style={{ background: "#f0e6d2", color: "#8a6f2e" }}>
                {c.nome}{c.telefone ? ` - ${c.telefone}` : ""}
              </span>
            ))}
          </div>
          <button
            onClick={() => onImportar(candidatos)}
            className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "#556b3f", color: "#F1E6D2" }}
          >
            <Users size={15} /> Importar {candidatos.length === 1 ? "esse comprador" : "todos como clientes"}
          </button>
        </Card>
      )}

      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8a7a63" }} />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="ui-sans w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", color: "#2B241C" }}
        />
      </div>

      {filtrados.length === 0 ? (
        <Card className="p-8 text-center ui-sans" style={{ color: "#8a7a63" }}>
          Nenhum cliente cadastrado ainda. Cadastre pelo nome/telefone de quem ja comprou (ou vai comprar) uma ave.
        </Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtrados.map((c) => (
            <ClienteCard
              key={c.id}
              c={c}
              historico={historicoCliente(c, aves)}
              onOpen={setDetalheId}
              onEdit={(cli) => { setEditando(cli); setShowForm(true); setFormError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

