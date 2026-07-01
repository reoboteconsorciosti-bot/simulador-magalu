'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Trash2, Highlighter, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type DrawPoint = {
  x: number
  y: number
  isStart: boolean
  pressure?: number
  tiltX?: number
  tiltY?: number
}

type Stroke = {
  id: string
  points: DrawPoint[]
  isEraser?: boolean
  color: string
  width: number
  isHighlighter: boolean
}

type StrokeMode = {
  color: string
  width: number
  isHighlighter: boolean
  isEraser: boolean
}

const COLORS = [
  '#ef4444', // vermelho
  '#f97316', // laranja
  '#eab308', // amarelo
  '#22c55e', // verde
  '#3b82f6', // azul
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#0f172a', // preto
]

const WIDTHS = [
  { value: 2,  visual: 1.5 },
  { value: 4,  visual: 3   },
  { value: 8,  visual: 6   },
  { value: 16, visual: 10  },
]

const STORAGE_KEY = 'drawing-canvas-by-page'

const getSavedDrawings = (): Record<string, Stroke[]> => {
  if (typeof window === 'undefined') return {}
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return {}
    const data = JSON.parse(saved)
    const converted: Record<string, Stroke[]> = {}
    for (const [path, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && 'x' in value[0]) {
          // Formato antigo: array de pontos
          const strokesArr: Stroke[] = []
          let current: DrawPoint[] = []
          for (const point of value) {
            if ((point as any).isStart && current.length > 0) {
              strokesArr.push({ id: crypto.randomUUID(), points: [...current], color: '#ef4444', width: 4, isHighlighter: false })
              current = []
            }
            current.push(point)
          }
          if (current.length > 0) {
            strokesArr.push({ id: crypto.randomUUID(), points: current, color: '#ef4444', width: 4, isHighlighter: false })
          }
          converted[path] = strokesArr
        } else {
          // Formato novo: pode estar faltando campos
          converted[path] = (value as any[]).map(s => ({
            ...s,
            color: s.color ?? '#ef4444',
            width: s.width ?? 4,
            isHighlighter: s.isHighlighter ?? false,
          }))
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
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const isDrawingRef = useRef(false)
  const isEraserModeRef = useRef(false)
  const currentStrokeModeRef = useRef<StrokeMode>({
    color: '#ef4444', width: 4, isHighlighter: false, isEraser: false,
  })

  const [isOpen, setIsOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const pathname = usePathname()
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null)
  const [isEraserActive, setIsEraserActive] = useState(false)

  const [strokeColor, setStrokeColor] = useState('#ef4444')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [isHighlighter, setIsHighlighter] = useState(false)
  const [isToolbarOpen, setIsToolbarOpen] = useState(false)

  useEffect(() => { setIsClient(true) }, [])

  useEffect(() => {
    if (!isOpen) setIsToolbarOpen(false)
  }, [isOpen])

  useEffect(() => {
    if (isClient) {
      const drawings = getSavedDrawings()
      setStrokes(drawings[pathname] || [])
    }
  }, [pathname, isClient])

  useEffect(() => {
    if (isClient) saveDrawing(pathname, strokes)
  }, [strokes, pathname, isClient])

  useEffect(() => {
    if (!isOpen || !isClient) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    redrawCanvas()
  }, [isOpen, isClient, strokes, pathname])

  useEffect(() => {
    if (!isOpen || !isClient) return
    const overlay = overlayRef.current
    if (!overlay) return
    const preventDefaultForPen = (e: PointerEvent) => {
      if (e.pointerType === 'pen') e.preventDefault()
    }
    overlay.addEventListener('pointerdown', preventDefaultForPen, { passive: false })
    overlay.addEventListener('pointermove', preventDefaultForPen, { passive: false })
    return () => {
      overlay.removeEventListener('pointerdown', preventDefaultForPen)
      overlay.removeEventListener('pointermove', preventDefaultForPen)
    }
  }, [isOpen, isClient])

  useEffect(() => {
    if (!isOpen || !isClient) return
    const handleScroll = () => redrawCanvas()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isOpen, isClient, strokes])

  const getContext = () => canvasRef.current?.getContext('2d') ?? null

  const applyStrokeMode = (ctx: CanvasRenderingContext2D, mode: StrokeMode) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (mode.isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.lineWidth = 30
    } else if (mode.isHighlighter) {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.38
      ctx.lineWidth = 24
      ctx.strokeStyle = mode.color
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.lineWidth = mode.width
      ctx.strokeStyle = mode.color
    }
  }

  const resetContext = (ctx: CanvasRenderingContext2D) => {
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  const redrawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = getContext()
    if (!canvas || !ctx) return
    const scrollX = window.scrollX
    const scrollY = window.scrollY
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue
      const isEraserStroke = stroke.isEraser || stroke.points.some(p => (p as any).isEraser)
      ctx.beginPath()
      applyStrokeMode(ctx, {
        color: stroke.color ?? '#ef4444',
        width: stroke.width ?? 4,
        isHighlighter: stroke.isHighlighter ?? false,
        isEraser: !!isEraserStroke,
      })
      stroke.points.forEach(p => {
        const x = p.x - scrollX
        const y = p.y - scrollY
        if (p.isStart) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      resetContext(ctx)
    }
  }

  const isPointOnStroke = (x: number, y: number, stroke: Stroke, tolerance = 30): boolean => {
    for (let i = 1; i < stroke.points.length; i++) {
      const p1 = stroke.points[i - 1]
      const p2 = stroke.points[i]
      const A = x - p1.x, B = y - p1.y
      const C = p2.x - p1.x, D = p2.y - p1.y
      const param = (C * C + D * D) !== 0 ? (A * C + B * D) / (C * C + D * D) : -1
      const xx = param < 0 ? p1.x : param > 1 ? p2.x : p1.x + param * C
      const yy = param < 0 ? p1.y : param > 1 ? p2.y : p1.y + param * D
      if (Math.sqrt((x - xx) ** 2 + (y - yy) ** 2) <= tolerance) return true
    }
    return false
  }

  const deleteStrokeAtPoint = (x: number, y: number) => {
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (isPointOnStroke(x, y, strokes[i])) {
        setStrokes(prev => prev.filter((_, idx) => idx !== i))
        return
      }
    }
  }

  const checkEraserButton = (event: PointerEvent | React.PointerEvent): boolean =>
    (event.buttons & 32) !== 0 || event.buttons === 32 || (event.buttons & 0x20) !== 0

  const startDrawing = (event: React.PointerEvent) => {
    if (event.pointerType === 'touch') return
    ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
    if (event.button === 2) return
    const isEraser = checkEraserButton(event)
    isEraserModeRef.current = isEraser
    setIsEraserActive(isEraser)

    const mode: StrokeMode = { color: strokeColor, width: strokeWidth, isHighlighter, isEraser }
    currentStrokeModeRef.current = mode
    isDrawingRef.current = true

    const ctx = getContext()
    if (!ctx) return
    const strokeId = crypto.randomUUID()
    setCurrentStrokeId(strokeId)

    const point: DrawPoint = {
      x: event.pageX, y: event.pageY, isStart: true,
      pressure: event.pressure, tiltX: event.tiltX, tiltY: event.tiltY,
    }
    setStrokes(prev => [...prev, { id: strokeId, points: [point], color: strokeColor, width: strokeWidth, isHighlighter }])

    applyStrokeMode(ctx, mode)
    ctx.beginPath()
    ctx.moveTo(event.pageX - window.scrollX, event.pageY - window.scrollY)
  }

  const continueDrawing = (event: React.PointerEvent) => {
    if (event.pointerType === 'touch') return
    if (!isDrawingRef.current || !currentStrokeId) return
    const isEraser = checkEraserButton(event)
    if (isEraser !== isEraserModeRef.current) {
      isEraserModeRef.current = isEraser
      setIsEraserActive(isEraser)
    }
    const ctx = getContext()
    if (!ctx) return
    const point: DrawPoint = {
      x: event.pageX, y: event.pageY, isStart: false,
      pressure: event.pressure, tiltX: event.tiltX, tiltY: event.tiltY,
    }
    setStrokes(prev => prev.map(s =>
      s.id === currentStrokeId ? { ...s, points: [...s.points, point] } : s
    ))
    applyStrokeMode(ctx, currentStrokeModeRef.current)
    ctx.lineTo(event.pageX - window.scrollX, event.pageY - window.scrollY)
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    setCurrentStrokeId(null)
    const ctx = getContext()
    if (ctx) resetContext(ctx)
  }

  const clearCanvas = () => {
    setStrokes([])
    const canvas = canvasRef.current
    const ctx = getContext()
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const activeCursor = isEraserActive ? 'cursor-cell' : isHighlighter ? 'cursor-text' : 'cursor-crosshair'

  if (!isClient) return null

  return (
    <>
      {/* Canvas overlay */}
      {isOpen && (
        <>
          {/* Canvas: só renderiza, sem capturar eventos */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[100] block h-screen w-screen pointer-events-none"
          />
          {/* Overlay: captura eventos de caneta/mouse, deixa toque do dedo passar */}
          <div
            ref={overlayRef}
            className={cn('fixed inset-0 z-[101] pointer-events-auto', activeCursor)}
            onContextMenu={e => { e.preventDefault(); deleteStrokeAtPoint(e.pageX, e.pageY) }}
            onPointerDown={startDrawing}
            onPointerMove={continueDrawing}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </>
      )}

      {/* Container — FAB + toolbar */}
      <div className="fixed bottom-6 right-6 z-[200]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>

        {/* Toolbar vertical — aparece acima do FAB */}
        <div className={cn(
          'absolute bottom-full right-0 mb-3',
          'transition-all duration-200 ease-out origin-bottom-right',
          isOpen && isToolbarOpen
            ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-x-1 pointer-events-none',
        )}>
          <div className={cn(
            'flex flex-col items-center gap-2 py-3 px-2',
            'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl',
            'border border-slate-200/60 dark:border-slate-700/60',
            'rounded-2xl shadow-lg shadow-black/8 dark:shadow-black/40',
          )}>

            {/* Cores 2×4 */}
            <div className="grid grid-cols-2 gap-1.5">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setStrokeColor(color)}
                  className={cn(
                    'w-5 h-5 rounded-full',
                    'border-2 transition-all duration-150 hover:scale-125 active:scale-90',
                    strokeColor === color
                      ? 'border-slate-700 dark:border-white scale-[1.2] shadow-sm'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

            {/* Espessuras verticais */}
            <div className="flex flex-col items-center gap-0.5">
              {WIDTHS.map(w => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => { setStrokeWidth(w.value); setIsHighlighter(false) }}
                  className={cn(
                    'w-10 h-7 rounded-md flex items-center justify-center',
                    'transition-all duration-150 active:scale-90',
                    strokeWidth === w.value && !isHighlighter
                      ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-400/60 dark:ring-slate-500/60'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800',
                  )}
                >
                  <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                    <line
                      x1="3" y1="9" x2="19" y2="9"
                      stroke={strokeColor}
                      strokeWidth={w.visual}
                      strokeLinecap="round"
                      opacity={isHighlighter ? 0.25 : 1}
                    />
                  </svg>
                </button>
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />

            {/* Marcador */}
            <button
              type="button"
              onClick={() => setIsHighlighter(prev => !prev)}
              title="Marcador de texto"
              className={cn(
                'w-10 h-7 rounded-md flex items-center justify-center',
                'transition-all duration-150 active:scale-90',
                isHighlighter
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 ring-1 ring-yellow-400/70 dark:ring-yellow-500/60'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              <Highlighter className={cn(
                'w-3.5 h-3.5 transition-colors',
                isHighlighter
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-slate-400 dark:text-slate-500',
              )} />
            </button>

          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">

          {/* Limpar tudo */}
          <div className={cn(
            'transition-all duration-300 ease-out',
            isOpen ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-3 pointer-events-none',
          )}>
            <button
              type="button"
              onClick={clearCanvas}
              className={cn(
                'flex items-center gap-1.5 h-10 px-3.5 rounded-full',
                'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md',
                'border border-slate-200 dark:border-slate-700',
                'shadow-md shadow-black/8 dark:shadow-black/30',
                'text-sm font-medium text-slate-500 dark:text-slate-400',
                'hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800',
                'transition-all duration-200 active:scale-95',
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar
            </button>
          </div>

          {/* Mais detalhes — abre toolbar vertical */}
          <div className={cn(
            'transition-all duration-300 ease-out',
            isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none',
          )}>
            <button
              type="button"
              onClick={() => setIsToolbarOpen(prev => !prev)}
              title="Ferramentas"
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'backdrop-blur-md border shadow-md transition-all duration-200 active:scale-95',
                isToolbarOpen
                  ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FAB — lápis ↔ X */}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? 'Fechar' : 'Desenhar'}
            className={cn(
              'relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0',
              'bg-gradient-to-tr from-blue-600 to-indigo-600',
              'shadow-lg transition-all duration-300 ease-out',
              isOpen
                ? 'shadow-indigo-500/40 scale-105 ring-4 ring-indigo-300/20 dark:ring-indigo-400/20'
                : 'shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-110 active:scale-95',
            )}
          >
            <span className="absolute inset-0 rounded-full bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

            <svg
              className={cn(
                'absolute w-5 h-5 text-white transition-all duration-300 ease-out',
                isOpen ? 'opacity-0 scale-50 rotate-45' : 'opacity-100 scale-100 rotate-0',
              )}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>

            <X className={cn(
              'absolute w-5 h-5 text-white transition-all duration-300 ease-out',
              isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-45',
            )} />
          </button>
        </div>
      </div>
    </>
  )
}
