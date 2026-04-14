import type { Point } from '@/types/document'

export interface ScaleParams {
  zoom: number
  panOffset: Point
  devicePixelRatio: number
}

/** Convert PDF logical pt to screen px */
export function ptToScreen(ptValue: number, zoom: number, dpr = 1): number {
  return ptValue * zoom * dpr
}

/** Convert screen px to PDF logical pt */
export function screenToPt(screenPx: number, zoom: number, dpr = 1): number {
  return screenPx / (zoom * dpr)
}

/** Convert a pt point to screen point */
export function ptPointToScreen(pt: Point, params: ScaleParams): Point {
  const { zoom, panOffset, devicePixelRatio: dpr } = params
  return {
    x: pt.x * zoom * dpr + panOffset.x,
    y: pt.y * zoom * dpr + panOffset.y,
  }
}

/** Convert a screen point to pt point */
export function screenPointToPt(screen: Point, params: ScaleParams): Point {
  const { zoom, panOffset, devicePixelRatio: dpr } = params
  return {
    x: (screen.x - panOffset.x) / (zoom * dpr),
    y: (screen.y - panOffset.y) / (zoom * dpr),
  }
}

/** Calculate pt from pixel count and DPI */
export function pixelToPt(px: number, dpi: number): number {
  return (px / dpi) * 72
}

/** Scale to fit a page into a container */
export function fitScale(
  pageWidthPt: number,
  pageHeightPt: number,
  containerWidth: number,
  containerHeight: number,
  padding = 32,
): number {
  const availW = containerWidth - padding * 2
  const availH = containerHeight - padding * 2
  const scaleW = availW / pageWidthPt
  const scaleH = availH / pageHeightPt
  return Math.min(scaleW, scaleH)
}
