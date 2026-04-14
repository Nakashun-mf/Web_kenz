import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { DocumentFile } from '@/types/document'
import type { ComparisonLayout, PanelSide } from '@/types/comparison'

interface ComparisonState {
  oldFile: DocumentFile | null
  newFile: DocumentFile | null
  layout: ComparisonLayout
  overlayOpacity: number
  activePanel: PanelSide
  oldPage: number
  newPage: number
  oldZoom: number
  newZoom: number

  setOldFile: (file: DocumentFile | null) => void
  setNewFile: (file: DocumentFile | null) => void
  setLayout: (layout: ComparisonLayout) => void
  setOverlayOpacity: (opacity: number) => void
  setActivePanel: (panel: PanelSide) => void
  setOldPage: (page: number) => void
  setNewPage: (page: number) => void
  setOldZoom: (zoom: number) => void
  setNewZoom: (zoom: number) => void
}

export const useComparisonStore = create<ComparisonState>()(
  immer((set) => ({
    oldFile: null,
    newFile: null,
    layout: 'sideBySide',
    overlayOpacity: 0.5,
    activePanel: 'old',
    oldPage: 0,
    newPage: 0,
    oldZoom: 1,
    newZoom: 1,

    setOldFile: (file) => set((state) => { state.oldFile = file; state.oldPage = 0 }),
    setNewFile: (file) => set((state) => { state.newFile = file; state.newPage = 0 }),
    setLayout: (layout) => set((state) => { state.layout = layout }),
    setOverlayOpacity: (opacity) => set((state) => { state.overlayOpacity = opacity }),
    setActivePanel: (panel) => set((state) => { state.activePanel = panel }),
    setOldPage: (page) => set((state) => { state.oldPage = page; state.newPage = page }),
    setNewPage: (page) => set((state) => { state.newPage = page }),
    setOldZoom: (zoom) => set((state) => { state.oldZoom = Math.min(Math.max(zoom, 0.1), 8) }),
    setNewZoom: (zoom) => set((state) => { state.newZoom = Math.min(Math.max(zoom, 0.1), 8) }),
  })),
)
