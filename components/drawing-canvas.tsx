'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DrawPoint = {
  x: number
  y: number
  isStart: boolean
}

type Stroke = {
  id: string
  points: DrawPoint[]
  isEraser?: boolean // Manter compatibilidade com dados antigos
}

// Usamos localStorage para persistir os desenhos por rota
const STORAGE_KEY = 'drawing-canvas-by-page'

const getSavedDrawings = (): Record<string, Stroke[]> => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    const data = JSON.parse(saved)
    // Converter dados antigos (array de DrawPoint) para novo formato (array de Stroke)
    const converted: Record<string, Stroke[]> = {}
    for (const [path, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && 'x' in value[0]) {
          // Dados antigos: agrupar em traços
          const strokes: Stroke[] = []
          let currentStroke: DrawPoint[] = []
          for (const point of value) {
            if ((point as any).isStart && currentStroke.length > 0) {
              strokes.push({ id: crypto.randomUUID(), points: [...currentStroke] })
              currentStroke = []
            }
            currentStroke.push(point)
          }
          if (currentStroke.length > 0) {
            strokes.push({ id: crypto.randomUUID(), points: currentStroke })
          }
          converted[path] = strokes
        } else {
          // Já está no novo formato
          converted[path] = value as Stroke[]
        }
      }
    }
    return converted
  } catch {
    return {}
  }
}

const saveDrawing = (pathname: string, strokes: Stroke[]) => {
  const drawings = getSavedDrawings()
  drawings[pathname] = strokes
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings))
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Quando muda de rota, carregar o desenho da nova rota
    if (isClient) {
      const drawings = getSavedDrawings()
      setStrokes(drawings[pathname] || [])
    }
  }, [pathname, isClient])

  useEffect(() => {
    // Salvar o desenho atual quando os traços mudarem
    if (isClient) {
      saveDrawing(pathname, strokes)
    }
  }, [strokes, pathname, isClient])

  useEffect(() => {
    if (!isOpen || !isClient) return

    const canvas = canvasRef.current
    if (!canvas) return

    // Definir o tamanho do canvas
    const initCanvas = () => {
      const current = canvasRef.current
      if (!current) return

      current.width = window.innerWidth
      current.height = window.innerHeight

      const context = current.getContext('2d')
      if (!context) return

      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 4
      context.strokeStyle = '#ef4444'
      
      // Redesenhar o desenho da página atual
      redrawCanvas()
    }

    initCanvas()
  }, [isOpen, isClient, strokes, pathname])

  useEffect(() => {
    if (!isOpen || !isClient) return

    const canvas = canvasRef.current
    if (!canvas) return

    const handleScroll = () => {
      redrawCanvas()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isOpen, isClient, strokes])

  const getContext = () => {
    const current = canvasRef.current
    if (!current) return null
    return current.getContext('2d')
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const context = getContext()
    if (!canvas || !context) return

    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY

    context.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue
      
      context.beginPath()
      context.lineCap = 'round'
      context.lineJoin = 'round'
      
      // Verificar se é um traço de borracha antigo
      const isEraserStroke = stroke.isEraser || stroke.points.some(p => (p as any).isEraser)
      
      if (isEraserStroke) {
        context.globalCompositeOperation = 'destination-out'
        context.lineWidth = 30
      } else {
        context.globalCompositeOperation = 'source-over'
        context.lineWidth = 4
        context.strokeStyle = '#ef4444'
      }
      
      stroke.points.forEach((point, index) => {
        const x = point.x - currentScrollX
        const y = point.y - currentScrollY
        
        if (point.isStart) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      })
      context.stroke()
    }
    
    context.globalCompositeOperation = 'source-over' // Resetar o modo
  }

  const isPointOnStroke = (x: number, y: number, stroke: Stroke, tolerance: number = 15): boolean => {
    // Algoritmo para detectar se o ponto está em algum segmento da linha
    for (let i = 1; i < stroke.points.length; i++) {
      const p1 = stroke.points[i - 1]
      const p2 = stroke.points[i]
      
      // Calcular a distância do ponto (x,y) ao segmento (p1,p2)
      const A = x - p1.x
      const B = y - p1.y
      const C = p2.x - p1.x
      const D = p2.y - p1.y
      
      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1
      
      if (lenSq !== 0) param = dot / lenSq
      
      let xx: number
      let yy: number
      
      if (param < 0) {
        xx = p1.x
        yy = p1.y
      } else if (param > 1) {
        xx = p2.x
        yy = p2.y
      } else {
        xx = p1.x + param * C
        yy = p1.y + param * D
      }
      
      const dx = x - xx
      const dy = y - yy
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance <= tolerance) {
        return true
      }
    }
    return false
  }

  const deleteStrokeAtPoint = (x: number, y: number) => {
    // Percorrer na ordem inversa para apagar o traço que está no topo
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (isPointOnStroke(x, y, strokes[i])) {
        setStrokes(prev => prev.filter((_, index) => index !== i))
        return true
      }
    }
    return false
  }

  const startDrawing = (x: number, y: number) => {
    const context = getContext()
    if (!context) return

    isDrawingRef.current = true
    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    const strokeId = crypto.randomUUID()
    setCurrentStrokeId(strokeId)
    
    const point: DrawPoint = { x, y, isStart: true }
    setStrokes(prev => [...prev, { id: strokeId, points: [point] }])
    
    // Desenha na posição visível atual
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 4
    context.strokeStyle = '#ef4444'
    context.beginPath()
    context.moveTo(x - currentScrollX, y - currentScrollY)
  }

  const draw = (x: number, y: number) => {
    if (!isDrawingRef.current || !currentStrokeId) return

    const context = getContext()
    if (!context) return

    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    
    const point: DrawPoint = { x, y, isStart: false }
    setStrokes(prev => prev.map(s => 
      s.id === currentStrokeId ? { ...s, points: [...s.points, point] } : s
    ))
    
    // Desenha na posição visível atual
    context.lineTo(x - currentScrollX, y - currentScrollY)
    context.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    setCurrentStrokeId(null)
  }

  const clearCanvas = () => {
    setStrokes([])
    const current = canvasRef.current
    const context = getContext()
    if (!current || !context) return

    context.clearRect(0, 0, current.width, current.height)
  }

  if (!isClient) {
    return null
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        Desenhar
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute right-4 top-4 z-[101] flex gap-2 pointer-events-auto">
            <Button type="button" variant="secondary" onClick={clearCanvas}>
              Limpar
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            className="fixed inset-0 block h-screen w-screen cursor-crosshair touch-none pointer-events-auto"
            onContextMenu={(e) => {
              e.preventDefault()
              deleteStrokeAtPoint(e.pageX, e.pageY)
            }}
            onPointerDown={(event) => {
              if (event.button === 2) {
                return // Botão direito já tratado no onContextMenu
              }
              startDrawing(event.pageX, event.pageY)
            }}
            onPointerMove={(event) => draw(event.pageX, event.pageY)}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
      )}
    </>
  )
}
