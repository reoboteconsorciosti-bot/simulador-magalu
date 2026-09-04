import type { LeveragePatrimonialInput, LeveragePatrimonialResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateCompoundInterest } from './helpers'
import {
  calcularAjusteAmortizacaoReajustado,
  calcularParcelaIntegral,
  calcularPagamentosMeiaParcelaAjustada,
  calcularPagamentosPosContemplacaoAjustada,
  calcularPagamentosMeiaParcelaTotalAjustada,
  calcularParcelaIntegralMeiaParcela,
  calcularMeiaParcela,
} from './simulation'
import { calcularPagoImovel } from './leverage-helpers'

export function calculoCreditoContempladoPatrimonial(
  credito: number,
  mesContemplacao: number,
  incc: number
): number {
  if (!credito || !mesContemplacao || mesContemplacao <= 0) return credito
  
  let creditoCorrigido = credito
  const maxMeses = Math.min(mesContemplacao, 1000) // Limita para evitar loops infinitos

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      creditoCorrigido = creditoCorrigido * (1 + incc / 100)
    }
  }

  return creditoCorrigido
}

export function calcularInccPatrimonial(
  credito: number,
  correcaoIncc: number,
  mesContemplacao: number
): number {
  if (!credito || !mesContemplacao || mesContemplacao <= 0) return credito
  
  let creditoCorrigido = credito
  const maxMeses = Math.min(mesContemplacao, 1000) // Limita para evitar loops infinitos

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      creditoCorrigido = creditoCorrigido * (1 + correcaoIncc / 100)
    }
  }

  return creditoCorrigido
}

// Calcula o prazo restante em anos e meses
function calcularPrazoRestante(prazo: number, mesContemplacao: number): { resto: number; prazoRestanteAnual: number } {
  if (!prazo || !mesContemplacao) return { resto: 0, prazoRestanteAnual: 0 }
  const resto = Math.max(0, prazo - mesContemplacao)
  const prazoRestanteAnual = resto / 12
  return { resto, prazoRestanteAnual }
}

// Calcula o total de alugueis recebidos com reajuste anual de IGP-M
function calcularTotalAlugueis(
  aluguelInicial: number,
  igpmAluguel: number,
  prazoRestanteMeses: number
): number {
  if (!aluguelInicial || !prazoRestanteMeses || prazoRestanteMeses <= 0) return 0
  
  let totalAlugueis = 0
  let aluguelAtual = aluguelInicial
  const maxAnos = Math.min(Math.floor(prazoRestanteMeses / 12), 100) // Limita para evitar loops infinitos
  const mesesRestantesUltimoAno = prazoRestanteMeses % 12

  // Calcula para cada ano completo
  for (let ano = 0; ano < maxAnos; ano++) {
    totalAlugueis += aluguelAtual * 12
    aluguelAtual = aluguelAtual * (1 + igpmAluguel / 100)
  }

  // Adiciona os meses restantes do último ano (se houver)
  if (mesesRestantesUltimoAno > 0) {
    totalAlugueis += aluguelAtual * mesesRestantesUltimoAno
  }

  return totalAlugueis
}

// Calcula a renda passiva final (valor do aluguel no último período)
function calcularRendaPassivaFinal(
  aluguelInicial: number,
  igpmAluguel: number,
  prazoRestanteMeses: number
): number {
  if (!aluguelInicial || !prazoRestanteMeses || prazoRestanteMeses <= 0) return aluguelInicial
  
  let aluguelAtual = aluguelInicial
  const maxAnos = Math.min(Math.floor(prazoRestanteMeses / 12), 100) // Limita para evitar loops infinitos

  // Aplica reajuste anual para cada ano completo
  for (let ano = 0; ano < maxAnos; ano++) {
    aluguelAtual = aluguelAtual * (1 + igpmAluguel / 100)
  }

  return aluguelAtual
}

export function calculatePatrimonialLeverage(
  input: LeveragePatrimonialInput
): LeveragePatrimonialResult {
  const { creditValue, months, rentPercent, correctionIncc, rentIgpPercent, currentMonth, taxaTotal, contemplationMonth, incc, tipoReducao, reducePercentage } = input
  
  // Monthly installment
  const monthlyInstallment = calculateMonthlyInstallment(creditValue, months)
  
  // Credit Contemplado (usando o INCC da simulação)
  const creditContemplado = incc !== undefined ? calculoCreditoContempladoPatrimonial(creditValue, contemplationMonth, incc) : creditValue
  
  // Aluguel inicial
  const aluguel = creditContemplado * (rentPercent / 100)
  
  // Valor Imóvel Corrigido (crédito contemplado + reajuste de INCC anual sobre o prazo restante)
  const { resto: prazoRestanteMeses } = calcularPrazoRestante(months, contemplationMonth)
  const valorImovelCorrigido = calculateCompoundInterest(creditContemplado, correctionIncc, prazoRestanteMeses / 12)
  
  // Alugueis Recebidos com reajuste anual de IGP-M
  const alugueisRecebidos = calcularTotalAlugueis(aluguel, rentIgpPercent, prazoRestanteMeses)
  
  let pagamentosPreContemplacao: number[]
  let ultimoFundoComumPago: number
  let ultimaTaxaAdministracaoPaga: number
  let totalInvestidoFundoComum: number
  
  if (tipoReducao === 'meia-parcela') {
    // Lógica para Redução de Parcela
    const result = calcularPagamentosMeiaParcelaTotalAjustada(
      creditValue,
      months,
      taxaTotal,
      incc ?? 5,
      contemplationMonth,
      reducePercentage
    )
    pagamentosPreContemplacao = result.pagamentos
    ultimoFundoComumPago = result.ultimoFundoComumPago
    ultimaTaxaAdministracaoPaga = result.ultimaTaxaAdministracaoPaga
    totalInvestidoFundoComum = result.totalInvestidoFundoComum
  } else {
    // Lógica para Fundo Comum (redutor incide somente no fundo comum)
    const result = calcularPagamentosMeiaParcelaAjustada(
      creditValue,
      months,
      taxaTotal,
      incc ?? 5,
      contemplationMonth,
      reducePercentage
    )
    pagamentosPreContemplacao = result.pagamentos
    ultimoFundoComumPago = result.ultimoFundoComumPago
    ultimaTaxaAdministracaoPaga = result.ultimaTaxaAdministracaoPaga
    totalInvestidoFundoComum = result.totalInvestidoFundoComum
  }

  const ajusteAmortizacaoReajustado = calcularAjusteAmortizacaoReajustado(
    totalInvestidoFundoComum,
    months,
    contemplationMonth
  )

  let parcelaIntegral: number
  if (tipoReducao === 'meia-parcela') {
    parcelaIntegral = calcularParcelaIntegralMeiaParcela(
      ultimoFundoComumPago,
      ultimaTaxaAdministracaoPaga,
      ajusteAmortizacaoReajustado,
      reducePercentage
    )
  } else {
    parcelaIntegral = calcularParcelaIntegral(
      ultimoFundoComumPago,
      ultimaTaxaAdministracaoPaga,
      ajusteAmortizacaoReajustado,
      reducePercentage
    )
  }

  // Calculate two versions of post-contemplation payments:
  // 1. With monthly increment for displaying parcelaPosContemplacaoAjustada
  // 2. Without monthly increment for calculating totalPagoConsorcio (same logic as fundo comum)
  const meiaParcelaInicial = tipoReducao === 'meia-parcela'
    ? calcularMeiaParcela(creditValue, taxaTotal, months, reducePercentage)
    : undefined

  const {
    pagamentos: amortizacaoAjustada,
    ultimaParcela: parcelaAjustada,
  } = calcularPagamentosPosContemplacaoAjustada(
    parcelaIntegral,
    months,
    contemplationMonth,
    incc ?? 5,
    meiaParcelaInicial,
    reducePercentage,
  )
  
  // For totalPagoConsorcio, use the same logic as fundo comum (no monthly increment)
  const {
    pagamentos: amortizacaoAjustadaSemIncremento,
  } = calcularPagamentosPosContemplacaoAjustada(
    parcelaIntegral,
    months,
    contemplationMonth,
    incc ?? 5,
    undefined, // No meiaParcelaInicial means no monthly increment
  )

  // O valor da parcela pós contemplação a ser exibido é a primeira parcela da amortização ajustada
  const parcelaPosContemplacaoInicial = amortizacaoAjustada[0] ?? parcelaIntegral
  
  // Total Pago Consórcio (soma todos os pagamentos pré e pós contemplação, using the version without increment for meia parcela)
  const totalPagoPreContemplacao = pagamentosPreContemplacao.reduce((acc, val) => acc + val, 0)
  const totalPagoPosContemplacao = amortizacaoAjustadaSemIncremento.reduce((acc, val) => acc + val, 0)
  const totalPagoConsorcio = totalPagoPreContemplacao + totalPagoPosContemplacao
  
  // Renda Passiva (valor do aluguel no último período)
  const rendaPassiva = calcularRendaPassivaFinal(aluguel, rentIgpPercent, prazoRestanteMeses)
  
  // Custo Final
  const custoFinal = totalPagoConsorcio - alugueisRecebidos
  
  // % Pago no Imóvel (alugueis recebidos sobre total pago em consórcios)
  const percentPagoImovel = calcularPagoImovel(alugueisRecebidos, totalPagoConsorcio)
  
  // Desembolso
  const desembolso = monthlyInstallment - aluguel
  
  return {
    creditContemplado,
    prazo: months - currentMonth,
    parcela: monthlyInstallment,
    aluguel,
    valorImovelCorrigido,
    alugueisRecebidos,
    totalPagoConsorcio,
    custoFinal,
    percentPagoImovel,
    rendaPassiva,
    desembolso,
    parcelaPosContemplacaoAjustada: parcelaPosContemplacaoInicial,
    amortizacaoAjustada,
  }
}
