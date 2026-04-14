import { PDFDocument } from 'pdf-lib'
import type { Annotation, FreehandAnnotation, LineAnnotation, RectAnnotation, CircleAnnotation, TextAnnotation } from '@/types/annotation'
import type { DocumentFile, PageInfo } from '@/types/document'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPdfPageOffscreen } from './pdfLoader'
import { renderTifFrame } from './tifLoader'
import type { TifFrame } from './tifLoader'

function drawAnnotationsOnCanvas(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  scalePt: number, // px per pt for the offscreen canvas
): void {
  ctx.save()
  ctx.strokeStyle = '#FF0000'
  ctx.fillStyle = '#FF0000'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const ann of annotations) {
    switch (ann.type) {
      case 'freehand': {
        const a = ann as FreehandAnnotation
        ctx.lineWidth = a.strokeWidth * scalePt
        ctx.beginPath()
        for (let i = 0; i < a.points.length - 1; i += 2) {
          const px = a.points[i] * scalePt
          const py = a.points[i + 1] * scalePt
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        break
      }
      case 'line': {
        const a = ann as LineAnnotation
        ctx.lineWidth = a.strokeWidth * scalePt
        ctx.beginPath()
        ctx.moveTo(a.x * scalePt, a.y * scalePt)
        ctx.lineTo(a.x2 * scalePt, a.y2 * scalePt)
        ctx.stroke()
        break
      }
      case 'rect': {
        const a = ann as RectAnnotation
        ctx.lineWidth = a.strokeWidth * scalePt
        ctx.strokeRect(a.x * scalePt, a.y * scalePt, a.width * scalePt, a.height * scalePt)
        break
      }
      case 'circle': {
        const a = ann as CircleAnnotation
        ctx.lineWidth = a.strokeWidth * scalePt
        ctx.beginPath()
        ctx.ellipse(a.x * scalePt, a.y * scalePt, Math.abs(a.rx) * scalePt, Math.abs(a.ry) * scalePt, 0, 0, Math.PI * 2)
        ctx.stroke()
        break
      }
      case 'text': {
        const a = ann as TextAnnotation
        const fontPx = a.fontSize * scalePt
        ctx.font = `${fontPx}px "Noto Sans JP", sans-serif`
        const metrics = ctx.measureText(a.text)
        const textW = metrics.width
        const textH = fontPx * 1.2

        if (a.bgColor !== 'transparent') {
          ctx.fillStyle = a.bgColor === 'yellow' ? '#FFFF00' : '#FFFFFF'
          ctx.fillRect(a.x * scalePt - 2, a.y * scalePt - textH + 4, textW + 4, textH + 4)
        }
        if (a.showBorder) {
          ctx.strokeStyle = '#FF0000'
          ctx.lineWidth = scalePt
          ctx.strokeRect(a.x * scalePt - 2, a.y * scalePt - textH + 4, textW + 4, textH + 4)
        }
        ctx.fillStyle = '#FF0000'
        ctx.fillText(a.text, a.x * scalePt, a.y * scalePt + textH / 2)
        break
      }
    }
  }
  ctx.restore()
}

export async function exportAnnotatedPdf(
  file: DocumentFile,
  annotationMap: Record<string, Annotation[]>,
  pdfProxy: PDFDocumentProxy | null,
  tifFrames: TifFrame[] | null,
): Promise<Uint8Array> {
  const outputDoc = await PDFDocument.create()
  const EXPORT_SCALE = 2 // 2x for quality

  for (let i = 0; i < file.pages.length; i++) {
    const page: PageInfo = file.pages[i]
    const key = `${file.id}:${i}`
    const annotations = annotationMap[key] ?? []

    // Render the page to an offscreen canvas
    let pageCanvas: HTMLCanvasElement

    if (file.type === 'pdf' && pdfProxy) {
      pageCanvas = await renderPdfPageOffscreen(pdfProxy, i, EXPORT_SCALE)
    } else if (file.type === 'tif' && tifFrames) {
      const imageData = renderTifFrame(file.arrayBuffer, tifFrames, i)
      pageCanvas = document.createElement('canvas')
      pageCanvas.width = tifFrames[i].widthPx * EXPORT_SCALE
      pageCanvas.height = tifFrames[i].heightPx * EXPORT_SCALE
      const tCtx = pageCanvas.getContext('2d')!
      // Scale up for quality
      const tmpC = document.createElement('canvas')
      tmpC.width = tifFrames[i].widthPx
      tmpC.height = tifFrames[i].heightPx
      tmpC.getContext('2d')!.putImageData(imageData, 0, 0)
      tCtx.drawImage(tmpC, 0, 0, pageCanvas.width, pageCanvas.height)
    } else {
      continue
    }

    // Draw annotations on top
    const scalePt = (pageCanvas.width / page.widthPt)
    if (annotations.length > 0) {
      const ctx = pageCanvas.getContext('2d')!
      drawAnnotationsOnCanvas(ctx, annotations, scalePt)
    }

    // Convert canvas to JPEG and embed
    const jpegDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92)
    const jpegBytes = await fetch(jpegDataUrl).then(r => r.arrayBuffer())
    const image = await outputDoc.embedJpg(jpegBytes)

    const pdfPage = outputDoc.addPage([page.widthPt, page.heightPt])
    pdfPage.drawImage(image, {
      x: 0,
      y: 0,
      width: page.widthPt,
      height: page.heightPt,
    })

    // Release memory
    pageCanvas.width = 0
    pageCanvas.height = 0
  }

  // Add metadata
  outputDoc.setTitle(file.name.replace(/\.(pdf|tif|tiff)$/i, '') + '_検図済')
  outputDoc.setCreator('図面検図アプリ')
  outputDoc.setProducer('図面検図アプリ')

  return outputDoc.save()
}

export function triggerDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
