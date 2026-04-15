import { describe, it, expect } from 'vitest'
import { validateMagicBytes } from '@/lib/fileValidator'

/** ArrayBuffer に先頭バイトを書き込んで返す */
function makeBuffer(bytes: number[]): ArrayBuffer {
  const buf = new ArrayBuffer(Math.max(bytes.length, 8))
  const view = new Uint8Array(buf)
  bytes.forEach((b, i) => { view[i] = b })
  return buf
}

// PDF マジックバイト: %PDF → [0x25, 0x50, 0x44, 0x46]
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]

// TIFF リトルエンディアン: II + 0x2A 0x00
const TIFF_LE_MAGIC = [0x49, 0x49, 0x2a, 0x00]

// TIFF ビッグエンディアン: MM + 0x00 0x2A
const TIFF_BE_MAGIC = [0x4d, 0x4d, 0x00, 0x2a]

describe('validateMagicBytes', () => {
  describe('PDF', () => {
    it('accepts valid PDF magic bytes', async () => {
      const result = await validateMagicBytes(makeBuffer(PDF_MAGIC), 'pdf')
      expect(result.valid).toBe(true)
      expect(result.fileType).toBe('pdf')
    })

    it('rejects TIFF bytes when expecting PDF', async () => {
      const result = await validateMagicBytes(makeBuffer(TIFF_LE_MAGIC), 'pdf')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('PDF')
    })

    it('rejects arbitrary bytes as PDF', async () => {
      const result = await validateMagicBytes(makeBuffer([0x00, 0x01, 0x02, 0x03]), 'pdf')
      expect(result.valid).toBe(false)
    })
  })

  describe('TIFF', () => {
    it('accepts little-endian TIFF', async () => {
      const result = await validateMagicBytes(makeBuffer(TIFF_LE_MAGIC), 'tif')
      expect(result.valid).toBe(true)
      expect(result.fileType).toBe('tif')
    })

    it('accepts big-endian TIFF', async () => {
      const result = await validateMagicBytes(makeBuffer(TIFF_BE_MAGIC), 'tif')
      expect(result.valid).toBe(true)
      expect(result.fileType).toBe('tif')
    })

    it('rejects PDF bytes when expecting TIFF', async () => {
      const result = await validateMagicBytes(makeBuffer(PDF_MAGIC), 'tif')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('TIF')
    })

    it('rejects arbitrary bytes as TIFF', async () => {
      const result = await validateMagicBytes(makeBuffer([0x00, 0x00, 0x00, 0x00]), 'tif')
      expect(result.valid).toBe(false)
    })
  })
})
