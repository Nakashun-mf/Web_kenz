import {
  MousePointer, Pencil, Minus, Square, Circle, Type,
  Undo2, Redo2, Trash2, Download,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAnnotationStore } from '@/store/annotationStore'
import { cn } from '@/lib/utils'
import type { AnnotationTool, AnnotationBgColor } from '@/types/annotation'

interface AnnotationToolbarProps {
  annotationKey: string
  onExport?: () => void
  exportLoading?: boolean
  direction?: 'vertical' | 'horizontal'
}

const TOOLS: { id: AnnotationTool; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: 'select',   icon: MousePointer, label: '選択 (V)' },
  { id: 'freehand', icon: Pencil,       label: 'フリーハンド (P)' },
  { id: 'line',     icon: Minus,        label: '直線 (L)' },
  { id: 'rect',     icon: Square,       label: '矩形 (R)' },
  { id: 'circle',   icon: Circle,       label: '楕円 / 丸 (O)' },
  { id: 'text',     icon: Type,         label: 'テキスト (T)' },
]

const BG_COLORS: { value: AnnotationBgColor; label: string; cls: string }[] = [
  { value: 'transparent', label: '透明', cls: 'bg-white border-dashed border border-slate-300' },
  { value: 'white',       label: '白',   cls: 'bg-white border border-slate-300' },
  { value: 'yellow',      label: '黄',   cls: 'bg-yellow-200 border border-yellow-400' },
]

// ── Vertical toolbar icon button (dark bg) ──────────────────────
function DarkIconBtn({
  onClick, active = false, danger = false, disabled = false,
  title, children,
}: {
  onClick: () => void
  active?: boolean
  danger?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
            active  && 'bg-indigo-600 text-white shadow-sm',
            !active && !danger && 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
            !active && danger  && 'text-slate-500 hover:bg-red-500/15 hover:text-red-400',
            disabled && 'pointer-events-none opacity-25',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  )
}

// ── Vertical toolbar (inspection mode) ─────────────────────────
function VerticalToolbar({
  activeTool, setActiveTool, activeProps, setActiveProps,
  undo, redo, pageAnnotations, handleClear, onExport, exportLoading,
}: {
  activeTool: AnnotationTool
  setActiveTool: (t: AnnotationTool) => void
  activeProps: { fontSize: number; showBorder: boolean; bgColor: AnnotationBgColor }
  setActiveProps: (p: Partial<{ fontSize: number; showBorder: boolean; bgColor: AnnotationBgColor }>) => void
  undo: () => void
  redo: () => void
  pageAnnotations: unknown[]
  handleClear: () => void
  onExport?: () => void
  exportLoading?: boolean
}) {
  return (
    <div className="relative flex h-full w-[52px] shrink-0 flex-col items-center border-r border-slate-800 bg-slate-900 py-3 gap-1">

      {/* Drawing tools */}
      <div className="flex flex-col items-center gap-0.5">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <DarkIconBtn
            key={id}
            onClick={() => setActiveTool(id)}
            active={activeTool === id}
            title={label}
          >
            <Icon className="h-[17px] w-[17px]" />
          </DarkIconBtn>
        ))}
      </div>

      {/* Divider */}
      <div className="my-1 h-px w-7 shrink-0 bg-slate-800" />

      {/* History */}
      <div className="flex flex-col items-center gap-0.5">
        <DarkIconBtn onClick={undo} title="元に戻す (Ctrl+Z)">
          <Undo2 className="h-[17px] w-[17px]" />
        </DarkIconBtn>
        <DarkIconBtn onClick={redo} title="やり直し (Ctrl+Y)">
          <Redo2 className="h-[17px] w-[17px]" />
        </DarkIconBtn>
      </div>

      {/* Divider */}
      <div className="my-1 h-px w-7 shrink-0 bg-slate-800" />

      {/* Clear */}
      <DarkIconBtn
        onClick={handleClear}
        disabled={pageAnnotations.length === 0}
        danger
        title="全消去"
      >
        <Trash2 className="h-[17px] w-[17px]" />
      </DarkIconBtn>

      <div className="flex-1" />

      {/* Export */}
      {onExport && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onExport}
              disabled={exportLoading}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              <Download className="h-[17px] w-[17px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{exportLoading ? '出力中…' : 'PDF 出力'}</TooltipContent>
        </Tooltip>
      )}

      {/* Text props — floating panel */}
      {activeTool === 'text' && (
        <div className="absolute left-full top-3 z-50 ml-2 w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            テキスト設定
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">フォントサイズ</span>
              <input
                type="number"
                value={activeProps.fontSize}
                min={8}
                max={72}
                onChange={(e) => setActiveProps({ fontSize: Number(e.target.value) })}
                className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">枠線</span>
              <button
                onClick={() => setActiveProps({ showBorder: !activeProps.showBorder })}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
                  activeProps.showBorder ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {activeProps.showBorder ? 'あり' : 'なし'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">背景色</span>
              <div className="flex gap-2">
                {BG_COLORS.map(({ value, label, cls }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveProps({ bgColor: value })}
                        className={cn(
                          'h-6 w-6 rounded-full transition-all',
                          cls,
                          activeProps.bgColor === value && 'ring-2 ring-indigo-500 ring-offset-1',
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{label}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Horizontal toolbar (comparison mode) ───────────────────────
function HorizontalToolbar({
  activeTool, setActiveTool, activeProps, setActiveProps,
  undo, redo, pageAnnotations, handleClear, onExport, exportLoading,
}: {
  activeTool: AnnotationTool
  setActiveTool: (t: AnnotationTool) => void
  activeProps: { fontSize: number; showBorder: boolean; bgColor: AnnotationBgColor }
  setActiveProps: (p: Partial<{ fontSize: number; showBorder: boolean; bgColor: AnnotationBgColor }>) => void
  undo: () => void
  redo: () => void
  pageAnnotations: unknown[]
  handleClear: () => void
  onExport?: () => void
  exportLoading?: boolean
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      {/* Drawing tools */}
      <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTool(id)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                  activeTool === id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-white hover:text-slate-800',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Text props inline */}
      {activeTool === 'text' && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="text-xs text-slate-400">サイズ</span>
          <input
            type="number"
            value={activeProps.fontSize}
            min={8} max={72}
            onChange={(e) => setActiveProps({ fontSize: Number(e.target.value) })}
            className="w-12 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="h-3.5 w-px bg-slate-200" />
          <button
            onClick={() => setActiveProps({ showBorder: !activeProps.showBorder })}
            className={cn(
              'rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-colors',
              activeProps.showBorder ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500',
            )}
          >
            {activeProps.showBorder ? '枠あり' : '枠なし'}
          </button>
          <div className="h-3.5 w-px bg-slate-200" />
          <div className="flex gap-1.5">
            {BG_COLORS.map(({ value, label, cls }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveProps({ bgColor: value })}
                    className={cn('h-4.5 w-4.5 rounded-full', cls, activeProps.bgColor === value && 'ring-2 ring-indigo-500 ring-offset-1')}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* History */}
      <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={undo} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white hover:text-slate-800">
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">元に戻す (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={redo} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-white hover:text-slate-800">
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">やり直し (Ctrl+Y)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClear}
              disabled={pageAnnotations.length === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">全消去</TooltipContent>
        </Tooltip>
      </div>

      {/* Export */}
      {onExport && (
        <button
          onClick={onExport}
          disabled={exportLoading}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {exportLoading ? '出力中…' : 'PDF 出力'}
        </button>
      )}
    </div>
  )
}

// ── Public component ────────────────────────────────────────────
export function AnnotationToolbar({ annotationKey, onExport, exportLoading, direction = 'vertical' }: AnnotationToolbarProps) {
  const {
    activeTool, setActiveTool,
    activeProps, setActiveProps,
    undo, redo, clearAnnotations,
    annotations,
  } = useAnnotationStore()

  const pageAnnotations = annotations[annotationKey] ?? []

  const handleClear = () => {
    if (pageAnnotations.length === 0) return
    if (window.confirm('このページの注釈をすべて削除しますか？')) {
      clearAnnotations(annotationKey)
    }
  }

  const shared = {
    activeTool, setActiveTool,
    activeProps, setActiveProps,
    undo, redo,
    pageAnnotations,
    handleClear,
    onExport,
    exportLoading,
  }

  return direction === 'vertical'
    ? <VerticalToolbar {...shared} />
    : <HorizontalToolbar {...shared} />
}
