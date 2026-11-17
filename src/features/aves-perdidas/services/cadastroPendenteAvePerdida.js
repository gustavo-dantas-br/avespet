// Preserva o formulário entre cadastro, confirmação por e-mail e login.
// Senhas e tokens NUNCA são armazenados aqui.
const KEY = "avespet:cadastro-ave-perdida:v1";
const TTL = 72 * 60 * 60 * 1000;
const FIELDS = [
  "id", "criadoEm", "nomeAve", "especie", "cor", "sexo", "idadeAproximada",
  "caracteristicas", "anilha", "cidade", "uf", "dataPerda", "descricao",
  "contatoNome", "whatsapp", "bairro", "foto",
];
let pending = null;

function norm(email) { return String(email || "").trim().toLowerCase(); }

export function lerCadastroPendente() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (item?.versao !== 1 || !item.email ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(item?.anuncio?.id || "") ||
      !Number.isFinite(item?.criadoEmMs) ||
      item.criadoEmMs > Date.now() + 60000 ||
      Date.now() - item.criadoEmMs > TTL) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return item;
  } catch { return null; }
}

export function guardarCadastroPendente(email, anuncio) {
  if (typeof window === "undefined") throw new Error("Cadastre a ave no navegador.");
  const normalizado = norm(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizado) || !anuncio?.id) {
    throw new Error("Informe um e-mail válido para acompanhar seu anúncio.");
  }
  const dados = Object.fromEntries(FIELDS.filter((key) => Object.hasOwn(anuncio, key))
    .map((key) => [key, anuncio[key]]));
  const json = JSON.stringify({ versao: 1, email: normalizado, criadoEmMs: Date.now(), anuncio: dados });
  if (json.length > 100000) throw new Error("Os dados informados excedem o limite de armazenamento temporário.");
  try { window.localStorage.setItem(KEY, json); }
  catch { throw new Error("Seu navegador bloqueou o armazenamento temporário. Libere-o antes de criar a conta."); }
}

export async function finalizarCadastroPendente(user, criarAnuncio) {
  const item = lerCadastroPendente();
  if (!item) return { status: "vazio" };
  if (!user?.id || norm(user.email) !== item.email) return { status: "outra_conta" };
  const id = item.anuncio.id;
  if (pending?.id === id) return pending.promise;
  const promise = (async () => {
    await criarAnuncio(user.id, item.anuncio);
    const current = lerCadastroPendente();
    if (current?.anuncio?.id === id) window.localStorage.removeItem(KEY);
    return { status: "salvo", id };
  })();
  pending = { id, promise };
  try { return await promise; }
  finally { if (pending?.id === id) pending = null; }
}
