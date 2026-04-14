import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, RotateCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ViewerControlsProps {
  currentPage: number
  totalPages: number
  zoom: number
  showRotation: boolean
  onPrevPage: () => void
  onNextPage: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onRotate: () => void
}

function CtrlBtn({
  onClick, disabled = false, title, children,
}: {
  onClick: () => void
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
            'flex h-9 w-9 items-center justify-center rounded-xl transition-all',
            'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
            'disabled:pointer-events-none disabled:opacity-30',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{title}</TooltipContent>
    </Tooltip>
  )
}

export function ViewerControls({
  currentPage, totalPages, zoom, showRotation,
  onPrevPage, onNextPage, onZoomIn, onZoomOut, onFitWidth, onRotate,
}: ViewerControlsProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
      <CtrlBtn onClick={onPrevPage} disabled={currentPage === 0} title="前のページ">
        <ChevronLeft className="h-4 w-4" />
      </CtrlBtn>

      <span className="min-w-[72px] text-center text-sm font-semibold text-slate-600">
        {currentPage + 1} / {totalPages}
      </span>

      <CtrlBtn onClick={onNextPage} disabled={currentPage >= totalPages - 1} title="次のページ">
        <ChevronRight className="h-4 w-4" />
      </CtrlBtn>

      <div className="mx-2 h-4 w-px bg-slate-200" />

      <CtrlBtn onClick={onZoomOut} title="縮小 (ホイールダウン)">
        <ZoomOut className="h-4 w-4" />
      </CtrlBtn>

      <span className="min-w-[56px] text-center text-sm font-semibold text-slate-600">
        {Math.round(zoom * 100)}%
      </span>

      <CtrlBtn onClick={onZoomIn} title="拡大 (ホイールアップ)">
        <ZoomIn className="h-4 w-4" />
      </CtrlBtn>

      <CtrlBtn onClick={onFitWidth} title="全体表示">
        <Maximize2 className="h-4 w-4" />
      </CtrlBtn>

      {showRotation && (
        <>
          <div className="mx-2 h-4 w-px bg-slate-200" />
          <CtrlBtn onClick={onRotate} title="右に90°回転">
            <RotateCw className="h-4 w-4" />
          </CtrlBtn>
        </>
      )}
    </div>
  )
}
