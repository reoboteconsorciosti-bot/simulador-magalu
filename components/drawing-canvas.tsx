'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

type DrawPoint = {
  x: number
  y: number
  isStart: boolean
}

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([])

  useEffect(() => {
    setIsClient(true)
  }, [])

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
    }

    initCanvas()
  }, [isOpen, isClient])

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
      context.beginPath()
      drawPoints.forEach((point, index) => {
        // Ajusta para a posição visível no canvas
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
  }

  const startDrawing = (x: number, y: number) => {
    const context = getContext()
    if (!context) return

    isDrawingRef.current = true
    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    
    // Calcula a posição fixa na página
    const fixedX = x + currentScrollX
    const fixedY = y + currentScrollY
    
    const point: DrawPoint = {
      x: fixedX,
      y: fixedY,
      isStart: true
    }
    setDrawPoints(prev => [...prev, point])
    
    // Desenha na posição visível atual
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (x: number, y: number) => {
    if (!isDrawingRef.current) return

    const context = getContext()
    if (!context) return

    const currentScrollX = window.scrollX
    const currentScrollY = window.scrollY
    
    // Calcula a posição fixa na página
    const fixedX = x + currentScrollX
    const fixedY = y + currentScrollY
    
    const point: DrawPoint = {
      x: fixedX,
      y: fixedY,
      isStart: false
    }
    setDrawPoints(prev => [...prev, point])
    
    // Desenha na posição visível atual
    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
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
            className="fixed inset-0 block h-screen w-screen cursor-crosshair touch-none pointer-events-auto"
            onPointerDown={(event) => startDrawing(event.clientX, event.clientY)}
            onPointerMove={(event) => draw(event.clientX, event.clientY)}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>
      )}
    </>
  )
}
