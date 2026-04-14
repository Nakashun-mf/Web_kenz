import { describe, it, expect } from 'vitest'
import {
  ptToScreen,
  screenToPt,
  ptPointToScreen,
  screenPointToPt,
  pixelToPt,
  fitScale,
} from '@/lib/coordinateUtils'

describe('coordinateUtils', () => {
  describe('ptToScreen', () => {
    it('converts pt to screen px with zoom', () => {
      expect(ptToScreen(100, 2, 1)).toBe(200)
    })

    it('accounts for device pixel ratio', () => {
      expect(ptToScreen(100, 2, 2)).toBe(400)
    })

    it('handles zoom 1 dpr 1 identity', () => {
      expect(ptToScreen(72, 1, 1)).toBe(72)
    })
  })

  describe('screenToPt', () => {
    it('converts screen px to pt', () => {
      expect(screenToPt(200, 2, 1)).toBe(100)
    })

    it('round-trips with ptToScreen', () => {
      const original = 123.45
      expect(screenToPt(ptToScreen(original, 1.5, 2), 1.5, 2)).toBeCloseTo(original)
    })
  })

  describe('ptPointToScreen', () => {
    it('applies zoom and pan', () => {
      const result = ptPointToScreen(
        { x: 10, y: 20 },
        { zoom: 2, panOffset: { x: 5, y: 10 }, devicePixelRatio: 1 },
      )
      expect(result.x).toBe(25)
      expect(result.y).toBe(50)
    })
  })

  describe('screenPointToPt', () => {
    it('reverses zoom and pan', () => {
      const result = screenPointToPt(
        { x: 25, y: 50 },
        { zoom: 2, panOffset: { x: 5, y: 10 }, devicePixelRatio: 1 },
      )
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
    })
  })

  describe('pixelToPt', () => {
    it('converts 300dpi pixel to pt', () => {
      // 300px at 300dpi = 1 inch = 72pt
      expect(pixelToPt(300, 300)).toBeCloseTo(72)
    })

    it('converts A4 width in pixels at 300dpi', () => {
      // A4 = 210mm = 595.28pt
      // At 300dpi: 2480px
      expect(pixelToPt(2480, 300)).toBeCloseTo(595.2, 0)
    })
  })

  describe('fitScale', () => {
    it('fits page width first when wider', () => {
      // A3 landscape (1190pt x 842pt) in 800x600 container with 32px padding
      const scale = fitScale(1190, 842, 800, 600)
      const availW = 800 - 64
      expect(scale).toBeCloseTo(availW / 1190, 5)
    })

    it('fits page height first when taller', () => {
      // Narrow tall page in wide container
      const scale = fitScale(100, 500, 800, 600)
      const availH = 600 - 64
      expect(scale).toBeCloseTo(availH / 500, 5)
    })

    it('always returns positive scale', () => {
      expect(fitScale(100, 100, 200, 200)).toBeGreaterThan(0)
    })
  })
})
