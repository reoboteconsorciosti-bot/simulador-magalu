'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { calculatePrevidenciaAplicada, calculateSimulation, formatCurrency } from '@/lib/calculations/index'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSharedSimulationStore } from '@/lib/store'
import { Calculator, CheckCircle2, DollarSign, HandCoins, RefreshCw } from 'lucide-react'

export default function AposentadoriaPage() {
  const { 
    creditValue, 
    months,
    incc,
    taxaTotal,
    contemplationMonth,
    setSharedField
  } = useSharedSimulationStore()
  
  const [modality, setModality] = useState<string>('Lance Fixo')
  const [application, setApplication] = useState<number | undefined>(0.9)

  const currentMonth = contemplationMonth

  // Calcula os resultados da simulação principal para pegar finalPaymentAfterContemplation
  const simulationResults = useMemo(() => {
    const isValid = 
      creditValue != null && creditValue > 0 && 
      months != null && months > 0 &&
      taxaTotal != null
    
    if (isValid) {
      return calculateSimulation({
        clientName: '',   
        creditValue,
        months,
        contemplationMonth: contemplationMonth ?? undefined,
        incc: incc ?? 5,
        taxaTotal,
      })
    }
    return null
  }, [creditValue, months, contemplationMonth, incc, taxaTotal])

  // Calcula a simulação com currentMonth como mês de contemplação para pegar o total investido completo
  const totalInvestidoResults = useMemo(() => {
    const isValid = 
      creditValue != null && creditValue > 0 && 
      months != null && months > 0 &&
      taxaTotal != null &&
      currentMonth != null
    
    if (isValid) {
      return calculateSimulation({
        clientName: '',   
        creditValue,
        months,
        contemplationMonth: currentMonth,
        incc: incc ?? 5,
        taxaTotal,
      })
    }
    return null
  }, [creditValue, months, currentMonth, incc, taxaTotal])

  const results = useMemo(() => {
    if (creditValue != null && creditValue > 0 && 
        application != null && 
        months != null && months > 0 && 
        incc != null && 
        currentMonth != null) {
      return calculatePrevidenciaAplicada({
        creditValue,
        modality,
        application,
        months,
        incc,
        currentMonth,
      })
    }
    return null
  }, [creditValue, modality, application, months, incc, currentMonth])

  const syncApSlider = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

  const syncApInput = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:px-8 py-6 w-full max-w-full overflow-x-hidden">
      <main className="w-full space-y-6 max-w-full">
        
        {/* Título da Página */}
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Simulação de Valorização para Aposentadoria</h2>
          <p className="text-sm text-muted-foreground">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>

        {/* Dados da Operação (Inputs) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-4">DADOS DA OPERAÇÃO (ALTERE OS VALORES PARA SIMULAR)</span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Crédito Original */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Crédito Original</label>
              <NumericFormat
                value={creditValue}
                onValueChange={(values) => setSharedField('creditValue', values.floatValue ?? null)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Rendimento Aluguel */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Rendimento Aluguel (%)</label>
              <NumericFormat
                value={application}
                onValueChange={(values) => setApplication(values.floatValue ?? undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Modalidade */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Modalidade</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="Lance Fixo">Lance Fixo</option>
                <option value="Lance Fidelidade">Lance Embutido</option>
                <option value="Sorteio">Sorteio</option>
              </select>
            </div>

            {/* Mês Contemplação */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">Mês Contemplação</label>
              <NumericFormat
                value={currentMonth}
                onValueChange={(values) => syncApSlider(values.floatValue?.toString() ?? '1')}
                allowNegative={false}
                decimalScale={0}
                min={1}
                max={months ?? 180}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="text-md font-extrabold text-foreground">Resultados da Aposentadoria</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">CÁLCULOS AUTOMATIZADOS</span>
          </div>

          {/* Slider / Linha do Tempo */}
          <div className="space-y-4">
            <span className="text-[10px] font-extrabold text-muted-foreground tracking-wider block uppercase">EVOLUÇÃO PELO MÊS DE CONTEMPLAÇÃO</span>
            <div className="relative pt-6 pb-2 px-2">
              {/* Custom slider track */}
              <div className="w-full h-1.5 bg-muted rounded-lg relative">
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
                  <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-md border-2 border-[#f59e0b]">
                    <div className="absolute inset-[2px] rounded-full bg-card" />
                    <span className="relative z-10 text-slate-950 dark:text-white font-bold text-xs">{contemplationMonth || 1}</span>
                  </div>
                </div>
              </div>

              {/* Hidden range input for interaction */}
              <input 
                type="range" 
                min="1" 
                max={months || 220} 
                value={contemplationMonth || 1} 
                onInput={(e: React.InputEvent<HTMLInputElement>) => syncApInput((e.target as HTMLInputElement).value)} 
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-8">
                <span>1º Mês</span>
                <span>{months ?? 180} Meses</span>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">Contemplado no Mês: {currentMonth ?? 1}</span>
            </div>
          </div>

          {/* Grid de Cartões */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Crédito Contemplado */}
            <div className="border-[2px] border-primary rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">CRÉDITO CONTEMPLADO</span>
                <div className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(results?.creditContemplado ?? 0)}</div>
              </div>
              <div className="w-12 h-12 shrink-0 text-primary bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" strokeWidth={2.4} />
              </div>
            </div>

            {/* Valor Corrigido */}
            <div className="border-[2px] border-primary rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">VALOR CORRIGIDO</span>
                <div className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(results?.valorCorrigido ?? 0)}</div>
              </div>
              <div className="relative w-12 h-12 shrink-0 text-primary bg-primary/10 rounded-full border border-primary/40 flex items-center justify-center">
                <RefreshCw className="absolute w-8 h-8" strokeWidth={2.1} />
                <DollarSign className="relative z-10 w-4 h-4" strokeWidth={2.8} />
              </div>
            </div>

            {/* Parcela Cheia */}
            <div className="border-[2px] border-[#f59e0b] rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">PARCELA CHEIA</span>
                <div className="text-xl md:text-2xl font-black text-foreground">{formatCurrency(simulationResults?.finalPaymentAfterContemplation ?? 0)}</div>
              </div>
              <div className="w-12 h-12 shrink-0 text-[#f59e0b] bg-[#f59e0b]/10 rounded-full border border-[#f59e0b]/20 flex items-center justify-center">
                <Calculator className="w-7 h-7" strokeWidth={2.1} />
              </div>
            </div>

            {/* Lucro Líquido */}
            <div className="border-[2px] border-emerald-500 rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">LUCRO LÍQUIDO</span>
                <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalInvestidoResults && results ? (results.valorCorrigido - totalInvestidoResults.totalPaid) : results?.lucro ?? 0)}</div>
              </div>
              <div className="w-12 h-12 shrink-0 text-emerald-500 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center justify-center">
                <HandCoins className="w-7 h-7" strokeWidth={2.1} />
              </div>
            </div>

            {/* ICC Anual */}
            <div className="border-[2px] border-slate-400 dark:border-slate-600 rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all font-sans">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">ICC ANUAL(%)</span>
                <div className="text-xl md:text-2xl font-black text-foreground">{`${(incc ?? 5).toFixed(4).replace('.', ',')}%`}</div>
              </div>
            </div>

            {/* Total Investido */}
            <div className="border-[2px] border-slate-400 dark:border-slate-600 rounded-xl p-5 flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest">TOTAL INVESTIDO</span>
                <div className="text-xl md:text-2xl font-black text-foreground">{formatCurrency((totalInvestidoResults?.totalPaid || results?.totalInvestido) ?? 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
