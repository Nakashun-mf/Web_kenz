import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPdfPage } from '@/lib/pdfLoader'
import { renderTifToCanvas } from '@/lib/tifLoader'
import type { TifFrame } from '@/lib/tifLoader'
import type { DocumentFile } from '@/types/document'

interface PageCanvasProps {
  file: DocumentFile
  pageIndex: number
  zoom: number
  rotation: number
  pdfProxy: PDFDocumentProxy | null
  tifFrames: TifFrame[] | null
  onSizeChange?: (widthPx: number, heightPx: number) => void
}

export function PageCanvas({
  file,
  pageIndex,
  zoom,
  rotation,
  pdfProxy,
  tifFrames,
  onSizeChange,
}: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    const render = async () => {
      if (file.type === 'pdf' && pdfProxy) {
        await renderPdfPage(pdfProxy, pageIndex, canvas, zoom)
        if (!cancelled && onSizeChange) {
          onSizeChange(canvas.width, canvas.height)
        }
      } else if (file.type === 'tif' && tifFrames) {
        renderTifToCanvas(file.arrayBuffer, tifFrames, pageIndex, canvas, zoom, rotation)
        if (!cancelled && onSizeChange) {
          onSizeChange(canvas.width, canvas.height)
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [file, pageIndex, zoom, rotation, pdfProxy, tifFrames, onSizeChange])

  return (
    <canvas
      ref={canvasRef}
      className="block shadow-lg"
    />
  )
}
