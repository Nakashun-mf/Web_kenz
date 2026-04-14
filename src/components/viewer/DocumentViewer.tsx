import { useRef, useState, useCallback, useEffect } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TifFrame } from '@/lib/tifLoader'
import { fitScale } from '@/lib/coordinateUtils'
import type { DocumentFile } from '@/types/document'
import { PageCanvas } from './PageCanvas'
import { AnnotationLayer } from './AnnotationLayer'
import { ViewerControls } from './ViewerControls'

interface DocumentViewerProps {
  file: DocumentFile
  currentPage: number
  zoom: number
  rotation: number
  pdfProxy: PDFDocumentProxy | null
  tifFrames: TifFrame[] | null
  annotationsEnabled?: boolean
  onPageChange: (page: number) => void
  onZoomChange: (zoom: number) => void
  onRotationChange: (rotation: number) => void
}

export function DocumentViewer({
  file, currentPage, zoom, rotation, pdfProxy, tifFrames,
  annotationsEnabled = true, onPageChange, onZoomChange, onRotationChange,
}: DocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })

  const page = file.pages[currentPage]

  useEffect(() => {
    if (!containerRef.current || !page) return
    const rect = containerRef.current.getBoundingClientRect()
    onZoomChange(fitScale(page.widthPt, page.heightPt, rect.width, rect.height, 48))
    setPanOffset({ x: 0, y: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.id, currentPage])

  const handleSizeChange = useCallback((w: number, h: number) => {
    setCanvasSize({ width: w, height: h })
  }, [])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    onZoomChange(Math.min(Math.max(zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.1), 8))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true)
      panStartRef.current = { mouseX: e.clientX, mouseY: e.clientY, panX: panOffset.x, panY: panOffset.y }
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    setPanOffset({
      x: panStartRef.current.panX + (e.clientX - panStartRef.current.mouseX),
      y: panStartRef.current.panY + (e.clientY - panStartRef.current.mouseY),
    })
  }

  const handleMouseUp = () => setIsPanning(false)

  const dpr = window.devicePixelRatio || 1
  const displayW = canvasSize.width  ? canvasSize.width / dpr  : (page?.widthPt  ?? 0) * zoom
  const displayH = canvasSize.height ? canvasSize.height / dpr : (page?.heightPt ?? 0) * zoom

  return (
    <div className="flex h-full flex-col bg-slate-200">
      {/* Controls bar */}
      <div className="flex shrink-0 items-center justify-center border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
        <ViewerControls
          currentPage={currentPage}
          totalPages={file.totalPages}
          zoom={zoom}
          showRotation={file.type === 'tif'}
          onPrevPage={() => onPageChange(Math.max(0, currentPage - 1))}
          onNextPage={() => onPageChange(Math.min(file.totalPages - 1, currentPage + 1))}
          onZoomIn={() => onZoomChange(Math.min(zoom * 1.25, 8))}
          onZoomOut={() => onZoomChange(Math.max(zoom / 1.25, 0.1))}
          onFitWidth={() => {
            if (!containerRef.current || !page) return
            const rect = containerRef.current.getBoundingClientRect()
            onZoomChange(fitScale(page.widthPt, page.heightPt, rect.width, rect.height, 48))
            setPanOffset({ x: 0, y: 0 })
          }}
          onRotate={() => onRotationChange(rotation + 90)}
        />
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: isPanning ? 'grabbing' : annotationsEnabled ? 'default' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="absolute flex items-start justify-center"
          style={{
            left: '50%', top: '50%',
            transform: `translate(-50%, -50%) translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <div className="relative" style={{ width: displayW, height: displayH }}>
            <PageCanvas
              file={file}
              pageIndex={currentPage}
              zoom={zoom}
              rotation={rotation}
              pdfProxy={pdfProxy}
              tifFrames={tifFrames}
              onSizeChange={handleSizeChange}
            />
            {canvasSize.width > 0 && (
              <AnnotationLayer
                fileId={file.id}
                pageIndex={currentPage}
                canvasWidthPx={canvasSize.width}
                canvasHeightPx={canvasSize.height}
                zoom={zoom}
                enabled={annotationsEnabled}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
