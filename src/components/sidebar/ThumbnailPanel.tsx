import { useRef, useEffect } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { AutoSizer } from 'react-virtualized-auto-sizer'
import type { PageInfo } from '@/types/document'

interface ThumbnailPanelProps {
  pages: PageInfo[]
  currentPage: number
  onPageSelect: (index: number) => void
}

const ITEM_HEIGHT = 148

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
    <div style={style} className="px-3 py-1.5">
      <button
        onClick={() => onPageSelect(index)}
        className="group w-full rounded-[20px] p-2.5 text-left transition-all"
        style={{
          background: isActive ? '#ffffff' : 'transparent',
          boxShadow: isActive ? '0 2px 4px 0 rgba(0,0,0,0.1)' : 'none',
          outline: isActive ? '2px solid #0064E0' : '2px solid transparent',
          outlineOffset: '-2px',
        }}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = '#ffffff'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px 0 rgba(0,0,0,0.08)'
            ;(e.currentTarget as HTMLElement).style.outline = '2px solid #DEE3E9'
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            ;(e.currentTarget as HTMLElement).style.outline = '2px solid transparent'
          }
        }}
      >
        <div
          className="relative mx-auto overflow-hidden rounded-lg bg-white"
          style={{
            aspectRatio: `${page.widthPt} / ${page.heightPt}`,
            maxWidth: 108,
            border: '1px solid #DEE3E9',
          }}
        >
          {page.thumbnailDataUrl ? (
            <img
              src={page.thumbnailDataUrl}
              alt={`ページ ${index + 1}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full min-h-[80px] items-center justify-center" style={{ background: '#F1F4F7' }}>
              <div
                className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: '#0064E0', borderTopColor: 'transparent' }}
              />
            </div>
          )}
        </div>
        <p
          className="mt-2 text-center text-[11px]"
          style={{
            fontWeight: 600,
            color: isActive ? '#0064E0' : '#5D6C7B',
          }}
        >
          {index + 1}
        </p>
      </button>
    </div>
  )
}

export function ThumbnailPanel({ pages, currentPage, onPageSelect }: ThumbnailPanelProps) {
  const listRef = useRef<FixedSizeList>(null)

  useEffect(() => {
    listRef.current?.scrollToItem(currentPage, 'smart')
  }, [currentPage])

  const itemData: ItemData = { pages, currentPage, onPageSelect }

  return (
    <div
      className="flex h-full flex-col"
      style={{ background: '#F7F8FA', borderRight: '1px solid #DEE3E9' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid #DEE3E9' }}
      >
        <p
          className="text-xs uppercase tracking-widest"
          style={{ fontWeight: 600, color: '#5D6C7B' }}
        >
          ページ
        </p>
        <span
          className="rounded-full px-3 py-1.5 text-xs"
          style={{ fontWeight: 700, background: '#DEE3E9', color: '#5D6C7B' }}
        >
          {pages.length}
        </span>
      </div>

      {/* Virtualized thumbnail list */}
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
