'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { calculateFinancialLeverage, formatCurrency } from '@/lib/calculations'
import { useSharedSimulationStore } from '@/lib/store'
import { DrawingCanvas } from '@/components/drawing-canvas'

export default function AlavancagemFinanceiraPage() {
  const { 
    creditValue, 
    months,
    incc,
    taxaTotal,
    contemplationMonth,
    setSharedField,
  } = useSharedSimulationStore()
  
  const [saleGainPercent, setSaleGainPercent] = useState<number | null>(20)
  const [installmentType, setInstallmentType] = useState<string>('Meia')
  const [modality, setModality] = useState<string>('Sorteio')

  const results = useMemo(() => {
    if (creditValue !== null && creditValue > 0 && 
        months !== null && months > 0 && 
        saleGainPercent !== null && 
        contemplationMonth !== null) {
      return calculateFinancialLeverage({
        creditValue,
        months,
        incc,
        taxaTotal,
        saleGainPercent,
        installmentType,
        modality,
        currentMonth: contemplationMonth,
        rentPercent: null,
        contemplationMonth
      })
    }
    return null
  }, [creditValue, months, incc, taxaTotal, saleGainPercent, installmentType, modality, contemplationMonth])

  // Calculate timeline percentage
  const timelinePercent = useMemo(() => {
    if (months && months > 0 && contemplationMonth) {
      return Math.max(0, Math.min(100, (contemplationMonth / months) * 100))
    }
    return 0
  }, [contemplationMonth, months])

  return (
    <div className="min-h-screen text-foreground p-3 md:p-6">
      <main className="w-full space-y-6 max-w-full">
        <div className="px-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Simulação de Valorização Patrimonial</h2>
          <p className="text-muted-foreground mt-1">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>

        {/* ENTRADAS (INPUTS) COMPACTAS E HORIZONTAIS NO TOPO */}
        <section className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Dados da Operação (Altere os valores para simular)</h3>
            <DrawingCanvas />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Crédito Original</label>
              <NumericFormat
                value={creditValue}
                onValueChange={(values) => setSharedField('creditValue', values.floatValue ?? null)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Prazo Total (Meses)</label>
              <NumericFormat
                value={months}
                onValueChange={(values) => setSharedField('months', values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={0}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Ganho Venda (%)</label>
              <NumericFormat
                value={saleGainPercent}
                onValueChange={(values) => setSaleGainPercent(values.floatValue ?? null)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Parcela</label>
              <select 
                value={installmentType} 
                onChange={(e) => setInstallmentType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Meia">Meia</option>
                <option value="Cheia">Cheia</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Modalidade</label>
              <select 
                value={modality} 
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Sorteio">Sorteio</option>
                <option value="Lance Fixo">Lance</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Mês Contemplação</label>
              <NumericFormat
                value={contemplationMonth}
                onValueChange={(values) => setSharedField('contemplationMonth', values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={0}
                min={1}
                max={months || 220}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </section>

        {/* RESULTADOS DA ALAVANCAGEM FINANCEIRA EMBAIXO COM MÁXIMA LARGURA */}
        <section className="bg-card rounded-3xl shadow-sm border border-border p-4 md:p-8 space-y-6 w-full max-w-full">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">Resultados da Alavancagem Financeira</h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Cálculos Automatizados</span>
          </div>

          {/* Linha do Tempo Dinâmica */}
          <div className="bg-accent/50 rounded-2xl border border-border p-6 w-full">
            <p className="text-sm font-bold text-muted-foreground mb-3">Evolução pelo Mês de Contemplação</p>
            <div className="relative py-8">
              {/* Barra de progresso */}
              <div className="h-2.5 w-full bg-muted rounded-full relative">
                <div className="absolute left-0 top-0 h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${timelinePercent}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500 border-4 border-card shadow-lg shadow-amber-500/50 flex items-center justify-center cursor-pointer transition-all duration-300" style={{ left: `${timelinePercent}%` }}>
                  <span className="text-[10px] font-black text-white">{contemplationMonth || 1}</span>
                </div>
              </div>
              {/* Rótulos do eixo */}
              <div className="flex justify-between items-center mt-4 text-xs font-semibold text-muted-foreground">
                <span>1º Mês</span>
                <span className="text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">Mês Atual: <span className="font-extrabold">{contemplationMonth || 1}</span></span>
                <span>{months || 220} Meses</span>
              </div>
            </div>
          </div>

          {/* Grid Responsiva com os Cartões de Saída à Esquerda e Círculos Dourados à Direita */}
          <div className="flex flex-col lg:flex-row items-stretch gap-6 w-full overflow-hidden">
            
            {/* Coluna de Cartões (Estilo clássico border-l-4 para não quebrar em notebooks/tablets) */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Crédito Original (Borda Azul) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-primary transition-all hover:shadow-md min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Crédito Original</span>
                <span className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight block break-all">
                  {formatCurrency(results?.creditValueOriginal || 0)}
                </span>
              </div>

              {/* Crédito com INCC (Borda Azul) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-primary transition-all hover:shadow-md min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Crédito com INCC</span>
                <span className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight block break-all">
                  {formatCurrency(results?.creditValueWithIncc || 0)}
                </span>
              </div>

              {/* Total Investido (Borda Amarela) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500 transition-all hover:shadow-md min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Investido</span>
                <span className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight block break-all">
                  {formatCurrency(results?.totalInvested || 0)}
                </span>
              </div>

              {/* Valor da Venda (Borda Amarela) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-amber-500 transition-all hover:shadow-md min-w-0">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Valor da Venda</span>
                <span className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight block break-all">
                  {formatCurrency(results?.saleValue || 0)}
                </span>
              </div>

              {/* Lucro Líquido na Venda (Borda Verde - Ocupa as 2 colunas no desktop) */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm border-l-4 border-l-emerald-500 md:col-span-2 transition-all hover:shadow-md min-w-0">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Lucro Líquido na Venda</span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block break-all">
                  {formatCurrency(results?.profit || 0)}
                </span>
              </div>

            </div>

            {/* Coluna dos Círculos Dourados (Stacked Verticalmente) */}
            <div className="w-full lg:w-[180px] flex flex-row lg:flex-col justify-center items-center gap-6 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l border-border">
              
              {/* Golden Circle 1: ROI */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-b from-[#ffeaa7] to-[#d4af37] border-4 border-card shadow-xl flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <span className="text-lg lg:text-xl font-extrabold text-black drop-shadow-md">
                    {results ? `${results.roi.toFixed(2).replace('.', ',')}%` : '0,00%'}
                  </span>
                  <span className="text-[9px] font-bold text-black uppercase tracking-wider mt-0.5 drop-shadow-sm">ROI</span>
                </div>
              </div>

              {/* Golden Circle 2: Rentabilidade ao Mês */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-b from-[#ffeaa7] to-[#d4af37] border-4 border-card shadow-xl flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
                  <span className="text-lg lg:text-xl font-extrabold text-black drop-shadow-md">
                    {results ? `${results.monthlyReturn.toFixed(2).replace('.', ',')}%` : '0,00%'}
                  </span>
                  <span className="text-[9px] font-bold text-black uppercase tracking-wider mt-0.5 drop-shadow-sm">Rent. Mês</span>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>
    </div>
  )
}
