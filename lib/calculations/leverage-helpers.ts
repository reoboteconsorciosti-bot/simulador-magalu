import { calculateSimulation } from './simulation'
import type { SimulationInput } from '@/lib/types'

/**
 * Calcula o lucro como a diferença entre o aluguel e a parcela pós contemplação
 * @param aluguel Valor do aluguel
 * @param parcelaPosContemplacao Valor da parcela pós contemplação
 * @returns O lucro calculado
 */
export function calcularLucroAluguelParcela(aluguel: number, parcelaPosContemplacao: number): number {
  return aluguel - parcelaPosContemplacao
}

/**
 * Obtém o valor da parcela pós contemplação a partir dos dados da simulação
 * @param input Dados da simulação
 * @returns O valor da parcela pós contemplação
 */
export function getParcelaPosContemplacao(input: SimulationInput): number {
  const simulation = calculateSimulation(input)
  return simulation.finalPaymentAfterContemplation
}

/**
 * Calcula o valor do aluguel com base no crédito e percentual de aluguel
 * @param credito Valor do crédito
 * @param percentualAluguel Percentual de aluguel
 * @returns O valor do aluguel
 */
export function calcularAluguel(credito: number, percentualAluguel: number): number {
  return credito * (percentualAluguel / 100)
}

/**
 * Calcula o percentual pago no imóvel com base no total pago no consórcio e alugueis recebidos
 * @param alugueisRecebidos Total de alugueis recebidos
 * @param totalPagoConsorcio Total pago no consórcio
 * @returns O percentual pago no imóvel (valor pago por você sobre total do consórcio), nunca negativo
 */
export function calcularPagoImovel(alugueisRecebidos: number, totalPagoConsorcio: number): number {
  if (totalPagoConsorcio <= 0) return 0
  const valorPagoPorVoce = totalPagoConsorcio - alugueisRecebidos
  if (valorPagoPorVoce < 0) return 0
  return (valorPagoPorVoce / totalPagoConsorcio) * 100
}
