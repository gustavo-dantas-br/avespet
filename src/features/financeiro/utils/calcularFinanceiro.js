// Calculos puros dos indicadores financeiros do criatorio.

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

export { computeFinanceiro, computeFinanceiroPeriodo };
