import type { LeverageFinancialInput, LeverageFinancialResult } from '@/lib/types'
import { calculateMonthlyInstallment, calculateFee, calculateROI } from './helpers'
import { 
  calcularLucroAluguelParcela, 
  calcularAluguel, 
  getParcelaPosContemplacao 
} from './leverage-helpers'

function calcularTotalInvestido(valorParcela: number, quantidadeMeses: number, inccPercentual: number): number {
  const INCC = inccPercentual / 100
  
  let totalInvestido = 0
  let parcelaAtual = valorParcela

  for (let mes = 1; mes <= quantidadeMeses; mes++) {
    // A cada início de novo ciclo de 12 meses (exceto o primeiro), aplica reajuste
    if (mes > 1 && (mes - 1) % 12 === 0) {
      parcelaAtual = parcelaAtual * (1 + INCC)
    }

    totalInvestido += parcelaAtual
  }

  return totalInvestido
}

function calcularLucroVenda(valorVenda: number, totalInvestido: number): number {
  const lucro = valorVenda - totalInvestido
  console.log('=== Cálculo do Lucro de Venda ===')
  console.log('Valor da Venda:', valorVenda)
  console.log('Total Investido:', totalInvestido)
  console.log('Lucro:', lucro)
  return lucro
}

function calcularRentabilidadeMensal(valorFinal: number, valorInvestido: number, meses: number): number {
  console.log('=== Cálculo da Rentabilidade Mensal ===')
  console.log('Valor Final (recebido na venda):', valorFinal)
  console.log('Valor Investido:', valorInvestido)
  console.log('Meses até a contemplação:', meses)
  
  if (valorInvestido <= 0 || meses <= 0) {
    console.log('Rentabilidade Mensal: 0 (valor ou meses inválidos)')
    return 0
  }
  
  const rentabilidade = (Math.pow(valorFinal / valorInvestido, 1 / meses) - 1) * 100
  console.log('Rentabilidade Mensal:', rentabilidade + '%')
  return rentabilidade
}

export function calculateFinancialLeverage(
  input: LeverageFinancialInput
): LeverageFinancialResult {
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
    contemplationMonth
  } = input
  
  // Use defaults if null
  const inccValue = incc ?? 0
  const taxaTotalValue = taxaTotal ?? 0
  
  // Step 1: Calculate credit value with INCC (annual compound interest)
  const creditValueOriginal = creditValue
  
  // Calculate number of complete years based on currentMonth (when the credit is contemplated)
  // Rule: 60 months = 4 years (not 5) - subtract 1 before calculating
  const anosCompletos = Math.floor((currentMonth - 1) / 12)
  
  // Apply INCC: valorInicial * (1 + percentualAnual / 100) ** anosCompletos
  const creditValueWithIncc = creditValueOriginal * Math.pow(1 + inccValue / 100, anosCompletos)
  
  console.log('=== Cálculo INCC ===')
  console.log('Valor original da carta:', creditValueOriginal)
  console.log('INCC anual (%):', inccValue)
  console.log('Mês atual:', currentMonth)
  console.log('Anos completos:', anosCompletos)
  console.log('Valor com INCC:', creditValueWithIncc)
  
  // Calculate Final Monthly Payment (Parcela Inicial Mensal) like in the simulation
  const totalValueWithTax = creditValueOriginal * (1 + taxaTotalValue / 100)
  const feeValue = calculateFee(creditValueOriginal, totalValueWithTax)
  const monthlyFee = feeValue / months
  const grossInstallment = calculateMonthlyInstallment(creditValueOriginal, months)
  const finalPayment = (grossInstallment / 2) + monthlyFee
  
  // Calculate installment amount based on type (Meia/Cheia) using the final payment
  const actualInstallment = installmentType === 'Meia' ? finalPayment : finalPayment * 2
  
  // Total Credit (calculated as per the image, now using credit with INCC)
  const totalCredit = creditValueWithIncc * (1 + saleGainPercent / 100)
  
  // Sale Value (valorFinal = valor recebido na venda)
  const saleValue = creditValueWithIncc * (saleGainPercent / 100)
  
  // Total Invested with annual INCC adjustment, using the final payment
  const totalInvested = calcularTotalInvestido(actualInstallment, currentMonth, inccValue)
  
  // Profit using the separate function
  const profit = calcularLucroVenda(saleValue, totalInvested)
  
  // ROI (%)
  const roi = calculateROI(profit, totalInvested)
  
  // Monthly Return (Rentabilidade Mensal)
  const monthlyReturn = calcularRentabilidadeMensal(saleValue, totalInvested, currentMonth)
  
  // Novos cálculos usando funções compartilhadas
  let parcelaPosContemplacao: number | undefined
  let aluguel: number | undefined
  let lucroAluguelParcela: number | undefined
  
  if (contemplationMonth && taxaTotalValue !== undefined) {
    parcelaPosContemplacao = getParcelaPosContemplacao({
      clientName: '',
      creditValue,
      months,
      contemplationMonth,
      incc: inccValue,
      lanceEmbutido: 0,
      taxaTotal: taxaTotalValue
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
  
  return {
    creditValueOriginal,
    creditValueWithIncc,
    totalCredit,
    saleValue,
    totalInvested,
    profit,
    roi,
    monthlyReturn,
    parcelaPosContemplacao,
    aluguel,
    lucroAluguelParcela
  }
}
