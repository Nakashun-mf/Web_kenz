import { useRef, useState } from 'react'
import { ArrowRight, FileText } from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TifFrame } from '@/lib/tifLoader'
import { loadPdf, getPdfPageInfo, generatePdfThumbnail } from '@/lib/pdfLoader'
import { decodeTif, generateTifThumbnail } from '@/lib/tifLoader'
import { validateFile, validateMagicBytes } from '@/lib/fileValidator'
import { exportAnnotatedPdf, triggerDownload } from '@/lib/exportPdf'
import { useDocumentStore } from '@/store/documentStore'
import { useAnnotationStore } from '@/store/annotationStore'
import { useComparisonStore } from '@/store/comparisonStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import { ThumbnailPanel } from '@/components/sidebar/ThumbnailPanel'
import { DocumentViewer } from '@/components/viewer/DocumentViewer'
import { AnnotationToolbar } from '@/components/toolbar/AnnotationToolbar'
import { FileDropzone } from '@/components/dropzone/FileDropzone'
import { GlobalDropZone } from '@/components/dropzone/GlobalDropZone'
import { v4 as uuidv4 } from 'uuid'
import type { DocumentFile } from '@/types/document'

export function InspectionPage() {
  useKeyboard()

  const {
    file, currentPage, zoom, rotation,
    setFile, setCurrentPage, setZoom, setRotation, updatePageThumbnail,
  } = useDocumentStore()
  const { annotations } = useAnnotationStore()
  const { setOldFile } = useComparisonStore()

  const pdfProxyRef = useRef<PDFDocumentProxy | null>(null)
  const tifFramesRef = useRef<TifFrame[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleFile = async (f: File) => {
    const validation = validateFile(f)
    if (!validation.valid) { setError(validation.error ?? 'エラー'); return }

    setLoading(true)
    setError(null)
    try {
      const buffer = await f.arrayBuffer()

      // マジックバイト検証（拡張子偽装の検出）
      const magicResult = await validateMagicBytes(buffer, validation.fileType!)
      if (!magicResult.valid) {
        setError(magicResult.error ?? 'ファイルの読み込みに失敗しました')
        return
      }

      const fileId = uuidv4()
      let docFile: DocumentFile

      if (validation.fileType === 'pdf') {
        const pdf = await loadPdf(buffer)
        pdfProxyRef.current = pdf
        tifFramesRef.current = null
        const pages = await Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) => getPdfPageInfo(pdf, i)),
        )
        docFile = { id: fileId, name: f.name, type: 'pdf', arrayBuffer: buffer, pages, totalPages: pdf.numPages }
        setFile(docFile)
        // Race condition 修正: サムネイル生成を順次実行（UI ブロックを避けつつ確実に反映）
        Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) =>
            generatePdfThumbnail(pdf, i).then((dataUrl) => updatePageThumbnail(i, dataUrl)),
          ),
        ).catch(() => {}) // サムネイル失敗はファイル表示には影響しないため握り潰す
      } else {
        const frames = decodeTif(buffer)
        tifFramesRef.current = frames
        pdfProxyRef.current = null
        const pages = frames.map((fr) => ({ index: fr.index, widthPt: fr.widthPt, heightPt: fr.heightPt }))
        docFile = { id: fileId, name: f.name, type: 'tif', arrayBuffer: buffer, pages, totalPages: frames.length }
        setFile(docFile)
        Promise.all(
          Array.from({ length: frames.length }, (_, i) =>
            generateTifThumbnail(buffer, frames, i).then((dataUrl) => updatePageThumbnail(i, dataUrl)),
          ),
        ).catch(() => {})
      }
    } catch {
      setError('ファイルの読み込みに失敗しました。ファイルが壊れているか、対応していない形式の可能性があります。')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!file) return
    setExporting(true)
    setExportError(null)
    try {
      const bytes = await exportAnnotatedPdf(file, annotations, pdfProxyRef.current, tifFramesRef.current)
      const outName = file.name.replace(/\.(pdf|tif|tiff)$/i, '') + '_検図済.pdf'
      triggerDownload(bytes, outName)
    } catch {
      setExportError('PDF の出力に失敗しました。もう一度お試しください。')
    } finally {
      setExporting(false)
    }
  }

  const handleSendToComparison = () => {
    if (file) setOldFile(file)
    setSendSuccess(true)
    setTimeout(() => setSendSuccess(false), 3000)
  }

  /* ── Empty state ── */
  if (!file) {
    return (
      <>
        <GlobalDropZone onFile={handleFile} label="図面ファイルをドロップ" />
        <div className="flex flex-1 flex-col items-center justify-center gap-10 bg-slate-50 px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">検図モード</h2>
            <p className="mt-3 text-sm text-slate-400">
              PDF または TIF ファイルを読み込んで検図・注釈を開始します
            </p>
          </div>
          <FileDropzone onFile={handleFile} className="w-full max-w-sm" />
          {loading && (
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-5 py-3 text-sm font-medium text-indigo-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              読み込み中…
            </div>
          )}
          {error && (
            <p className="rounded-xl bg-red-50 px-5 py-3 text-sm font-medium text-red-500">{error}</p>
          )}
        </div>
      </>
    )
  }

  const annotationKey = `${file.id}:${currentPage}`

  return (
    <div className="flex h-full flex-col">

      {/* ── File info bar ── */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5">
        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
        <span
          className="truncate text-sm font-semibold text-slate-700 max-w-[300px]"
          title={file.name}
        >
          {file.name}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => { pdfProxyRef.current = null; tifFramesRef.current = null; setFile(null) }}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          変更
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <button
          onClick={handleSendToComparison}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-indigo-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
        >
          比較モードへ送る
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Inline notifications ── */}
      {exportError && (
        <div className="shrink-0 border-b border-red-100 bg-red-50 px-5 py-2 text-sm font-medium text-red-600">
          {exportError}
        </div>
      )}
      {sendSuccess && (
        <div className="shrink-0 border-b border-green-100 bg-green-50 px-5 py-2 text-sm font-medium text-green-700">
          比較モードの旧版にセットしました。比較モードタブに切り替えてください。
        </div>
      )}

      {/* ── Body: [vertical toolbar] [thumbnails] [viewer] ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Dark vertical annotation toolbar */}
        <AnnotationToolbar
          annotationKey={annotationKey}
          onExport={handleExport}
          exportLoading={exporting}
          direction="vertical"
        />

        {/* Thumbnail panel */}
        <div className="w-[148px] shrink-0">
          <ThumbnailPanel
            pages={file.pages}
            currentPage={currentPage}
            onPageSelect={setCurrentPage}
          />
        </div>

        {/* Document viewer */}
        <div className="flex-1 overflow-hidden">
          <DocumentViewer
            file={file}
            currentPage={currentPage}
            zoom={zoom}
            rotation={rotation}
            pdfProxy={pdfProxyRef.current}
            tifFrames={tifFramesRef.current}
            annotationsEnabled={true}
            onPageChange={setCurrentPage}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>
      </div>
    </div>
  )
}
