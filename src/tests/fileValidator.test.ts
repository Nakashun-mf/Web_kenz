import { describe, it, expect } from 'vitest'
import { validateFile, validateComparisonFiles, MAX_FILE_SIZE } from '@/lib/fileValidator'

function makeFile(name: string, size: number, type = ''): File {
  const blob = new Blob([new Uint8Array(Math.min(size, 10))], { type })
  return new File([blob], name, { type })
}

describe('validateFile', () => {
  it('accepts PDF by extension', () => {
    const result = validateFile(makeFile('drawing.pdf', 1000))
    expect(result.valid).toBe(true)
    expect(result.fileType).toBe('pdf')
  })

  it('accepts TIF by extension', () => {
    const result = validateFile(makeFile('drawing.tif', 1000))
    expect(result.valid).toBe(true)
    expect(result.fileType).toBe('tif')
  })

  it('accepts TIFF by extension', () => {
    const result = validateFile(makeFile('drawing.TIFF', 1000))
    expect(result.valid).toBe(true)
    expect(result.fileType).toBe('tif')
  })

  it('rejects unknown extensions', () => {
    const result = validateFile(makeFile('drawing.docx', 1000))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('PDF')
  })

  it('rejects files over 100MB', () => {
    const tooBig = makeFile('large.pdf', MAX_FILE_SIZE + 1)
    Object.defineProperty(tooBig, 'size', { value: MAX_FILE_SIZE + 1 })
    const result = validateFile(tooBig)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('100MB')
  })

  it('accepts files exactly at 100MB', () => {
    const exact = makeFile('exact.pdf', 100)
    Object.defineProperty(exact, 'size', { value: MAX_FILE_SIZE })
    const result = validateFile(exact)
    expect(result.valid).toBe(true)
  })
})

describe('validateComparisonFiles', () => {
  const pages = (count: number, w = 595, h = 842) =>
    Array.from({ length: count }, () => ({ widthPt: w, heightPt: h }))

  it('passes when page counts and sizes match', () => {
    const result = validateComparisonFiles(3, 3, pages(3), pages(3))
    expect(result.valid).toBe(true)
  })

  it('fails on page count mismatch', () => {
    const result = validateComparisonFiles(2, 3, pages(2), pages(3))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('ページ数')
  })

  it('fails on page size mismatch', () => {
    const result = validateComparisonFiles(1, 1, pages(1, 595, 842), pages(1, 842, 1190))
    expect(result.valid).toBe(false)
    expect(result.error).toContain('サイズ')
  })

  it('passes with size within 2pt tolerance', () => {
    const result = validateComparisonFiles(1, 1, pages(1, 595, 842), pages(1, 596, 843))
    expect(result.valid).toBe(true)
  })

  it('fails with size difference > 2pt', () => {
    const result = validateComparisonFiles(1, 1, pages(1, 595, 842), pages(1, 598, 842))
    expect(result.valid).toBe(false)
  })
})
