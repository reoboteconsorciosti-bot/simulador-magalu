import type { PrevidenciaAplicadaInput, PrevidenciaAplicadaResult } from '@/lib/types'
import { calculateMonthlyInstallment } from './helpers'

export function calcularCreditoPrevidencia(
  credito: number,
  prazo: number,
  incc: number,
  mesContemplacao: number
): number {
  let creditoReajustado = credito
  const anosCompletos = Math.floor(mesContemplacao / 12)

  for (let ano = 0; ano < anosCompletos; ano++) {
    creditoReajustado = creditoReajustado * (1 + incc / 100)
  }

  return creditoReajustado
}

export function calcularValorCorrigidoPrevidencia(
  credito: number,
  prazo: number,
  incc: number,
  mesContemplacao: number,
  aplicacao: number
): number {
  const creditoContemplado = calcularCreditoPrevidencia(
    credito,
    prazo,
    incc,
    mesContemplacao
  )
  const prazoRestante = Math.max(0, prazo - mesContemplacao)
  let valorCorrigido = creditoContemplado

  for (let mes = 0; mes < prazoRestante; mes++) {
    valorCorrigido = valorCorrigido * (1 + aplicacao / 100)
  }

  return valorCorrigido
}

export function calculatePrevidenciaAplicada(
  input: PrevidenciaAplicadaInput
): PrevidenciaAplicadaResult {
  const { creditValue, application, months, incc, currentMonth } = input
  
  // Monthly installment
  const parcelaCheia = calculateMonthlyInstallment(creditValue, months)
  
  // Credit
  const credit = calcularCreditoPrevidencia(creditValue, months, incc, currentMonth)
  
  // Valor Corrigido
  const valorCorrigido = calcularValorCorrigidoPrevidencia(
    creditValue,
    months,
    incc,
    currentMonth,
    application
  )
  
  // Total Investido
  const totalInvestido = parcelaCheia * currentMonth
  
  // Lucro
  const lucro = valorCorrigido - totalInvestido
  
  return {
    credit,
    valorCorrigido,
    parcelaCheia,
    parcelaPosContemplacao: 0,
    incc,
    lucro,
    totalInvestido,
  }
}
