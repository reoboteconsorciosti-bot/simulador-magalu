'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type DrawPoint = {
  x: number
  y: number
  isStart: boolean
  isEraser: boolean
}

// Usamos localStorage para persistir os desenhos por rota
const STORAGE_KEY = 'drawing-canvas-by-page'

const getSavedDrawings = (): Record<string, DrawPoint[]> => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

const saveDrawing = (pathname: string, points: DrawPoint[]) => {
  const drawings = getSavedDrawings()
  drawings[pathname] = points
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drawings))
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const isEraserModeRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isEraserActive, setIsEraserActive] = useState(false)
  const pathname = usePathname()
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Quando muda de rota, carregar o desenho da nova rota
    if (isClient) {
      const drawings = getSavedDrawings()
      setDrawPoints(drawings[pathname] || [])
    }
  }, [pathname, isClient])

  useEffect(() => {
    // Salvar o desenho atual quando os pontos mudarem
    if (isClient) {
      saveDrawing(pathname, drawPoints)
    }
  }, [drawPoints, pathname, isClient])

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
      context.lineWidth = 3
      context.strokeStyle = '#ef4444'
      
      // Redesenhar o desenho da página atual
      redrawCanvas()
    }

    initCanvas()
  }, [isOpen, isClient, drawPoints, pathname])

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
  }, [isOpen, isClient, drawPoints])

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

    if (drawPoints.length > 0) {
      let lastWasEraser = false
      drawPoints.forEach((point, index) => {
        // Ajusta para a posição visível no canvas
        const x = point.x - currentScrollX
        const y = point.y - currentScrollY

        // Se mudou de modo, começa um novo caminho
        if (point.isStart || point.isEraser !== lastWasEraser) {
          if (index > 0) {
            context.stroke()
          }
          context.beginPath()
          
          if (point.isEraser) {
            context.globalCompositeOperation = 'destination-out'
            context.lineWidth = 20
          } else {
            context.globalCompositeOperation = 'source-over'
            context.lineWidth = 3
            context.strokeStyle = '#ef4444'
          }
          context.moveTo(x, y)
        }
        
        if (!point.isStart) {
          context.lineTo(x, y)
        }
        
        lastWasEraser = point.isEraser
      })
      context.stroke()
      context.globalCompositeOperation = 'source-over' // Resetar o modo
    }
  }

  const startDrawing = (x: number, y: number, isEraser: boolean) => {
    const context = getContext()
    if (!context) return

    isDrawingRef.current = true
    isEraserModeRef.current = isEraser
    setIsEraserActive(isEraser)
    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    
    const point: DrawPoint = {
      x: x,
      y: y,
      isStart: true,
      isEraser: isEraser
    }
    setDrawPoints(prev => [...prev, point])
    
    // Desenha na posição visível atual
    if (isEraser) {
      context.globalCompositeOperation = 'destination-out'
      context.lineWidth = 20
    } else {
      context.globalCompositeOperation = 'source-over'
      context.lineWidth = 3
      context.strokeStyle = '#ef4444'
    }
    context.beginPath()
    context.moveTo(x - currentScrollX, y - currentScrollY)
  }

  const draw = (x: number, y: number, isEraser: boolean) => {
    if (!isDrawingRef.current) return

    const context = getContext()
    if (!context) return

    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    
    const point: DrawPoint = {
      x: x,
      y: y,
      isStart: false,
      isEraser: isEraser
    }
    setDrawPoints(prev => [...prev, point])
    
    // Desenha na posição visível atual
    if (isEraser) {
      context.globalCompositeOperation = 'destination-out'
      context.lineWidth = 20
    }
    context.lineTo(x - currentScrollX, y - currentScrollY)
    context.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    setIsEraserActive(false)
  }

  const clearCanvas = () => {
    setDrawPoints([])
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
            className={cn(
              "fixed inset-0 block h-screen w-screen touch-none pointer-events-auto",
              isEraserActive ? "cursor-cell" : "cursor-crosshair"
            )}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(event) => {
              const isEraser = event.button === 2 // Botão direito
              startDrawing(event.pageX, event.pageY, isEraser)
            }}
            onPointerMove={(event) => {
              const isEraser = isEraserModeRef.current || event.buttons === 2
              if (isEraser !== isEraserActive) {
                setIsEraserActive(isEraser)
              }
              draw(event.pageX, event.pageY, isEraser)
            }}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
      )}
    </>
  )
}
