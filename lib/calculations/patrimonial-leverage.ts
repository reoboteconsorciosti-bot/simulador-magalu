import type { LeveragePatrimonialInput, LeveragePatrimonialResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateCompoundInterest } from './helpers'
import {
  calcularAjusteAmortizacaoReajustado,
  calcularParcelaIntegral,
  calcularPagamentosMeiaParcelaAjustada,
  calcularPagamentosPosContemplacaoAjustada,
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
  const { creditValue, months, rentPercent, correctionIncc, rentIgpPercent, currentMonth, taxaTotal, contemplationMonth, incc } = input
  
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
  
  const {
    pagamentos: pagamentosPreContemplacao,
    ultimoFundoComumPago,
    ultimaTaxaAdministracaoPaga,
    totalInvestidoFundoComum,
  } = calcularPagamentosMeiaParcelaAjustada(
    creditValue,
    months,
    taxaTotal,
    incc ?? 5,
    contemplationMonth
  )

  const ajusteAmortizacaoReajustado = calcularAjusteAmortizacaoReajustado(
    totalInvestidoFundoComum,
    months,
    contemplationMonth
  )

  const parcelaIntegral = calcularParcelaIntegral(
    ultimoFundoComumPago,
    ultimaTaxaAdministracaoPaga,
    ajusteAmortizacaoReajustado
  )

  const {
    pagamentos: amortizacaoAjustada,
    ultimaParcela: parcelaAjustada,
  } = calcularPagamentosPosContemplacaoAjustada(
    parcelaIntegral,
    months,
    contemplationMonth,
    incc ?? 5,
  )
  
  // Total Pago Consórcio (soma todos os pagamentos pré e pós contemplação)
  const totalPagoPreContemplacao = pagamentosPreContemplacao.reduce((acc, val) => acc + val, 0)
  const totalPagoPosContemplacao = amortizacaoAjustada.reduce((acc, val) => acc + val, 0)
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
    parcelaPosContemplacaoAjustada: parcelaAjustada,
    amortizacaoAjustada,
  }
}
