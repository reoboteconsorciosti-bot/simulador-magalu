// Helper functions that are used across multiple calculations
export function calculateMonthlyInstallment(creditValue: number, months: number): number {
  return creditValue / months
}

export function calculateFee(creditValue: number, totalValue: number): number {
  return totalValue - creditValue
}

export function calculateROI(profit: number, totalInvested: number): number {
  return totalInvested > 0 ? (profit / totalInvested) * 100 : 0
}

export function calculateCompoundInterest(principal: number, rate: number, period: number): number {
  return principal * Math.pow(1 + rate / 100, period)
}

/**
 * Calcula o lucro como a diferença entre o aluguel e a parcela pós contemplação
 * @param aluguel Valor do aluguel
 * @param parcelaPosContemplacao Valor da parcela pós contemplação
 * @returns O lucro calculado
 */
export function calculateLucroAluguelParcela(aluguel: number, parcelaPosContemplacao: number): number {
  return aluguel - parcelaPosContemplacao
}
