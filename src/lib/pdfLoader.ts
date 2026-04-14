import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import type { PageInfo } from '@/types/document'

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export async function loadPdf(buffer: ArrayBuffer): Promise<PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({ data: buffer })
  return loadingTask.promise
}

export async function getPdfPageInfo(
  pdf: PDFDocumentProxy,
  pageIndex: number,
): Promise<PageInfo> {
  const page = await pdf.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale: 1 })
  return {
    index: pageIndex,
    widthPt: viewport.width,
    heightPt: viewport.height,
  }
}

export async function renderPdfPage(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  zoom: number,
): Promise<void> {
  const page: PDFPageProxy = await pdf.getPage(pageIndex + 1)
  const dpr = window.devicePixelRatio || 1
  const viewport = page.getViewport({ scale: zoom * dpr })

  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = `${viewport.width / dpr}px`
  canvas.style.height = `${viewport.height / dpr}px`

  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
}

export async function generatePdfThumbnail(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  targetWidth = 120,
): Promise<string> {
  const page = await pdf.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale: 1 })
  const scale = targetWidth / viewport.width
  const scaledViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = scaledViewport.width
  canvas.height = scaledViewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise
  return canvas.toDataURL('image/jpeg', 0.7)
}

export async function renderPdfPageOffscreen(
  pdf: PDFDocumentProxy,
  pageIndex: number,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const page = await pdf.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas
}
