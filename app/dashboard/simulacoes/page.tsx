'use client'

import { useState, useMemo } from 'react'
import { useAuthStore, useSimulationStore } from '@/lib/store'
import { formatCurrency } from '@/lib/calculations'
import { generateSimulationPDF } from '@/lib/pdf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Search, Eye, FileDown, Trash2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Simulation } from '@/lib/types'

export default function SimulacoesPage() {
  const user = useAuthStore((state) => state.user)
  const allSimulations = useSimulationStore((state) => state.getAllSimulations())
  const deleteSimulation = useSimulationStore((state) => state.deleteSimulation)

  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const simulations = user?.role === 'ADMIN'
    ? allSimulations
    : allSimulations.filter((s) => s.userId === user?.id)

  const filteredSimulations = useMemo(() => {
    return simulations.filter((s) => {
      const matchesSearch = s.clientName.toLowerCase().includes(search.toLowerCase())
      const simDate = new Date(s.createdAt)
      const matchesStartDate = !startDate || simDate >= new Date(startDate)
      const matchesEndDate = !endDate || simDate <= new Date(endDate + 'T23:59:59')
      return matchesSearch && matchesStartDate && matchesEndDate
    })
  }, [simulations, search, startDate, endDate])

  const paginatedSimulations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredSimulations.slice(start, start + itemsPerPage)
  }, [filteredSimulations, currentPage])

  const totalPages = Math.ceil(filteredSimulations.length / itemsPerPage)

  const handleDownloadPDF = (simulation: Simulation) => {
    if (!user) return

    generateSimulationPDF({
      clientName: simulation.clientName,
      creditValue: simulation.creditValue,
      months: simulation.months,
      contemplationMonth: simulation.contemplationMonth,
      incc: simulation.incc,
      lanceEmbutido: simulation.lanceEmbutido,
      taxaTotal: simulation.taxaTotal,
      results: {
        totalValue: simulation.totalValue,
        feeValue: simulation.feeValue,
        monthlyFee: simulation.monthlyFee,
        grossInstallment: simulation.grossInstallment,
        firstInitialPayment: simulation.firstInitialPayment,
        finalPayment: simulation.finalPayment,
        finalPaymentAfterContemplation: simulation.finalPaymentAfterContemplation,
        totalPaid: simulation.totalPaid,
        contemplationMonth: simulation.contemplationMonth,
        parcelaPosContemplacaoAjustada: simulation.parcelaPosContemplacaoAjustada,
        amortizacaoAjustada: simulation.amortizacaoAjustada,
      },
      user,
    })

    toast.success('PDF baixado com sucesso!')
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteSimulation(deleteId)
      toast.success('Simulação excluída com sucesso!')
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Simulações</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as suas simulações salvas.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <span className="text-muted-foreground">até</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSimulations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma simulação encontrada.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Crédito</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Parcela Final</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSimulations.map((simulation) => (
                    <TableRow key={simulation.id}>
                      <TableCell className="font-medium">
                        {simulation.clientName}
                      </TableCell>
                      <TableCell>{formatCurrency(simulation.creditValue)}</TableCell>
                      <TableCell>{simulation.months} meses</TableCell>
                      <TableCell>{formatCurrency(simulation.finalPayment)}</TableCell>
                      <TableCell>
                        {format(new Date(simulation.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={simulation.status === 'PDF_GERADO' ? 'default' : 'secondary'}>
                          {simulation.status === 'PDF_GERADO' ? 'PDF Gerado' : 'Em Andamento'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedSimulation(simulation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadPDF(simulation)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(simulation.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{' '}
                    {Math.min(currentPage * itemsPerPage, filteredSimulations.length)} de{' '}
                    {filteredSimulations.length} resultados
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!selectedSimulation} onOpenChange={() => setSelectedSimulation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Simulação</DialogTitle>
            <DialogDescription>
              Simulação para {selectedSimulation?.clientName}
            </DialogDescription>
          </DialogHeader>
          {selectedSimulation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crédito</p>
                  <p className="font-semibold">{formatCurrency(selectedSimulation.creditValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prazo</p>
                  <p className="font-semibold">{selectedSimulation.months} meses</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mês de Contemplação</p>
                  <p className="font-semibold">{selectedSimulation.contemplationMonth} meses</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">INCC</p>
                  <p className="font-semibold">{selectedSimulation.incc}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lance Embutido</p>
                  <p className="font-semibold">{selectedSimulation.lanceEmbutido}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Total</p>
                  <p className="font-semibold">{selectedSimulation.taxaTotal}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {format(new Date(selectedSimulation.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-semibold">{formatCurrency(selectedSimulation.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa em R$</p>
                    <p className="font-semibold">{formatCurrency(selectedSimulation.feeValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parcela Bruta</p>
                    <p className="font-semibold">{formatCurrency(selectedSimulation.grossInstallment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Mensal</p>
                    <p className="font-semibold">{formatCurrency(selectedSimulation.monthlyFee)}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-primary text-primary-foreground rounded-lg">
                <p className="text-sm opacity-90">Parcela Inicial Mensal</p>
                <p className="text-2xl font-bold">{formatCurrency(selectedSimulation.finalPayment)}</p>
              </div>
              <div className="p-3 bg-green-950/30 rounded-lg border border-green-900/30">
                <p className="text-sm text-muted-foreground">Pós Contemplação</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(selectedSimulation.finalPaymentAfterContemplation)}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => handleDownloadPDF(selectedSimulation)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta simulação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
