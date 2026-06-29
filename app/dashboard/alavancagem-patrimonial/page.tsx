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
  const [selectedImovel, setSelectedImovel] = useState<string>('casa')

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

  const syncPatSlider = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

  const syncPatInput = (value: string) => {
    setSharedField('contemplationMonth', parseFloat(value))
  }

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
  const patrimonioImobiliario = valorAtualizadoImovel
  const rendaPassivaFinal = results?.rendaPassiva ?? 0
  const percentPagoImovel = results?.percentPagoImovel ?? 0

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:px-8 py-6 w-full max-w-full overflow-x-hidden">
      <main className="w-full space-y-6 max-w-full">
        <div className="space-y-1.5">
          <h2 className="text-[2rem] font-extrabold text-foreground tracking-tight">Simulação de Valorização Patrimonial</h2>
          <p className="text-base text-muted-foreground">Multiplique o seu patrimônio utilizando consórcio imobiliário de forma planejada.</p>
        </div>

        {/* Dados da Operação (Inputs) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block mb-4">DADOS DE OPERAÇÃO (ALTERE OS VALORES PARA SIMULAR)</span>
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

            {/* Forma Contemplação */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Forma Contemplação</label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="Sorteio">Sorteio</option>
                <option value="Lance Fixo">Lance Fixo</option>
                <option value="Lance Fidelidade">Lance Livre</option>
              </select>
            </div>

            {/* Mês Contemplação */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Mês Contemplação</label>
              <NumericFormat
                value={contemplationMonth}
                onValueChange={(values) => syncPatSlider(values.floatValue?.toString() ?? '1')}
                allowNegative={false}
                decimalScale={0}
                min={1}
                max={months || 220}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* % Aluguel Sugerido */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">% Aluguel Sugerido</label>
              <NumericFormat
                value={rentPercent}
                onValueChange={(values) => setRentPercent(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* Correção INCC Anual (%) */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">Correção INCC Anual (%)</label>
              <NumericFormat
                value={correctionIncc}
                onValueChange={(values) => setCorrectionIncc(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            {/* IGP-M Aluguel (%) */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-2">IGP-M Aluguel (%)</label>
              <NumericFormat
                value={rentIgpPercent}
                onValueChange={(values) => setRentIgpPercent(values.floatValue || undefined)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <h3 className="text-xl font-extrabold text-foreground">Resultados da Alavancagem Patrimonial</h3>
            <span className="text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full uppercase tracking-wider">CÁLCULOS AUTOMATIZADOS</span>
          </div>

          {/* Slider / Linha do Tempo */}
          <div className="space-y-4">
            <span className="text-[11px] font-extrabold text-muted-foreground tracking-wider block uppercase">MOMENTO ESTRATÉGICO DA CONTEMPLAÇÃO</span>
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
                  <div className="relative w-11 h-11 rounded-full flex items-center justify-center shadow-md border-2 border-[#f59e0b]">
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
                onInput={(e: React.InputEvent<HTMLInputElement>) => syncPatInput((e.target as HTMLInputElement).value)} 
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
              />

              <div className="flex justify-between text-[11px] font-bold text-muted-foreground mt-8">
                <span>1º Mês</span>
                <span>{months || 220} Meses</span>
              </div>
            </div>
            <div className="flex justify-center">
              <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider">Contemplado no Mês: {contemplationMonth || 1}</span>
            </div>
          </div>

          {/* Fluxo Dinâmico Horizontal */}
          <div className="grid grid-cols-1 justify-items-center gap-4 xl:grid-cols-2 2xl:flex 2xl:flex-row 2xl:items-center 2xl:justify-between">
            
            {/* Passo 01 */}
            <div className="w-full xl:w-auto xl:shrink-0 flex justify-center">
              <div className="w-[340px] h-[560px] bg-[#1b54b8] text-white rounded-[24px] p-5 shadow-2xl flex flex-col justify-start">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <div className="w-6 h-6 rounded-full border-2 border-[#2ecc71] flex items-center justify-center text-[#2ecc71] bg-transparent shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[13px] font-bold tracking-tight">Passo 01: Liberação</span>
                </div>

                <div className="flex flex-col gap-2.5 mt-4">
                  <div className="bg-white rounded-2xl py-5 px-4 shadow-sm flex flex-col justify-center min-h-[112px]">
                    <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">CRED. CONT</span>
                    <div className="text-xl font-black text-[#1b54b8] tracking-tight leading-tight mt-0.5">
                      {formatCurrency(creditoContemplado)}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl py-5 px-4 shadow-sm flex flex-col justify-center min-h-[112px]">
                    <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">PRAZO RES.T</span>
                    <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                      {prazoRestante} meses
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl py-5 px-4 shadow-sm flex flex-col justify-center min-h-[112px]">
                    <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">PARC. PÓS CONT.</span>
                    <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                      {formatCurrency(parcelaPosContemplacao)}
                    </div>
                  </div>
                </div>

                <div className="flex-1" />
              </div>
            </div>

            {/* Seta 1 */}
            <div className="hidden 2xl:flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-2.5 rounded-full shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Passo 02 */}
            <div className="w-full max-w-[340px] xl:w-[340px] xl:shrink-0 bg-[#374151] text-white rounded-[24px] p-5 shadow-2xl flex flex-col h-[560px] overflow-hidden font-sans">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[13px] font-bold tracking-tight">Passo 02: Aquisição patrimonial</span>
              </div>
              <div className="flex flex-col gap-2.5 mt-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=150&q=80"
                      alt="Casa"
                      className="w-full h-[62px] object-cover"
                    />
                    <button
                      onClick={() => setSelectedImovel('casa')}
                      className="bg-[#1b4fab] text-white text-[9px] font-extrabold tracking-wider py-2 uppercase transition-colors hover:bg-blue-800"
                    >
                      CASA
                    </button>
                  </div>
                  <div className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=150&q=80"
                      alt="Apto"
                      className="w-full h-[62px] object-cover"
                    />
                    <button
                      onClick={() => setSelectedImovel('apto')}
                      className="bg-[#e07a1b] text-white text-[9px] font-extrabold tracking-wider py-2 uppercase transition-colors hover:bg-orange-600"
                    >
                      APARTAMENTO
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">VALOR IMÓVEL</span>
                  <div className="text-xl font-black text-[#e07a1b] tracking-tight leading-tight mt-0.5">{formatCurrency(valorAtualizadoImovel)}</div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">ALUGUEL INICIAL</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">{formatCurrency(aluguelInicial)}</div>
                </div>
                <div className={`bg-white rounded-2xl py-2 px-4 shadow-sm flex flex-col justify-center min-h-[66px] border-[2.5px] ${isSobraInicial ? 'border-[#1b4fab]' : 'border-rose-600'}`}>
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">SOBRAS OU DESEMBOLSO</span>
                  <div className={`text-xl font-black tracking-tight leading-none mt-0.5 ${isSobraInicial ? 'text-[#1b4fab]' : 'text-rose-700'}`}>{formatCurrency(Math.abs(sobrasOuDesembolso))}</div>
                  <span className="text-[13px] font-black text-slate-400 uppercase tracking-wider mt-0.5">
                    {isSobraInicial ? 'SALDO POSITIVO INICIAL' : 'APORTE INICIAL NECESSÁRIO'}
                  </span>
                </div>
              </div>
              <div className="flex-1" />
            </div>

            {/* Seta 2 */}
            <div className="hidden 2xl:flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-2.5 rounded-full shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Passo 03 */}
            <div className="w-full max-w-[340px] xl:w-[340px] xl:shrink-0 bg-[#0e9f6e] text-white rounded-[24px] p-5 shadow-2xl flex flex-col h-[560px] overflow-hidden font-sans">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-[13px] font-bold tracking-tight">Passo 03: Métrcias de acumulação</span>
              </div>
              <div className="flex flex-col gap-2.5 mt-4">
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">CRED. CONT</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">{formatCurrency(valorAtualizadoImovel)}</div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">ALUGUEL RECEBIDO</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">{formatCurrency(alugueisRecebidos)}</div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL PAGO CONSÓRCIO</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">{formatCurrency(totalPagoConsorcio)}</div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px] border-[2px] border-red-500">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">CUSTO OU LUCRO</span>
                  <div className={`text-xl font-black tracking-tight leading-tight mt-0.5 ${isLucro ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(lucroCustoFinal)}
                  </div>
                </div>
                <div className="bg-white rounded-2xl py-2.5 px-4 shadow-sm flex flex-col justify-center min-h-[62px]">
                  <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider">% PAGO</span>
                  <div className="text-xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">{percentPagoImovel.toFixed(1)}%</div>
                </div>
              </div>
              <div className="flex-1" />
            </div>

            {/* Seta 3 */}
            <div className="hidden 2xl:flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-2.5 rounded-full shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>

            {/* Passo 04 */}
            <div className="w-full max-w-[340px] xl:w-[340px] xl:shrink-0 bg-[#6b7280] text-white rounded-[24px] shadow-2xl flex flex-col h-[560px] overflow-hidden font-sans p-5">
              <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                <div className="w-7 h-7 rounded-full bg-[#f59e0b] flex items-center justify-center text-slate-950 font-black text-sm shadow-md">
                  $
                </div>
                <span className="text-[13px] font-bold tracking-tight">Resultado Final</span>
              </div>
              <div className="flex flex-col gap-3 mt-4">
                {/* Patrimonio Imobiliario */}
                <div className="bg-[#1a56db] rounded-2xl p-4 shadow-md flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-blue-200 uppercase tracking-wider">Patrimônio Imobiliário</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-1">{formatCurrency(patrimonioImobiliario)}</div>
                  <span className="text-[13px] font-semibold text-blue-200 mt-0.5">Ativo Consolidado da Operação</span>
                </div>
                {/* Sinal de Mais */}
                <div className="w-full bg-white text-slate-500 rounded-xl py-3 px-4 flex items-center justify-start shadow-inner">
                  <span className="text-[13px] font-black leading-none">+</span>
                </div>
                {/* Renda Passiva */}
                <div className="bg-[#0e9f6e] rounded-2xl p-4 shadow-md flex flex-col gap-0.5">
                  <span className="text-[13px] font-bold text-emerald-100 uppercase tracking-wider">Renda Passiva</span>
                  <div className="text-2xl font-black text-white tracking-tight mt-1">{formatCurrency(rendaPassivaFinal)}</div>
                </div>
              </div>
              <div className="flex-1" />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
