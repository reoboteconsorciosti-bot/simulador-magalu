'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { calculatePatrimonialLeverage, calculateSimulation, calculoCreditoContempladoPatrimonial, formatCurrency } from '@/lib/calculations/index'
import { useSharedSimulationStore } from '@/lib/store'

export default function AlavancagemPatrimonialPage() {
  const { 
    creditValue, 
    months,
    contemplationMonth,
    taxaTotal,
    incc,
    setSharedField
  } = useSharedSimulationStore()
  
  const [rentPercent, setRentPercent] = useState<number | undefined>(0.7)
  const [correctionIncc, setCorrectionIncc] = useState<number | undefined>(5)
  const [rentIgpPercent, setRentIgpPercent] = useState<number | undefined>(5)
  const [modality, setModality] = useState<string>('Sorteio')

  const results = useMemo(() => {
    if (creditValue != null && creditValue > 0 && 
        months != null && months > 0 && 
        taxaTotal != null &&
        contemplationMonth != null) {
      return calculatePatrimonialLeverage({
        creditValue,
        months,
        rentPercent: rentPercent ?? 0.7,
        correctionIncc: correctionIncc ?? 5,
        rentIgpPercent: rentIgpPercent ?? 5,
        modality,
        currentMonth: contemplationMonth,
        taxaTotal,
        contemplationMonth,
        incc: incc ?? 5,
      })
    }
    return null
  }, [creditValue, months, rentPercent, correctionIncc, rentIgpPercent, modality, taxaTotal, contemplationMonth, incc])

  const simulationResults = useMemo(() => {
    if (
      creditValue != null &&
      creditValue > 0 &&
      months != null &&
      months > 0 &&
      taxaTotal != null &&
      contemplationMonth != null
    ) {
      return calculateSimulation({
        clientName: '',
        creditValue,
        months,
        contemplationMonth,
        incc: correctionIncc ?? 5,
        taxaTotal,
      })
    }
    return null
  }, [creditValue, months, contemplationMonth, taxaTotal, correctionIncc])

  const creditoPatrimonial = useMemo(() => {
    if (
      creditValue != null &&
      creditValue > 0 &&
      contemplationMonth != null &&
      incc != null
    ) {
      return calculoCreditoContempladoPatrimonial(creditValue, contemplationMonth, incc)
    }
    return null
  }, [creditValue, contemplationMonth, incc])

  const timelinePercent = useMemo(() => {
    if (months && months > 0 && contemplationMonth) {
      return Math.max(0, Math.min(100, (contemplationMonth / months) * 100))
    }
    return 0
  }, [contemplationMonth, months])

  const totalPagoConsorcio = results?.totalPagoConsorcio || 0
  const alugueisRecebidos = results?.alugueisRecebidos || 0
  const lucroCustoFinal = alugueisRecebidos > totalPagoConsorcio ? 
    alugueisRecebidos - totalPagoConsorcio : 
    totalPagoConsorcio - alugueisRecebidos
  const isLucro = alugueisRecebidos > totalPagoConsorcio

  return (
    <div className="min-h-screen text-foreground p-2 md:p-6">
      <main className="w-full space-y-6">
        <div className="px-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Simulação de Valorização Patrimonial</h2>
          <p className="text-muted-foreground mt-1">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>

        <section className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Dados de Operação (Altere os valores para simular)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
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
              <label className="text-xs font-bold text-muted-foreground">Forma Contemplação</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Sorteio">Sorteio</option>
                <option value="Lance Fixo">Lance</option>
                <option value="Lance Fidelidade">Lance Fidelidade</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Mês Contemplação</label>
              <NumericFormat
                value={contemplationMonth}
                onValueChange={(values) => setSharedField('contemplationMonth', values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={0}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">% Aluguel Sugerido</label>
              <NumericFormat
                value={rentPercent}
                onValueChange={(values) => setRentPercent(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Correção INCC Anual (%)</label>
              <NumericFormat
                value={correctionIncc}
                onValueChange={(values) => setCorrectionIncc(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">IGP-M Aluguel (%)</label>
              <NumericFormat
                value={rentIgpPercent}
                onValueChange={(values) => setRentIgpPercent(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-xl p-3 text-sm font-bold text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-3xl shadow-sm border border-border p-4 md:p-8 space-y-8 w-full">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-extrabold tracking-tight text-foreground">Resultados da Alavancagem Patrimonial</h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-wider">Cálculos Automatizados</span>
          </div>

          <div className="bg-accent/50 rounded-2xl border border-border p-6 w-full">
            <p className="text-sm font-bold text-muted-foreground mb-3">Momento Estratégico da Contemplação</p>
            <div className="relative py-8">
              <div className="h-2.5 w-full bg-muted rounded-full relative">
                <div className="absolute left-0 top-0 h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${timelinePercent}%` }}></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500 border-4 border-card shadow-lg shadow-amber-500/50 flex items-center justify-center cursor-pointer transition-all duration-300"
                  style={{ left: `${timelinePercent}%` }}
                >
                  <span className="text-[10px] font-black text-white">{contemplationMonth || 1}</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 text-xs font-semibold text-muted-foreground">
                <span>1º Mês</span>
                <span className="text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/30 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">Contemplado no Mês: <span className="font-extrabold">{contemplationMonth || 1}</span></span>
                <span>{months || 220} Meses</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 w-full custom-scrollbar">
            <div className="flex items-stretch justify-between gap-6 w-full" style={{ minWidth: '1360px' }}>

              <div className="flex-1 bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '290px' }}>
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">Passo 01: Liberação</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm flex-1 min-w-[180px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Crédito Contemplado</span>
                    <span className="text-2xl xl:text-3xl font-black text-primary tracking-tight break-all">
                      {formatCurrency(creditoPatrimonial ?? results?.creditContemplado ?? 0)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm flex-1 min-w-[180px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Prazo Restante</span>
                    <span className="text-2xl xl:text-3xl font-black text-foreground tracking-tight">
                      {(months && contemplationMonth ? Math.max(0, months - contemplationMonth) : 0)} Meses
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm flex-1 min-w-[180px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Pago Consórcio</span>
                    <span className="text-2xl xl:text-3xl font-black text-foreground tracking-tight break-all">
                      {formatCurrency(results?.totalPagoConsorcio ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-[1.5] bg-amber-50/20 dark:bg-amber-900/10 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '440px' }}>
                <div className="text-center">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">Passo 02: Aquisição Patrimonial</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=400&auto=format&fit=crop)' }}></div>
                    <div className="p-3 text-center bg-accent/30 border-t border-border">
                      <span className="text-xs font-extrabold text-foreground">Comprar Casa</span>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-28 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400&auto=format&fit=crop)' }}></div>
                    <div className="p-3 text-center bg-accent/30 border-t border-border">
                      <span className="text-xs font-extrabold text-foreground">Comprar Apto</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-sm min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Valor Imóvel Corrigido</span>
                    <span className="text-xl xl:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight block break-all">
                      {formatCurrency(results?.valorImovelCorrigido ?? 0)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-sm min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">% Pago no Imóvel</span>
                    <span className="text-xl xl:text-2xl font-black text-foreground tracking-tight block">
                      {results?.percentPagoImovel.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '290px' }}>
                <div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">Passo 03: Locação e Ganhos</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm flex justify-between items-center">
                    <div className="w-full min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Aluguel Inicial</span>
                      <span className="text-lg xl:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block break-all">
                        {formatCurrency(results?.aluguel ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm flex justify-between items-center">
                    <div className="w-full min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Pós Contemplação</span>
                      <span className="text-lg xl:text-xl font-extrabold text-foreground block break-all">
                        {formatCurrency(simulationResults?.finalPaymentAfterContemplation ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm flex justify-between items-center">
                    <div className="w-full min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Aluguéis Recebidos</span>
                      <span className="text-lg xl:text-xl font-extrabold text-foreground block break-all">
                        {formatCurrency(results?.alugueisRecebidos ?? 0)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm flex justify-between items-center">
                    <div className="w-full min-w-0">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Sobras (Lucro Mensal)</span>
                      <span className="text-lg xl:text-xl font-extrabold text-foreground block break-all">
                        {results && simulationResults ? 
                          formatCurrency(Math.max(0, results.aluguel - simulationResults.finalPaymentAfterContemplation)) : 
                          formatCurrency(0)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-[1.2] bg-accent border-2 border-border rounded-3xl p-6 flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-xl" style={{ minWidth: '320px' }}>
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-background px-3 py-1.5 rounded-full border border-border">Resultado Final</span>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-5 shadow-lg shadow-amber-500/20 text-white relative overflow-hidden min-w-0">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 block mb-1">Renda Passiva do Aluguel</span>
                    <span className="text-2xl xl:text-3xl font-black text-white block break-all">
                      {formatCurrency(results?.rendaPassiva ?? 0)}
                    </span>
                    <span className="text-[9px] font-medium text-amber-100 block mt-1">Estimado a longo prazo</span>
                  </div>
                  <div 
                    className="rounded-2xl p-5 shadow-lg text-white relative overflow-hidden min-w-0"
                    style={{ 
                      background: isLucro ? 'linear-gradient(to right, #22c55e, #16a34a)' : 'linear-gradient(to right, #ef4444, #dc2626)',
                      boxShadow: isLucro ? '0 10px 15px rgba(34, 197, 94, 0.2)' : '0 10px 15px rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/90 block mb-1">
                      {isLucro ? 'Lucro Total Acumulado' : 'Custo Final'}
                    </span>
                    <span className="text-2xl xl:text-3xl font-black text-white block break-all">
                      {formatCurrency(lucroCustoFinal)}
                    </span>
                    <span className="text-[9px] font-medium text-white/80 block mt-1"></span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
