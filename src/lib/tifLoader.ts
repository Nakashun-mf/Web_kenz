import UTIF from 'utif2'
import { pixelToPt } from './coordinateUtils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UtifIFD = any

export interface TifFrame {
  index: number
  widthPx: number
  heightPx: number
  widthPt: number
  heightPt: number
  dpi: number
  ifd: UtifIFD
}

export function decodeTif(buffer: ArrayBuffer): TifFrame[] {
  const ifds: UtifIFD[] = UTIF.decode(buffer)

  return ifds.map((ifd: UtifIFD, index: number) => {
    const widthPx: number = ifd.t256?.[0] ?? ifd.width ?? 0
    const heightPx: number = ifd.t257?.[0] ?? ifd.height ?? 0
    // XResolution tag (282)
    const dpiX: number = ifd.t282?.[0] ?? 96
    const dpi = dpiX > 0 ? dpiX : 96
    const widthPt = pixelToPt(widthPx, dpi)
    const heightPt = pixelToPt(heightPx, dpi)
    return { index, widthPx, heightPx, widthPt, heightPt, dpi, ifd }
  })
}

export function renderTifFrame(
  buffer: ArrayBuffer,
  frames: TifFrame[],
  frameIndex: number,
): ImageData {
  const ifds: UtifIFD[] = UTIF.decode(buffer)
  UTIF.decodeImage(buffer, ifds[frameIndex])
  const rgba = UTIF.toRGBA8(ifds[frameIndex]) as Uint8Array
  const { widthPx, heightPx } = frames[frameIndex]
  return new ImageData(new Uint8ClampedArray(rgba), widthPx, heightPx)
}

export async function generateTifThumbnail(
  buffer: ArrayBuffer,
  frames: TifFrame[],
  frameIndex: number,
  targetWidth = 120,
): Promise<string> {
  const imageData = renderTifFrame(buffer, frames, frameIndex)
  const { widthPx, heightPx } = frames[frameIndex]
  const scale = targetWidth / widthPx

  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is not available')
  ctx.putImageData(imageData, 0, 0)

  const thumbCanvas = document.createElement('canvas')
  thumbCanvas.width = Math.round(widthPx * scale)
  thumbCanvas.height = Math.round(heightPx * scale)
  const thumbCtx = thumbCanvas.getContext('2d')
  if (!thumbCtx) throw new Error('Canvas 2D context is not available')
  thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height)
  return thumbCanvas.toDataURL('image/jpeg', 0.7)
}

export function renderTifToCanvas(
  buffer: ArrayBuffer,
  frames: TifFrame[],
  frameIndex: number,
  canvas: HTMLCanvasElement,
  zoom: number,
  rotation: number,
): void {
  const imageData = renderTifFrame(buffer, frames, frameIndex)
  const { widthPx, heightPx } = frames[frameIndex]
  const dpr = window.devicePixelRatio || 1
  const scale = zoom * dpr

  const isRotated90 = rotation === 90 || rotation === 270
  const displayW = isRotated90 ? heightPx * scale : widthPx * scale
  const displayH = isRotated90 ? widthPx * scale : heightPx * scale

  canvas.width = displayW
  canvas.height = displayH
  canvas.style.width = `${displayW / dpr}px`
  canvas.style.height = `${displayH / dpr}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is not available')
  ctx.save()

  ctx.translate(displayW / 2, displayH / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(scale, scale)
  ctx.translate(-widthPx / 2, -heightPx / 2)

  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = widthPx
  tmpCanvas.height = heightPx
  const tmpCtx = tmpCanvas.getContext('2d')
  if (!tmpCtx) throw new Error('Canvas 2D context is not available')
  tmpCtx.putImageData(imageData, 0, 0)
  ctx.drawImage(tmpCanvas, 0, 0)
  ctx.restore()
}
