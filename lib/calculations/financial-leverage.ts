import type { LeverageFinancialInput, LeverageFinancialResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateFee, calculateROI } from './helpers'
import { 
  calcularLucroAluguelParcela, 
  calcularAluguel, 
  getParcelaPosContemplacao 
} from './leverage-helpers'
import { calcularParcelaInicial, normalizarReducePercentage } from './simulation'

function calcularTotalInvestido(
  credito: number,
  prazo: number,
  taxaTotal: number,
  inccPercentual: number,
  quantidadeMeses: number,
  tipoParcela: 'Meia' | 'Cheia',
  tipoReducao: string = 'meia-parcela',
  reducePercentage?: number | null
): { totalInvestido: number; ultimaParcela: number } {
  console.log('[calcularTotalInvestido] ENTRADA:', { credito, prazo, taxaTotal, inccPercentual, quantidadeMeses, tipoParcela, tipoReducao, reducePercentage })

  // Define a parcela base conforme a modalidade (ambas usam o % de "Reduzir Parcela"):
  // - Fundo Comum: reduz SOMENTE o fundo comum, a taxa fica inteira, igual ao exibido na UI
  // - Redução de Parcela: reduz o (fundo comum + taxa) juntos, igual ao exibido na UI
  let parcelaBase: number
  if (tipoReducao === 'fundo-comum') {
    parcelaBase = calcularParcelaInicial(credito, prazo, taxaTotal, reducePercentage)
    console.log('[calcularTotalInvestido] Modalidade FUNDO COMUM - parcelaBase:', parcelaBase)
  } else {
    const fatorReducao = 1 - normalizarReducePercentage(reducePercentage) / 100
    const fundoComumMensal = credito / prazo
    const taxaMensal = (credito * (taxaTotal / 100)) / prazo
    parcelaBase = (fundoComumMensal + taxaMensal) * fatorReducao
    console.log('[calcularTotalInvestido] Modalidade REDUÇÃO DE PARCELA - parcelaBase:', parcelaBase)
  }

  if (!quantidadeMeses || quantidadeMeses <= 0) {
    console.log('[calcularTotalInvestido] SAIDA (meses<=0):', { totalInvestido: 0, ultimaParcela: parcelaBase })
    return { totalInvestido: 0, ultimaParcela: parcelaBase }
  }

  // A parcela base cresce com INCC a cada 12 meses (estrutura condicional mantida)
  let parcelaAtual = parcelaBase
  let totalInvestido = 0
  let ultimaParcela = parcelaBase
  const maxMeses = Math.min(quantidadeMeses, 1000)
  console.log('[calcularTotalInvestido] Estado inicial:', { parcelaBase, parcelaAtual, maxMeses })

  for (let mes = 1; mes <= maxMeses; mes++) {
    if (mes % 12 === 0) {
      parcelaAtual = parcelaAtual * (1 + inccPercentual / 100)
      console.log(`[calcularTotalInvestido] Reajuste INCC mês ${mes}:`, { parcelaAtual })
    }
    totalInvestido += parcelaAtual
    ultimaParcela = parcelaAtual
  }

  console.log('[calcularTotalInvestido] SAIDA:', { totalInvestido, ultimaParcela })
  return { totalInvestido, ultimaParcela }
}

function calcularLucroVenda(valorVenda: number, totalInvestido: number): number {
  const lucro = valorVenda - totalInvestido
  console.log('=== Cálculo do Lucro de Venda ===')
  console.log('Valor da Venda:', valorVenda)
  console.log('Total Investido:', totalInvestido)
  console.log('Lucro:', lucro)
  return lucro
}

function calcularRentabilidadeMensal(roi: number, meses: number): number {
  if (meses <= 0) return 0
  return roi / meses
}

export function calculateFinancialLeverage(
  input: LeverageFinancialInput
): LeverageFinancialResult {
  console.log('[calculateFinancialLeverage] INPUT BRUTO RECEBIDO:', JSON.stringify(input, null, 2))

  const { 
    creditValue, 
    months, 
    incc, 
    taxaTotal, 
    saleGainPercent, 
    installmentType, 
    modality, 
    currentMonth,
    rentPercent,
    contemplationMonth,
    tipoReducao,
    reducePercentage
  } = input

  const DEFAULT_CREDIT = 110000
  const DEFAULT_MONTHS = 220
  const DEFAULT_INCC = 5
  const DEFAULT_TAXA = 27
  const DEFAULT_SALE_GAIN = 20
  const DEFAULT_CONTEMPLACAO = 49

  const creditValueOriginal = (creditValue && creditValue > 0) ? creditValue : DEFAULT_CREDIT
  const monthsValue = (months && months > 0) ? months : DEFAULT_MONTHS
  const inccValue = (incc !== null && incc !== undefined && !isNaN(incc)) ? incc : DEFAULT_INCC
  const taxaTotalValue = (taxaTotal !== null && taxaTotal !== undefined && !isNaN(taxaTotal)) ? taxaTotal : DEFAULT_TAXA
  const saleGain = (saleGainPercent !== null && saleGainPercent !== undefined && !isNaN(saleGainPercent)) ? saleGainPercent : DEFAULT_SALE_GAIN
  const contemplacaoUsada = (contemplationMonth && contemplationMonth > 0) ? contemplationMonth
    : (currentMonth && currentMonth > 0) ? currentMonth
    : DEFAULT_CONTEMPLACAO

  console.log('[calculateFinancialLeverage] VALORES APOS FALLBACKS:', { creditValueOriginal, monthsValue, inccValue, taxaTotalValue, saleGain, contemplacaoUsada })

  const anosCompletos = Math.floor((contemplacaoUsada - 1) / 12)
  
  const creditValueWithIncc = creditValueOriginal * Math.pow(1 + inccValue / 100, anosCompletos)
  
  console.log('=== Cálculo INCC ===')
  console.log('Valor original da carta:', creditValueOriginal)
  console.log('INCC anual (%):', inccValue)
  console.log('Mês contemplação:', contemplacaoUsada)
  console.log('Anos completos:', anosCompletos)
  console.log('Valor com INCC:', creditValueWithIncc)
  
  const totalValueWithTax = creditValueOriginal * (1 + taxaTotalValue / 100)
  const feeValue = calculateFee(creditValueOriginal, totalValueWithTax)
  const monthlyFee = feeValue / monthsValue
  const grossInstallment = calculateMonthlyInstallment(creditValueOriginal, monthsValue)
  const finalPayment = (grossInstallment / 2) + monthlyFee
  
  const totalCredit = creditValueWithIncc * (1 + saleGain / 100)
  
  const saleValue = creditValueWithIncc * (saleGain / 100)
  
  console.log('[calculateFinancialLeverage] CHAMANDO calcularTotalInvestido com:', { creditValueOriginal, monthsValue, taxaTotalValue, inccValue, contemplacaoUsada, installmentType, tipoReducao })
  const { totalInvestido, ultimaParcela } = calcularTotalInvestido(
    creditValueOriginal,
    monthsValue,
    taxaTotalValue,
    inccValue,
    contemplacaoUsada,
    (installmentType as 'Meia' | 'Cheia') || 'Meia',
    tipoReducao || 'meia-parcela',
    reducePercentage
  )
  const totalInvested = totalInvestido
  console.log('[calculateFinancialLeverage] RETORNO calcularTotalInvestido:', { totalInvestido, ultimaParcela })
  
  const actualInstallment = ultimaParcela
  
  const profit = calcularLucroVenda(saleValue, totalInvested)
  console.log('[calculateFinancialLeverage] profit calculado:', profit, 'saleValue:', saleValue, 'totalInvested:', totalInvested)
  
  const roi = calculateROI(profit, totalInvested)
  console.log('[calculateFinancialLeverage] roi calculado:', roi)
  
  const monthlyReturn = calcularRentabilidadeMensal(roi, contemplacaoUsada)
  console.log('[calculateFinancialLeverage] monthlyReturn calculado:', monthlyReturn)
  
  let parcelaPosContemplacao: number | undefined
  let aluguel: number | undefined
  let lucroAluguelParcela: number | undefined
  
  if (contemplacaoUsada && taxaTotalValue !== undefined) {
    parcelaPosContemplacao = getParcelaPosContemplacao({
      clientName: '',
      creditValue: creditValueOriginal,
      months: monthsValue,
      contemplationMonth: contemplacaoUsada,
      incc: inccValue,
      lanceEmbutido: 0,
      taxaTotal: taxaTotalValue,
      tipoReducao: tipoReducao || 'meia-parcela',
      reducePercentage
    })
    
    if (rentPercent) {
      aluguel = calcularAluguel(creditValueWithIncc, rentPercent)
      lucroAluguelParcela = calcularLucroAluguelParcela(aluguel, parcelaPosContemplacao)
    }
  }
  
  console.log('=== Resultados Alavancagem Financeira ===')
  console.log('Crédito original:', creditValueOriginal)
  console.log('Crédito com INCC:', creditValueWithIncc)
  console.log('Crédito total (com ganho):', totalCredit)
  console.log('Parcela Final Mensal:', finalPayment)
  console.log('Parcela utilizada:', actualInstallment)
  console.log('Valor da venda:', saleValue)
  console.log('Total investido:', totalInvested)
  console.log('Lucro:', profit)
  console.log('ROI:', roi + '%')
  console.log('Rentabilidade mensal:', monthlyReturn + '%')

  const retorno = {
    creditValueOriginal,
    creditValueWithIncc,
    totalCredit,
    saleValue,
    totalInvested,
    meiaParcelaAteContemplacao: ultimaParcela,
    profit,
    roi,
    monthlyReturn,
    parcelaPosContemplacao,
    aluguel,
    lucroAluguelParcela
  }
  console.log('[calculateFinancialLeverage] RETORNO FINAL DA FUNCAO:', JSON.stringify(retorno, null, 2))
  return retorno
}
