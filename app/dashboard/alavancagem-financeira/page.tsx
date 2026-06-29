'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { calculateFinancialLeverage, formatCurrency } from '@/lib/calculations'
import { useSharedSimulationStore } from '@/lib/store'

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

  const syncFinSlider = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

  const syncFinInput = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:px-8 py-6 w-full max-w-full overflow-x-hidden">
      <main className="w-full space-y-6 max-w-full">
        <div className="space-y-1.5">
          <h2 className="text-[2rem] font-extrabold text-foreground tracking-tight">Resultados da Alavancagem Financeira</h2>
          <p className="text-base text-muted-foreground">Analise seu ganho de capital rápido utilizando a estratégia de comercialização de cotas contempladas.</p>
        </div>

        {/* Dados da Operação (Inputs) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-4">DADOS DA OPERAÇÃO (ALTERE OS VALORES PARA SIMULAR)</span>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            
            {/* Crédito Original */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Crédito Original</label>
              <NumericFormat
                value={creditValue}
                onValueChange={(values) => setSharedField('creditValue', values.floatValue ?? null)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Prazo Total (Meses) */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Prazo Total (Meses)</label>
              <NumericFormat
                value={months}
                onValueChange={(values) => setSharedField('months', values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={0}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Ganho Venda (%) */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Ganho Venda (%)</label>
              <NumericFormat
                value={saleGainPercent}
                onValueChange={(values) => setSaleGainPercent(values.floatValue ?? null)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Parcela */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Parcela</label>
              <select 
                value={installmentType} 
                onChange={(e) => setInstallmentType(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="Meia">Meia Parcela</option>
                <option value="Cheia">Parcela Cheia</option>
              </select>
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Modalidade</label>
              <select 
                value={modality} 
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="Sorteio">Sorteio</option>
                <option value="Lance Fixo">Lance</option>
              </select>
            </div>

            {/* Mês Contemplação */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Mês Contemplação</label>
              <NumericFormat
                value={contemplationMonth}
                onValueChange={(values) => syncFinSlider(values.floatValue?.toString() ?? '1')}
                allowNegative={false}
                decimalScale={0}
                min={1}
                max={months || 220}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="text-xl font-extrabold text-foreground">Resultados da Alavancagem Financeira</h3>
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full uppercase tracking-wider">CÁLCULOS AUTOMATIZADOS</span>
          </div>

          {/* Slider / Linha do Tempo */}
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold text-muted-foreground tracking-wider block uppercase">EVOLUÇÃO PELO MÊS DE CONTEMPLAÇÃO</span>
            <div className="relative pt-6 pb-2 px-2">
              {/* Custom slider track */}
              <div className="w-full h-2 bg-muted rounded-lg relative">
                {/* Filled portion */}
                <div 
                  className="absolute h-full bg-[#f59e0b] rounded-lg transition-all duration-300 ease-out"
                  style={{ width: `${((contemplationMonth || 1) / (months || 220)) * 100}%` }}
                />

                {/* Custom thumb with number */}
                <div 
                  className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ease-out z-10" 
                  style={{ left: `${((contemplationMonth || 1) / (months || 220)) * 100}%` }}
                >
                  <div className="relative w-11 h-11 rounded-full flex items-center justify-center shadow-md border-2 border-[#f59e0b] font-sans">
                    <div className="absolute inset-[2px] rounded-full bg-card" />
                    <span className="relative z-10 text-slate-950 dark:text-white font-bold text-sm">{contemplationMonth || 1}</span>
                  </div>
                </div>
              </div>

              {/* Hidden range input for interaction */}
              <input 
                type="range" 
                min="1" 
                max={months || 220} 
                value={contemplationMonth || 1} 
                onInput={(e: React.InputEvent<HTMLInputElement>) => syncFinInput((e.target as HTMLInputElement).value)} 
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div className="flex justify-between text-[11px] font-bold text-muted-foreground mt-8">
                <span>1º Mês</span>
                <span>{months || 220} Meses</span>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider">Mês Atual: {contemplationMonth || 1}</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Esquerda: Cartões de Destaque */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Crédito Original */}
                <div className="bg-card border border-border border-l-[5px] border-l-primary rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center font-sans">
                  <div>
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">CRÉDITO ORIGINAL</span>
                    <div className="text-xl font-black text-foreground mt-1">{formatCurrency(results?.creditValueOriginal || 0)}</div>
                  </div>
                  <div className="p-2.5 rounded-full flex items-center justify-center">
                    <img src="/icons/mão.png" alt="Mão" className="w-15 h-15 object-contain" />
                  </div>
                </div>

                {/* Crédito com INCC */}
                <div className="bg-card border border-border border-l-[5px] border-l-primary rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center font-sans">
                  <div>
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">CRÉDITO COM INCC</span>
                    <div className="text-xl font-black text-foreground mt-1">{formatCurrency(results?.creditValueWithIncc || 0)}</div>
                  </div>
                  <div className="p-2.5 rounded-full flex items-center justify-center">
                    <img src="/icons/CASA.png" alt="casa" className="w-15 h-15 object-contain" />
                  </div>
                </div>

                {/* Total Investido */}
                <div className="bg-card border border-border border-l-[5px] border-l-[#f59e0b] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center font-sans">
                  <div>
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">TOTAL INVESTIDO</span>
                    <div className="text-xl font-black text-foreground mt-1">{formatCurrency(results?.totalInvested || 0)}</div>
                  </div>
                  <div className="p-2.5 rounded-full flex items-center justify-center">
                    <img src="/icons/Vector Smart Object.png" alt="Vector Smart Object" className="w-20 h-20 object-contain" />
                  </div>
                </div>

                {/* Valor da Venda */}
                <div className="bg-card border border-border border-l-[5px] border-l-[#f59e0b] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center font-sans">
                  <div>
                    <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block">VALOR DA VENDA</span>
                    <div className="text-xl font-black text-foreground mt-1">{formatCurrency(results?.saleValue || 0)}</div>
                  </div>
                  <div className="p-2.5 rounded-full flex items-center justify-center">
                    <img src="/icons/MOEDA.png" alt="Moeda" className="w-15 h-15 object-contain" />
                  </div>
                </div>
              </div>

              {/* Lucro Liquido amplo */}
              <div className="bg-card border border-border border-l-[5px] border-l-emerald-500 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center font-sans">
                <div>
                  <span className="text-[9px] font-extrabold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest block">LUCRO LÍQUIDO NA VENDA</span>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(results?.profit || 0)}</div>
                </div>
                <div className="p-3 rounded-full flex items-center justify-center shadow-inner">
                  <img src="/icons/MOEDA.png" alt="Moeda" className="w-15 h-15 object-contain" />
                </div>
              </div>
            </div>

            {/* Direita: Círculos Dourados Premium (ROI / RENTABILIDADE) */}
            <div className="w-full lg:w-48 flex flex-row lg:flex-col justify-center items-center gap-4 lg:py-4">
              {/* Círculo ROI */}
              <div className="bg-gradient-to-br from-[#ffeaa7] via-[#d4af37] to-[#d4af37] border-4 border-card rounded-full w-32 h-32 md:w-36 md:h-36 flex flex-col justify-center items-center text-black select-none transform hover:scale-105 transition-all shadow-xl font-sans">
                <div className="text-lg md:text-xl font-black tracking-tighter drop-shadow-md">{results ? `${results.roi.toFixed(2).replace('.', ',')}%` : '0,00%'}</div>
                <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider mt-0.5 drop-shadow-sm">ROI</div>
              </div>

              {/* Círculo RENTABILIDA */}
              <div className="bg-gradient-to-br from-[#ffeaa7] via-[#d4af37] to-[#d4af37] border-4 border-card rounded-full w-32 h-32 md:w-36 md:h-36 flex flex-col justify-center items-center text-black select-none transform hover:scale-105 transition-all shadow-xl font-sans">
                <div className="text-lg md:text-xl font-black tracking-tighter drop-shadow-md">{results ? `${results.monthlyReturn.toFixed(2).replace('.', ',')}%` : '0,00%'}</div>
                <div className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider mt-0.5 drop-shadow-sm">RENT. MÊS</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
