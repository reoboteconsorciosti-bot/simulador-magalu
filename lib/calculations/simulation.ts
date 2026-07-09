import type { SimulationInput, SimulationResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateFee } from './helpers'

// 1. Calcula o fundo comum cheio
function calcularFundoComum(credito: number, prazo: number): number {
  return credito / prazo
}

// Calcula a meia parcela conforme a lógica do usuário
export function calcularMeiaParcela(credito: number, taxaTotal: number, prazo: number): number {
  const totalComTaxa = credito * (1 + taxaTotal / 100)
  const parcelaIntegral = totalComTaxa / prazo
  return parcelaIntegral / 2
}

// 2. Calcula a taxa mensal (usando taxaTotal)
function calcularTaxaMensal(credito: number, taxaTotal: number, prazo: number): number {
  const totalTaxa = credito * (taxaTotal / 100)
  return totalTaxa / prazo
}

// 3. Calcula a parcela inicial (meia) - redutor incide SOMENTE no fundo comum
export function calcularParcelaInicial(
  credito: number,
  prazo: number,
  taxaTotal: number,
): number {
  const componenteA = (credito / 2) / prazo
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
  taxaTotal: number
): { fundoComum: number; taxaAdministracao: number } {
  return {
    fundoComum: (credito / 2) / prazo,
    taxaAdministracao: (credito * (taxaTotal / 100)) / prazo,
  }
}

// Função para calcular componentes de Meia Parcela (redução em ambos)
export function calcularComponentesMeiaParcelaTotal(
  credito: number,
  prazo: number,
  taxaTotal: number
): { fundoComum: number; taxaAdministracao: number } {
  const totalComTaxa = credito * (1 + taxaTotal / 100)
  const parcelaIntegral = totalComTaxa / prazo
  const parcelaMeia = parcelaIntegral / 2
  
  const fundoComum = credito / prazo / 2
  const taxaAdministracao = (credito * taxaTotal / 100) / prazo / 2
  
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
    taxaTotal
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

// Função para calcular parcela integral para Meia Parcela
export function calcularParcelaIntegralMeiaParcela(
  fundoComumMeiaParcelaReajustado: number,
  taxaAdministracaoReajustada: number,
  ajusteAmortizacao: number
): number {
  const fundoComumIntegral = fundoComumMeiaParcelaReajustado * 2
  const taxaAdministracaoIntegral = taxaAdministracaoReajustada * 2
  return fundoComumIntegral + taxaAdministracaoIntegral + ajusteAmortizacao
}

// 4.1 Calcula o ajuste de amortização
export function calcularAjusteAmortizacao(
  credito: number,
  prazo: number,
  mesContemplacao: number
): number {
  const componenteA = (credito / 2) / prazo
  const valorInvestido = componenteA * mesContemplacao
  const parcelasRestantes = prazo - mesContemplacao
  return valorInvestido / parcelasRestantes
}

// 4. Calcula parcela base (sem ajuste de amortização)
export function calcularParcelaBasePosContemplacao(
  credito: number,
  prazo: number,
  taxaTotal: number
): number {
  // Componente A: meia parcela do fundo comum
  const componenteA = (credito / 2) / prazo

  // Componente B: taxa de administração mensal
  const componenteB = (credito * (taxaTotal / 100)) / prazo

  // Parcela cheia do fundo comum
  const parcelaCheia = componenteA * 2

  // Parcela base: parcela cheia + taxa mensal
  return parcelaCheia + componenteB
}

// 4. Calcula a parcela integral
export function calcularPosContemplacao(
  credito: number,
  prazo: number,
  taxaTotal: number,
  mesContemplacao: number,
  inccAnual: number
): number {
  const incc = inccAnual / 100

  const fundoComumBase = (credito / 2) / prazo
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

  const metadeCredito = credito / 2
  const metadeCreditoReajustada = aplicarReajusteAnual(
    metadeCredito,
    mesContemplacao,
    incc
  )
  const calculoB = metadeCreditoReajustada / prazoRestante

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
    taxaTotal
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

export function calcularParcelaIntegral(
  fundoComumMeiaParcelaReajustado: number,
  taxaAdministracaoReajustada: number,
  ajusteAmortizacao: number
): number {
  const fundoComumIntegral = fundoComumMeiaParcelaReajustado * 2
  return fundoComumIntegral + taxaAdministracaoReajustada + ajusteAmortizacao
}

// Helper function to calculate the additional monthly increment for Meia Parcela
function calcularIncrementoMeiaParcela(
  meiaParcelaInicial: number,
  mesContemplacao: number,
  prazoTotal: number
): number {
  if (!mesContemplacao || mesContemplacao <= 0 || prazoTotal <= mesContemplacao) return 0
  const R = meiaParcelaInicial * mesContemplacao
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
  meiaParcelaInicial?: number
): { parcelaIntegral: number; pagamentos: number[]; ultimaParcela: number } {
  const mesesRestantes = Math.max(0, prazo - mesContemplacao)
  const incrementoMensal = meiaParcelaInicial 
    ? calcularIncrementoMeiaParcela(meiaParcelaInicial, mesContemplacao, prazo)
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

export function calculateSimulation(input: SimulationInput): SimulationResult {
  const { creditValue, months, contemplationMonth, taxaTotal, incc = 5, tipoReducao = 'meia-parcela' } = input
  
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
    // Lógica para Fundo Comum (mantida como original)
    firstInitialPayment = calcularParcelaInicial(creditValue, months, taxaTotal)
    
    const {
      pagamentos: pagamentosPreContemplacao,
      ultimaParcela,
    } = calcularPagamentosMeiaParcelaAjustada(
      creditValue, months, taxaTotal, incc, mesContemplacaoUsado)
    finalPayment = ultimaParcela

    finalPaymentAfterContemplation = calcularPosContemplacao(
      creditValue, months, taxaTotal, mesContemplacaoUsado, incc)

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
    // Lógica para Meia Parcela usando a nova regra
    firstInitialPayment = calcularMeiaParcela(creditValue, taxaTotal, months)
    
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
      parcelaIntegralInicial, months, mesContemplacaoUsado, incc, firstInitialPayment)
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
