import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { SimulationResult } from './types'
import type { User } from './types'
import { formatCurrency } from './calculations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GeneratePDFParams {
  clientName: string
  creditValue: number
  months: number
  contemplationMonth: number
  incc: number
  lanceEmbutido: number
  taxaTotal: number
  results: SimulationResult
  user: User
}

export function generateSimulationPDF(params: GeneratePDFParams) {
  const { clientName, creditValue, months, contemplationMonth, incc, lanceEmbutido, taxaTotal, results, user } = params
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Colors - Identidade Visual Reobote Consórcios
  const primaryColor: [number, number, number] = [0, 150, 255] // Azul Neon Reobote
  const secondaryColor: [number, number, number] = [20, 40, 80] // Azul Escuro
  const darkGray: [number, number, number] = [30, 30, 30]
  const lightGray: [number, number, number] = [150, 150, 150]
  const bgLight: [number, number, number] = [240, 248, 255] // Azul Claro

  // Header
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, pageWidth, 40, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Reobote Consórcios', 20, 20)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Proposta Magalu Consórcio', 20, 30)
  
  // Date
  doc.setFontSize(10)
  doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), pageWidth - 20, 20, { align: 'right' })

  // Client Info
  doc.setTextColor(...darkGray)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Dados do Cliente', 20, 55)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Nome: ${clientName}`, 20, 65)

  // Simulation Parameters
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Parâmetros da Simulação', 20, 85)

  autoTable(doc, {
    startY: 90,
    head: [['Parâmetro', 'Valor']],
    body: [
      ['Valor do Crédito', formatCurrency(creditValue)],
      ['Prazo do Grupo', `${months} meses`],
      ['Mês de Contemplação', `${contemplationMonth} meses`],
      ['INCC', `${incc.toFixed(2).replace('.', ',')}%`],
      ['Lance Embutido', `${lanceEmbutido.toFixed(2).replace('.', ',')}%`],
      ['Taxa Total', `${taxaTotal.toFixed(2).replace('.', ',')}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 },
  })

  // Results
  const finalY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resultado da Simulação', 20, finalY)

  autoTable(doc, {
    startY: finalY + 5,
    head: [['Descrição', 'Valor']],
    body: [
      ['Valor Total com Taxa', formatCurrency(results.totalValue)],
      ['Taxa em Reais', formatCurrency(results.feeValue)],
      ['Parcela Bruta Mensal', formatCurrency(results.grossInstallment)],
      ['PARCELA INICIAL MENSAL', formatCurrency(results.finalPayment)],
      ['PÓS CONTEMPLAÇÃO', formatCurrency(results.finalPaymentAfterContemplation)],
      ['Total Pago no Plano', formatCurrency(results.totalPaid)],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 },
    bodyStyles: { fontSize: 11 },
    didParseCell: function(data) {
      if (data.row.index === 3 || data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [220, 240, 255]
      }
    },
  })


  // Footer - Seller Info
  const footerY = (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(20, footerY, pageWidth - 20, footerY)
  
  doc.setTextColor(...darkGray)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Consultor', 20, footerY + 10)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Nome: ${user.name}`, 20, footerY + 18)
  doc.text(`Telefone: ${user.phone || '-'}`, 20, footerY + 25)
  doc.text(`E-mail: ${user.email}`, pageWidth / 2, footerY + 18)
  doc.text(`Rede Social: ${user.socialMedia || '-'}`, pageWidth / 2, footerY + 25)

  // Save
  const fileName = `Simulacao_${clientName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
