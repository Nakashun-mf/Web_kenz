import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DocumentFile, PageInfo } from '@/types/document'

interface DocumentState {
  file: DocumentFile | null
  currentPage: number
  zoom: number
  rotation: number // 0,90,180,270 TIF only
  // Actions
  setFile: (file: DocumentFile | null) => void
  setCurrentPage: (page: number) => void
  setZoom: (zoom: number) => void
  setRotation: (rotation: number) => void
  updatePageThumbnail: (pageIndex: number, dataUrl: string) => void
}

export const useDocumentStore = create<DocumentState>()(
  immer((set) => ({
    file: null,
    currentPage: 0,
    zoom: 1,
    rotation: 0,

    setFile: (file) => set((state) => {
      state.file = file
      state.currentPage = 0
      state.zoom = 1
      state.rotation = 0
    }),

    setCurrentPage: (page) => set((state) => {
      state.currentPage = page
    }),

    setZoom: (zoom) => set((state) => {
      state.zoom = Math.min(Math.max(zoom, 0.1), 8)
    }),

    setRotation: (rotation) => set((state) => {
      state.rotation = ((rotation % 360) + 360) % 360
    }),

    updatePageThumbnail: (pageIndex, dataUrl) => set((state) => {
      if (state.file) {
        const page: PageInfo | undefined = state.file.pages[pageIndex]
        if (page) page.thumbnailDataUrl = dataUrl
      }
    }),
  })),
)
