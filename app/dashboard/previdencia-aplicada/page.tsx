'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { calculatePrevidenciaAplicada, calculateSimulation, formatCurrency } from '@/lib/calculations/index'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSharedSimulationStore } from '@/lib/store'

export default function PrevidenciaAplicadaPage() {
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
  const [currentMonthState, setCurrentMonthState] = useState<number | undefined>(undefined)

  const currentMonth = currentMonthState ?? contemplationMonth ?? undefined

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

  return (
    <div className="min-h-screen text-foreground p-2 md:p-6 w-full max-w-full overflow-x-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <main className="w-full space-y-6 max-w-full">
        <div className="px-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Simulação de Valorização Patrimonial</h2>
          <p className="text-muted-foreground mt-1">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>
        
        {/* SEÇÃO DE INPUTS NO TOPO (COMPACTA E HORIZONTAL) */}
        <section className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Dados da Operação (Altere os valores para simular)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
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
              <label className="text-xs font-bold text-muted-foreground">Rendimento Aluguel (%)</label>
              <NumericFormat
                value={application}
                onValueChange={(values) => setApplication(values.floatValue ?? undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Modalidade</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Sorteio">Sorteio</option>
                <option value="Lance Fixo">Lance Fixo</option>
                <option value="Lance Fidelidade">Lance Fidelidade</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Mês Contemplação</label>
              <NumericFormat
                value={currentMonth}
                onValueChange={(values) => setCurrentMonthState(values.floatValue ?? undefined)}
                allowNegative={false}
                decimalScale={0}
                min={1}
                max={months ?? 180}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </section>

        {/* SEÇÃO DE RESULTADOS COM LAYOUT LATERAL LIMPO */}
        <section className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8 w-full max-w-full">
            
          <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
            <h3 className="text-lg font-bold text-foreground">Resultados da Previdência Aplicada</h3>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Cálculos Automatizados</span>
          </div>

          {/* LINHA DO TEMPO MINIMALISTA COM PREENCHIMENTO LARANJA */}
          <div className="w-full mb-8">
            <div className="relative py-6">
              <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Evolução pelo Mês de Contemplação</div>
              <div className="h-2 w-full bg-muted rounded-full relative">
                {/* Progresso preenchido em laranja vibrante */}
                <div className="absolute left-0 top-0 h-full bg-[#f39c12] rounded-full transition-all duration-300" style={{ width: `${months && currentMonth ? (currentMonth / months) * 100 : 0}%` }}></div>
                
                {/* Ponto Extremo Esquerdo: 1º Mês */}
                <div className="absolute -bottom-6 left-0 text-xs font-bold text-muted-foreground">
                  1º Mês
                </div>

                {/* Indicador Dinâmico Móvel (Bolinha com o Mês atual) */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-[3px] border-[#f39c12] shadow-md flex items-center justify-center cursor-pointer transition-all duration-300" style={{ left: `${months && currentMonth ? (currentMonth / months) * 100 : 0}%` }}>
                  <span className="text-xs font-black text-foreground">{currentMonth ?? 1}</span>
                </div>

                {/* Ponto Extremo Direito: Prazo Total */}
                <div className="absolute -bottom-6 right-0 text-xs font-bold text-muted-foreground">
                  <span>{months ?? 180} Meses</span>
                </div>
              </div>
              {/* Label Central de Status */}
              <div className="flex justify-center mt-6">
                <span className="text-[#f39c12] font-bold bg-amber-50 dark:bg-amber-900/30 px-4 py-1 rounded-full border border-amber-200 dark:border-amber-800 text-xs">
                  Contemplado no Mês: <span className="font-extrabold">{currentMonth ?? 1}</span>
                </span>
              </div>
            </div>
          </div>

          {/* GRID DE EXPOSIÇÃO LATERAL: COLUNA ESQUERDA VS COLUNA DIREITA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch">
            
            {/* COLUNA DA ESQUERDA */}
            <div className="flex flex-col gap-4">
              
              {/* Crédito */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-primary shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Crédito Original</span>
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight break-all">{formatCurrency(creditValue ?? 0)}</span>
              </div>

              {/* Parcela Cheia */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-[#f39c12] shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Parcela Cheia</span>
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight break-all">{formatCurrency(simulationResults?.finalPaymentAfterContemplation ?? 0)}</span>
              </div>

              {/* INCC */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-slate-400 shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">INCC Anual (%)</span>
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{`${(incc ?? 5).toFixed(4).replace('.', ',')}%`}</span>
              </div>
      
            </div>

            {/* COLUNA DA DIREITA */}
            <div className="flex flex-col gap-4">
              
              {/* Valor Corrigido */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-primary shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Valor Corrigido</span>
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight break-all">{formatCurrency(results?.valorCorrigido ?? 0)}</span>
              </div>

              {/* Lucro */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-emerald-500 shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Lucro Líquido</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight break-all">{formatCurrency(totalInvestidoResults && results ? (results.valorCorrigido - totalInvestidoResults.totalPaid) : results?.lucro ?? 0)}</span>
              </div>

              {/* Total Investido */}
              <div className="bg-card p-6 rounded-2xl border border-border border-l-[6px] border-l-[#f39c12] shadow-sm flex flex-col justify-center min-h-[100px]">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Investido Acumulado</span>
                <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight break-all">{formatCurrency((totalInvestidoResults?.totalPaid || results?.totalInvestido) ?? 0)}</span>
              </div>
              
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
