import type { SimulationInput, SimulationResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateFee } from './helpers'

// Percentual de redução padrão da modalidade "Redução de Parcela" (era fixo em 50%, "meia" parcela)
export const DEFAULT_REDUCE_PERCENTAGE = 50

// Normaliza o % de redução vindo do input "Reduzir Parcela (%)": aceita null/undefined
// (usa o padrão de 50%) e limita entre 0 e 100 para não gerar parcela negativa/invertida.
export function normalizarReducePercentage(reducePercentage?: number | null): number {
  if (reducePercentage === null || reducePercentage === undefined || isNaN(reducePercentage)) {
    return DEFAULT_REDUCE_PERCENTAGE
  }
  return Math.min(100, Math.max(0, reducePercentage))
}

// 1. Calcula o fundo comum cheio
function calcularFundoComum(credito: number, prazo: number): number {
  return credito / prazo
}

// Calcula a parcela reduzida conforme o % informado em "Reduzir Parcela (%)"
// (antes era sempre "meia" parcela, ou seja, reducePercentage fixo em 50%)
export function calcularMeiaParcela(
  credito: number,
  taxaTotal: number,
  prazo: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  const totalComTaxa = credito * (1 + taxaTotal / 100)
  const parcelaIntegral = totalComTaxa / prazo
  return parcelaIntegral * fatorReducao
}

// 2. Calcula a taxa mensal (usando taxaTotal)
function calcularTaxaMensal(credito: number, taxaTotal: number, prazo: number): number {
  const totalTaxa = credito * (taxaTotal / 100)
  return totalTaxa / prazo
}

// 3. Calcula a parcela inicial (Fundo Comum) - redutor incide SOMENTE no fundo comum,
// conforme o % de "Reduzir Parcela" (antes fixo em 50%)
export function calcularParcelaInicial(
  credito: number,
  prazo: number,
  taxaTotal: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  const componenteA = (credito * fatorReducao) / prazo
  const taxaMensal = (credito * (taxaTotal / 100)) / prazo
  const parcelaInicial = componenteA + taxaMensal
  return parcelaInicial
}

export function aplicarReajusteAnual(
  valorBase: number,
  mesContemplacao: number,
  inccAnual: number
): number {
  let valor = valorBase
  const maxMeses = Math.min(mesContemplacao, 1000)

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      valor = valor * (1 + inccAnual)
    }
  }

  return valor
}

export function calcularComponentesMeiaParcela(
  credito: number,
  prazo: number,
  taxaTotal: number,
  reducePercentage?: number | null
): { fundoComum: number; taxaAdministracao: number } {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  return {
    fundoComum: (credito * fatorReducao) / prazo,
    taxaAdministracao: (credito * (taxaTotal / 100)) / prazo,
  }
}

// Função para calcular componentes de Redução de Parcela (redução em ambos, conforme % informado)
export function calcularComponentesMeiaParcelaTotal(
  credito: number,
  prazo: number,
  taxaTotal: number,
  reducePercentage?: number | null
): { fundoComum: number; taxaAdministracao: number } {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100

  const fundoComum = (credito / prazo) * fatorReducao
  const taxaAdministracao = ((credito * taxaTotal / 100) / prazo) * fatorReducao

  return {
    fundoComum,
    taxaAdministracao,
  }
}

// Função para calcular pagamentos pré-contemplação para Meia Parcela
export function calcularPagamentosMeiaParcelaTotalAjustada(
  credito: number,
  prazo: number,
  taxaTotal: number,
  correctionIncc: number,
  mesContemplacao: number,
  reducePercentage?: number | null,
): {
  pagamentos: number[]
  ultimaParcela: number
  ultimoFundoComumPago: number
  ultimaTaxaAdministracaoPaga: number
  totalInvestidoFundoComum: number
} {
  const { fundoComum, taxaAdministracao } = calcularComponentesMeiaParcelaTotal(
    credito,
    prazo,
    taxaTotal,
    reducePercentage
  )

  const pagamentos: number[] = []
  if (!mesContemplacao || mesContemplacao <= 0) {
    return {
      pagamentos,
      ultimaParcela: fundoComum + taxaAdministracao,
      ultimoFundoComumPago: fundoComum,
      ultimaTaxaAdministracaoPaga: taxaAdministracao,
      totalInvestidoFundoComum: 0,
    }
  }

  let fundoAtual = fundoComum
  let taxaAtual = taxaAdministracao
  let ultimoFundoComumPago = fundoComum
  let ultimaTaxaAdministracaoPaga = taxaAdministracao
  let totalInvestidoFundoComum = 0
  const maxMeses = Math.min(mesContemplacao, 1000)

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      fundoAtual = fundoAtual * (1 + correctionIncc / 100)
      taxaAtual = taxaAtual * (1 + correctionIncc / 100)
    }
    pagamentos.push(fundoAtual + taxaAtual)
    ultimoFundoComumPago = fundoAtual
    ultimaTaxaAdministracaoPaga = taxaAtual
    totalInvestidoFundoComum += fundoAtual
  }

  return {
    pagamentos,
    ultimaParcela: pagamentos[pagamentos.length - 1] ?? (fundoComum + taxaAdministracao),
    ultimoFundoComumPago,
    ultimaTaxaAdministracaoPaga,
    totalInvestidoFundoComum,
  }
}

// Função para calcular parcela integral a partir dos componentes reduzidos (Redução de Parcela):
// reconstrói o valor cheio "desfazendo" o % de redução aplicado (antes sempre *2, pois a redução era fixa em 50%)
export function calcularParcelaIntegralMeiaParcela(
  fundoComumMeiaParcelaReajustado: number,
  taxaAdministracaoReajustada: number,
  ajusteAmortizacao: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  if (fatorReducao <= 0) {
    // Redução de 100%: não há como "desfazer" a divisão (evita divisão por zero/negativo)
    return ajusteAmortizacao
  }
  const fundoComumIntegral = fundoComumMeiaParcelaReajustado / fatorReducao
  const taxaAdministracaoIntegral = taxaAdministracaoReajustada / fatorReducao
  return fundoComumIntegral + taxaAdministracaoIntegral + ajusteAmortizacao
}

// 4.1 Calcula o ajuste de amortização
export function calcularAjusteAmortizacao(
  credito: number,
  prazo: number,
  mesContemplacao: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  const componenteA = (credito * fatorReducao) / prazo
  const valorInvestido = componenteA * mesContemplacao
  const parcelasRestantes = prazo - mesContemplacao
  return valorInvestido / parcelasRestantes
}

// 4. Calcula parcela base (sem ajuste de amortização)
export function calcularParcelaBasePosContemplacao(
  credito: number,
  prazo: number,
  taxaTotal: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  // Componente A: parcela reduzida do fundo comum
  const componenteA = (credito * fatorReducao) / prazo

  // Componente B: taxa de administração mensal
  const componenteB = (credito * (taxaTotal / 100)) / prazo

  // Parcela cheia do fundo comum (desfaz a redução)
  const parcelaCheia = fatorReducao > 0 ? componenteA / fatorReducao : 0

  // Parcela base: parcela cheia + taxa mensal
  return parcelaCheia + componenteB
}

// 4. Calcula a parcela integral
export function calcularPosContemplacao(
  credito: number,
  prazo: number,
  taxaTotal: number,
  mesContemplacao: number,
  inccAnual: number,
  reducePercentage?: number | null
): number {
  const incc = inccAnual / 100
  const percentualReducao = normalizarReducePercentage(reducePercentage)
  const fatorReducao = 1 - percentualReducao / 100

  const fundoComumBase = (credito * fatorReducao) / prazo
  const taxaMensal = (credito * (taxaTotal / 100)) / prazo
  const parcelaInicialBase = fundoComumBase + taxaMensal
  const parcelaReajustada = aplicarReajusteAnual(
    parcelaInicialBase,
    mesContemplacao,
    incc
  )

  const prazoRestante = prazo - mesContemplacao
  if (prazoRestante <= 0) {
    return parcelaReajustada
  }

  // Parte do fundo comum não acumulada ao longo do prazo por causa da redução
  // (com reducePercentage=50%, isso é credito/2 — igual ao cálculo original)
  const naoAcumulado = credito * (percentualReducao / 100)
  const naoAcumuladoReajustado = aplicarReajusteAnual(
    naoAcumulado,
    mesContemplacao,
    incc
  )
  const calculoB = naoAcumuladoReajustado / prazoRestante

  return calculoB + parcelaReajustada
}

// Calcula pagamentos mensais com reajuste INCC anual para um período dado
export function calcularPagamentosPeriodo(
  parcelaInicialPeriodo: number,
  taxaIncc: number,
  mesesPeriodo: number
): { pagamentos: number[]; ultimaParcela: number } {
  const pagamentos: number[] = []
  if (!mesesPeriodo || mesesPeriodo <= 0) {
    return { pagamentos, ultimaParcela: parcelaInicialPeriodo }
  }
  
  let parcelaAtual = parcelaInicialPeriodo
  const maxMeses = Math.min(mesesPeriodo, 1000)
  
  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      parcelaAtual = parcelaAtual * (1 + taxaIncc / 100)
    }
    pagamentos.push(parcelaAtual)
  }
  
  return {
    pagamentos,
    ultimaParcela: pagamentos[pagamentos.length - 1] ?? parcelaInicialPeriodo,
  }
}

export function calcularPagamentosMeiaParcelaAjustada(
  credito: number,
  prazo: number,
  taxaTotal: number,
  correctionIncc: number,
  mesContemplacao: number,
  reducePercentage?: number | null,
): {
  pagamentos: number[]
  ultimaParcela: number
  ultimoFundoComumPago: number
  ultimaTaxaAdministracaoPaga: number
  totalInvestidoFundoComum: number
} {
  const { fundoComum, taxaAdministracao } = calcularComponentesMeiaParcela(
    credito,
    prazo,
    taxaTotal,
    reducePercentage
  )

  const pagamentos: number[] = []
  if (!mesContemplacao || mesContemplacao <= 0) {
    return {
      pagamentos,
      ultimaParcela: fundoComum + taxaAdministracao,
      ultimoFundoComumPago: fundoComum,
      ultimaTaxaAdministracaoPaga: taxaAdministracao,
      totalInvestidoFundoComum: 0,
    }
  }

  let fundoAtual = fundoComum
  let taxaAtual = taxaAdministracao
  let ultimoFundoComumPago = fundoComum
  let ultimaTaxaAdministracaoPaga = taxaAdministracao
  let totalInvestidoFundoComum = 0
  const maxMeses = Math.min(mesContemplacao, 1000)

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      fundoAtual = fundoAtual * (1 + correctionIncc / 100)
      taxaAtual = taxaAtual * (1 + correctionIncc / 100)
    }
    pagamentos.push(fundoAtual + taxaAtual)
    ultimoFundoComumPago = fundoAtual
    ultimaTaxaAdministracaoPaga = taxaAtual
    totalInvestidoFundoComum += fundoAtual
  }

  return {
    pagamentos,
    ultimaParcela: pagamentos[pagamentos.length - 1] ?? (fundoComum + taxaAdministracao),
    ultimoFundoComumPago,
    ultimaTaxaAdministracaoPaga,
    totalInvestidoFundoComum,
  }
}

export function calcularAjusteAmortizacaoReajustado(
  totalInvestidoFundoComum: number,
  prazo: number,
  mesContemplacao: number
): number {
  const prazoRestante = prazo - mesContemplacao
  if (prazoRestante <= 0) return 0
  return totalInvestidoFundoComum / prazoRestante
}

// Reconstrói a parcela cheia do Fundo Comum a partir do componente reduzido
// (antes sempre *2, pois a redução do fundo comum era fixa em 50%)
export function calcularParcelaIntegral(
  fundoComumMeiaParcelaReajustado: number,
  taxaAdministracaoReajustada: number,
  ajusteAmortizacao: number,
  reducePercentage?: number | null
): number {
  const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
  const fundoComumIntegral = fatorReducao > 0 ? fundoComumMeiaParcelaReajustado / fatorReducao : 0
  return fundoComumIntegral + taxaAdministracaoReajustada + ajusteAmortizacao
}

// Helper function to calculate the additional monthly increment for Redução de Parcela.
// R = valor não pago por mês (diferença entre a parcela cheia e a parcela reduzida) × meses pré-contemplação.
// Com reducePercentage=50 (antigo "meia parcela" fixo), a diferença não paga por mês é igual à
// própria parcela reduzida, mantendo o cálculo idêntico ao de antes.
function calcularIncrementoMeiaParcela(
  meiaParcelaInicial: number,
  mesContemplacao: number,
  prazoTotal: number,
  reducePercentage?: number | null
): number {
  if (!mesContemplacao || mesContemplacao <= 0 || prazoTotal <= mesContemplacao) return 0
  const percentualReducao = normalizarReducePercentage(reducePercentage)
  if (percentualReducao <= 0 || percentualReducao >= 100) return 0
  const naoPagoPorMes = meiaParcelaInicial * (percentualReducao / (100 - percentualReducao))
  const R = naoPagoPorMes * mesContemplacao
  const prazoRestante = prazoTotal - mesContemplacao
  const X = R / prazoRestante
  const incrementoMensal = X / mesContemplacao
  return incrementoMensal
}

export function calcularPagamentosPosContemplacaoAjustada(
  parcelaIntegral: number,
  prazo: number,
  mesContemplacao: number,
  correctionIncc: number,
  meiaParcelaInicial?: number,
  reducePercentage?: number | null
): { parcelaIntegral: number; pagamentos: number[]; ultimaParcela: number } {
  const mesesRestantes = Math.max(0, prazo - mesContemplacao)
  const incrementoMensal = meiaParcelaInicial
    ? calcularIncrementoMeiaParcela(meiaParcelaInicial, mesContemplacao, prazo, reducePercentage)
    : 0
  
  const pagamentos: number[] = []
  let parcelaAtual = parcelaIntegral
  const maxMeses = Math.min(mesesRestantes, 1000)
  
  for (let mes = 1; mes <= maxMeses; mes++) {
    // First, add the monthly increment
    parcelaAtual += incrementoMensal
    // Then, check if we need to apply the annual INCC adjustment
    if (mes % 12 === 0) {
      parcelaAtual = parcelaAtual * (1 + correctionIncc / 100)
    }
    // Then, add this month's installment to the list
    pagamentos.push(parcelaAtual)
  }

  return {
    parcelaIntegral,
    pagamentos,
    ultimaParcela: pagamentos[pagamentos.length - 1] ?? parcelaAtual,
  }
}

// Total investido COMPLETO (uso exclusivo da Aposentadoria):
// representa tudo que é efetivamente pago no consórcio ao longo do prazo total, coerente
// com a PARCELA CHEIA exibida em cada modalidade.
// - Fundo Comum: mantém a lógica atual (já correta) = totalPaid da simulação.
// - Meia Parcela: usa a MESMA base da Alavancagem Patrimonial (parcela cheia = 27k...),
//   somando as meia parcelas pré-contemplação + a parcela cheia (com o incremento que
//   devolve "o que faltou") pós-contemplação, tudo com reajuste INCC anual.
export function calcularTotalInvestidoCompleto(input: SimulationInput): number {
  const { creditValue, months, contemplationMonth, taxaTotal, incc = 5, tipoReducao = 'meia-parcela', reducePercentage } = input
  const mesContemplacaoUsado = contemplationMonth ?? Math.floor(months / 2)

  if (tipoReducao === 'fundo-comum') {
    return calculateSimulation({ ...input, tipoReducao: 'fundo-comum' }).totalPaid
  }

  // Redução de Parcela — mesma base de cálculo da parcela cheia exibida (Alavancagem Patrimonial)
  const {
    pagamentos: pagamentosPre,
    ultimoFundoComumPago,
    ultimaTaxaAdministracaoPaga,
    totalInvestidoFundoComum,
  } = calcularPagamentosMeiaParcelaTotalAjustada(creditValue, months, taxaTotal, incc, mesContemplacaoUsado, reducePercentage)

  const ajusteAmortizacaoReajustado = calcularAjusteAmortizacaoReajustado(
    totalInvestidoFundoComum, months, mesContemplacaoUsado)

  const parcelaIntegral = calcularParcelaIntegralMeiaParcela(
    ultimoFundoComumPago, ultimaTaxaAdministracaoPaga, ajusteAmortizacaoReajustado, reducePercentage)

  const meiaParcelaInicial = calcularMeiaParcela(creditValue, taxaTotal, months, reducePercentage)

  const { pagamentos: pagamentosPos } = calcularPagamentosPosContemplacaoAjustada(
    parcelaIntegral, months, mesContemplacaoUsado, incc, meiaParcelaInicial, reducePercentage)

  return (
    pagamentosPre.reduce((acc, val) => acc + val, 0) +
    pagamentosPos.reduce((acc, val) => acc + val, 0)
  )
}

export function calculateSimulation(input: SimulationInput): SimulationResult {
  const { creditValue, months, contemplationMonth, taxaTotal, incc = 5, tipoReducao = 'meia-parcela', reducePercentage } = input
  
  // Step 1: Total Value with Fee
  const totalValue = creditValue * (1 + taxaTotal / 100)
  
  // Step 2: Fee Value in BRL
  const feeValue = calculateFee(creditValue, totalValue)
  
  // Step 3: Monthly Fee Installment
  const monthlyFee = calcularTaxaMensal(creditValue, taxaTotal, months)
  
  // Step 4: Gross Monthly Installment
  const grossInstallment = calcularFundoComum(creditValue, months)
  
  // Using the month of contemplation from input or default (half the term)
  const mesContemplacaoUsado = contemplationMonth ?? Math.floor(months / 2)

  let firstInitialPayment: number
  let finalPayment: number
  let finalPaymentAfterContemplation: number
  let parcelaPosContemplacaoAjustada: number
  let amortizacaoAjustada: number[]
  let totalPaid: number

  if (tipoReducao === 'fundo-comum') {
    // Lógica para Fundo Comum: redutor incide somente no fundo comum, conforme "Reduzir Parcela (%)"
    firstInitialPayment = calcularParcelaInicial(creditValue, months, taxaTotal, reducePercentage)

    const {
      pagamentos: pagamentosPreContemplacao,
      ultimaParcela,
    } = calcularPagamentosMeiaParcelaAjustada(
      creditValue, months, taxaTotal, incc, mesContemplacaoUsado, reducePercentage)
    finalPayment = ultimaParcela

    finalPaymentAfterContemplation = calcularPosContemplacao(
      creditValue, months, taxaTotal, mesContemplacaoUsado, incc, reducePercentage)

    const { pagamentos, ultimaParcela: parcelaAjustada } = calcularPagamentosPosContemplacaoAjustada(
      finalPaymentAfterContemplation, months, mesContemplacaoUsado, incc)
    amortizacaoAjustada = pagamentos
    parcelaPosContemplacaoAjustada = parcelaAjustada
    // Use o primeiro pagamento da amortização ajustada como o valor inicial pós contemplação
    finalPaymentAfterContemplation = pagamentos[0] ?? finalPaymentAfterContemplation

    const totalPagoPreContemplacao = pagamentosPreContemplacao.reduce((acc, val) => acc + val, 0)
    const totalPagoPosContemplacao = amortizacaoAjustada.reduce((acc, val) => acc + val, 0)
    totalPaid = totalPagoPreContemplacao + totalPagoPosContemplacao

  } else {
    // Lógica para Redução de Parcela (antes fixa em "meia" parcela), usando o % de "Reduzir Parcela"
    firstInitialPayment = calcularMeiaParcela(creditValue, taxaTotal, months, reducePercentage)
    
    // Pre-contemplação: pagamentos de meia parcela até o mês de contemplação
    const {
      pagamentos: pagamentosPreContemplacao,
      ultimaParcela,
    } = calcularPagamentosPeriodo(firstInitialPayment, incc, mesContemplacaoUsado)
    finalPayment = ultimaParcela
    
    // Pós-contemplação: valor é a parcela integral (meia parcela * 2) com ajuste INCC anual até o mês de contemplação
    const totalComTaxa = creditValue * (1 + taxaTotal / 100)
    const parcelaIntegralBase = totalComTaxa / months
    const parcelaIntegralInicial = aplicarReajusteAnual(parcelaIntegralBase, mesContemplacaoUsado, incc / 100)

    // Pagamentos pós-contemplação (com reajuste anual e o novo incremento mensal - for display)
    const { pagamentos, ultimaParcela: parcelaAjustada } = calcularPagamentosPosContemplacaoAjustada(
      parcelaIntegralInicial, months, mesContemplacaoUsado, incc, firstInitialPayment, reducePercentage)
    amortizacaoAjustada = pagamentos
    parcelaPosContemplacaoAjustada = parcelaAjustada
    // Use o primeiro pagamento da amortização ajustada como o valor inicial pós contemplação
    finalPaymentAfterContemplation = pagamentos[0] ?? parcelaIntegralInicial

    // Pagamentos pós-contemplação without increment (for totalPaid calculation, same logic as fundo comum)
    const { pagamentos: pagamentosSemIncremento } = calcularPagamentosPosContemplacaoAjustada(
      parcelaIntegralInicial, months, mesContemplacaoUsado, incc, undefined)

    const totalPagoPreContemplacao = pagamentosPreContemplacao.reduce((acc, val) => acc + val, 0)
    const totalPagoPosContemplacao = pagamentosSemIncremento.reduce((acc, val) => acc + val, 0)
    totalPaid = totalPagoPreContemplacao + totalPagoPosContemplacao
  }
  
  return {
    totalValue,
    feeValue,
    monthlyFee,
    grossInstallment,
    firstInitialPayment,
    finalPayment,
    finalPaymentAfterContemplation,
    totalPaid,
    contemplationMonth: mesContemplacaoUsado,
    parcelaPosContemplacaoAjustada,
    amortizacaoAjustada,
  }
}
