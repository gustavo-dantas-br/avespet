import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bird, Plus, Search, GitBranch, Tag, Upload, Trash2, X, Loader2, Save,
  Download, Feather, DollarSign, LogOut, LayoutDashboard, Dna, Users, Phone, Pencil, ClipboardCheck, Truck, MessageCircle, Handshake, Megaphone, UserCircle, ShieldCheck, Check, Bell, Eye, MousePointerClick, Egg, BookOpen,
} from "lucide-react";

import { supabase } from "./supabaseClient";

import {
  listRows, saveRow, deleteRow, uid, getPerfil, savePerfil, listAnuncios, saveAnuncio, deleteAnuncio,
  checkIsAdmin, listTodosAnunciosParaAdmin, updateAnuncioStatus, listPerfisPublicos,
  listPerdidas, savePerdida, deletePerdida, buscarPerdidaPorAnilha,
  listAchadosAnilha, atualizarStatusAchado,
  listAnunciosAvesPerdidasAdmin, atualizarStatusAnuncioAvePerdida,
} from "./lib/db";

import AuthPage from "./components/AuthPage";
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

function emptyAve() {
  return {
    id: null,
    nome: "",
    especie: "Ring Neck",
    sexo: "Indefinido",
    corMutacao: "",
    portadores: [],
    pesos: [],
    corAnilha: "",
    anilha: "",
    nascimento: "",
    origem: "",
    criador: "Dantas",
    ctf: "",
    sexado: false,
    laudoNota: "",
    paiId: "",
    paiExterno: "",
    maeId: "",
    maeExterno: "",
    parceiroId: "",
    casalLabel: "",
    foto: "",
    status: "No plantel",
    ninhadasGeradas: "",
    garantiaDias: "",
    origemTipo: "Nasceu no plantel",
    fornecedorNome: "",
    fornecedorTelefone: "",
    fornecedorEndereco: "",
    fornecedorId: "",
    valorCompra: "",
    dataCompra: "",
    compradorNome: "",
    compradorTelefone: "",
    compradorEndereco: "",
    valorVenda: "",
    dataVenda: "",
    clienteId: "",
    dataEntrega: "",
    statusPosVenda: "Venda realizada",
    dataUltimoContato: "",
    obsPosVenda: "",
    clienteSatisfeito: "Pendente",
    criadoEm: "",
  };
}

function emptyDespesa() {
  return { id: null, tipo: "Racao", descricao: "", valor: "", data: "" };
}

function emptyMutacao() {
  return {
    id: null,
    nome: "",
    nomeAlternativo: "",
    gene: "",
    serie: "",
    tipoHeranca: "Autossomica recessiva",
    combinaCom: "",
    comoIdentificar: "",
    observacoes: "",
  };
}

function emptyIndicacao() {
  return {
    id: null,
    clienteIndicouId: "",
    nomeIndicado: "",
    telefoneIndicado: "",
    data: "",
    status: "Nova",
    observacoes: "",
    criadoEm: "",
  };
}

function emptyAnuncio() {
  return {
    id: null,
    aveId: "",
    nomeAve: "",
    especie: "",
    corMutacao: "",
    sexo: "",
    nascimento: "",
    foto: "",
    preco: "",
    descricao: "",
    ativo: true,
    criadoEm: "",
  };
}

function emptyPerfilCriador() {
  return { nomeCriatorio: "", cidade: "", uf: "", whatsapp: "" };
}

function emptyCliente() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

function emptyFornecedor() {
  return { id: null, nome: "", telefone: "", endereco: "", observacoes: "", criadoEm: "" };
}

function normalizeTelefone(t) {
  return (t || "").replace(/\D/g, "");
}

// Monta o link do WhatsApp a partir de um telefone e uma mensagem opcional.
// Funcao pura - nao le nem grava nada, so formata a URL.
function whatsappUrl(telefone, mensagem) {
  let digitos = normalizeTelefone(telefone);
  if (!digitos) return null;
  // Numeros brasileiros digitados sem DDI (10 ou 11 digitos com DDD) precisam
  // do "55" na frente pro link do WhatsApp funcionar.
  if (digitos.length <= 11) digitos = "55" + digitos;
  const base = `https://wa.me/${digitos}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// ---------- Compressao de foto ----------
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 480;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.72;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > 900000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Desenho da placa (Canvas) ----------
function drawWood(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#8a5a34");
  grad.addColorStop(0.5, "#6b4225");
  grad.addColorStop(1, "#4a2c18");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(30,16,6,0.55)";
  ctx.lineWidth = 2;
  const plankH = h / 5;
  for (let y = 0; y < h; y += plankH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  const rg = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.2, w * 0.5, h * 0.5, w * 0.75);
  rg.addColorStop(0, "rgba(0,0,0,0)");
  rg.addColorStop(1, "rgba(0,0,0,0.35)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawRibbon(ctx, x, y, w, h, text, fill, outline, textColor) {
  const notch = h * 0.32;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - notch, y + h / 2);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + notch, y + h / 2);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = "bold 30px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(text).width;
  ctx.fillText(text, x + (w - tw) / 2, y + h / 2 + 2);
}

function fieldBox(ctx, x, y, w, h, value, big) {
  ctx.fillStyle = "#faf8f0";
  ctx.strokeStyle = "#1e1006";
  ctx.lineWidth = 2;
  roundRectPath(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1c1712";
  ctx.font = (big ? "bold 42px" : "bold 30px") + " 'Fraunces', serif";
  ctx.textBaseline = "middle";
  const tw = ctx.measureText(value).width;
  ctx.fillText(value, x + (w - tw) / 2, y + h / 2 + 2);
}

function label(ctx, x, y, text) {
  ctx.fillStyle = "#e8c46a";
  ctx.font = "bold 22px 'IBM Plex Mono', monospace";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y);
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlaque(canvas, ave, photoImg) {
  const W = 1888, H = 1180;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  drawWood(ctx, W, H);

  const photoW = Math.round(W * 0.37);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const seg = 6;
  for (let i = 0; i <= seg; i++) {
    const y = (H * i) / seg;
    const x = photoW - 14 - (i % 2 === 0 ? 10 : -5);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.clip();
  if (photoImg) {
    const scale = Math.max(photoW / photoImg.width, H / photoImg.height);
    const dw = photoImg.width * scale;
    const dh = photoImg.height * scale;
    ctx.drawImage(photoImg, (photoW - dw) / 2, H * 0.32 - dh * 0.32, dw, dh);
  } else {
    ctx.fillStyle = "#3a2a1c";
    ctx.fillRect(0, 0, photoW, H);
    ctx.fillStyle = "#8a7a63";
    ctx.font = "24px 'Fraunces', serif";
    ctx.fillText("sem foto", 20, H / 2);
  }
  ctx.restore();

  const PX = photoW + 18;
  const PW = W - PX - 14;
  const half = (PW - 14) / 2;
  let y = 22;
  const rowGap = 34;

  label(ctx, PX, y, "NOME");
  fieldBox(ctx, PX, y + 30, PW, 78, ave.nome || "-", true);
  y += 30 + 78 + rowGap;

  label(ctx, PX, y, "SEXO");
  label(ctx, PX + half + 14, y, "ANILHA");
  fieldBox(ctx, PX, y + 30, half, 66, ave.sexo || "-");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, ave.anilha || "-");
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "NASCIMENTO");
  label(ctx, PX + half + 14, y, "CASAL / SEXAGEM");
  fieldBox(ctx, PX, y + 30, half, 66, ave.nascimento || "-");
  const casalSex = (ave.casalLabel ? ave.casalLabel + " - " : "") + (ave.sexado ? "SEXADO" : "S/ SEXAGEM");
  fieldBox(ctx, PX + half + 14, y + 30, half, 66, casalSex);
  y += 30 + 66 + rowGap;

  label(ctx, PX, y, "CRIADOR");
  fieldBox(ctx, PX, y + 30, PW, 66, ave.criador || "-");

  const ribbonH = 46;
  const rx = 14, ry = H - ribbonH - 12;
  drawRibbon(ctx, rx, ry, 220, ribbonH, (ave.especie || "AVE").toUpperCase(), "#a6402b", "#6e2417", "#f7dfb0");
  if (ave.corMutacao) {
    drawRibbon(ctx, rx + 220 + 14, ry, 200, ribbonH, ave.corMutacao.toUpperCase(), "#d2a014", "#826008", "#3c2300");
  }

  ctx.fillStyle = "rgba(235,220,190,0.9)";
  ctx.font = "italic 18px 'Fraunces', serif";
  const footer = `Criatorio ${ave.criador || "-"}  \u2022  CTF: ${ave.ctf || "-"}`;
  const fw = ctx.measureText(footer).width;
  ctx.fillText(footer, W - fw - 16, H - 20);
}

// ---------- Financeiro ----------
function computeFinanceiro(aves, despesas) {
  const totalCompras = aves.reduce((s, a) => s + (a.origemTipo === "Comprada" ? parseFloat(a.valorCompra) || 0 : 0), 0);
  const totalVendas = aves.reduce((s, a) => s + (a.status === "Vendida" ? parseFloat(a.valorVenda) || 0 : 0), 0);
  const totalDespesas = despesas.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
  const totalInvestido = totalCompras + totalDespesas;
  const lucro = totalVendas - totalInvestido;
  const avesVendidas = aves.filter((a) => a.status === "Vendida").length;
  return { totalCompras, totalVendas, totalDespesas, totalInvestido, lucro, avesVendidas };
}

function computeFinanceiroPeriodo(aves, despesas, inicio, fim) {
  const dentro = (d) => (!d ? false : (!inicio || d >= inicio) && (!fim || d <= fim));

  const comprasPeriodo = aves.filter((a) => a.origemTipo === "Comprada" && dentro(a.dataCompra));
  const vendasPeriodo = aves.filter((a) => a.status === "Vendida" && dentro(a.dataVenda));
  const despesasPeriodo = despesas.filter((d) => dentro(d.data));

  const totalCompras = comprasPeriodo.reduce((s, a) => s + (parseFloat(a.valorCompra) || 0), 0);
  const totalVendas = vendasPeriodo.reduce((s, a) => s + (parseFloat(a.valorVenda) || 0), 0);
  const totalDespesas = despesasPeriodo.reduce((s, d) => s + (parseFloat(d.valor) || 0), 0);
  const totalInvestido = totalCompras + totalDespesas;
  const lucro = totalVendas - totalInvestido;

  const semData =
    aves.filter((a) => a.origemTipo === "Comprada" && !a.dataCompra).length +
    aves.filter((a) => a.status === "Vendida" && !a.dataVenda).length +
    despesas.filter((d) => !d.data).length;

  return {
    totalCompras, totalVendas, totalDespesas, totalInvestido, lucro,
    avesVendidas: vendasPeriodo.length, semData,
    comprasPeriodo, vendasPeriodo, despesasPeriodo,
  };
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function primeiroDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMeses);
  return d.toISOString().slice(0, 10);
}
function ultimoDiaMesISO(offsetMeses = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMeses + 1, 0);
  return d.toISOString().slice(0, 10);
}
function primeiroDiaAnoISO() {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
}

function money(n) {
  const v = parseFloat(n);
  if (isNaN(v)) return "R$ 0,00";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
  const [perfil, setPerfil] = useState(emptyPerfilCriador());
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
      const p = await getPerfil(user.id);
      if (p) setPerfil({ ...emptyPerfilCriador(), ...p, synced: true });
    } catch {
      // silencioso - se a tabela ainda nao existir no banco, fica com o perfil vazio
    }
  }, [user.id]);

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
        className="w-full md:w-60 shrink-0 flex flex-row md:flex-col items-center md:items-stretch py-3 md:py-6 px-3 md:px-4 gap-2 md:gap-0"
        style={{ background: "#241609", borderBottom: "1px solid #4a2c18", borderRight: "1px solid #4a2c18" }}
      >
        <div className="flex items-center gap-2 mb-0 md:mb-8 px-1 shrink-0">
        <Feather size={20} color="#C69A2E" />
  <div className="hidden sm:block">
    <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
      Aves<span style={{ color: "#C69A2E" }}>pet</span>
    </div>
  </div>
</div><div className="flex items-center gap-2 mb-0 md:mb-8 px-1 shrink-0">
          <Feather size={20} color="#C69A2E" />
          <div className="hidden sm:block">
            <div style={{ color: "#F1E6D2", fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>Gestao inteligente para seu criatorio</div>
            <div className="ui-mono" style={{ color: "#8a6f4a", fontSize: 10, letterSpacing: 1 }}>CADASTRO DE AVES</div>
          </div>
        </div>

        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible flex-1 md:flex-none">
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
              />
            )}

            {tab === "arvore" && (
              <ArvoreTab aves={aves} arvoreId={arvoreId} setArvoreId={setArvoreId} arvoreAve={arvoreAve} pai={pai} mae={mae} parceiro={parceiro} filhos={filhos} />
            )}

            {tab === "placa" && (
              <PlacaTab aves={aves} placaId={placaId} setPlacaId={setPlacaId} canvasRef={canvasRef} onDownload={downloadPlaca} />
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

            {tab === "anuncios" && (
              <AnunciosTab
                aves={aves} anuncios={anuncios} perfil={perfil}
                onSave={handleSaveAnuncio} onToggleAtivo={handleToggleAnuncioAtivo} onDelete={handleDeleteAnuncio}
                setTab={setTab}
              />
            )}

            {tab === "perfil" && (
              <PerfilTab perfil={perfil} onSave={handleSavePerfil} />
            )}


            {tab === "aprovacoes" && isAdminUser && (
              <AprovacoesTab anuncios={anunciosAprovacao} perfis={perfisPublicos} onModerar={handleModerarAnuncio} Card={Card} SectionTitle={SectionTitle} money={money} STATUS_ANUNCIO_TONS={STATUS_ANUNCIO_TONS} STATUS_ANUNCIO_LABEL={STATUS_ANUNCIO_LABEL} />
            )}

            {tab === "achados" && isAdminUser && (
              <AchadosTab achados={achados} perfis={perfisPublicos} onAtualizar={handleAtualizarAchado} />
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

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl ${className}`} style={{ background: "#FAF3E6", border: "1px solid #e3d3b4" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="mb-5" style={{ color: "#F1E6D2", fontSize: 24, fontWeight: 700 }}>{children}</h2>;
}

const inputStyle = {
  background: "#fff",
  border: "1px solid #e3d3b4",
  color: "#2B241C",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  outline: "none",
};

function Field({ label: lbl, children }) {
  return (
    <label className="flex flex-col gap-1.5 ui-sans">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8a7a63" }}>{lbl}</span>
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function StatCard({ label: lbl, value, tone = "default", onClick }) {
  const tones = {
    default: { bg: "#FAF3E6", color: "#2B241C" },
    bad: { bg: "#f0dad4", color: "#a6402b" },
    good: { bg: "#e4ead9", color: "#556b3f" },
    gold: { bg: "#f5e9c8", color: "#8a6f2e" },
  };
  const t = tones[tone];
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-4 text-left w-full"
      style={{ background: t.bg, border: "1px solid #e3d3b4", cursor: onClick ? "pointer" : "default" }}
    >
      <div className="ui-mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "#8a7a63" }}>{lbl}</div>
      <div className="text-2xl font-bold" style={{ color: t.color, fontFamily: "'Fraunces', serif" }}>{value}</div>
    </button>
  );
}

function AveCard({ a, onEdit, onDelete, onSync }) {
  return (
    <Card className="overflow-hidden flex">
      <div className="w-24 shrink-0" style={{ background: "#3a2a1c" }}>
        {a.foto ? <img src={a.foto} alt={a.nome} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center"><Bird size={22} color="#8a7a63" /></div>
        )}
      </div>
      <div className="flex-1 p-3 ui-sans min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold truncate" style={{ color: "#2B241C" }}>{a.nome}</div>
          <span className="ui-mono text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: a.sexado ? "#e4ead9" : "#f0e6d2", color: a.sexado ? "#556b3f" : "#8a6f2e" }}>
            {a.sexado ? "SEXADO" : "S/ SEXAGEM"}
          </span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: "#7a6a52" }}>{a.especie} - {a.sexo}</div>
        <div className="text-xs" style={{ color: "#7a6a52" }}>{a.corMutacao || "sem mutacao"}</div>
        <div className="ui-mono text-[11px] mt-1" style={{ color: "#a6402b" }}>{a.anilha || "sem anilha"}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded ui-mono" style={{ background: "#e3d3b4", color: "#5a4a30" }}>{a.status || "No plantel"}</span>
          {a.status === "Vendida" && a.valorVenda && <span className="text-[10px] ui-mono" style={{ color: "#556b3f" }}>R$ {a.valorVenda}</span>}
        </div>
        {a.synced === false && <div className="text-[10px] mt-1 font-semibold" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</div>}
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => onEdit(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
          <button onClick={() => onDelete(a.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
          {a.synced === false && <button onClick={() => onSync(a)} className="text-xs px-2 py-1 rounded" style={{ background: "#e4ead9", color: "#556b3f" }}>Sincronizar</button>}
        </div>
      </div>
    </Card>
  );
}

const FILTER_LABELS = {
  "A venda": "Aves a venda",
  Vendida: "Aves vendidas",
  Falecida: "Aves falecidas",
  casais: "Casais",
  solteiros: "Solteiros (sem parceiro)",
  plantel: "Plantel (sob sua responsabilidade)",
};

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

function FormTab({ form, setForm, onSave, onPhoto, saving, machoOptions, femeaOptions, parceiroOptions, mutacoes, clientes, fornecedores, onCancel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target?.type === "checkbox" ? e.target.checked : e.target.value }));
  // Editar manualmente os campos do comprador desfaz o vinculo com o cliente
  // selecionado (senao ficaria um clienteId apontando pra dado errado).
  const setComprador = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, clienteId: "" }));
  const setFornecedor = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, fornecedorId: "" }));
  // Se a ave ja tem uma mutacao que nao bate com nenhuma cadastrada no Banco
  // de Genetica, assume que foi digitada livre ("Outra") e mantem o campo aberto.
  const [mutacaoLivre, setMutacaoLivre] = useState(
    () => !!form.corMutacao && !mutacoes.some((m) => m.nome === form.corMutacao)
  );

  return (
    <div className="max-w-3xl">
      <SectionTitle>{form.id ? `Editando ${form.nome || "ave"}` : "Nova ave"}</SectionTitle>
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden flex items-center justify-center relative mx-auto sm:mx-0" style={{ background: "#f1e6d2", border: "1px dashed #d6c39a" }}>
            {form.foto ? <img src={form.foto} className="w-full h-full object-cover" alt="" /> : <Bird size={28} color="#b09a78" />}
            <label className="absolute bottom-1 right-1 p-1.5 rounded-full cursor-pointer" style={{ background: "#C69A2E" }}>
              <Upload size={13} color="#2B1D14" />
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {form.foto && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, foto: "" }))} className="absolute top-1 right-1 p-1 rounded-full" style={{ background: "#A6402B" }} title="Remover foto">
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nome"><input style={inputStyle} value={form.nome} onChange={set("nome")} placeholder="ex: Princesa" /></Field>
            <Field label="Especie">
              <select style={inputStyle} value={form.especie} onChange={set("especie")}>{ESPECIES.map((e) => <option key={e}>{e}</option>)}</select>
            </Field>
            <Field label="Sexo">
              <select style={inputStyle} value={form.sexo} onChange={set("sexo")}>{SEXOS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Mutacao / Cor">
  <select
    style={inputStyle}
    value={mutacaoLivre ? "__outra__" : form.corMutacao}
    onChange={(e) => {
      if (e.target.value === "__outra__") {
        setMutacaoLivre(true);
        setForm((f) => ({ ...f, corMutacao: "" }));
      } else {
        setMutacaoLivre(false);
        setForm((f) => ({ ...f, corMutacao: e.target.value }));
      }
    }}
  >
    <option value="">-- selecione --</option>
    {mutacoes.map((m) => (
      <option key={m.id} value={m.nome}>{m.nome}</option>
    ))}
    <option value="__outra__">Outra (digitar)</option>
  </select>

  {mutacaoLivre && (
    <input
      style={{ ...inputStyle, marginTop: 8 }}
      value={form.corMutacao}
      onChange={(e) => setForm((f) => ({ ...f, corMutacao: e.target.value }))}
      placeholder="Digite a mutacao/cor dessa ave"
    />
  )}

  {mutacoes.length === 0 && !mutacaoLivre && (
    <div className="ui-sans text-xs mt-1" style={{ color: "#8a7a63" }}>
      Nenhuma mutacao cadastrada ainda — cadastre em Genetica &gt; Mutacoes, ou escolha "Outra (digitar)".
    </div>
  )}
</Field>

<Field label="Portador de">
  <div
    className="rounded-xl p-3"
    style={{
      background: "#fffaf0",
      border: "1px solid #d8c6a5",
    }}
  >
    {mutacoes.length === 0 ? (
      <div className="text-sm" style={{ color: "#8a7a63" }}>
        Nenhuma mutacao cadastrada.
      </div>
    ) : (
      <div className="space-y-2">
        {mutacoes.map((mutacao) => {
          const selecionado = (form.portadores || []).includes(mutacao.nome);

          return (
            <label
              key={mutacao.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
              style={{ color: "#4f4336" }}
            >
              <input
                type="checkbox"
                checked={selecionado}
                onChange={(e) => {
                  const atuais = form.portadores || [];

                  const novos = e.target.checked
                    ? [...new Set([...atuais, mutacao.nome])]
                    : atuais.filter((nome) => nome !== mutacao.nome);

                  setForm({
                    ...form,
                    portadores: novos,
                  });
                }}
              />

              <span>{mutacao.nome}</span>
            </label>
          );
        })}
      </div>
    )}
  </div>

  <p className="text-xs mt-2" style={{ color: "#8a7a63" }}>
    Marque as mutacoes que a ave carrega sem apresentar visualmente.
  </p>
</Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Numero da anilha"><input style={inputStyle} value={form.anilha} onChange={set("anilha")} placeholder="ex: FOB 0080" /></Field>
          <Field label="Cor da anilha"><input style={inputStyle} value={form.corAnilha} onChange={set("corAnilha")} placeholder="ex: azul 2024" /></Field>
          <Field label="Nascimento"><input style={inputStyle} value={form.nascimento} onChange={set("nascimento")} placeholder="ex: Ago/2024" /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="De onde veio (origem)"><input style={inputStyle} value={form.origem} onChange={set("origem")} placeholder="ex: Nascido no criatorio / comprado de..." /></Field>
          <Field label="Criador"><input style={inputStyle} value={form.criador} onChange={set("criador")} /></Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="CTF"><input style={inputStyle} value={form.ctf} onChange={set("ctf")} placeholder="opcional" /></Field>
          <Field label="Sexagem">
            <div className="flex items-center gap-2 h-full pt-1.5">
              <input type="checkbox" checked={form.sexado} onChange={set("sexado")} />
              <span className="text-sm ui-sans" style={{ color: "#2B241C" }}>Ja tem laudo de sexagem</span>
            </div>
          </Field>
          <Field label="Nota do laudo"><input style={inputStyle} value={form.laudoNota} onChange={set("laudoNota")} placeholder="opcional" /></Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>STATUS E PLANTEL</div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={set("status")}>{STATUS_AVE.map((s) => <option key={s}>{s}</option>)}</select>
          </Field>
          <Field label="Ninhadas ja geradas (se reprodutora)">
            <input style={inputStyle} type="number" min="0" value={form.ninhadasGeradas} onChange={set("ninhadasGeradas")} placeholder="0" />
          </Field>
          <Field label="Garantia de saude (dias)">
            <input style={inputStyle} type="number" min="0" value={form.garantiaDias} onChange={set("garantiaDias")} placeholder="ex: 7" />
          </Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>AQUISICAO (COMPRA)</div>

        <Field label="Como essa ave chegou no plantel">
          <select style={{ ...inputStyle, maxWidth: 280 }} value={form.origemTipo} onChange={set("origemTipo")}>{ORIGEM_TIPOS.map((o) => <option key={o}>{o}</option>)}</select>
        </Field>

        {form.origemTipo === "Comprada" && (
          <div className="mt-4">
            <SeletorFornecedor form={form} setForm={setForm} fornecedores={fornecedores} />
            {form.fornecedorId && (
              <div className="ui-sans text-xs mt-2 mb-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do fornecedor
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <Field label="Nome de quem vendeu"><input style={inputStyle} value={form.fornecedorNome} onChange={setFornecedor("fornecedorNome")} /></Field>
              <Field label="Telefone do vendedor"><input style={inputStyle} value={form.fornecedorTelefone} onChange={setFornecedor("fornecedorTelefone")} /></Field>
              <Field label="Endereco do vendedor"><input style={inputStyle} value={form.fornecedorEndereco} onChange={setFornecedor("fornecedorEndereco")} /></Field>
              <Field label="Valor pago (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorCompra} onChange={set("valorCompra")} /></Field>
              <Field label="Data da compra"><input style={inputStyle} type="date" value={form.dataCompra} onChange={set("dataCompra")} /></Field>
            </div>
          </div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>VENDA</div>

        {form.status === "Vendida" ? (
          <div>
            <SeletorComprador form={form} setForm={setForm} clientes={clientes} />
            {form.clienteId && (
              <div className="ui-sans text-xs mt-2 px-3 py-1.5 rounded-lg inline-block" style={{ background: "#e4ead9", color: "#556b3f" }}>
                ✓ Vinculado ao cadastro do cliente
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Field label="Nome do comprador"><input style={inputStyle} value={form.compradorNome} onChange={setComprador("compradorNome")} /></Field>
              <Field label="Telefone do comprador"><input style={inputStyle} value={form.compradorTelefone} onChange={setComprador("compradorTelefone")} /></Field>
              <Field label="Endereco do comprador"><input style={inputStyle} value={form.compradorEndereco} onChange={setComprador("compradorEndereco")} /></Field>
              <Field label="Valor vendido (R$)"><input style={inputStyle} type="number" step="0.01" value={form.valorVenda} onChange={set("valorVenda")} /></Field>
              <Field label="Data da venda"><input style={inputStyle} type="date" value={form.dataVenda} onChange={set("dataVenda")} /></Field>
            </div>
          </div>
        ) : (
          <div className="text-xs ui-sans" style={{ color: "#8a7a63" }}>Muda o status pra "Vendida" acima pra preencher os dados do comprador.</div>
        )}

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>GENEALOGIA E CASAL</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Pai (se estiver cadastrado)">
            <select style={inputStyle} value={form.paiId} onChange={set("paiId")}>
              <option value="">-- nenhum --</option>
              {machoOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Pai (se nao estiver no sistema)"><input style={inputStyle} value={form.paiExterno} onChange={set("paiExterno")} placeholder="ex: desconhecido / de outro criador" /></Field>
          <Field label="Mae (se estiver cadastrada)">
            <select style={inputStyle} value={form.maeId} onChange={set("maeId")}>
              <option value="">-- nenhuma --</option>
              {femeaOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Mae (se nao estiver no sistema)"><input style={inputStyle} value={form.maeExterno} onChange={set("maeExterno")} placeholder="ex: emprestada do Anderson" /></Field>
          <Field label="Parceiro(a) / casal">
            <select style={inputStyle} value={form.parceiroId} onChange={set("parceiroId")}>
              <option value="">-- nenhum --</option>
              {parceiroOptions.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </Field>
          <Field label="Identificacao do casal"><input style={inputStyle} value={form.casalLabel} onChange={set("casalLabel")} placeholder="ex: Casal 04" /></Field>
        </div>

        <div className="my-5 h-px" style={{ background: "#e3d3b4" }} />
        <div className="ui-mono text-xs mb-3" style={{ color: "#8a7a63" }}>HISTORICO DE PESO</div>
        <PesoHistorico pesos={form.pesos} onChange={(pesos) => setForm((f) => ({ ...f, pesos }))} />

        <div className="flex gap-3 mt-6">
          <button onClick={onSave} disabled={saving} className="ui-sans flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar
          </button>
          <button onClick={onCancel} className="ui-sans px-5 py-2.5 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Arvore Genealogica
// ---------------------------------------------------------------------------

function TreeCard({ ave }) {
  if (!ave) return null;
  return (
    <div className="rounded-lg px-4 py-2.5 ui-sans text-center" style={{ background: "#FAF3E6", border: "1px solid #e3d3b4", minWidth: 140 }}>
      <div className="font-semibold text-sm" style={{ color: "#2B241C" }}>{ave.nome}</div>
      <div className="text-[11px]" style={{ color: "#8a7a63" }}>{ave.especie} - {ave.sexo}</div>
    </div>
  );
}

function ArvoreTab({ aves, arvoreId, setArvoreId, arvoreAve, pai, mae, parceiro, filhos }) {
  return (
    <div>
      <SectionTitle>Arvore Genealogica</SectionTitle>
      <Field label="Escolha a ave">
        <select style={{ ...inputStyle, maxWidth: 320 }} value={arvoreId} onChange={(e) => setArvoreId(e.target.value)}>
          <option value="">-- selecione --</option>
          {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
        </select>
      </Field>

      {arvoreAve && (
        <Card className="p-8 mt-6">
          <div className="flex flex-col items-center gap-6 ui-sans">
            <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>PAIS</div>
            <div className="flex gap-4 flex-wrap justify-center">
              <TreeCard ave={pai} />
              {!pai && arvoreAve.paiExterno && <TreeCard ave={{ nome: arvoreAve.paiExterno, especie: "externo", sexo: "Macho" }} />}
              <TreeCard ave={mae} />
              {!mae && arvoreAve.maeExterno && <TreeCard ave={{ nome: arvoreAve.maeExterno, especie: "externo", sexo: "Femea" }} />}
            </div>

            <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />

            <div className="flex gap-4 items-center">
              <div className="rounded-lg px-5 py-3 text-center" style={{ background: "#C69A2E", color: "#2B1D14" }}>
                <div className="font-bold">{arvoreAve.nome}</div>
                <div className="text-[11px]">{arvoreAve.especie} - {arvoreAve.sexo}</div>
              </div>
              {parceiro && (<><span className="text-xs" style={{ color: "#8a7a63" }}>x</span><TreeCard ave={parceiro} /></>)}
            </div>

            {filhos.length > 0 && (
              <>
                <div className="h-6 w-px" style={{ background: "#e3d3b4" }} />
                <div className="ui-mono text-xs" style={{ color: "#8a7a63" }}>FILHOS ({filhos.length})</div>
                <div className="flex flex-wrap gap-3 justify-center">{filhos.map((f) => <TreeCard key={f.id} ave={f} />)}</div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placa
// ---------------------------------------------------------------------------

function PlacaTab({ aves, placaId, setPlacaId, canvasRef, onDownload }) {
  return (
    <div>
      <SectionTitle>Gerar Placa</SectionTitle>
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <Field label="Escolha a ave">
          <select style={{ ...inputStyle, minWidth: 200, maxWidth: "100%" }} value={placaId} onChange={(e) => setPlacaId(e.target.value)}>
            <option value="">-- selecione --</option>
            {aves.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </Field>
        {placaId && (
          <button onClick={onDownload} className="ui-sans flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Download size={16} /> Baixar PNG
          </button>
        )}
      </div>

      {placaId ? (
        <div className="rounded-xl overflow-hidden w-full" style={{ border: "3px solid #4a2c18", maxWidth: 720 }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
      ) : (
        <Card className="p-8 ui-sans" style={{ color: "#8a7a63" }}>Selecione uma ave pra ver a previa da placa.</Card>
      )}
    </div>
  );
}

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

function MutacoesTab({ mutacoes, onSave, onDelete }) {
  const [nova, setNova] = useState(emptyMutacao());
  const [editId, setEditId] = useState(null);

  function submit() {
    if (!nova.nome.trim()) return;
    onSave({ ...nova, id: editId });
    setNova(emptyMutacao());
    setEditId(null);
  }

  function editar(m) {
    setNova(m);
    setEditId(m.id);
  }

  return (
    <div>
      <SectionTitle>Banco de Genetica</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Cadastro das mutacoes que voce trabalha. Essa base vai alimentar a calculadora genetica na proxima fase.
      </p>

      <Card className="p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome da mutacao"><input style={inputStyle} value={nova.nome} onChange={(e) => setNova((m) => ({ ...m, nome: e.target.value }))} placeholder="ex: Pallid Azul Turquesa" /></Field>
          <Field label="Nome alternativo"><input style={inputStyle} value={nova.nomeAlternativo} onChange={(e) => setNova((m) => ({ ...m, nomeAlternativo: e.target.value }))} placeholder="opcional" /></Field>
          <Field label="Gene (locus)"><input style={inputStyle} value={nova.gene} onChange={(e) => setNova((m) => ({ ...m, gene: e.target.value }))} placeholder="ex: bl (blue)" /></Field>
          <Field label="Serie/Cor base"><input style={inputStyle} value={nova.serie} onChange={(e) => setNova((m) => ({ ...m, serie: e.target.value }))} placeholder="ex: serie Azul" /></Field>
          <Field label="Tipo de heranca">
            <select style={inputStyle} value={nova.tipoHeranca} onChange={(e) => setNova((m) => ({ ...m, tipoHeranca: e.target.value }))}>{TIPOS_HERANCA.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Combina com (outras mutacoes)"><input style={inputStyle} value={nova.combinaCom} onChange={(e) => setNova((m) => ({ ...m, combinaCom: e.target.value }))} placeholder="ex: Azul, Turquesa, Violeta (possivel)" /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Como identificar visualmente"><input style={inputStyle} value={nova.comoIdentificar} onChange={(e) => setNova((m) => ({ ...m, comoIdentificar: e.target.value }))} placeholder="ex: penas com tom diluido, olhos claros" /></Field>
          <Field label="Observacoes"><input style={inputStyle} value={nova.observacoes} onChange={(e) => setNova((m) => ({ ...m, observacoes: e.target.value }))} placeholder="opcional" /></Field>
        </div>
        <div className="flex gap-3">
          <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
            <Plus size={15} /> {editId ? "Salvar edicao" : "Adicionar mutacao"}
          </button>
          {editId && (
            <button onClick={() => { setNova(emptyMutacao()); setEditId(null); }} className="ui-sans px-4 py-2 rounded-lg text-sm" style={{ background: "#e3d3b4", color: "#2B241C" }}>
              Cancelar
            </button>
          )}
        </div>
      </Card>

      {mutacoes.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhuma mutacao cadastrada ainda.</Card>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {mutacoes.map((m) => (
            <Card key={m.id} className="p-4 ui-sans">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="font-semibold" style={{ color: "#2B241C" }}>{m.nome}</div>
                {m.synced === false && <span className="text-[10px] font-semibold shrink-0" style={{ color: "#a6402b" }}>NAO SINCRONIZADO</span>}
              </div>
              {m.nomeAlternativo && <div className="text-xs mb-1" style={{ color: "#8a7a63" }}>tambem chamada: {m.nomeAlternativo}</div>}
              {(m.gene || m.serie) && (
                <div className="text-xs mb-1 ui-mono" style={{ color: "#7a6a52" }}>
                  {m.gene && `Gene: ${m.gene}`}{m.gene && m.serie ? " · " : ""}{m.serie && `Serie: ${m.serie}`}
                </div>
              )}
              <div className="text-xs mb-1 ui-mono" style={{ color: "#a6402b" }}>{m.tipoHeranca}</div>
              {m.combinaCom && <div className="text-xs mb-1" style={{ color: "#556b3f" }}>Combina com: {m.combinaCom}</div>}
              {m.comoIdentificar && <div className="text-xs mb-1" style={{ color: "#7a6a52" }}>{m.comoIdentificar}</div>}
              {m.observacoes && <div className="text-xs italic mb-2" style={{ color: "#7a6a52" }}>{m.observacoes}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => editar(m)} className="text-xs px-2 py-1 rounded" style={{ background: "#e3d3b4", color: "#2B241C" }}>Editar</button>
                <button onClick={() => onDelete(m.id)} className="text-xs px-2 py-1 rounded flex items-center gap-1" style={{ background: "#f0dad4", color: "#a6402b" }}><Trash2 size={12} /> Remover</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

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

const UF_LISTA = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function PerfilTab({ perfil, onSave }) {
  const [form, setForm] = useState(perfil);
  const [salvo, setSalvo] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit() {
    onSave(form);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  return (
    <div className="max-w-xl">
      <SectionTitle>Perfil do Criador</SectionTitle>
      <p className="ui-sans text-sm mb-5" style={{ color: "#F1E6D2" }}>
        Essas informacoes aparecem publicamente em todos os seus anuncios, pra quem se interessar saber quem e voce e como falar com voce.
      </p>
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Nome do criatório"><input style={inputStyle} value={form.nomeCriatorio} onChange={set("nomeCriatorio")} placeholder="ex: Criatório Avespet" /></Field>
          <Field label="WhatsApp de contato"><input style={inputStyle} value={form.whatsapp} onChange={set("whatsapp")} placeholder="ex: (11) 99999-9999" /></Field>
          <Field label="Cidade"><input style={inputStyle} value={form.cidade} onChange={set("cidade")} placeholder="ex: Barueri" /></Field>
          <Field label="UF">
            <select style={inputStyle} value={form.uf} onChange={set("uf")}>
              <option value="">--</option>
              {UF_LISTA.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        {form.synced === false && <div className="ui-sans text-xs mb-3" style={{ color: "#a6402b" }}>Salvando no banco...</div>}
        {salvo && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#e4ead9", color: "#556b3f" }}>Perfil salvo.</div>}
        <button onClick={submit} className="ui-sans flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>
          <Save size={15} /> Salvar perfil
        </button>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Anuncios (Fase 8C)
// ---------------------------------------------------------------------------

function NovoAnuncioForm({ ave, onSave, onCancel }) {
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

  function submit() {
    const result = onSave(form);
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
      {error && <div className="ui-sans text-sm mb-3 px-3 py-2 rounded-lg" style={{ background: "#f0dad4", color: "#a6402b" }}>{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} className="ui-sans text-sm px-4 py-2 rounded-lg font-semibold" style={{ background: "#C69A2E", color: "#2B1D14" }}>Publicar anuncio</button>
        <button onClick={onCancel} className="ui-sans text-sm px-4 py-2 rounded-lg" style={{ background: "#e3d3b4", color: "#2B241C" }}>Cancelar</button>
      </div>
    </Card>
  );
}


       const STATUS_ANUNCIO_TONS = { pendente: "#f0dab0", aprovado: "#c8dcb8", rejeitado: "#f0c9c0" };
       const STATUS_ANUNCIO_LABEL = { pendente: "EM ANALISE", aprovado: "APROVADO", rejeitado: "REJEITADO" };

 function AnuncioCard({ anuncio, onToggleAtivo, onDelete }) {
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

function AnunciosTab({ aves, anuncios, perfil, onSave, onToggleAtivo, onDelete, setTab }) {
  const [criandoParaId, setCriandoParaId] = useState(null);

  const avesAnunciaveis = aves.filter((a) => a.status === "A venda" && !anuncios.some((an) => an.aveId === a.id));
  const perfilIncompleto = !perfil.whatsapp?.trim();

  return (
    <div>
      <SectionTitle>Anuncios</SectionTitle>

      {perfilIncompleto && (
        <div className="ui-sans mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3" style={{ background: "#f5e9c8", color: "#8a6f2e", border: "1px solid #d6c39a" }}>
          <span>Preenche seu WhatsApp no Perfil do Criador antes de publicar, pra quem se interessar saber como falar com voce.</span>
          <button onClick={() => setTab("perfil")} className="ui-sans px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0" style={{ background: "#2B1D14", color: "#F1E6D2" }}>Ir pro Perfil</button>
        </div>
      )}

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>AVES DISPONIVEIS PRA ANUNCIAR</div>
      {avesAnunciaveis.length === 0 ? (
        <Card className="p-4 mb-6 ui-sans text-sm" style={{ color: "#8a7a63" }}>
          Nenhuma ave nova pra anunciar (marca uma ave como "A venda" no cadastro pra ela aparecer aqui).
        </Card>
      ) : (
        <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {avesAnunciaveis.map((a) =>
            criandoParaId === a.id ? (
              <div key={a.id} className="sm:col-span-2">
                <NovoAnuncioForm ave={a} onSave={(form) => { const r = onSave(form); if (r?.ok) setCriandoParaId(null); return r; }} onCancel={() => setCriandoParaId(null)} />
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

      <div className="ui-mono text-xs mb-3" style={{ color: "#F1E6D2" }}>MEUS ANUNCIOS ({anuncios.length})</div>
      {anuncios.length === 0 ? (
        <Card className="p-6 text-center ui-sans" style={{ color: "#8a7a63" }}>Nenhum anuncio publicado ainda.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {anuncios.map((an) => <AnuncioCard key={an.id} anuncio={an} onToggleAtivo={onToggleAtivo} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Aprovacoes (Fase 8D) - so visivel/carregado pra quem esta na tabela admins
// ---------------------------------------------------------------------------

// Reproducao: posturas, ovos e nascimentos
// ---------------------------------------------------------------------------

function SuporteWhatsApp() {
  const mensagem = encodeURIComponent(
    "Olá! Preciso de suporte no Avespet."
  );

  return (
    <a
      href={`https://wa.me/5511986338898?text=${mensagem}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar com o suporte do Avespet pelo WhatsApp"
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "13px 18px",
        borderRadius: "999px",
        background: "#25D366",
        color: "#FFFFFF",
        fontWeight: 700,
        fontSize: "14px",
        textDecoration: "none",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
      }}
    >
      <MessageCircle size={22} />
      Suporte
    </a>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const caminho = usePath();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "#2B1D14" }}>
        <Loader2 className="animate-spin" color="#C69A2E" size={28} />
      </div>
    );
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