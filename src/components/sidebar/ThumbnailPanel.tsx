import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { PageInfo } from '@/types/document'

interface ThumbnailPanelProps {
  pages: PageInfo[]
  currentPage: number
  onPageSelect: (index: number) => void
}

export function ThumbnailPanel({ pages, currentPage, onPageSelect }: ThumbnailPanelProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentPage])

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-zinc-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Pages</p>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
          {pages.length}
        </span>
      </div>

      {/* Thumbnail list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {pages.map((page, index) => (
          <button
            key={index}
            ref={index === currentPage ? activeRef : undefined}
            onClick={() => onPageSelect(index)}
            className={cn(
              'group w-full rounded-xl p-2.5 text-left transition-all',
              index === currentPage
                ? 'bg-white shadow-sm ring-2 ring-indigo-500/70'
                : 'hover:bg-white hover:shadow-sm ring-2 ring-transparent hover:ring-slate-200/80',
            )}
          >
            {/* Thumbnail image */}
            <div
              className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-sm border border-slate-100"
              style={{ aspectRatio: `${page.widthPt} / ${page.heightPt}`, maxWidth: 108 }}
            >
              {page.thumbnailDataUrl ? (
                <img
                  src={page.thumbnailDataUrl}
                  alt={`ページ ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full min-h-[80px] items-center justify-center bg-slate-50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Page number */}
            <p className={cn(
              'mt-2 text-center text-[11px] font-semibold',
              index === currentPage ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500',
            )}>
              {index + 1}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
