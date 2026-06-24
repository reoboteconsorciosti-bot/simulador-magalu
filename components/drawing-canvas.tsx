'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
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

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [isOpen])

  const getContext = () => {
    const current = canvasRef.current
    if (!current) return null
    return current.getContext('2d')
  }

  const startDrawing = (x: number, y: number) => {
    const context = getContext()
    if (!context) return

    isDrawingRef.current = true
    context.beginPath()
    context.moveTo(x, y)
  }

  const draw = (x: number, y: number) => {
    if (!isDrawingRef.current) return

    const context = getContext()
    if (!context) return

    context.lineTo(x, y)
    context.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const clearCanvas = () => {
    const current = canvasRef.current
    const context = getContext()
    if (!current || !context) return

    context.clearRect(0, 0, current.width, current.height)
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        Desenhar
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/30">
          <div className="absolute right-4 top-4 z-[101] flex gap-2">
            <Button type="button" variant="secondary" onClick={clearCanvas}>
              Limpar
            </Button>
            <Button type="button" variant="destructive" onClick={() => setIsOpen(false)}>
              Fechar
            </Button>
          </div>

          <canvas
            ref={canvasRef}
            className="block h-screen w-screen cursor-crosshair touch-none"
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
