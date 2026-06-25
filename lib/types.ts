export type UserRole = 'ADMIN' | 'VENDEDOR'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  office?: string
  phone?: string
  socialMedia?: string
  active: boolean
}

export interface Simulation {
  id: string
  clientName: string
  creditValue: number
  months: number
  contemplationMonth: number
  incc: number
  lanceEmbutido: number
  taxaTotal: number
  totalValue: number
  feeValue: number
  monthlyFee: number
  grossInstallment: number
  firstInitialPayment: number
  finalPayment: number
  finalPaymentAfterContemplation: number
  totalPaid: number
  parcelaPosContemplacaoAjustada: number
  amortizacaoAjustada: number[]
  createdAt: Date
  userId: string
  userName: string
  status: 'EM_ANDAMENTO' | 'PDF_GERADO'
}

export interface SimulationInput {
  clientName: string
  creditValue: number
  months: number
  contemplationMonth?: number
  incc?: number
  lanceEmbutido?: number
  taxaTotal: number
}

export interface SimulationResult {
  totalValue: number
  feeValue: number
  monthlyFee: number
  grossInstallment: number
  firstInitialPayment: number
  finalPayment: number
  finalPaymentAfterContemplation: number
  totalPaid: number
  contemplationMonth: number
  parcelaPosContemplacaoAjustada: number
  amortizacaoAjustada: number[]
}

export interface LeverageFinancialInput {
  creditValue: number;
  months: number;
  incc?: number | null;
  taxaTotal?: number | null;
  saleGainPercent: number;
  installmentType: string; // "Meia" or "Cheia"
  modality: string; // "Sorteio", "Lance Fixo", "Lance Fidelidade"
  currentMonth: number;
  rentPercent?: number | null; // Novo campo para percentual de aluguel
  contemplationMonth?: number | null; // Novo campo para mês de contemplação
}

export interface LeverageFinancialResult {
  creditValueOriginal: number;
  creditValueWithIncc: number;
  totalCredit: number;
  saleValue: number;
  totalInvested: number;
  profit: number;
  roi: number;
  monthlyReturn: number;
  parcelaPosContemplacao?: number; // Novo campo: parcela pós contemplação
  aluguel?: number; // Novo campo: valor do aluguel
  lucroAluguelParcela?: number; // Novo campo: lucro aluguel - parcela
}

export interface LeveragePatrimonialInput {
  creditValue: number;
  months: number;
  rentPercent: number;
  correctionIncc: number;
  rentIgpPercent: number;
  modality: string; // "Sorteio", "Lance Fixo", "Lance Fidelidade"
  currentMonth: number;
  taxaTotal: number;
  contemplationMonth: number;
  incc?: number;
}

export interface AmortizationRow {
  month: number;
  installment: number;
  balance: number;
}

export interface LeveragePatrimonialResult {
  creditContemplado: number;
  prazo: number;
  parcela: number;
  aluguel: number;
  valorImovelCorrigido: number;
  alugueisRecebidos: number;
  totalPagoConsorcio: number;
  custoFinal: number;
  percentPagoImovel: number;
  rendaPassiva: number;
  desembolso: number;
  parcelaPosContemplacaoAjustada: number;
  amortizacaoAjustada: number[];
}

export interface PrevidenciaAplicadaInput {
  creditValue: number
  modality: string
  application: number
  months: number
  incc: number
  currentMonth: number
}

export interface PrevidenciaAplicadaResult {
  credit: number
  creditContemplado: number
  valorCorrigido: number
  parcelaCheia: number
  parcelaPosContemplacao: number
  incc: number
  lucro: number
  totalInvestido: number
}
