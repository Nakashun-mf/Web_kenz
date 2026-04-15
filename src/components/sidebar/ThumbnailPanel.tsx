import { useRef, useEffect } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import { cn } from '@/lib/utils'
import type { PageInfo } from '@/types/document'

interface ThumbnailPanelProps {
  pages: PageInfo[]
  currentPage: number
  onPageSelect: (index: number) => void
}

const ITEM_HEIGHT = 148 // px per thumbnail row

interface ItemData {
  pages: PageInfo[]
  currentPage: number
  onPageSelect: (index: number) => void
}

function ThumbnailItem({ index, style, data }: ListChildComponentProps<ItemData>) {
  const { pages, currentPage, onPageSelect } = data
  const page = pages[index]
  const isActive = index === currentPage

  return (
    <div style={style} className="px-4 py-1.5">
      <button
        onClick={() => onPageSelect(index)}
        className={cn(
          'group w-full rounded-xl p-2.5 text-left transition-all',
          isActive
            ? 'bg-white shadow-sm ring-2 ring-indigo-500/70'
            : 'hover:bg-white hover:shadow-sm ring-2 ring-transparent hover:ring-slate-200/80',
        )}
      >
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
        <p className={cn(
          'mt-2 text-center text-[11px] font-semibold',
          isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500',
        )}>
          {index + 1}
        </p>
      </button>
    </div>
  )
}

export function ThumbnailPanel({ pages, currentPage, onPageSelect }: ThumbnailPanelProps) {
  const listRef = useRef<FixedSizeList>(null)

  // アクティブなサムネイルを表示領域内にスクロール
  useEffect(() => {
    listRef.current?.scrollToItem(currentPage, 'smart')
  }, [currentPage])

  const itemData: ItemData = { pages, currentPage, onPageSelect }

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-zinc-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">ページ</p>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
          {pages.length}
        </span>
      </div>

      {/* Virtualized thumbnail list — 1000ページでも DOM 要素は画面内の数個のみ */}
      <div className="flex-1 overflow-hidden">
        <AutoSizer renderProp={({ height, width }) => (
          <FixedSizeList
            ref={listRef}
            height={height ?? 0}
            width={width ?? 0}
            itemCount={pages.length}
            itemSize={ITEM_HEIGHT}
            itemData={itemData}
            overscanCount={3}
          >
            {ThumbnailItem}
          </FixedSizeList>
        )} />
      </div>
    </div>
  )
}
