import type { FileType } from '@/types/document'

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export interface ValidationResult {
  valid: boolean
  error?: string
  fileType?: FileType
}

/** ファイルの拡張子・MIMEタイプで形式を確認（同期） */
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

/**
 * ファイルのマジックバイト（シグネチャ）を検証する（非同期）
 * 拡張子やMIMEタイプの偽装を検出する
 */
export async function validateMagicBytes(
  buffer: ArrayBuffer,
  expectedType: FileType,
): Promise<ValidationResult> {
  const header = new Uint8Array(buffer, 0, 8)

  if (expectedType === 'pdf') {
    // PDF シグネチャ: %PDF → [0x25, 0x50, 0x44, 0x46]
    const isPdf =
      header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46
    if (!isPdf) {
      return { valid: false, error: 'ファイルの内容が PDF 形式ではありません。' }
    }
    return { valid: true, fileType: 'pdf' }
  }

  if (expectedType === 'tif') {
    // TIFF リトルエンディアン: II + 0x2A 0x00 → [0x49, 0x49, 0x2A, 0x00]
    // TIFF ビッグエンディアン: MM + 0x00 0x2A → [0x4D, 0x4D, 0x00, 0x2A]
    const isLittleEndian =
      header[0] === 0x49 && header[1] === 0x49 && header[2] === 0x2a && header[3] === 0x00
    const isBigEndian =
      header[0] === 0x4d && header[1] === 0x4d && header[2] === 0x00 && header[3] === 0x2a
    if (!isLittleEndian && !isBigEndian) {
      return { valid: false, error: 'ファイルの内容が TIF 形式ではありません。' }
    }
    return { valid: true, fileType: 'tif' }
  }

  return { valid: false, error: '未対応のファイル形式です。' }
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
