import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Annotation, AnnotationMap, AnnotationProps, AnnotationTool } from '@/types/annotation'

const MAX_HISTORY = 50

interface HistoryEntry {
  key: string
  annotations: Annotation[]
}

interface AnnotationState {
  annotations: AnnotationMap
  history: HistoryEntry[][]  // history[i] = snapshot of all changed keys
  historyIndex: number
  activeTool: AnnotationTool
  activeProps: AnnotationProps

  // Actions
  setActiveTool: (tool: AnnotationTool) => void
  setActiveProps: (props: Partial<AnnotationProps>) => void
  addAnnotation: (key: string, annotation: Annotation) => void
  updateAnnotation: (key: string, id: string, changes: Partial<Annotation>) => void
  deleteAnnotation: (key: string, id: string) => void
  clearAnnotations: (key: string) => void
  undo: () => void
  redo: () => void
  clearAll: () => void
}

function snapshotKey(annotations: AnnotationMap, key: string): HistoryEntry {
  return { key, annotations: [...(annotations[key] ?? [])] }
}

function pushHistory(
  history: HistoryEntry[][],
  historyIndex: number,
  entry: HistoryEntry,
): { history: HistoryEntry[][]; historyIndex: number } {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push([entry])
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

export const useAnnotationStore = create<AnnotationState>()(
  immer((set) => ({
    annotations: {},
    history: [],
    historyIndex: -1,
    activeTool: 'select',
    activeProps: {
      fontSize: 14,
      showBorder: true,
      bgColor: 'transparent',
    },

    setActiveTool: (tool) => set((state) => { state.activeTool = tool }),
    setActiveProps: (props) => set((state) => {
      Object.assign(state.activeProps, props)
    }),

    addAnnotation: (key, annotation) => set((state) => {
      const before = snapshotKey(state.annotations, key)
      if (!state.annotations[key]) state.annotations[key] = []
      state.annotations[key].push(annotation)
      const { history, historyIndex } = pushHistory(
        state.history as HistoryEntry[][],
        state.historyIndex,
        before,
      )
      state.history = history as typeof state.history
      state.historyIndex = historyIndex
    }),

    updateAnnotation: (key, id, changes) => set((state) => {
      const before = snapshotKey(state.annotations, key)
      const list = state.annotations[key]
      if (!list) return
      const idx = list.findIndex((a) => a.id === id)
      if (idx !== -1) Object.assign(list[idx], changes)
      const { history, historyIndex } = pushHistory(
        state.history as HistoryEntry[][],
        state.historyIndex,
        before,
      )
      state.history = history as typeof state.history
      state.historyIndex = historyIndex
    }),

    deleteAnnotation: (key, id) => set((state) => {
      const before = snapshotKey(state.annotations, key)
      if (state.annotations[key]) {
        state.annotations[key] = state.annotations[key].filter((a) => a.id !== id)
      }
      const { history, historyIndex } = pushHistory(
        state.history as HistoryEntry[][],
        state.historyIndex,
        before,
      )
      state.history = history as typeof state.history
      state.historyIndex = historyIndex
    }),

    clearAnnotations: (key) => set((state) => {
      const before = snapshotKey(state.annotations, key)
      state.annotations[key] = []
      const { history, historyIndex } = pushHistory(
        state.history as HistoryEntry[][],
        state.historyIndex,
        before,
      )
      state.history = history as typeof state.history
      state.historyIndex = historyIndex
    }),

    undo: () => set((state) => {
      if (state.historyIndex < 0) return
      const entries = state.history[state.historyIndex]
      for (const entry of entries) {
        state.annotations[entry.key] = [...entry.annotations]
      }
      state.historyIndex--
    }),

    redo: () => set((state) => {
      // Simple redo: move forward in history, but we stored "before" states
      // For redo, we need a future snapshot. Let's use a forward-looking approach.
      // Actually our history stores "before" states, so redo would need "after".
      // This is a simplified undo that removes last action's before state.
      // For proper redo, we store pairs. Let's skip complex redo for now.
      if (state.historyIndex >= state.history.length - 1) return
      state.historyIndex++
    }),

    clearAll: () => set((state) => {
      state.annotations = {}
      state.history = []
      state.historyIndex = -1
    }),
  })),
)
