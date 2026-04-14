import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { validateFile } from '@/lib/fileValidator'
import { loadPdf, getPdfPageInfo, generatePdfThumbnail } from '@/lib/pdfLoader'
import { decodeTif, generateTifThumbnail } from '@/lib/tifLoader'
import type { TifFrame } from '@/lib/tifLoader'
import { useDocumentStore } from '@/store/documentStore'
import type { DocumentFile } from '@/types/document'
import type { PDFDocumentProxy } from 'pdfjs-dist'

interface UseDocumentReturn {
  loading: boolean
  error: string | null
  pdfProxy: PDFDocumentProxy | null
  tifFrames: TifFrame[] | null
  loadFile: (file: File) => Promise<DocumentFile | null>
  clearError: () => void
}

export function useDocument(): UseDocumentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pdfProxyRef = useRef<PDFDocumentProxy | null>(null)
  const tifFramesRef = useRef<TifFrame[] | null>(null)
  const { setFile, updatePageThumbnail } = useDocumentStore()

  const loadFile = useCallback(async (file: File): Promise<DocumentFile | null> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error ?? '不明なエラー')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const buffer = await file.arrayBuffer()
      const fileId = uuidv4()
      const fileType = validation.fileType!

      let docFile: DocumentFile

      if (fileType === 'pdf') {
        const pdf = await loadPdf(buffer)
        pdfProxyRef.current = pdf
        tifFramesRef.current = null

        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) => getPdfPageInfo(pdf, i)),
        )

        docFile = {
          id: fileId,
          name: file.name,
          type: 'pdf',
          arrayBuffer: buffer,
          pages,
          totalPages: pdf.numPages,
        }

        setFile(docFile)

        // Generate thumbnails async
        for (let i = 0; i < pdf.numPages; i++) {
          generatePdfThumbnail(pdf, i).then((dataUrl) => {
            updatePageThumbnail(i, dataUrl)
          })
        }
      } else {
        const frames = decodeTif(buffer)
        tifFramesRef.current = frames
        pdfProxyRef.current = null

        const pages = frames.map((f) => ({
          index: f.index,
          widthPt: f.widthPt,
          heightPt: f.heightPt,
        }))

        docFile = {
          id: fileId,
          name: file.name,
          type: 'tif',
          arrayBuffer: buffer,
          pages,
          totalPages: frames.length,
        }

        setFile(docFile)

        // Generate thumbnails async
        for (let i = 0; i < frames.length; i++) {
          generateTifThumbnail(buffer, frames, i).then((dataUrl) => {
            updatePageThumbnail(i, dataUrl)
          })
        }
      }

      return docFile
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [setFile, updatePageThumbnail])

  return {
    loading,
    error,
    pdfProxy: pdfProxyRef.current,
    tifFrames: tifFramesRef.current,
    loadFile,
    clearError: () => setError(null),
  }
}
