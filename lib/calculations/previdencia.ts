import type { PrevidenciaAplicadaInput, PrevidenciaAplicadaResult } from '@/lib/types'
import { calculateMonthlyInstallment } from './helpers'
import { calculoCreditoContempladoPatrimonial } from './patrimonial-leverage'

export function calcularValorCorrigidoPrevidencia(
  credito: number,
  prazo: number,
  incc: number,
  mesContemplacao: number,
  aplicacao: number
): number {
  const creditoContemplado = calculoCreditoContempladoPatrimonial(
    credito,
    mesContemplacao,
    incc
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
  
  // Credit Contemplado (using the function from patrimonial-leverage)
  const creditContemplado = calculoCreditoContempladoPatrimonial(creditValue, currentMonth, incc)
  
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
    credit: creditContemplado, // this can still be the same property name
    creditContemplado, // add this explicitly for clarity
    valorCorrigido,
    parcelaCheia,
    parcelaPosContemplacao: 0,
    incc,
    lucro,
    totalInvestido,
  }
}
