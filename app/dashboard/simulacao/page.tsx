'use client'

import { useMemo, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import { useAuthStore, useSimulationStore, useSharedSimulationStore } from '@/lib/store'
import { calculateSimulation, formatCurrency } from '@/lib/calculations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Save, FileDown, RotateCcw, CreditCard, BarChart3, Calendar, CheckCircle, Wallet } from 'lucide-react'
import { generateSimulationPDF } from '@/lib/pdf'

export default function SimulacaoPage() {
  const user = useAuthStore((state) => state.user)
  const addSimulation = useSimulationStore((state) => state.addSimulation)
  const updateSimulationStatus = useSimulationStore((state) => state.updateSimulationStatus)
  const [clearKey, setClearKey] = useState<number>(0)
  
  // Debug: Log the entire store state whenever it changes
  const storeState = useSharedSimulationStore()
  console.log('Full store state:', storeState)
  
  const { 
    clientName, 
    creditValue, 
    months, 
    contemplationMonth,
    incc, 
    lanceEmbutido, 
    taxaTotal,
    isLoading,
    setSharedField,
    clearSharedFields
  } = storeState

  // Debug logs
  console.log('Estado atual:', {
    clientName,
    creditValue,
    months,
    contemplationMonth,
    incc,
    lanceEmbutido,
    taxaTotal
  })

  const results = useMemo(() => {
    console.log('Calculando resultados...', {
      creditValue,
      months,
      contemplationMonth,
      taxaTotal
    })
    
    // Verificações mais permissivas para taxaTotal (aceita 0)
    const isValid = 
      creditValue != null && creditValue > 0 && 
      months != null && months > 0 &&
      taxaTotal != null
    
    console.log('isValid:', isValid)
    
    if (isValid) {
      return calculateSimulation({
        clientName,   
        creditValue,
        months,
        contemplationMonth: contemplationMonth ?? undefined,
        incc: incc ?? 0,
        lanceEmbutido: lanceEmbutido ?? 0,
        taxaTotal,
      })
    }
    return null
  }, [clientName, creditValue, months, contemplationMonth, incc, lanceEmbutido, taxaTotal])

  const handleSave = () => {
    if (!clientName.trim()) {
      toast.error('Por favor, informe o nome do cliente')
      return
    }
    if (!results || !user || 
        creditValue == null || 
        months == null ||
        contemplationMonth == null ||
        taxaTotal == null) return

    setSharedField('isLoading', true)

    setTimeout(() => {
      addSimulation({
        clientName,
        creditValue,
        months,
        contemplationMonth,
        incc: incc ?? 0,
        lanceEmbutido: lanceEmbutido ?? 0,
        taxaTotal,
        totalValue: results.totalValue,
        feeValue: results.feeValue,
        monthlyFee: results.monthlyFee,
        grossInstallment: results.grossInstallment,
        firstInitialPayment: results.firstInitialPayment,
        finalPayment: results.finalPayment,
        finalPaymentAfterContemplation: results.finalPaymentAfterContemplation,
        totalPaid: results.totalPaid,
        parcelaPosContemplacaoAjustada: results.parcelaPosContemplacaoAjustada,
        amortizacaoAjustada: results.amortizacaoAjustada,
        userId: user.id,
        userName: user.name,
        status: 'EM_ANDAMENTO',
      })

      toast.success('Simulação salva com sucesso!')
      setSharedField('isLoading', false)
    }, 500)
  }

  const handleGeneratePDF = () => {
    if (!clientName.trim()) {
      toast.error('Por favor, informe o nome do cliente')
      return
    }
    if (!results || !user || 
        creditValue == null || 
        months == null ||
        contemplationMonth == null ||
        taxaTotal == null) return

    setSharedField('isLoading', true)

    setTimeout(() => {
      const simulationId = addSimulation({
        clientName,
        creditValue,
        months,
        contemplationMonth,
        incc: incc ?? 0,
        lanceEmbutido: lanceEmbutido ?? 0,
        taxaTotal,
        totalValue: results.totalValue,
        feeValue: results.feeValue,
        monthlyFee: results.monthlyFee,
        grossInstallment: results.grossInstallment,
        firstInitialPayment: results.firstInitialPayment,
        finalPayment: results.finalPayment,
        finalPaymentAfterContemplation: results.finalPaymentAfterContemplation,
        totalPaid: results.totalPaid,
        parcelaPosContemplacaoAjustada: results.parcelaPosContemplacaoAjustada,
        amortizacaoAjustada: results.amortizacaoAjustada,
        userId: user.id,
        userName: user.name,
        status: 'PDF_GERADO',
      })

      updateSimulationStatus(simulationId, 'PDF_GERADO')

      generateSimulationPDF({
        clientName,
        creditValue,
        months,
        contemplationMonth,
        incc: incc ?? 0,
        lanceEmbutido: lanceEmbutido ?? 0,
        taxaTotal,
        results,
        user,
      })

      toast.success('PDF gerado com sucesso!')
      setSharedField('isLoading', false)
    }, 500)
  }

  const handleClear = () => {
    console.log('🔄 Iniciando limpeza completa...')
    
    // 1. Limpa o localStorage completamente
    localStorage.removeItem('reobote-shared-simulation')
    console.log('✅ localStorage limpo')
    
    // 2. Força re-renderização dos inputs ANTES de resetar
    setClearKey((prev: number) => prev + 1)
    
    // 3. Reseta todos os campos INDIVIDUALMENTE para garantir
    setSharedField('clientName', '')
    setSharedField('creditValue', null)
    setSharedField('months', null)
    setSharedField('contemplationMonth', null)
    setSharedField('incc', 5) // Mantém o padrão de 5%
    setSharedField('lanceEmbutido', null)
    setSharedField('taxaTotal', null)
    setSharedField('isLoading', false)
    
    // 4. Chama a função clearSharedFields da store como backup
    setTimeout(() => {
      clearSharedFields()
      console.log('✅ Limpeza concluída')
    }, 50)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Simulação</h1>
        <p className="text-muted-foreground">
          Simule propostas para Magalu Consórcio com cálculo em tempo real.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Dados da Simulação</CardTitle>
            <CardDescription>
              Preencha os dados para calcular a proposta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                key={`clientName-${clearKey}`}
                id="clientName"
                placeholder="Nome completo do cliente"
                value={clientName}
                onChange={(e) => setSharedField('clientName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditValue">Valor do Crédito</Label>
              <NumericFormat
                key={`creditValue-${clearKey}`}
                id="creditValue"
                customInput={Input}
                value={creditValue}
                onValueChange={(values) => setSharedField('creditValue', values.floatValue ?? null)}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="months">Prazo do Grupo</Label>
              <NumericFormat
                key={`months-${clearKey}`}
                id="months"
                customInput={Input}
                value={months}
                onValueChange={(values) => setSharedField('months', values.floatValue ?? null)}
                allowNegative={false}
                decimalScale={0}
                placeholder="118"
                suffix=" meses"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contemplationMonth">Mês de Contemplação</Label>
              <NumericFormat
                key={`contemplationMonth-${clearKey}`}
                id="contemplationMonth"
                customInput={Input}
                value={contemplationMonth}
                onValueChange={(values) => {
                  console.log('contemplationMonth onValueChange:', values.floatValue);
                  setSharedField('contemplationMonth', values.floatValue ?? null);
                }}
                allowNegative={false}
                decimalScale={0}
                placeholder="10"
                suffix=" meses"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="incc">INCC (%)</Label>
              <NumericFormat
                key={`incc-${clearKey}`}
                id="incc"
                customInput={Input}
                value={incc}
                onValueChange={(values) => setSharedField('incc', values.floatValue ?? null)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                placeholder="0,00%"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxaTotal">Taxa Total (%)</Label>
              <NumericFormat
                key={`taxaTotal-${clearKey}`}
                id="taxaTotal"
                customInput={Input}
                value={taxaTotal}
                onValueChange={(values) => setSharedField('taxaTotal', values.floatValue ?? null)}
                decimalSeparator=","
                suffix="%"
                decimalScale={2}
                allowNegative={false}
                placeholder="0,00%"
              />
            </div>

            {/* Seller Info */}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={handleSave} disabled={isLoading || !results}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Simulação
              </Button>
              <Button variant="secondary" onClick={handleGeneratePDF} disabled={isLoading || !results}>
                <FileDown className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
              <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultado da Simulação</CardTitle>
              <CardDescription>
                Valores calculados em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results ? (
                <>
                  <div className="space-y-6">
                    {/* Meia parcela até a contemplação */}
                    <div className="p-6 bg-primary text-primary-foreground rounded-xl border-2 border-primary shadow-lg">
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-2">Meia parcela até a contemplação</p>
                        <p className="text-4xl font-extrabold">{formatCurrency(results.firstInitialPayment)}</p>
                      </div>
                    </div>
                    
                    {/* Pós contemplação - Mais destacado */}
                    <div className="p-8 bg-[#ECFDF5] rounded-xl border-3 border-[#A7F3D0] shadow-xl">
                      <div className="text-center">
                        <p className="text-lg text-[#6B7280] mb-3 font-semibold">Pós Contemplação</p>
                        <p className="text-5xl font-black text-[#059669]">{formatCurrency(results.finalPaymentAfterContemplation)}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Preencha os campos para ver o resultado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
