'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { House } from 'lucide-react'
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
  const creditoContemplado = creditoPatrimonial ?? results?.creditContemplado ?? 0
  const prazoRestante = months && contemplationMonth ? Math.max(0, months - contemplationMonth) : 0
  const parcelaPosContemplacao = simulationResults?.finalPaymentAfterContemplation ?? 0
  const valorAtualizadoImovel = results?.valorImovelCorrigido ?? 0
  const aluguelInicial = results?.aluguel ?? 0
  const sobrasOuDesembolso = aluguelInicial - parcelaPosContemplacao
  const isSobraInicial = sobrasOuDesembolso >= 0
  const lucroCustoFinal = alugueisRecebidos > totalPagoConsorcio ? 
    alugueisRecebidos - totalPagoConsorcio : 
    totalPagoConsorcio - alugueisRecebidos
  const isLucro = alugueisRecebidos > totalPagoConsorcio
  const patrimonioMaisRendaPassiva = valorAtualizadoImovel + (results?.rendaPassiva ?? 0)

  return (
    <div className="min-h-screen text-foreground p-2 md:p-6">
      <main className="w-full space-y-6">
        <div className="px-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Simulação de Valorização Patrimonial</h2>
          <p className="text-muted-foreground mt-1">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>

        <section className="bg-card rounded-2xl shadow-sm border border-border p-6 w-full">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Dados de Operação (Altere os valores para simular)</h3>
          </div>
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

          {/* LINHA DO TEMPO MINIMALISTA COM PREENCHIMENTO LARANJA */}
          <div className="w-full mb-8">
            <div className="relative py-6">
              <div className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Momento Estratégico da Contemplação</div>
              <div className="h-2 w-full bg-muted rounded-full relative">
                {/* Progresso preenchido em laranja vibrante */}
                <div className="absolute left-0 top-0 h-full bg-[#f39c12] rounded-full transition-all duration-300" style={{ width: `${timelinePercent}%` }}></div>
                
                {/* Ponto Extremo Esquerdo: 1º Mês */}
                <div className="absolute -bottom-6 left-0 text-xs font-bold text-muted-foreground">
                  1º Mês
                </div>

                {/* Indicador Dinâmico Móvel (Bolinha com o Mês atual) */}
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border-[3px] border-[#f39c12] shadow-md flex items-center justify-center cursor-pointer transition-all duration-300" style={{ left: `${timelinePercent}%` }}>
                  <span className="text-xs font-black text-foreground">{contemplationMonth || 1}</span>
                </div>

                {/* Ponto Extremo Direito: Prazo Total */}
                <div className="absolute -bottom-6 right-0 text-xs font-bold text-muted-foreground">
                  <span>{months || 220} Meses</span>
                </div>
              </div>
              {/* Label Central de Status */}
              <div className="flex justify-center mt-6">
                <span className="text-[#f39c12] font-bold bg-amber-50 dark:bg-amber-900/30 px-4 py-1 rounded-full border border-amber-200 dark:border-amber-800 text-xs">
                  Contemplado no Mês: <span className="font-extrabold">{contemplationMonth || 1}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 w-full custom-scrollbar">
            <div className="flex items-stretch justify-between gap-6 w-full" style={{ minWidth: '1420px' }}>

              <div className="flex-1 bg-primary/5 border-2 border-primary/20 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '280px' }}>
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">Passo 01: Liberação</span>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-card rounded-xl p-4 border border-primary/30 shadow-sm shadow-primary/10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Cred. Cont.</span>
                    <span className="text-2xl xl:text-3xl font-black text-primary tracking-tight break-all">
                      {formatCurrency(creditoContemplado)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Prazo Rest.</span>
                    <span className="text-2xl xl:text-3xl font-black text-foreground tracking-tight">
                      {prazoRestante} Meses
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-primary/10 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Parc. Pós Cont.</span>
                    <span className="text-2xl xl:text-3xl font-black text-foreground tracking-tight break-all">
                      {formatCurrency(parcelaPosContemplacao)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-1 bg-amber-50/20 dark:bg-amber-900/10 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '300px' }}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">Passo 02: Aquisição Patrimonial</span>
                  <House className="h-5 w-5 text-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-24 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=400&auto=format&fit=crop)' }} />
                    <div className="p-3 text-center bg-accent/30 border-t border-border">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Casa</span>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="h-24 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=400&auto=format&fit=crop)' }} />
                    <div className="p-3 text-center bg-accent/30 border-t border-border">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-foreground">Apartamento</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-card rounded-xl p-4 border border-amber-200 dark:border-amber-800 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Valor Imóvel</span>
                    <span className="text-2xl xl:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight block break-all">
                      {formatCurrency(valorAtualizadoImovel)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-4 border border-amber-100 dark:border-amber-800 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Aluguel Inicial</span>
                    <span className="text-xl xl:text-2xl font-black text-foreground tracking-tight block break-all">
                      {formatCurrency(aluguelInicial)}
                    </span>
                  </div>
                  <div
                    className="bg-card rounded-xl p-4 border shadow-sm"
                    style={{
                      borderColor: isSobraInicial ? '#8b5cf6' : '#f97316',
                    }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Sobras ou Desembolso</span>
                    <span
                      className="text-xl xl:text-2xl font-black tracking-tight block break-all"
                      style={{
                        color: isSobraInicial ? '#8b5cf6' : '#f97316',
                      }}
                    >
                      {formatCurrency(Math.abs(sobrasOuDesembolso))}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mt-1">
                      {isSobraInicial ? 'Saldo positivo inicial' : 'Aporte inicial necessário'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-1 bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:shadow-md" style={{ minWidth: '320px' }}>
                <div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">Passo 03: Métricas de Acumulação</span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="bg-card rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm shadow-emerald-500/10">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Valor Atualizado Imóvel</span>
                    <span className="text-2xl xl:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight block break-all">
                      {formatCurrency(valorAtualizadoImovel)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Aluguel Recebido</span>
                    <span className="text-lg xl:text-xl font-extrabold text-foreground block break-all">
                      {formatCurrency(alugueisRecebidos)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Total Pago Consórcio</span>
                    <span className="text-lg xl:text-xl font-extrabold text-foreground block break-all">
                      {formatCurrency(totalPagoConsorcio)}
                    </span>
                  </div>
                  <div
                    className="bg-card rounded-xl p-3 border shadow-sm"
                    style={{
                      borderColor: isLucro ? '#22c55e' : '#ef4444',
                    }}
                  >
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Custo ou Lucro
                    </span>
                    <span
                      className="text-lg xl:text-xl font-extrabold tracking-tight block break-all"
                      style={{
                        color: isLucro ? '#22c55e' : '#ef4444',
                      }}
                    >
                      {formatCurrency(lucroCustoFinal)}
                    </span>
                  </div>
                  <div className="bg-card rounded-xl p-3 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">% Pago</span>
                    <span className="text-lg xl:text-xl font-extrabold text-foreground block">
                      {results?.percentPagoImovel?.toFixed(1) ?? '0.0'}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center text-amber-500 font-extrabold text-3xl">→</div>

              <div className="flex-[1.15] bg-accent border-2 border-border rounded-3xl p-6 flex flex-col gap-6 transition-all duration-300 hover:shadow-xl" style={{ minWidth: '340px' }}>
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-background px-3 py-1.5 rounded-full border border-border">Resultado Final</span>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-5 space-y-5">
                  <div className="rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 p-5 shadow-lg shadow-amber-500/20 text-white relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 block mb-2">Patrimônio + Renda Passiva</span>
                    <span className="text-3xl xl:text-4xl font-black text-white block break-all">
                      {formatCurrency(patrimonioMaisRendaPassiva)}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-100 block mt-2">
                      Ativo consolidado da operação
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-card border border-border px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Patrimônio</span>
                      <span className="text-base xl:text-lg font-black text-foreground text-right break-all">
                        {formatCurrency(valorAtualizadoImovel)}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 px-4 py-4 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
                      <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 block mb-1">Renda Passiva</span>
                      <span className="text-2xl xl:text-3xl font-black text-white block break-all">
                        {formatCurrency(results?.rendaPassiva ?? 0)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-border bg-card px-4 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Composição Final</span>
                      <span className="text-sm xl:text-base font-semibold text-foreground block">
                        Patrimônio atualizado somado à renda passiva acumulada na operação.
                      </span>
                    </div>
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
