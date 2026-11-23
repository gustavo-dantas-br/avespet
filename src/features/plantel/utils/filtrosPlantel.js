// Regras compartilhadas entre a lista e o painel do criador.
// Uma ave deixa de integrar o plantel quando vendida, perdida ou falecida.
export const STATUS_ATIVOS_PLANTEL = ["No plantel", "A venda", "Reservada"];

export function estaNoPlantel(ave) {
  return Boolean(ave) && STATUS_ATIVOS_PLANTEL.includes(ave.status || "No plantel");
}

export function parceiroNoPlantel(ave, aves) {
  if (!ave?.parceiroId) return null;
  return aves.find((outra) => String(outra.id) === String(ave.parceiroId) && outra.id !== ave.id && estaNoPlantel(outra)) || null;
}

export function ehCasalDoPlantel(ave, aves) {
  return estaNoPlantel(ave) && (Boolean(parceiroNoPlantel(ave, aves)) || Boolean(ave.casalLabel?.trim()));
}

export function ehSolteiroDoPlantel(ave, aves) {
  return estaNoPlantel(ave) && !ehCasalDoPlantel(ave, aves);
}

export function agruparCasaisDoPlantel(aves) {
  const ativos = aves.filter(estaNoPlantel);
  const usados = new Set();
  const grupos = [];
  for (const ave of ativos) {
    if (usados.has(String(ave.id)) || !ehCasalDoPlantel(ave, ativos)) continue;
    const parceiro = parceiroNoPlantel(ave, ativos);
    const segundo = parceiro && !usados.has(String(parceiro.id)) ? parceiro : null;
    usados.add(String(ave.id));
    if (segundo) usados.add(String(segundo.id));
    grupos.push({a: ave, b: segundo, label: ave.casalLabel || segundo?.casalLabel || ""});
  }
  return grupos;
}
