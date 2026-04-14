import { useEffect, useRef, useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAnnotationStore } from '@/store/annotationStore'
import type {
  Annotation, FreehandAnnotation, LineAnnotation,
  RectAnnotation, CircleAnnotation, TextAnnotation,
} from '@/types/annotation'
import type { Point } from '@/types/document'

const STROKE_COLOR = '#FF0000'
const STROKE_WIDTH = 2

interface AnnotationLayerProps {
  fileId: string
  pageIndex: number
  canvasWidthPx: number
  canvasHeightPx: number
  zoom: number
  enabled: boolean
}

// ── Module-level draw helper (no React deps) ────────────────────
function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation, scale: number, zoom: number) {
  ctx.strokeStyle = STROKE_COLOR
  ctx.fillStyle = STROKE_COLOR

  switch (ann.type) {
    case 'freehand': {
      const a = ann as FreehandAnnotation
      ctx.lineWidth = a.strokeWidth
      ctx.beginPath()
      for (let i = 0; i < a.points.length - 1; i += 2) {
        const px = a.points[i] * scale
        const py = a.points[i + 1] * scale
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      break
    }
    case 'line': {
      const a = ann as LineAnnotation
      ctx.lineWidth = a.strokeWidth
      ctx.beginPath()
      ctx.moveTo(a.x * scale, a.y * scale)
      ctx.lineTo(a.x2 * scale, a.y2 * scale)
      ctx.stroke()
      break
    }
    case 'rect': {
      const a = ann as RectAnnotation
      ctx.lineWidth = a.strokeWidth
      ctx.strokeRect(a.x * scale, a.y * scale, a.width * scale, a.height * scale)
      break
    }
    case 'circle': {
      const a = ann as CircleAnnotation
      ctx.lineWidth = a.strokeWidth
      ctx.beginPath()
      ctx.ellipse(a.x * scale, a.y * scale, Math.abs(a.rx) * scale, Math.abs(a.ry) * scale, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    case 'text': {
      const a = ann as TextAnnotation
      const fontPx = a.fontSize * scale / zoom
      ctx.font = `${fontPx}px "Noto Sans JP", sans-serif`
      const metrics = ctx.measureText(a.text)
      const w = metrics.width
      const h = fontPx * 1.4
      const tx = a.x * scale
      const ty = a.y * scale
      if (a.bgColor !== 'transparent') {
        ctx.fillStyle = a.bgColor === 'yellow' ? '#FFFF0099' : '#FFFFFF99'
        ctx.fillRect(tx - 2, ty - h + 4, w + 4, h + 2)
      }
      if (a.showBorder) {
        ctx.strokeStyle = STROKE_COLOR
        ctx.lineWidth = 1
        ctx.strokeRect(tx - 2, ty - h + 4, w + 4, h + 2)
      }
      ctx.fillStyle = STROKE_COLOR
      ctx.fillText(a.text, tx, ty)
      break
    }
  }
}

export function AnnotationLayer({
  fileId, pageIndex, canvasWidthPx, canvasHeightPx, zoom, enabled,
}: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const pointsRef = useRef<number[]>([])
  const startPtRef = useRef<Point>({ x: 0, y: 0 })
  const [editingText, setEditingText] = useState<{ x: number; y: number; ptX: number; ptY: number } | null>(null)
  const [textValue, setTextValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { activeTool, activeProps, annotations, addAnnotation } = useAnnotationStore()
  const annotationKey = `${fileId}:${pageIndex}`
  const pageAnnotations = annotations[annotationKey] ?? []

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || canvasWidthPx === 0) return
    canvas.width = canvasWidthPx
    canvas.height = canvasHeightPx
    canvas.style.width = `${canvasWidthPx / (window.devicePixelRatio || 1)}px`
    canvas.style.height = `${canvasHeightPx / (window.devicePixelRatio || 1)}px`
  }, [canvasWidthPx, canvasHeightPx])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = zoom * (window.devicePixelRatio || 1)
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const ann of pageAnnotations) drawAnnotation(ctx, ann, scale, zoom)
    ctx.restore()
  }, [pageAnnotations, zoom])

  useEffect(() => { redraw() }, [redraw])

  function getCanvasPoint(e: React.MouseEvent): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function getPtPoint(px: Point): Point {
    const dpr = window.devicePixelRatio || 1
    return { x: px.x / (zoom * dpr), y: px.y / (zoom * dpr) }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enabled || activeTool === 'select') return
    if (activeTool === 'text') {
      const px = getCanvasPoint(e)
      const pt = getPtPoint(px)
      const dpr = window.devicePixelRatio || 1
      setEditingText({ x: px.x / dpr, y: px.y / dpr, ptX: pt.x, ptY: pt.y })
      setTextValue('')
      setTimeout(() => inputRef.current?.focus(), 0)
      return
    }
    drawingRef.current = true
    const px = getCanvasPoint(e)
    const pt = getPtPoint(px)
    startPtRef.current = pt
    pointsRef.current = [pt.x, pt.y]
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawingRef.current || !enabled) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const px = getCanvasPoint(e)
    const pt = getPtPoint(px)
    const scale = zoom * (window.devicePixelRatio || 1)

    if (activeTool === 'freehand') {
      pointsRef.current.push(pt.x, pt.y)
      const pts = pointsRef.current
      ctx.strokeStyle = STROKE_COLOR
      ctx.lineWidth = STROKE_WIDTH
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[pts.length - 4] * scale, pts[pts.length - 3] * scale)
      ctx.lineTo(pts[pts.length - 2] * scale, pts[pts.length - 1] * scale)
      ctx.stroke()
    } else {
      redraw()
      const start = startPtRef.current
      ctx.strokeStyle = STROKE_COLOR
      ctx.lineWidth = STROKE_WIDTH

      if (activeTool === 'line') {
        ctx.beginPath()
        ctx.moveTo(start.x * scale, start.y * scale)
        ctx.lineTo(pt.x * scale, pt.y * scale)
        ctx.stroke()
      } else if (activeTool === 'rect') {
        ctx.strokeRect(start.x * scale, start.y * scale, (pt.x - start.x) * scale, (pt.y - start.y) * scale)
      } else if (activeTool === 'circle') {
        const rx = Math.abs(pt.x - start.x) / 2
        const ry = Math.abs(pt.y - start.y) / 2
        const cx = (start.x + pt.x) / 2
        const cy = (start.y + pt.y) / 2
        ctx.beginPath()
        ctx.ellipse(cx * scale, cy * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawingRef.current || !enabled) return
    drawingRef.current = false

    const px = getCanvasPoint(e)
    const pt = getPtPoint(px)
    const start = startPtRef.current

    if (activeTool === 'freehand') {
      if (pointsRef.current.length < 4) return
      addAnnotation(annotationKey, {
        id: uuidv4(), type: 'freehand',
        x: pointsRef.current[0], y: pointsRef.current[1],
        points: [...pointsRef.current], strokeWidth: STROKE_WIDTH,
      } as FreehandAnnotation)
    } else if (activeTool === 'line') {
      addAnnotation(annotationKey, {
        id: uuidv4(), type: 'line',
        x: start.x, y: start.y, x2: pt.x, y2: pt.y, strokeWidth: STROKE_WIDTH,
      } as LineAnnotation)
    } else if (activeTool === 'rect') {
      const w = pt.x - start.x
      const h = pt.y - start.y
      if (Math.abs(w) < 2 && Math.abs(h) < 2) return
      addAnnotation(annotationKey, {
        id: uuidv4(), type: 'rect',
        x: Math.min(start.x, pt.x), y: Math.min(start.y, pt.y),
        width: Math.abs(w), height: Math.abs(h), strokeWidth: STROKE_WIDTH,
      } as RectAnnotation)
    } else if (activeTool === 'circle') {
      const rx = Math.abs(pt.x - start.x) / 2
      const ry = Math.abs(pt.y - start.y) / 2
      if (rx < 2 && ry < 2) return
      const cx = (start.x + pt.x) / 2
      const cy = (start.y + pt.y) / 2
      addAnnotation(annotationKey, {
        id: uuidv4(), type: 'circle',
        x: cx, y: cy, rx, ry, strokeWidth: STROKE_WIDTH,
      } as CircleAnnotation)
    }

    pointsRef.current = []
  }

  const commitText = () => {
    if (!editingText || !textValue.trim()) { setEditingText(null); return }
    addAnnotation(annotationKey, {
      id: uuidv4(), type: 'text',
      x: editingText.ptX, y: editingText.ptY,
      text: textValue,
      fontSize: activeProps.fontSize,
      showBorder: activeProps.showBorder,
      bgColor: activeProps.bgColor,
    } as TextAnnotation)
    setEditingText(null)
    setTextValue('')
  }

  const cursorStyle = !enabled ? 'default'
    : activeTool === 'select' ? 'default'
    : activeTool === 'text' ? 'text'
    : 'crosshair'

  return (
    <div className="absolute inset-0" style={{ pointerEvents: enabled ? 'auto' : 'none' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {editingText && (
        <input
          ref={inputRef}
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitText()
            if (e.key === 'Escape') { setEditingText(null); setTextValue('') }
          }}
          className="absolute rounded border border-red-500 bg-white/80 px-2 py-0.5 text-red-600 outline-none shadow-sm"
          style={{
            left: editingText.x,
            top: editingText.y - activeProps.fontSize - 4,
            fontSize: activeProps.fontSize,
            minWidth: 80,
          }}
          placeholder="テキストを入力…"
        />
      )}
    </div>
  )
}
