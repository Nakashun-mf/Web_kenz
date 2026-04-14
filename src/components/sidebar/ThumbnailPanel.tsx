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
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Pages&nbsp;
          <span className="font-bold text-slate-600">{pages.length}</span>
        </p>
      </div>

      {/* Thumbnail list */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {pages.map((page, index) => (
          <button
            key={index}
            ref={index === currentPage ? activeRef : undefined}
            onClick={() => onPageSelect(index)}
            className={cn(
              'group w-full rounded-2xl border-2 p-2.5 text-left transition-all',
              'hover:border-blue-400 hover:bg-blue-50/60 hover:shadow-sm',
              index === currentPage
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-transparent bg-slate-50',
            )}
          >
            {/* Thumbnail image */}
            <div
              className="relative mx-auto overflow-hidden rounded-xl bg-white shadow-sm"
              style={{ aspectRatio: `${page.widthPt} / ${page.heightPt}`, maxWidth: 108 }}
            >
              {page.thumbnailDataUrl ? (
                <img
                  src={page.thumbnailDataUrl}
                  alt={`ページ ${index + 1}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full min-h-[80px] items-center justify-center bg-slate-100">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                </div>
              )}
            </div>

            {/* Page number */}
            <p className={cn(
              'mt-2 text-center text-[11px] font-semibold',
              index === currentPage ? 'text-blue-700' : 'text-slate-400',
            )}>
              {index + 1}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
