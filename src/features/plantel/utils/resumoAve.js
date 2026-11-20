// Formatos de nascimento aceitos: AAAA, Mês/AAAA, DD/MM/AAAA e AAAA-MM-DD.
// As estimativas não inventam dia ou mês quando não foram informados.
const MESES = Object.freeze({jan:1,janeiro:1,fev:2,fevereiro:2,mar:3,marco:3,abr:4,abril:4,mai:5,maio:5,jun:6,junho:6,jul:7,julho:7,ago:8,agosto:8,set:9,setembro:9,out:10,outubro:10,nov:11,novembro:11,dez:12,dezembro:12});
const normalizar = (v) => String(v || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function lerNascimento(valor) {
  const str = String(valor || "").trim();
  let ano, mes, dia, precisao;
  let m = /^(\d{4})$/.exec(str);
  if (m) { ano = Number(m[1]); precisao = "ano"; }
  else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str))) {
    ano = Number(m[1]); mes = Number(m[2]); dia = Number(m[3]); precisao = "dia";
  } else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str))) {
    dia = Number(m[1]); mes = Number(m[2]); ano = Number(m[3]); precisao = "dia";
  } else if ((m = /^(\d{1,2})[/-](\d{4})$/.exec(str))) {
    mes = Number(m[1]); ano = Number(m[2]); precisao = "mes";
  } else if ((m = /^([a-zçãéô]+)[/\s-](\d{4})$/i.exec(str))) {
    mes = MESES[normalizar(m[1])]; ano = Number(m[2]); precisao = "mes";
  } else return null;
  if (!Number.isInteger(ano) || ano < 1900 || ano > 2200) return null;
  if (precisao !== "ano" && (!Number.isInteger(mes) || mes < 1 || mes > 12)) return null;
  if (precisao === "dia") {
    if (!Number.isInteger(dia) || dia < 1 || dia > 31) return null;
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) return null;
  }
  return { ano, mes, dia, precisao };
}
export function idadeDaAve(valor, hoje = new Date()) {
  const n = lerNascimento(valor);
  if (!n || !(hoje instanceof Date) || !Number.isFinite(hoje.getTime())) return null;
  const ano = hoje.getFullYear(), mes = hoje.getMonth() + 1, dia = hoje.getDate();
  if (n.precisao === "ano") {
    if (n.ano > ano) return null;
    return `Nascida em ${n.ano} · idade aproximada`;
  }
  const meses = (ano - n.ano) * 12 + mes - n.mes - (n.precisao === "dia" && dia < n.dia ? 1 : 0);
  if (meses < 0) return null;
  const anos = Math.floor(meses / 12), resto = meses % 12;
  let texto;
  if (meses === 0) texto = "Menos de 1 mês";
  else if (!anos) texto = `${meses} ${meses === 1 ? "mês" : "meses"}`;
  else texto = `${anos} ${anos === 1 ? "ano" : "anos"}${resto ? ` e ${resto} ${resto === 1 ? "mês" : "meses"}` : ""}`;
  return n.precisao === "mes" ? `Aprox. ${texto}` : texto;
}
export function sexoVisual(sexo) {
  if (sexo === "Macho") return { rotulo:"Macho", simbolo:"♂", fundo:"#EFF6FF", texto:"#235B95", borda:"#AACDED" };
  if (sexo === "Femea" || sexo === "Fêmea") return { rotulo:"Fêmea", simbolo:"♀", fundo:"#FFF2F7", texto:"#A63970", borda:"#F2BCD2" };
  return { rotulo:"Não informado", simbolo:"•", fundo:"#F1F5F1", texto:"#607466", borda:"#D5E1D7" };
}
