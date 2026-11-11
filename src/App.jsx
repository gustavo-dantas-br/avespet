import React, { useState, useEffect, useRef, useCallback } from "react";
import { StatCard, TreeCard } from "./features/dashboard/components/CardsDashboard";
import AveCard from "./features/plantel/components/AveCard";
import { Card, SectionTitle, inputStyle, Field } from "./components/ui/SharedUI";
import SuporteWhatsApp from "./components/SuporteWhatsApp";
import { compressPhoto } from "./features/plantel/utils/comprimirFoto";
import { emptyAve, emptyDespesa, emptyMutacao, emptyIndicacao, emptyAnuncio, emptyPerfilCriador, emptyPerfilPrivado, emptyCliente, emptyFornecedor } from "./lib/modelos";
import { hojeISO, primeiroDiaMesISO, ultimoDiaMesISO, primeiroDiaAnoISO, money } from "./lib/formatadores";
import { normalizeTelefone, whatsappUrl } from "./lib/telefone";
import { computeFinanceiro, computeFinanceiroPeriodo } from "./features/financeiro/utils/calcularFinanceiro";
import { drawPlaque } from "./features/plantel/utils/desenharPlaca";
import {
  Bird, Plus, Search, GitBranch, Tag, Upload, Trash2, X, Loader2, Save,
  Download, Feather, DollarSign, LogOut, LayoutDashboard, Dna, Users, Phone, Pencil, ClipboardCheck, Truck, MessageCircle, Handshake, Megaphone, UserCircle, ShieldCheck, Check, Bell, Eye, MousePointerClick, Egg, BookOpen,
} from "lucide-react";

import { supabase } from "./supabaseClient";

import {
  listRows, saveRow, deleteRow, uid, getPerfil, savePerfil, getPerfilPrivado, savePerfilPrivado, listAnuncios, saveAnuncio, deleteAnuncio,
  checkIsAdmin, listTodosAnunciosParaAdmin, updateAnuncioStatus, listPerfisPublicos,
  listPerdidas, savePerdida, deletePerdida, buscarPerdidaPorAnilha,
  listAchadosAnilha, atualizarStatusAchado,
  listAnunciosAvesPerdidasAdmin, atualizarStatusAnuncioAvePerdida,
} from "./lib/db";

import AuthPage from "./components/AuthPage";
import NotificationsCenter from "./components/NotificationsCenter";
import { PerdiUmaAve } from "./features/aves-perdidas";
import ConteudoAdmin from "./conteudo/ConteudoAdmin";
import { AdminCampanhas } from "./features/campanhas";
import ModeracaoAvesPerdidasTab from "./features/aves-perdidas/components/ModeracaoAvesPerdidasTab";
import AchadosTab from "./features/aves-perdidas/components/AchadosTab";
import AprovacoesTab from "./features/anuncios/components/AprovacoesTab";
import CalculadoraGenetica from "./features/genetica/components/CalculadoraGenetica";
import ListaTab from "./features/plantel/components/ListaTab";
import DashboardTab from "./features/dashboard/components/DashboardTab";
import FinanceiroTab from "./features/financeiro/components/FinanceiroTab";
import ReproducaoTab from "./features/reproducao/components/ReproducaoTab";
import ClientesTab from "./features/clientes/ClientesTab";
import FornecedoresTab from "./features/fornecedores/FornecedoresTab";
import PosVendaTab from "./features/pos-venda/PosVendaTab";
import IndicacoesTab from "./features/indicacoes/IndicacoesTab";
import PerfilTab from "./features/perfil/PerfilTab";
import AnunciosTab from "./features/anuncios/AnunciosTab";
import FormTab from "./features/plantel/FormTab";
import { SeletorComprador, SeletorFornecedor } from "./features/plantel/components/SeletoresCadastro";
import PesoHistorico from "./features/plantel/PesoHistorico";
import ArvoreTab from "./features/plantel/ArvoreTab";
import PlacaTab from "./features/plantel/PlacaTab";
import MutacoesTab from "./features/genetica/MutacoesTab";
import { usePath } from "./publico/roteador";

// ---------------------------------------------------------------------------
// Design tokens
// bg base:      #2B1D14  (walnut, header/sidebar)
// panel:        #FAF3E6  (parchment card)
// accent gold:  #C69A2E
// accent rust:  #A6402B
// accent sage:  #6E7B57
// ink:          #2B241C
// ---------------------------------------------------------------------------

const ESPECIES = ["Ring Neck", "Calopsita", "Outra"];
const SEXOS = ["Macho", "Femea", "Indefinido"];
const STATUS_AVE = ["No plantel", "A venda", "Reservada", "Vendida", "Falecida", "Perdida"];
const STATUS_PLANTEL = ["No plantel", "A venda", "Reservada"];
const STATUS_POSVENDA = ["Venda realizada", "Entregue", "Primeiro contato", "Acompanhamento", "Cliente satisfeito"];
const SATISFACAO_OPCOES = ["Pendente", "Sim", "Nao"];
const ORIGEM_TIPOS = ["Nasceu no plantel", "Comprada"];
const DESPESA_TIPOS = ["Racao", "Veterinario/Medicamento", "Gaiola/Equipamento", "Anilha", "Outro"];
const TIPOS_HERANCA = [
  "Cor base (selvagem)",
  "Autossomica recessiva",
  "Autossomica dominante",
  "Ligada ao sexo (recessiva)",
  "Ligada ao sexo (dominante)",
  "Codominante",
  "Nao definido / em estudo",
];
const STATUS_INDICACAO = ["Nova", "Em atendimento", "Venda realizada", "Nao converteu"];
const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };

// ---------- Compressao de foto ----------
// Historico do cliente e sempre CALCULADO na hora, cruzando pelo telefone com
// as aves ja vendidas. Nao grava nada de novo nas aves, nao duplica dado.
// Historico do fornecedor: espelha historicoCliente, so que olhando pro lado
// da COMPRA (origemTipo === "Comprada") em vez da venda.
// ---------------------------------------------------------------------------

function AppInner({ user, onLogout }) {
  const [aves, setAves] = useState([]);
  const [despesas, setDespesas] = useState([]);
  const [mutacoes, setMutacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [indicacoes, setIndicacoes] = useState([]);
  const [posturas, setPosturas] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [perfil, setPerfil] = useState(emptyPerfilCriador());\n  const [perfilPrivado, setPerfilPrivado] = useState(emptyPerfilPrivado());
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [anunciosAprovacao, setAnunciosAprovacao] = useState([]);
  const [perfisPublicos, setPerfisPublicos] = useState([]);
  const [achados, setAchados] = useState([]);
  const [anunciosPerdidasAdmin, setAnunciosPerdidasAdmin] = useState([]);
  const [perdidas, setPerdidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyAve());
  const [saving, setSaving] = useState(false);
  const [placaId, setPlacaId] = useState("");
  const [arvoreId, setArvoreId] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // null | "A venda" | "Vendida" | "Falecida" | "casais" | "solteiros" | "plantel"
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  const loadAves = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const items = await listRows("aves", user.id);
      setAves(items.map((a) => ({ ...a, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch (e) {
      setError("Nao foi possivel carregar o cadastro. Tenta recarregar. (" + (e?.message || "") + ")");
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const loadDespesas = useCallback(async () => {
    try {
      const items = await listRows("despesas", user.id);
      setDespesas(items.map((d) => ({ ...d, synced: true })).sort((a, b) => (a.data || "").localeCompare(b.data || "")));
    } catch {
      // silencioso
    }
  }, [user.id]);

  const loadMutacoes = useCallback(async () => {
    try {
      const items = await listRows("mutacoes", user.id);
      setMutacoes(items.map((m) => ({ ...m, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso
      }
    }, [user.id]);

 

  const loadClientes = useCallback(async () => {
    try {
      const items = await listRows("clientes", user.id);
      setClientes(items.map((c) => ({ ...c, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadFornecedores = useCallback(async () => {
    try {
      const items = await listRows("fornecedores", user.id);
      setFornecedores(items.map((f) => ({ ...f, synced: true })).sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadIndicacoes = useCallback(async () => {
    try {
      const items = await listRows("indicacoes", user.id);
      setIndicacoes(items.map((i) => ({ ...i, synced: true })).sort((a, b) => (b.data || "").localeCompare(a.data || "")));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadAnuncios = useCallback(async () => {
    try {
      const items = await listAnuncios(user.id);
      setAnuncios(items.map((a) => ({ ...a, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

    const loadPerfil = useCallback(async () => {
    try {
      const [p, privado] = await Promise.all([getPerfil(user.id), getPerfilPrivado(user.id)]);\n      setPerfilPrivado({ ...emptyPerfilPrivado(), ...privado });
      if (p) {
        setPerfil({ ...emptyPerfilCriador(), ...p, synced: true });
        return;
      }

      // Dados do cadastro ficam no Auth metadata ate o primeiro acesso.
      const metadata = user.user_metadata || {};
      const nome = (metadata.nome || "").trim();
      const sobrenome = (metadata.sobrenome || "").trim();
      const telefone = (metadata.telefone || metadata.whatsapp || "").trim();
      if (nome || sobrenome || telefone) {
        const perfilInicial = {
          ...emptyPerfilCriador(),
          nome,
          sobrenome,
          nomeCompleto: [nome, sobrenome].filter(Boolean).join(" "),
          telefone,
          whatsapp: telefone,
        };
        await savePerfil(user.id, perfilInicial);
        setPerfil({ ...perfilInicial, synced: true });
      }
    } catch {
      // Mantem o cadastro funcional mesmo se a tabela de perfil estiver indisponivel.
    }
  }, [user.id, user.user_metadata]);

  const loadAdminStatus = useCallback(async () => {
    try {
      const admin = await checkIsAdmin(user.id);
      setIsAdminUser(admin);

      if (admin) {
        const [todos, perfis, achadosData, perdidasData] = await Promise.all([
          listTodosAnunciosParaAdmin(),
          listPerfisPublicos(),
          listAchadosAnilha().catch(() => []),
          listAnunciosAvesPerdidasAdmin().catch(() => []),
        ]);

        setAnunciosAprovacao(todos);
        setPerfisPublicos(perfis);
        setAchados(achadosData);
        setAnunciosPerdidasAdmin(perdidasData);
      }
    } catch {
      // silencioso - se a tabela 'admins' ainda nao existir, so nao mostra o painel
    }
  }, [user.id]);

  const loadPerdidas = useCallback(async () => {
    try {
      const items = await listPerdidas(user.id);
      setPerdidas(items.map((p) => ({ ...p, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  const loadPosturas = useCallback(async () => {
    try {
      const items = await listRows("posturas", user.id);
      setPosturas(items.map((p) => ({ ...p, synced: true })));
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, so fica vazio
    }
  }, [user.id]);

  useEffect(() => {
    loadAves();
    loadDespesas();
    loadMutacoes();
    loadClientes();
    loadFornecedores();
    loadIndicacoes();
    loadAnuncios();
    loadPerfil();
    loadAdminStatus();
    loadPerdidas();
    loadPosturas();
  }, [loadAves, loadDespesas, loadMutacoes, loadClientes, loadFornecedores, loadIndicacoes, loadAnuncios, loadPerfil, loadAdminStatus, loadPerdidas, loadPosturas]);

  function startNew() {
    setForm(emptyAve());
    setTab("form");
  }

  function goToLista(filter) {
    setStatusFilter(filter);
    setTab("lista");
  }

  function startEdit(ave) {
    setForm({ ...emptyAve(), ...ave });
    setTab("form");
  }

  async function handleSave() {
    if (!form.nome.trim()) {
      setError("Da um nome pra ave antes de salvar.");
      return;
    }
    setSaving(true);
    setError("");
    const id = form.id || uid();
    let toSave = { ...form, id, criadoEm: form.criadoEm || new Date().toISOString() };

    // Vincula (ou cria) automaticamente o Cliente quando a ave e vendida.
    // Se o usuario ja selecionou um cliente existente no formulario, o
    // clienteId ja vem preenchido e nada precisa ser feito aqui.
    if (toSave.status === "Vendida" && !toSave.clienteId && (toSave.compradorNome?.trim() || toSave.compradorTelefone?.trim())) {
      const tel = normalizeTelefone(toSave.compradorTelefone);
      const nomeBusca = (toSave.compradorNome || "").trim().toLowerCase();
      let existente = null;
      if (tel) existente = clientes.find((c) => normalizeTelefone(c.telefone) === tel);
      if (!existente && nomeBusca) existente = clientes.find((c) => (c.nome || "").trim().toLowerCase() === nomeBusca);

      if (existente) {
        toSave.clienteId = existente.id;
      } else {
        const novoCliente = {
          ...emptyCliente(),
          id: uid(),
          nome: toSave.compradorNome?.trim() || "(sem nome)",
          telefone: toSave.compradorTelefone || "",
          endereco: toSave.compradorEndereco || "",
          observacoes: "Cliente criado automaticamente ao registrar essa venda.",
        };
        handleSaveCliente(novoCliente);
        toSave.clienteId = novoCliente.id;
      }
    }

    // Vincula (ou cria) automaticamente o Fornecedor quando a ave foi comprada.
    if (toSave.origemTipo === "Comprada" && !toSave.fornecedorId && (toSave.fornecedorNome?.trim() || toSave.fornecedorTelefone?.trim())) {
      const tel = normalizeTelefone(toSave.fornecedorTelefone);
      const nomeBusca = (toSave.fornecedorNome || "").trim().toLowerCase();
      let existente = null;
      if (tel) existente = fornecedores.find((f) => normalizeTelefone(f.telefone) === tel);
      if (!existente && nomeBusca) existente = fornecedores.find((f) => (f.nome || "").trim().toLowerCase() === nomeBusca);

      if (existente) {
        toSave.fornecedorId = existente.id;
      } else {
        const novoFornecedor = {
          ...emptyFornecedor(),
          id: uid(),
          nome: toSave.fornecedorNome?.trim() || "(sem nome)",
          telefone: toSave.fornecedorTelefone || "",
          endereco: toSave.fornecedorEndereco || "",
          observacoes: "Fornecedor criado automaticamente ao registrar essa compra.",
        };
        handleSaveFornecedor(novoFornecedor);
        toSave.fornecedorId = novoFornecedor.id;
      }
    }

    setAves((prev) => {
      const others = prev.filter((a) => a.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    setTab("lista");

    // Cria ou atualiza o registro publico de "ave perdida" automaticamente,
    // conforme o status mudou pra "Perdida" ou saiu dele.
    const aveAnterior = aves.find((a) => a.id === id);
    const eraPerdida = aveAnterior?.status === "Perdida";
    const agoraPerdida = toSave.status === "Perdida";
    if (agoraPerdida && !eraPerdida) {
      const existente = perdidas.find((p) => p.aveId === id);
      handleSavePerdida({
        ...(existente || {}),
        id: existente?.id,
        aveId: id,
        nomeAve: toSave.nome,
        especie: toSave.especie,
        corMutacao: toSave.corMutacao,
        anilha: toSave.anilha,
        foto: toSave.foto,
        status: "perdida",
      });
    } else if (!agoraPerdida && eraPerdida) {
      const existente = perdidas.find((p) => p.aveId === id);
      if (existente) handleSavePerdida({ ...existente, status: "encontrada" });
    }

    try {
      await saveRow("aves", user.id, toSave);
      setAves((prev) => prev.map((a) => (a.id === id ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(
        `"${form.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Use o botao de sincronizar no card dela pra tentar de novo, ou baixe o backup."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSavePerdida(perdida) {
    const id = perdida.id || uid();
    const toSave = { ...perdida, id };
    setPerdidas((prev) => {
      const others = prev.filter((p) => p.id !== id);
      return [...others, { ...toSave, synced: false }];
    });
    savePerdida(user.id, toSave)
      .then(() => setPerdidas((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p))))
      .catch((e) => setError(
        `Registro de ave perdida ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'perdidas' ainda nao existe no seu Supabase, roda o schema_fase_perdidas.sql no SQL Editor."
      ));
  }

  async function handleSync(ave) {
    try {
      await saveRow("aves", user.id, ave);
      setAves((prev) => prev.map((a) => (a.id === ave.id ? { ...a, synced: true } : a)));
      setError("");
    } catch (e) {
      setError(`Ainda nao consegui sincronizar "${ave.nome}" (${e?.message || "erro desconhecido"}).`);
    }
  }

  // Atualiza so os campos de pos-venda de uma ave ja vendida, sem passar
  // pelo formulario inteiro de cadastro.
  async function handleUpdatePosVenda(aveId, patch) {
    const atualizada = aves.find((a) => a.id === aveId);
    if (!atualizada) return;
    const toSave = { ...atualizada, ...patch };
    setAves((prev) => prev.map((a) => (a.id === aveId ? { ...toSave, synced: false } : a)));
    try {
      await saveRow("aves", user.id, toSave);
      setAves((prev) => prev.map((a) => (a.id === aveId ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(`Pos-venda de "${atualizada.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remover essa ave do cadastro?")) return;
    setAves((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteRow("aves", id);
    } catch {
      setError("Removida da lista, mas pode ainda existir no banco (falha de conexao). Sem problema, ela nao vai reaparecer aqui.");
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressPhoto(file);
      setForm((f) => ({ ...f, foto: dataUrl }));
    } catch {
      setError("Nao consegui processar essa foto.");
    }
  }

  async function handleSaveDespesa(despesa) {
    const id = despesa.id || uid();
    const toSave = { ...despesa, id };
    setDespesas((prev) => {
      const others = prev.filter((d) => d.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.data || "").localeCompare(b.data || ""));
    });
    try {
      await saveRow("despesas", user.id, toSave);
      setDespesas((prev) => prev.map((d) => (d.id === id ? { ...d, synced: true } : d)));
    } catch (e) {
      setError(`Despesa ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleDeleteDespesa(id) {
    setDespesas((prev) => prev.filter((d) => d.id !== id));
    try {
      await deleteRow("despesas", id);
    } catch {
      // ja removida localmente
    }
  }

  async function handleSaveMutacao(mutacao) {
    if (!mutacao.nome.trim()) return;
    const id = mutacao.id || uid();
    const toSave = { ...mutacao, id };
    setMutacoes((prev) => {
      const others = prev.filter((m) => m.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    try {
      await saveRow("mutacoes", user.id, toSave);
      setMutacoes((prev) => prev.map((m) => (m.id === id ? { ...m, synced: true } : m)));
    } catch (e) {
      setError(
        `Mutacao ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'mutacoes' ainda nao existe no seu Supabase, roda o schema_fase2.sql no SQL Editor."
      );
    }
  }

  async function handleDeleteMutacao(id) {
    setMutacoes((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteRow("mutacoes", id);
    } catch {
      // ja removida localmente
    }
  }

  function handleSaveCliente(cliente) {
    if (!cliente.nome.trim()) return { ok: false, error: "Da um nome pro cliente." };
    const telNorm = normalizeTelefone(cliente.telefone);
    if (telNorm) {
      const duplicado = clientes.find((c) => c.id !== cliente.id && normalizeTelefone(c.telefone) === telNorm);
      if (duplicado) {
        return { ok: false, error: `Ja existe um cliente com esse telefone: ${duplicado.nome}. Edita ele em vez de criar outro.` };
      }
    }
    const id = cliente.id || uid();
    const toSave = { ...cliente, id, criadoEm: cliente.criadoEm || new Date().toISOString() };
    setClientes((prev) => {
      const others = prev.filter((c) => c.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    saveRow("clientes", user.id, toSave)
      .then(() => setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, synced: true } : c))))
      .catch((e) => setError(
        `"${cliente.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'clientes' ainda nao existe no seu Supabase, roda o schema_fase_clientes.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteCliente(id) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteRow("clientes", id);
    } catch {
      // ja removido localmente
    }
  }

  function handleImportarClientes(candidatos) {
    const novos = candidatos.map((c) => ({
      ...emptyCliente(),
      ...c,
      id: uid(),
      criadoEm: new Date().toISOString(),
    }));
    setClientes((prev) => [...prev, ...novos.map((c) => ({ ...c, synced: false }))].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    novos.forEach((c) => {
      saveRow("clientes", user.id, c)
        .then(() => setClientes((prev) => prev.map((x) => (x.id === c.id ? { ...x, synced: true } : x))))
        .catch(() => setError(`"${c.nome}" foi importado na tela, mas nao sincronizou ainda. Use o botao de sincronizar depois.`));
    });
  }

  function handleSaveFornecedor(fornecedor) {
    if (!fornecedor.nome.trim()) return { ok: false, error: "Da um nome pro fornecedor." };
    const telNorm = normalizeTelefone(fornecedor.telefone);
    if (telNorm) {
      const duplicado = fornecedores.find((f) => f.id !== fornecedor.id && normalizeTelefone(f.telefone) === telNorm);
      if (duplicado) {
        return { ok: false, error: `Ja existe um fornecedor com esse telefone: ${duplicado.nome}. Edita ele em vez de criar outro.` };
      }
    }
    const id = fornecedor.id || uid();
    const toSave = { ...fornecedor, id, criadoEm: fornecedor.criadoEm || new Date().toISOString() };
    setFornecedores((prev) => {
      const others = prev.filter((f) => f.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
    });
    saveRow("fornecedores", user.id, toSave)
      .then(() => setFornecedores((prev) => prev.map((f) => (f.id === id ? { ...f, synced: true } : f))))
      .catch((e) => setError(
        `"${fornecedor.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'fornecedores' ainda nao existe no seu Supabase, roda o schema_fase_fornecedores.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteFornecedor(id) {
    setFornecedores((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteRow("fornecedores", id);
    } catch {
      // ja removido localmente
    }
  }

  function handleImportarFornecedores(candidatos) {
    const novos = candidatos.map((f) => ({
      ...emptyFornecedor(),
      ...f,
      id: uid(),
      criadoEm: new Date().toISOString(),
    }));
    setFornecedores((prev) => [...prev, ...novos.map((f) => ({ ...f, synced: false }))].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    novos.forEach((f) => {
      saveRow("fornecedores", user.id, f)
        .then(() => setFornecedores((prev) => prev.map((x) => (x.id === f.id ? { ...x, synced: true } : x))))
        .catch(() => setError(`"${f.nome}" foi importado na tela, mas nao sincronizou ainda. Use o botao de sincronizar depois.`));
    });
  }

  function handleSaveIndicacao(indicacao) {
    if (!indicacao.nomeIndicado?.trim()) return { ok: false, error: "Da o nome da pessoa indicada." };
    const id = indicacao.id || uid();
    const toSave = { ...indicacao, id, criadoEm: indicacao.criadoEm || new Date().toISOString() };
    setIndicacoes((prev) => {
      const others = prev.filter((i) => i.id !== id);
      return [...others, { ...toSave, synced: false }].sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    });
    saveRow("indicacoes", user.id, toSave)
      .then(() => setIndicacoes((prev) => prev.map((i) => (i.id === id ? { ...i, synced: true } : i))))
      .catch((e) => setError(
        `Indicacao ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'indicacoes' ainda nao existe no seu Supabase, roda o schema_fase_indicacoes.sql no SQL Editor."
      ));
    return { ok: true };
  }

  async function handleDeleteIndicacao(id) {
    setIndicacoes((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteRow("indicacoes", id);
    } catch {
      // ja removida localmente
    }
  }

  function handleSavePostura(postura) {
    const { synced, ...limpa } = postura;
    const id = limpa.id || uid();
    const toSave = { ...limpa, id, criadoEm: limpa.criadoEm || new Date().toISOString() };
    setPosturas((prev) => {
      const others = prev.filter((p) => p.id !== id);
      return [...others, { ...toSave, synced: false }];
    });
    saveRow("posturas", user.id, toSave)
      .then(() => setPosturas((prev) => prev.map((p) => (p.id === id ? { ...p, synced: true } : p))))
      .catch((e) => setError(
        `Postura ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'posturas' ainda nao existe no seu Supabase, roda o schema_fase_posturas.sql no SQL Editor."
      ));
  }

  async function handleDeletePostura(id) {
    setPosturas((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteRow("posturas", id);
    } catch {
      // ja removida localmente
    }
  }

  // Cria a ave filhote (so quando o usuario clica) e liga o ovo a ela.
  async function handleRegistrarNascimento(postura, numeroOvo, { nome, dataEclosao }) {
    const pai = aves.find((a) => a.id === postura.paiId);
    const mae = aves.find((a) => a.id === postura.maeId);
    const aveId = uid();
    const nascimento = formatarDataBR(dataEclosao);
    const novaAve = {
      ...emptyAve(),
      id: aveId,
      nome: (nome || "").trim() || `Filhote ${nascimento.slice(0, 5)}`,
      especie: pai?.especie || mae?.especie || "Ring Neck",
      sexo: "Indefinido",
      nascimento,
      paiId: postura.paiId || "",
      maeId: postura.maeId || "",
      status: "No plantel",
      origemTipo: "Nasceu no plantel",
      criador: pai?.criador || mae?.criador || "Dantas",
      criadoEm: new Date().toISOString(),
    };
    setAves((prev) => [...prev, { ...novaAve, synced: false }].sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
    handleSavePostura({
      ...postura,
      ovos: (postura.ovos || []).map((o) => (o.n === numeroOvo ? { ...o, status: "Nasceu", aveId, dataEclosao } : o)),
    });
    try {
      await saveRow("aves", user.id, novaAve);
      setAves((prev) => prev.map((a) => (a.id === aveId ? { ...a, synced: true } : a)));
    } catch (e) {
      setError(`O filhote "${novaAve.nome}" ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). Use o botao Sincronizar no card dele.`);
    }
  }

 function handleSaveAnuncio(anuncio) {
  if (!anuncio.aveId) return { ok: false, error: "Selecione a ave pra anunciar." };
  if (!anuncio.preco) return { ok: false, error: "Informe o preco do anuncio." };
  const id = anuncio.id || uid();
  const ehNovo = !anuncio.id;
  const toSave = { ...anuncio, id, criadoEm: anuncio.criadoEm || new Date().toISOString() };
  setAnuncios((prev) => {
    const others = prev.filter((a) => a.id !== id);
    // anuncio novo sempre comeca "pendente" (so entra no ar depois de aprovado)
    return [...others, { ...toSave, status: ehNovo ? (isAdminUser ? "aprovado" : "pendente") : toSave.status, synced: false }];
  });
    saveAnuncio(user.id, toSave)
      .then(() => setAnuncios((prev) => prev.map((a) => (a.id === id ? { ...a, synced: true } : a))))
      .catch((e) => setError(
        `Anuncio ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se as tabelas 'anuncios'/'perfil_criador' ainda nao existem no seu Supabase, roda o schema_fase_anuncios.sql no SQL Editor."
      ));
    return { ok: true };
    }

  function handleToggleAnuncioAtivo(anuncio) {
    handleSaveAnuncio({ ...anuncio, ativo: !anuncio.ativo });
  }

  async function handleDeleteAnuncio(id) {
    setAnuncios((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAnuncio(id);
    } catch {
      // ja removido localmente
    }
  }

  function handleSavePerfil(novoPerfil) {
    setPerfil({ ...novoPerfil, synced: false });
    savePerfil(user.id, novoPerfil)
      .then(() => setPerfil({ ...novoPerfil, synced: true }))
      .catch((e) => setError(
        `Perfil ficou na tela, mas nao salvou no banco (${e?.message || "erro desconhecido"}). ` +
        "Se a tabela 'perfil_criador' ainda nao existe no seu Supabase, roda o schema_fase_anuncios.sql no SQL Editor."
      ));
  }

  async function handleSavePerfilPrivado(dados) {
    setPerfilPrivado(dados);
    try {
      await savePerfilPrivado(user.id, dados);
      setError("");
    } catch (e) {
      setError("Nao foi possivel salvar o endereco privado (" + (e?.message || "erro desconhecido") + ").");
    }
  }

  async function handleUpdateEmail(novoEmail) {
    const { error: authError } = await supabase.auth.updateUser({ email: novoEmail });
    if (authError) setError("Nao foi possivel solicitar a troca de e-mail: " + authError.message);
    else setError("Solicitacao enviada. Confirme o novo e-mail pelo link enviado pelo Supabase para concluir a alteracao.");
  }

  async function handleModerarAnuncio(id, novoStatus) {
    setAnunciosAprovacao((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    try {
      await updateAnuncioStatus(id, novoStatus);
    } catch (e) {
      setError(`Nao consegui atualizar o status desse anuncio (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleModerarAvePerdida(id, novoStatus) {
    const anterior = anunciosPerdidasAdmin;
    setAnunciosPerdidasAdmin((prev) => prev.map((a) => a.id === id ? { ...a, status: novoStatus } : a));
    try {
      await atualizarStatusAnuncioAvePerdida(id, novoStatus);
    } catch (e) {
      setAnunciosPerdidasAdmin(anterior);
      setError(`Nao consegui moderar esse anuncio (${e?.message || "erro desconhecido"}).`);
    }
  }

  async function handleAtualizarAchado(id, novoStatus) {
    setAchados((prev) => prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    try {
      await atualizarStatusAchado(id, novoStatus);
    } catch (e) {
      setError(`Nao consegui atualizar esse achado (${e?.message || "erro desconhecido"}).`);
    }
  }

  useEffect(() => {
    if (tab !== "placa" || !placaId) return;
    const ave = aves.find((a) => a.id === placaId);
    if (!ave || !canvasRef.current) return;
    if (ave.foto) {
      const img = new Image();
      img.onload = () => drawPlaque(canvasRef.current, ave, img);
      img.src = ave.foto;
    } else {
      drawPlaque(canvasRef.current, ave, null);
    }
  }, [tab, placaId, aves]);

  function downloadPlaca() {
    if (!canvasRef.current) return;
    const ave = aves.find((a) => a.id === placaId);
    const link = document.createElement("a");
    link.download = `placa_${(ave?.nome || "ave").replace(/\s+/g, "_")}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  // Backup completo: todas as tabelas do criador num unico arquivo ("versao: 2").
  // O formato antigo (so uma lista de aves) continua sendo aceito na importacao.
  function handleExport() {
    const backup = {
      app: "avespet",
      versao: 2,
      exportadoEm: new Date().toISOString(),
      dados: {
        aves: aves.map(semSynced),
        despesas: despesas.map(semSynced),
        mutacoes: mutacoes.map(semSynced),
        clientes: clientes.map(semSynced),
        fornecedores: fornecedores.map(semSynced),
        indicacoes: indicacoes.map(semSynced),
        posturas: posturas.map(semSynced),
        anuncios: anuncios.map(semSynced),
        perdidas: perdidas.map(semSynced),
        perfil: Object.values(semSynced(perfil)).some(Boolean) ? semSynced(perfil) : null,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_avespet_${hojeLocalISO()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Restaura GRAVANDO no banco (antes so ia pra tela do aparelho). Mescla por id:
  // registros com o mesmo id sao sobrescritos pelos do arquivo, nada e apagado.
  // Pode importar o mesmo arquivo de novo sem duplicar.
  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      const dados = Array.isArray(imported) ? { aves: imported } : imported?.dados;
      if (!dados || typeof dados !== "object") throw new Error("arquivo invalido");
      const lista = (nome) => (Array.isArray(dados[nome]) ? dados[nome].filter((r) => r && r.id) : []);
      const perfilImp = dados.perfil && typeof dados.perfil === "object" && !Array.isArray(dados.perfil) ? dados.perfil : null;

      const rotulos = {
        aves: "aves", despesas: "despesas", mutacoes: "mutacoes", clientes: "clientes", fornecedores: "fornecedores",
        indicacoes: "indicacoes", posturas: "posturas", anuncios: "anuncios", perdidas: "aves perdidas",
      };
      const resumo = Object.keys(rotulos).map((k) => [rotulos[k], lista(k).length]).filter(([, n]) => n > 0);
      if (!resumo.length && !perfilImp) throw new Error("backup vazio");
      const linhas = resumo.map(([nome, n]) => `- ${n} ${nome}`).concat(perfilImp ? ["- seu perfil de criador"] : []).join("\n");
      if (!confirm(`Restaurar este backup?\n\n${linhas}\n\nRegistros com o mesmo ID serao sobrescritos pelos do arquivo. Nada e apagado.`)) return;

      const tarefas = [];
      ["aves", "despesas", "mutacoes", "clientes", "fornecedores", "indicacoes", "posturas"].forEach((tabela) =>
        lista(tabela).forEach((r) => tarefas.push({ chave: `${tabela}:${r.id}`, run: () => saveRow(tabela, user.id, semSynced(r)) }))
      );
      lista("anuncios").forEach((r) => tarefas.push({ chave: `anuncios:${r.id}`, run: () => saveAnuncio(user.id, semSynced(r)) }));
      lista("perdidas").forEach((r) => tarefas.push({ chave: `perdidas:${r.id}`, run: () => savePerdida(user.id, semSynced(r)) }));
      if (perfilImp) tarefas.push({ chave: "perfil", run: () => savePerfil(user.id, semSynced(perfilImp)) });

      const gravados = new Set();
      let falhas = 0;
      for (let i = 0; i < tarefas.length; i += 5) {
        const lote = tarefas.slice(i, i + 5);
        const resultados = await Promise.allSettled(lote.map((tarefa) => tarefa.run()));
        resultados.forEach((r, j) => {
          if (r.status === "fulfilled") gravados.add(lote[j].chave);
          else falhas++;
        });
      }

      const mesclar = (tabela, prev) => {
        const porId = new Map(prev.map((r) => [r.id, r]));
        lista(tabela).forEach((r) => porId.set(r.id, { ...r, synced: gravados.has(`${tabela}:${r.id}`) }));
        return Array.from(porId.values());
      };
      const porNome = (a, b) => (a.nome || "").localeCompare(b.nome || "");
      setAves((p) => mesclar("aves", p).sort(porNome));
      setDespesas((p) => mesclar("despesas", p).sort((a, b) => (a.data || "").localeCompare(b.data || "")));
      setMutacoes((p) => mesclar("mutacoes", p).sort(porNome));
      setClientes((p) => mesclar("clientes", p).sort(porNome));
      setFornecedores((p) => mesclar("fornecedores", p).sort(porNome));
      setIndicacoes((p) => mesclar("indicacoes", p).sort((a, b) => (b.data || "").localeCompare(a.data || "")));
      setPosturas((p) => mesclar("posturas", p));
      setPerdidas((p) => mesclar("perdidas", p));
      if (perfilImp) setPerfil({ ...emptyPerfilCriador(), ...perfilImp, synced: gravados.has("perfil") });
      // anuncios: o banco decide o status (criador comum volta pra analise), entao recarrega de la
      if (lista("anuncios").length) await loadAnuncios();

      const gravadosOk = tarefas.length - falhas;
      setError(
        falhas === 0
          ? `Backup restaurado: ${gravadosOk} ${gravadosOk === 1 ? "registro gravado" : "registros gravados"} no banco.${lista("anuncios").length && !isAdminUser ? " Os anuncios voltam para analise." : ""}`
          : `Backup restaurado em parte: ${gravadosOk} de ${tarefas.length} gravados no banco, ${falhas} ${falhas === 1 ? "falhou" : "falharam"}. Importe o mesmo arquivo de novo para tentar outra vez (nada e duplicado).`
      );
    } catch {
      setError("Nao consegui ler esse arquivo de backup.");
    } finally {
      e.target.value = "";
    }
  }

  const bySearch = aves.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (a.nome || "").toLowerCase().includes(q) ||
      (a.anilha || "").toLowerCase().includes(q) ||
      (a.especie || "").toLowerCase().includes(q)
    );
  });

  const filtered = bySearch.filter((a) => {
    if (!statusFilter) return true;
    if (statusFilter === "casais") return !!a.parceiroId || !!a.casalLabel?.trim();
    if (statusFilter === "solteiros") return !a.parceiroId && !a.casalLabel?.trim();
    if (statusFilter === "plantel") return STATUS_PLANTEL.includes(a.status);
    return a.status === statusFilter;
  });

  const casaisAgrupados = (() => {
    if (statusFilter !== "casais") return [];
    const usados = new Set();
    const pares = [];
    filtered.forEach((a) => {
      if (usados.has(a.id)) return;
      const parceiro = a.parceiroId ? aves.find((x) => x.id === a.parceiroId) : null;
      usados.add(a.id);
      if (parceiro) usados.add(parceiro.id);
      pares.push({ a, b: parceiro, label: a.casalLabel || parceiro?.casalLabel || "" });
    });
    return pares;
  })();

  const machoOptions = aves.filter((a) => a.sexo === "Macho");
  const femeaOptions = aves.filter((a) => a.sexo === "Femea");
  const parceiroOptions = aves.filter((a) => a.id !== form.id && (form.sexo === "Macho" ? a.sexo === "Femea" : form.sexo === "Femea" ? a.sexo === "Macho" : true));

  const arvoreAve = aves.find((a) => a.id === arvoreId);
  const filhos = arvoreAve ? aves.filter((a) => a.paiId === arvoreAve.id || a.maeId === arvoreAve.id) : [];
  const pai = arvoreAve?.paiId ? aves.find((a) => a.id === arvoreAve.paiId) : null;
  const mae = arvoreAve?.maeId ? aves.find((a) => a.id === arvoreAve.maeId) : null;
  const parceiro = arvoreAve?.parceiroId ? aves.find((a) => a.id === arvoreAve.parceiroId) : null;

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row" style={{ background: "#2B1D14", fontFamily: "'Fraunces', serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ui-sans { font-family: 'Inter', sans-serif; }
        .ui-mono { font-family: 'IBM Plex Mono', monospace; }
        ::selection { background: #C69A2E; color: #2B1D14; }
      `}</style>

      <aside
        className="w-full md:w-60 shrink-0 flex flex-col items-stretch py-3 md:py-6 px-3 md:px-4 gap-2 md:gap-0"
        style={{ background: "#241609", borderBottom: "1px solid #4a2c18", borderRight: "1px solid #4a2c18" }}
      >
        <div className="flex items-center justify-between gap-3 mb-1 md:mb-8 px-1 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Feather size={20} color="#C69A2E" />
            <div>
              <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
                Aves<span style={{ color: "#C69A2E" }}>pet</span>
              </div>
              <div className="ui-mono hidden md:block" style={{ color: "#8a6f4a", fontSize: 10, letterSpacing: 1 }}>GESTAO DO CRIATORIO</div>
            </div>
          </div>
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => setTab("dashboard")}
              aria-label="Voltar ao início"
              className="ui-sans flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: tab === "dashboard" ? "#3a2314" : "#332113", color: "#F1E6D2", border: "1px solid #6b4b25" }}
            >
              <LayoutDashboard size={15} /> Início
            </button>
            <button
              onClick={onLogout}
              className="ui-sans flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
              style={{ background: "#332113", color: "#e6c9a4", border: "1px solid #6b4b25" }}
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </div>

        <nav className="w-full flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-1 md:flex-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "lista", label: "Aves", icon: Bird },
            { id: "form", label: "Cadastrar", icon: Plus },
            { id: "arvore", label: "Arvore", icon: GitBranch },
            { id: "reproducao", label: "Reproducao", icon: Egg },
            { id: "placa", label: "Placa", icon: Tag },
            { id: "financeiro", label: "Financeiro", icon: DollarSign },
            { id: "clientes", label: "Clientes", icon: Users },
            { id: "fornecedores", label: "Fornecedores", icon: Truck },
            { id: "posvenda", label: "Pos-venda", icon: ClipboardCheck },
            { id: "indicacoes", label: "Indicacoes", icon: Handshake },
            { id: "anuncios", label: "Anuncios", icon: Megaphone },
            { id: "perdi-uma-ave", label: "Ave perdida", icon: Bird },
            { id: "perfil", label: "Perfil", icon: UserCircle },
            ...(isAdminUser ? [{ id: "aprovacoes", label: "Aprovacoes", icon: ShieldCheck }] : []),
            ...(isAdminUser ? [{ id: "achados", label: "Achados", icon: Bell }] : []),
            ...(isAdminUser ? [{ id: "aves-perdidas-admin", label: "Aves perdidas", icon: Bird }, { id: "campanhas-admin", label: "Campanhas", icon: Megaphone }] : []),
            ...(isAdminUser ? [{ id: "conteudo", label: "Conteudo", icon: BookOpen }] : []),


            { id: "mutacoes", label: "Genetica", icon: Dna },
          ].map(({ id, label: lbl, icon: Icon }) => (
            <button
              key={id}
              onClick={() => (id === "form" ? startNew() : id === "lista" ? goToLista(null) : setTab(id))}
              className="ui-sans flex items-center gap-2 md:gap-3 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-left transition-colors shrink-0"
              style={{
                background: tab === id ? "#3a2314" : "transparent",
                color: tab === id ? "#F1E6D2" : "#b09a78",
                fontWeight: tab === id ? 600 : 500,
              }}
            >
              <Icon size={16} />
              {lbl}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex mt-auto flex-col gap-2">
          <div className="ui-mono text-[11px]" style={{ color: "#6b5638" }}>
            {aves.length} {aves.length === 1 ? "ave cadastrada" : "aves cadastradas"}
          </div>
          <div className="ui-mono text-[10px] truncate" style={{ color: "#5a4a30" }}>{user.email}</div>
          <button onClick={onLogout} className="ui-sans flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg self-start" style={{ color: "#b09a78" }}>
            <LogOut size={13} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0" style={{ minHeight: "60vh" }}>
        <NotificationsCenter userId={user.id} isAdmin={isAdminUser} onNavigate={setTab} />
        {error && (
          <div className="ui-sans mb-4 px-4 py-2.5 rounded-lg flex items-center justify-between" style={{ background: "#4a2018", color: "#f2c9c0", border: "1px solid #7a3226" }}>
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")}><X size={16} /></button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 ui-sans" style={{ color: "#F1E6D2" }}>
            <Loader2 className="animate-spin" size={18} /> Carregando cadastro...
          </div>
        ) : (
          <>
            {tab === "dashboard" && <DashboardTab aves={aves} despesas={despesas} clientes={clientes} indicacoes={indicacoes} posturas={posturas} setTab={setTab} goToLista={goToLista} STATUS_PLANTEL={STATUS_PLANTEL} SectionTitle={SectionTitle} StatCard={StatCard} money={money} Card={Card} />}

            {tab === "reproducao" && (
              <ReproducaoTab aves={aves} posturas={posturas} onSave={handleSavePostura} onDelete={handleDeletePostura} onNascimento={handleRegistrarNascimento} Card={Card} Field={Field} inputStyle={inputStyle} SectionTitle={SectionTitle} />
            )}

            {tab === "lista" && (
              <ListaTab
                aves={filtered} search={search} setSearch={setSearch}
                onEdit={startEdit} onDelete={handleDelete} onNew={startNew}
                onSync={handleSync} onExport={handleExport} onImport={handleImport}
                statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                casaisAgrupados={casaisAgrupados}
                Card={Card} SectionTitle={SectionTitle} AveCard={AveCard} FILTER_LABELS={FILTER_LABELS}
              />
            )}

            {tab === "form" && (
              <FormTab
                form={form} setForm={setForm} onSave={handleSave} onPhoto={handlePhoto} saving={saving}
                machoOptions={machoOptions} femeaOptions={femeaOptions} parceiroOptions={parceiroOptions}
                mutacoes={mutacoes} clientes={clientes} fornecedores={fornecedores} onCancel={() => setTab("lista")}
                Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle}
                ESPECIES={ESPECIES} SEXOS={SEXOS} STATUS_AVE={STATUS_AVE} ORIGEM_TIPOS={ORIGEM_TIPOS}
                SeletorComprador={SeletorComprador} SeletorFornecedor={SeletorFornecedor} PesoHistorico={PesoHistorico}
              />
            )}

            {tab === "arvore" && (
              <ArvoreTab aves={aves} arvoreId={arvoreId} setArvoreId={setArvoreId} arvoreAve={arvoreAve} pai={pai} mae={mae} parceiro={parceiro} filhos={filhos} SectionTitle={SectionTitle} Field={Field} inputStyle={inputStyle} Card={Card} />
            )}

            {tab === "placa" && (
              <PlacaTab aves={aves} placaId={placaId} setPlacaId={setPlacaId} canvasRef={canvasRef} onDownload={downloadPlaca} SectionTitle={SectionTitle} Field={Field} inputStyle={inputStyle} Card={Card} />
            )}

            {tab === "financeiro" && (
              <FinanceiroTab aves={aves} despesas={despesas} onSaveDespesa={handleSaveDespesa} onDeleteDespesa={handleDeleteDespesa} emptyDespesa={emptyDespesa} primeiroDiaMesISO={primeiroDiaMesISO} hojeISO={hojeISO} ultimoDiaMesISO={ultimoDiaMesISO} primeiroDiaAnoISO={primeiroDiaAnoISO} computeFinanceiro={computeFinanceiro} computeFinanceiroPeriodo={computeFinanceiroPeriodo} money={money} DESPESA_TIPOS={DESPESA_TIPOS} inputStyle={inputStyle} SectionTitle={SectionTitle} Card={Card} Field={Field} />
            )}

            {tab === "mutacoes" && (
  <>
              {isAdminUser && <CalculadoraGenetica aves={aves} mutacoes={mutacoes} />}
              {isAdminUser && <div className="my-8 h-px" style={{ background: "#e3d3b4" }} />}

              <MutacoesTab
                mutacoes={mutacoes}
                onSave={handleSaveMutacao}
                onDelete={handleDeleteMutacao}
                emptyMutacao={emptyMutacao}
                TIPOS_HERANCA={TIPOS_HERANCA}
                SectionTitle={SectionTitle}
                Field={Field}
                inputStyle={inputStyle}
                Card={Card}
              />
  </>
            )}

            {tab === "clientes" && (
              <ClientesTab clientes={clientes} aves={aves} onSave={handleSaveCliente} onDelete={handleDeleteCliente} onImportar={handleImportarClientes} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} money={money} whatsappUrl={whatsappUrl} emptyCliente={emptyCliente} inputStyle={inputStyle} />
            )}

            {tab === "fornecedores" && (
              <FornecedoresTab fornecedores={fornecedores} aves={aves} onSave={handleSaveFornecedor} onDelete={handleDeleteFornecedor} onImportar={handleImportarFornecedores} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} money={money} whatsappUrl={whatsappUrl} emptyFornecedor={emptyFornecedor} inputStyle={inputStyle} />
            )}

            {tab === "posvenda" && (
              <PosVendaTab aves={aves} clientes={clientes} onUpdate={handleUpdatePosVenda} Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle} STATUS_POSVENDA={STATUS_POSVENDA} SATISFACAO_OPCOES={SATISFACAO_OPCOES} />
            )}

            {tab === "indicacoes" && (
              <IndicacoesTab indicacoes={indicacoes} clientes={clientes} onSave={handleSaveIndicacao} onDelete={handleDeleteIndicacao} Card={Card} Field={Field} SectionTitle={SectionTitle} SummaryCard={StatCard} inputStyle={inputStyle} STATUS_INDICACAO={STATUS_INDICACAO} emptyIndicacao={emptyIndicacao} hojeISO={hojeISO} />
            )}

            {tab === "perdi-uma-ave" && <PerdiUmaAve userId={user.id} />}

            {tab === "anuncios" && (
              <AnunciosTab
                aves={aves} anuncios={anuncios} perfil={perfil}
                onSave={handleSaveAnuncio} onToggleAtivo={handleToggleAnuncioAtivo} onDelete={handleDeleteAnuncio}
                setTab={setTab}
                Card={Card} Field={Field} SectionTitle={SectionTitle}
                inputStyle={inputStyle} emptyAnuncio={emptyAnuncio} money={money}
              />
            )}

            {tab === "perfil" && (
              <PerfilTab perfil={perfil} privado={perfilPrivado} email={user.email} onSave={handleSavePerfil} onSavePrivado={handleSavePerfilPrivado} onUpdateEmail={handleUpdateEmail} Card={Card} Field={Field} SectionTitle={SectionTitle} inputStyle={inputStyle} />
            )}


            {tab === "aprovacoes" && isAdminUser && (
              <AprovacoesTab anuncios={anunciosAprovacao} perfis={perfisPublicos} onModerar={handleModerarAnuncio} Card={Card} SectionTitle={SectionTitle} money={money} STATUS_ANUNCIO_TONS={STATUS_ANUNCIO_TONS} STATUS_ANUNCIO_LABEL={STATUS_ANUNCIO_LABEL} />
            )}

            {tab === "achados" && isAdminUser && (
              <AchadosTab achados={achados} perfis={perfisPublicos} anuncios={anunciosPerdidasAdmin} onAtualizar={handleAtualizarAchado} />
            )}

            {tab === "aves-perdidas-admin" && isAdminUser && (
              <ModeracaoAvesPerdidasTab anuncios={anunciosPerdidasAdmin} onModerar={handleModerarAvePerdida} />
            )}

            {tab === "campanhas-admin" && isAdminUser && <AdminCampanhas />}

            {tab === "conteudo" && isAdminUser && <ConteudoAdmin />}
          </>
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UI compartilhada
// ---------------------------------------------------------------------------

// Dashboard
// ---------------------------------------------------------------------------

const FILTER_LABELS = {
  "A venda": "Aves a venda",
  Vendida: "Aves vendidas",
  Falecida: "Aves falecidas",
  casais: "Casais",
  solteiros: "Solteiros (sem parceiro)",
  plantel: "Plantel (sob sua responsabilidade)",
};

// ---------------------------------------------------------------------------
// Placa
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Financeiro
// ---------------------------------------------------------------------------

// Banco de Genetica
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Motor genetico multi-loci - usado pela CalculadoraGenetica
// Suporta: Autossomica recessiva/dominante, Codominante, Ligada ao sexo
// (recessiva/dominante). Assume loci independentes entre si (aproximacao
// padrao usada em calculadoras de criadores - nao modela ligacao fisica
// entre genes no mesmo cromossomo).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Clientes (Fase 1)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fornecedores (espelha Clientes, so que do lado da compra)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Indicacoes (Fase 6)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Perfil do Criador (Fase 8C)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Aprovacoes (Fase 8D) - so visivel/carregado pra quem esta na tabela admins
// ---------------------------------------------------------------------------

// Reproducao: posturas, ovos e nascimentos
// ---------------------------------------------------------------------------

export default function App() {
  const [session, setSession] = useState(undefined);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const caminho = usePath();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
  }

  if (passwordRecovery) {
    return <AuthPage logado={!!session} redefinirSenha onSenhaAtualizada={() => setPasswordRecovery(false)} />;
  }

// Visitante ve a area publica; quem esta logado tambem, mas so quando abre um guia/video (links compartilhados).
const emConteudo = /^\/(guias|videos)(\/|$)/.test(caminho);
if (!session || emConteudo) {
  return (
    <>
      <AuthPage logado={!!session} />
      <SuporteWhatsApp />
    </>
  );
}



return (
  <>
    <AppInner
      user={session.user}
      onLogout={() => supabase.auth.signOut()}
    />
    <SuporteWhatsApp />
  </>
);
}