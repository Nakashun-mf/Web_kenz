import { useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TifFrame } from '@/lib/tifLoader'
import { loadPdf, getPdfPageInfo, generatePdfThumbnail } from '@/lib/pdfLoader'
import { decodeTif } from '@/lib/tifLoader'
import { validateFile, validateComparisonFiles, validateMagicBytes } from '@/lib/fileValidator'
import { exportAnnotatedPdf, triggerDownload } from '@/lib/exportPdf'
import { useComparisonStore } from '@/store/comparisonStore'
import { useAnnotationStore } from '@/store/annotationStore'
import { DocumentViewer } from '@/components/viewer/DocumentViewer'
import { AnnotationToolbar } from '@/components/toolbar/AnnotationToolbar'
import { FileDropzone } from '@/components/dropzone/FileDropzone'
import { GlobalDropZone } from '@/components/dropzone/GlobalDropZone'
import { Slider } from '@/components/ui/slider'
import { Layers, Columns2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import type { DocumentFile } from '@/types/document'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

type FileHandle = {
  pdfProxy: PDFDocumentProxy | null
  tifFrames: TifFrame[] | null
}

async function loadDocumentFile(f: File): Promise<{ doc: DocumentFile; pdfProxy: PDFDocumentProxy | null; tifFrames: TifFrame[] | null }> {
  const validation = validateFile(f)
  if (!validation.valid) throw new Error('ファイルの形式またはサイズが正しくありません。')

  const buffer = await f.arrayBuffer()

  // マジックバイト検証（拡張子偽装の検出）
  const magicResult = await validateMagicBytes(buffer, validation.fileType!)
  if (!magicResult.valid) throw new Error('ファイルの読み込みに失敗しました。')

  const fileId = uuidv4()

  if (validation.fileType === 'pdf') {
    const pdf = await loadPdf(buffer)
    const pages = await Promise.all(Array.from({ length: pdf.numPages }, (_, i) => getPdfPageInfo(pdf, i)))
    const doc: DocumentFile = { id: fileId, name: f.name, type: 'pdf', arrayBuffer: buffer, pages, totalPages: pdf.numPages }
    // Race condition 修正: void で明示的に非同期実行（結果は updatePageThumbnail で反映）
    // ComparisonPage では updatePageThumbnail が呼べないため、ここでは生成のみ（将来拡張用）
    void Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) => generatePdfThumbnail(pdf, i)),
    ).catch(() => {})
    return { doc, pdfProxy: pdf, tifFrames: null }
  } else {
    const frames = decodeTif(buffer)
    const pages = frames.map((fr) => ({ index: fr.index, widthPt: fr.widthPt, heightPt: fr.heightPt }))
    const doc: DocumentFile = { id: fileId, name: f.name, type: 'tif', arrayBuffer: buffer, pages, totalPages: frames.length }
    return { doc, pdfProxy: null, tifFrames: frames }
  }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-3 text-sm font-medium text-indigo-600">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      読み込み中...
    </div>
  )
}

export function ComparisonPage() {
  const {
    oldFile, newFile, layout, overlayOpacity, activePanel,
    oldPage, newPage, oldZoom, newZoom,
    setOldFile, setNewFile, setLayout, setOverlayOpacity, setActivePanel,
    setOldPage, setOldZoom, setNewZoom,
  } = useComparisonStore()

  const { annotations } = useAnnotationStore()

  const oldHandleRef = useRef<FileHandle>({ pdfProxy: null, tifFrames: null })
  const newHandleRef = useRef<FileHandle>({ pdfProxy: null, tifFrames: null })

  const [error, setError] = useState<string | null>(null)
  const [loadingOld, setLoadingOld] = useState(false)
  const [loadingNew, setLoadingNew] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleFile = async (side: 'old' | 'new', f: File) => {
    const setLoading = side === 'old' ? setLoadingOld : setLoadingNew
    const setFile = side === 'old' ? setOldFile : setNewFile
    const handleRef = side === 'old' ? oldHandleRef : newHandleRef
    const otherFile = side === 'old' ? newFile : oldFile

    setLoading(true)
    setError(null)
    try {
      // 前のPDFドキュメントを明示的に解放（メモリリーク防止）
      handleRef.current.pdfProxy?.destroy()
      const { doc, pdfProxy, tifFrames } = await loadDocumentFile(f)
      handleRef.current = { pdfProxy, tifFrames }
      setFile(doc)
      if (otherFile) {
        const [aPagesCount, bPagesCount, aPages, bPages] = side === 'old'
          ? [doc.totalPages, otherFile.totalPages, doc.pages, otherFile.pages]
          : [otherFile.totalPages, doc.totalPages, otherFile.pages, doc.pages]
        const result = validateComparisonFiles(aPagesCount, bPagesCount, aPages, bPages)
        if (!result.valid) setError(result.error ?? 'エラー')
      }
    } catch (err) {
      logger.error('比較ファイル読み込み失敗', err, { side, fileName: f.name })
      setError('ファイルの読み込みに失敗しました。ファイルが壊れているか、対応していない形式の可能性があります。')
    } finally {
      setLoading(false)
    }
  }

  const handleOldFile = (f: File) => handleFile('old', f)
  const handleNewFile = (f: File) => handleFile('new', f)

  const handleExport = async (side: 'old' | 'new') => {
    const file = side === 'old' ? oldFile : newFile
    const handle = side === 'old' ? oldHandleRef.current : newHandleRef.current
    if (!file) return
    setExporting(true)
    try {
      const bytes = await exportAnnotatedPdf(file, annotations, handle.pdfProxy, handle.tifFrames)
      const outName = file.name.replace(/\.(pdf|tif|tiff)$/i, '') + '_検図済.pdf'
      triggerDownload(bytes, outName)
    } catch (err) {
      logger.error('比較PDFエクスポート失敗', err, { side, fileName: file.name })
      setError('PDF の出力に失敗しました。もう一度お試しください。')
    } finally {
      setExporting(false)
    }
  }

  const rotation = 0

  const oldAnnotationKey = oldFile ? `${oldFile.id}:${oldPage}` : ''
  const newAnnotationKey = newFile ? `${newFile.id}:${newPage}` : ''
  const activeKey = activePanel === 'old' ? oldAnnotationKey : newAnnotationKey

  const bothLoaded = oldFile && newFile

  return (
    <div className="flex h-full flex-col">
      <GlobalDropZone
        onFile={activePanel === 'old' ? handleOldFile : handleNewFile}
        label={`${activePanel === 'old' ? '旧版' : '新版'}にドロップ`}
      />

      {/* ── Comparison toolbar ── */}
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">

        {/* Layout toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1.5">
          {[
            { value: 'sideBySide' as const, icon: Columns2, label: '並列' },
            { value: 'overlay'    as const, icon: Layers,   label: '重ね' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setLayout(value)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                layout === value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overlay opacity */}
        {layout === 'overlay' && (
          <>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">透過率</span>
              <div className="w-32">
                <Slider
                  value={[overlayOpacity * 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setOverlayOpacity(v / 100)}
                />
              </div>
              <span className="w-10 text-sm font-semibold text-slate-600">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          </>
        )}

        {/* Active panel selector */}
        {bothLoaded && (
          <>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">注釈対象</span>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1.5">
                {[
                  { value: 'old' as const, label: '旧版' },
                  { value: 'new' as const, label: '新版' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setActivePanel(value)}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                      activePanel === value
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-600',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-1" />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-500 max-w-xs truncate" title={error}>{error}</p>
        )}
      </div>

      {/* Annotation toolbar (shown when both loaded) */}
      {bothLoaded && (
        <AnnotationToolbar
          annotationKey={activeKey}
          onExport={() => handleExport(activePanel)}
          exportLoading={exporting}
          direction="horizontal"
        />
      )}

      {/* Main comparison area */}
      <div className="flex flex-1 overflow-hidden">
        {layout === 'sideBySide' ? (
          <SideBySideLayout
            oldFile={oldFile}
            newFile={newFile}
            oldHandle={oldHandleRef.current}
            newHandle={newHandleRef.current}
            page={oldPage}
            oldZoom={oldZoom}
            newZoom={newZoom}
            rotation={rotation}
            activePanel={activePanel}
            onPageChange={setOldPage}
            onOldZoomChange={setOldZoom}
            onNewZoomChange={setNewZoom}
            onOldFile={handleOldFile}
            onNewFile={handleNewFile}
            loadingOld={loadingOld}
            loadingNew={loadingNew}
          />
        ) : (
          <OverlayLayout
            oldFile={oldFile}
            newFile={newFile}
            oldHandle={oldHandleRef.current}
            newHandle={newHandleRef.current}
            page={oldPage}
            zoom={oldZoom}
            rotation={rotation}
            overlayOpacity={overlayOpacity}
            activePanel={activePanel}
            onPageChange={setOldPage}
            onZoomChange={setOldZoom}
            onOldFile={handleOldFile}
            onNewFile={handleNewFile}
            loadingOld={loadingOld}
            loadingNew={loadingNew}
          />
        )}
      </div>
    </div>
  )
}

interface SideBySideProps {
  oldFile: DocumentFile | null
  newFile: DocumentFile | null
  oldHandle: FileHandle
  newHandle: FileHandle
  page: number
  oldZoom: number
  newZoom: number
  rotation: number
  activePanel: 'old' | 'new'
  onPageChange: (p: number) => void
  onOldZoomChange: (z: number) => void
  onNewZoomChange: (z: number) => void
  onOldFile: (f: File) => void
  onNewFile: (f: File) => void
  loadingOld: boolean
  loadingNew: boolean
}

function PanelHeader({ label, filename, accent }: { label: string; filename?: string; accent?: boolean }) {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-slate-100 bg-white px-6">
      <span className={cn(
        'shrink-0 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
        accent
          ? 'bg-indigo-100 text-indigo-600'
          : 'bg-slate-100 text-slate-500',
      )}>
        {label}
      </span>
      {filename && (
        <span className="truncate text-sm text-slate-400">{filename}</span>
      )}
    </div>
  )
}

function SideBySideLayout({
  oldFile, newFile, oldHandle, newHandle, page, oldZoom, newZoom, rotation, activePanel,
  onPageChange, onOldZoomChange, onNewZoomChange, onOldFile, onNewFile, loadingOld, loadingNew,
}: SideBySideProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col border-r border-slate-200">
        <PanelHeader label="旧版" filename={oldFile?.name} />
        {oldFile ? (
          <DocumentViewer
            file={oldFile}
            currentPage={page}
            zoom={oldZoom}
            rotation={rotation}
            pdfProxy={oldHandle.pdfProxy}
            tifFrames={oldHandle.tifFrames}
            annotationsEnabled={activePanel === 'old'}
            onPageChange={onPageChange}
            onZoomChange={onOldZoomChange}
            onRotationChange={() => {}}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50">
            {loadingOld ? <LoadingSpinner /> : <FileDropzone onFile={onOldFile} label="旧版を読み込む" compact />}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <PanelHeader label="新版" filename={newFile?.name} accent />
        {newFile ? (
          <DocumentViewer
            file={newFile}
            currentPage={page}
            zoom={newZoom}
            rotation={rotation}
            pdfProxy={newHandle.pdfProxy}
            tifFrames={newHandle.tifFrames}
            annotationsEnabled={activePanel === 'new'}
            onPageChange={onPageChange}
            onZoomChange={onNewZoomChange}
            onRotationChange={() => {}}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50">
            {loadingNew ? <LoadingSpinner /> : <FileDropzone onFile={onNewFile} label="新版を読み込む" compact />}
          </div>
        )}
      </div>
    </div>
  )
}

interface OverlayProps {
  oldFile: DocumentFile | null
  newFile: DocumentFile | null
  oldHandle: FileHandle
  newHandle: FileHandle
  page: number
  zoom: number
  rotation: number
  overlayOpacity: number
  activePanel: 'old' | 'new'
  onPageChange: (p: number) => void
  onZoomChange: (z: number) => void
  onOldFile: (f: File) => void
  onNewFile: (f: File) => void
  loadingOld: boolean
  loadingNew: boolean
}

function OverlayLayout({
  oldFile, newFile, oldHandle, newHandle, page, zoom, rotation, overlayOpacity, activePanel,
  onPageChange, onZoomChange, onOldFile, onNewFile, loadingOld, loadingNew,
}: OverlayProps) {
  if (!oldFile && !newFile) {
    return (
      <div className="flex flex-1 gap-10 items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-500">旧版</span>
          {loadingOld ? <LoadingSpinner /> : <FileDropzone onFile={onOldFile} label="旧版を読み込む" compact />}
        </div>
        <div className="h-20 w-px bg-slate-200" />
        <div className="flex flex-col items-center gap-4">
          <span className="rounded-md bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-600">新版</span>
          {loadingNew ? <LoadingSpinner /> : <FileDropzone onFile={onNewFile} label="新版を読み込む" compact />}
        </div>
      </div>
    )
  }

  const baseFile = oldFile ?? newFile!
  const baseHandle = oldFile ? oldHandle : newHandle

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0">
        <DocumentViewer
          file={baseFile}
          currentPage={page}
          zoom={zoom}
          rotation={rotation}
          pdfProxy={baseHandle.pdfProxy}
          tifFrames={baseHandle.tifFrames}
          annotationsEnabled={activePanel === 'old' && !!oldFile}
          onPageChange={onPageChange}
          onZoomChange={onZoomChange}
          onRotationChange={() => {}}
        />
      </div>

      {newFile && oldFile && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: overlayOpacity }}
        >
          <DocumentViewer
            file={newFile}
            currentPage={page}
            zoom={zoom}
            rotation={rotation}
            pdfProxy={newHandle.pdfProxy}
            tifFrames={newHandle.tifFrames}
            annotationsEnabled={false}
            onPageChange={() => {}}
            onZoomChange={() => {}}
            onRotationChange={() => {}}
          />
        </div>
      )}

      {(!oldFile || !newFile) && (
        <div className="absolute bottom-6 right-6 flex gap-3">
          {!oldFile && (
            loadingOld
              ? <span className="rounded-xl bg-white/95 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm">読込中...</span>
              : <FileDropzone onFile={onOldFile} label="旧版" compact className="!w-auto" />
          )}
          {!newFile && (
            loadingNew
              ? <span className="rounded-xl bg-white/95 px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm">読込中...</span>
              : <FileDropzone onFile={onNewFile} label="新版" compact className="!w-auto" />
          )}
        </div>
      )}
    </div>
  )
}
