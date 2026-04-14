import type { FileType } from '@/types/document'

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export interface ValidationResult {
  valid: boolean
  error?: string
  fileType?: FileType
}

export function validateFile(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ファイルサイズが上限（100MB）を超えています。（${(file.size / 1024 / 1024).toFixed(1)}MB）`,
    }
  }

  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return { valid: true, fileType: 'pdf' }
  }
  if (name.endsWith('.tif') || name.endsWith('.tiff') || file.type === 'image/tiff') {
    return { valid: true, fileType: 'tif' }
  }

  return {
    valid: false,
    error: 'PDF または TIF ファイルを選択してください。',
  }
}

export interface ComparisonValidationResult {
  valid: boolean
  error?: string
}

export function validateComparisonFiles(
  oldPageCount: number,
  newPageCount: number,
  oldPages: { widthPt: number; heightPt: number }[],
  newPages: { widthPt: number; heightPt: number }[],
): ComparisonValidationResult {
  if (oldPageCount !== newPageCount) {
    return {
      valid: false,
      error: `ページ数が一致しません。旧版: ${oldPageCount}ページ、新版: ${newPageCount}ページ`,
    }
  }

  const TOLERANCE = 2 // pt
  for (let i = 0; i < oldPageCount; i++) {
    const o = oldPages[i]
    const n = newPages[i]
    if (
      Math.abs(o.widthPt - n.widthPt) > TOLERANCE ||
      Math.abs(o.heightPt - n.heightPt) > TOLERANCE
    ) {
      return {
        valid: false,
        error: `ページ ${i + 1} のサイズが一致しません。旧版: ${o.widthPt.toFixed(1)}×${o.heightPt.toFixed(1)}pt、新版: ${n.widthPt.toFixed(1)}×${n.heightPt.toFixed(1)}pt`,
      }
    }
  }

  return { valid: true }
}
