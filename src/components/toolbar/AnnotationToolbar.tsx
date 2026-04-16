import { useState } from 'react'
import {
  MousePointer, Pencil, Minus, Square, Circle, Type,
  Undo2, Redo2, Trash2, Download,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAnnotationStore } from '@/store/annotationStore'
import { cn } from '@/lib/utils'
import type { AnnotationTool, AnnotationBgColor, AnnotationProps, Annotation } from '@/types/annotation'

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
  { value: 'transparent', label: '透明', cls: 'bg-white border-dashed border border-[#DEE3E9]' },
  { value: 'white',       label: '白',   cls: 'bg-white border border-[#DEE3E9]' },
  { value: 'yellow',      label: '黄',   cls: 'bg-yellow-200 border border-yellow-400' },
]

type ToolbarCoreProps = {
  activeTool: AnnotationTool
  setActiveTool: (t: AnnotationTool) => void
  activeProps: AnnotationProps
  setActiveProps: (p: Partial<AnnotationProps>) => void
  undo: () => void
  redo: () => void
  pageAnnotations: Annotation[]
  handleClear: () => void
  onExport?: () => void
  exportLoading?: boolean
}

/* ── Vertical toolbar icon button (Meta Near Black bg) ─────────── */
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
            'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
            disabled && 'pointer-events-none opacity-25',
          )}
          style={{
            background: active ? '#0064E0' : 'transparent',
            color: active ? '#ffffff' : danger ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)',
          }}
          onMouseEnter={e => {
            if (!active && !disabled) {
              const el = e.currentTarget as HTMLElement
              el.style.background = danger ? 'rgba(200,10,40,0.2)' : 'rgba(255,255,255,0.1)'
              el.style.color = danger ? '#ff6b7a' : 'rgba(255,255,255,0.9)'
            }
          }}
          onMouseLeave={e => {
            if (!active) {
              const el = e.currentTarget as HTMLElement
              el.style.background = 'transparent'
              el.style.color = danger ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.5)'
            }
          }}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{title}</TooltipContent>
    </Tooltip>
  )
}

/* ── Vertical toolbar (inspection mode) ─────────────────────────── */
function VerticalToolbar({
  activeTool, setActiveTool, activeProps, setActiveProps,
  undo, redo, pageAnnotations, handleClear, onExport, exportLoading,
}: ToolbarCoreProps) {
  return (
    <div
      className="relative flex h-full w-[68px] shrink-0 flex-col items-center py-5"
      style={{ background: '#1C1E21', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >

      {/* Drawing tools */}
      <div className="flex flex-col items-center gap-1.5">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <DarkIconBtn
            key={id}
            onClick={() => setActiveTool(id)}
            active={activeTool === id}
            title={label}
          >
            <Icon className="h-[18px] w-[18px]" />
          </DarkIconBtn>
        ))}
      </div>

      {/* Divider */}
      <div className="my-4 h-px w-8 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {/* History */}
      <div className="flex flex-col items-center gap-1.5">
        <DarkIconBtn onClick={undo} title="元に戻す (Ctrl+Z)">
          <Undo2 className="h-[18px] w-[18px]" />
        </DarkIconBtn>
        <DarkIconBtn onClick={redo} title="やり直し (Ctrl+Y)">
          <Redo2 className="h-[18px] w-[18px]" />
        </DarkIconBtn>
      </div>

      {/* Divider */}
      <div className="my-4 h-px w-8 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {/* Clear */}
      <DarkIconBtn
        onClick={handleClear}
        disabled={pageAnnotations.length === 0}
        danger
        title="全消去"
      >
        <Trash2 className="h-[18px] w-[18px]" />
      </DarkIconBtn>

      <div className="flex-1" />

      {/* Export */}
      {onExport && (
        <div className="pb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onExport}
                disabled={exportLoading}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all disabled:opacity-50"
                style={{ background: '#0064E0' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0143B5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0064E0' }}
              >
                <Download className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{exportLoading ? '出力中…' : 'PDF 出力'}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Text props — floating panel */}
      {activeTool === 'text' && (
        <div
          className="absolute left-full top-4 z-50 ml-3 w-60 rounded-2xl p-5"
          style={{
            background: '#ffffff',
            border: '1px solid #DEE3E9',
            boxShadow: '0 12px 28px 0 rgba(0,0,0,0.2), 0 2px 4px 0 rgba(0,0,0,0.1)',
          }}
        >
          <p
            className="mb-4 text-[11px] uppercase tracking-widest"
            style={{ fontWeight: 600, color: '#5D6C7B' }}
          >
            テキスト設定
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#5D6C7B' }}>フォントサイズ</span>
              <input
                type="number"
                value={activeProps.fontSize}
                min={8}
                max={72}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isFinite(v) || v < 8 || v > 72) return
                  setActiveProps({ fontSize: v })
                }}
                className="w-16 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none"
                style={{
                  border: '1px solid #DEE3E9',
                  color: '#1C2B33',
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#5D6C7B' }}>枠線</span>
              <button
                onClick={() => setActiveProps({ showBorder: !activeProps.showBorder })}
                className="rounded-full px-5 py-2 text-sm transition-colors"
                style={{
                  fontWeight: 600,
                  background: activeProps.showBorder ? '#E8F3FF' : '#F1F4F7',
                  color: activeProps.showBorder ? '#0064E0' : '#5D6C7B',
                }}
              >
                {activeProps.showBorder ? 'あり' : 'なし'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: '#5D6C7B' }}>背景色</span>
              <div className="flex gap-2.5">
                {BG_COLORS.map(({ value, label, cls }) => (
                  <Tooltip key={value}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveProps({ bgColor: value })}
                        className={cn('h-7 w-7 rounded-full transition-all', cls)}
                        style={activeProps.bgColor === value ? { outline: '2px solid #0064E0', outlineOffset: '2px' } : {}}
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

/* ── Horizontal toolbar (comparison mode) ───────────────────────── */
function HorizontalToolbar({
  activeTool, setActiveTool, activeProps, setActiveProps,
  undo, redo, pageAnnotations, handleClear, onExport, exportLoading,
}: ToolbarCoreProps) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-3"
      style={{ background: '#ffffff', borderBottom: '1px solid #DEE3E9' }}
    >
      {/* Drawing tools */}
      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{ background: 'rgba(28,43,51,0.07)' }}
      >
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setActiveTool(id)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all"
                style={{
                  background: activeTool === id ? '#0064E0' : 'transparent',
                  color: activeTool === id ? '#ffffff' : '#5D6C7B',
                }}
                onMouseEnter={e => {
                  if (activeTool !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)'
                    ;(e.currentTarget as HTMLElement).style.color = '#1C2B33'
                  }
                }}
                onMouseLeave={e => {
                  if (activeTool !== id) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = '#5D6C7B'
                  }
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Text props inline */}
      {activeTool === 'text' && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-2"
          style={{ border: '1px solid #DEE3E9', background: '#F7F8FA' }}
        >
          <span className="text-sm" style={{ color: '#5D6C7B' }}>サイズ</span>
          <input
            type="number"
            value={activeProps.fontSize}
            min={8} max={72}
            onChange={(e) => setActiveProps({ fontSize: Number(e.target.value) })}
            className="w-16 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            style={{ border: '1px solid #DEE3E9', background: '#ffffff', color: '#1C2B33' }}
          />
          <div className="h-4 w-px" style={{ background: '#DEE3E9' }} />
          <button
            onClick={() => setActiveProps({ showBorder: !activeProps.showBorder })}
            className="rounded-full px-5 py-2 text-sm transition-colors"
            style={{
              fontWeight: 600,
              background: activeProps.showBorder ? '#E8F3FF' : '#F1F4F7',
              color: activeProps.showBorder ? '#0064E0' : '#5D6C7B',
            }}
          >
            {activeProps.showBorder ? '枠あり' : '枠なし'}
          </button>
          <div className="h-4 w-px" style={{ background: '#DEE3E9' }} />
          <div className="flex gap-2">
            {BG_COLORS.map(({ value, label, cls }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveProps({ bgColor: value })}
                    className={cn('h-6 w-6 rounded-full', cls)}
                    style={activeProps.bgColor === value ? { outline: '2px solid #0064E0', outlineOffset: '1px' } : {}}
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
      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{ background: 'rgba(28,43,51,0.07)' }}
      >
        {[
          { fn: undo, icon: Undo2, tip: '元に戻す (Ctrl+Z)', danger: false },
          { fn: redo, icon: Redo2, tip: 'やり直し (Ctrl+Y)', danger: false },
          { fn: handleClear, icon: Trash2, tip: '全消去', danger: true, disabled: pageAnnotations.length === 0 },
        ].map(({ fn, icon: Icon, tip, danger, disabled }, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <button
                onClick={fn}
                disabled={disabled}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all disabled:pointer-events-none disabled:opacity-30"
                style={{ color: '#5D6C7B' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = danger ? 'rgba(200,10,40,0.08)' : 'rgba(255,255,255,0.8)'
                  el.style.color = danger ? '#C80A28' : '#1C2B33'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.background = 'transparent'
                  el.style.color = '#5D6C7B'
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{tip}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Export */}
      {onExport && (
        <button
          onClick={onExport}
          disabled={exportLoading}
          className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm text-white transition-all disabled:opacity-60"
          style={{ fontWeight: 500, background: '#0064E0', boxShadow: '0 2px 8px rgba(0,100,224,0.3)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0143B5' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0064E0' }}
        >
          <Download className="h-4 w-4" />
          {exportLoading ? '出力中…' : 'PDF 出力'}
        </button>
      )}
    </div>
  )
}

/* ── Public component ──────────────────────────────────────────── */
export function AnnotationToolbar({ annotationKey, onExport, exportLoading, direction = 'vertical' }: AnnotationToolbarProps) {
  const {
    activeTool, setActiveTool,
    activeProps, setActiveProps,
    undo, redo, clearAnnotations,
    annotations,
  } = useAnnotationStore()

  const [showClearDialog, setShowClearDialog] = useState(false)

  const pageAnnotations: Annotation[] = annotations[annotationKey] ?? []

  const handleClear = () => {
    if (pageAnnotations.length === 0) return
    setShowClearDialog(true)
  }

  const confirmClear = () => {
    clearAnnotations(annotationKey)
    setShowClearDialog(false)
  }

  const shared: ToolbarCoreProps = {
    activeTool, setActiveTool,
    activeProps, setActiveProps,
    undo, redo,
    pageAnnotations,
    handleClear,
    onExport,
    exportLoading,
  }

  return (
    <>
      {direction === 'vertical'
        ? <VerticalToolbar {...shared} />
        : <HorizontalToolbar {...shared} />
      }

      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>注釈を削除</DialogTitle>
            <DialogDescription>
              このページの注釈をすべて削除しますか？この操作は元に戻せません。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmClear}>
              削除する
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
