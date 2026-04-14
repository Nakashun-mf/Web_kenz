import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Annotation, AnnotationMap, AnnotationProps, AnnotationTool } from '@/types/annotation'

const MAX_HISTORY = 50

interface HistoryEntry {
  key: string
  annotations: Annotation[]
}

interface HistoryStep {
  before: HistoryEntry[]
  after: HistoryEntry[]
}

interface AnnotationState {
  annotations: AnnotationMap
  history: HistoryStep[]
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

function pushStep(
  history: HistoryStep[],
  historyIndex: number,
  step: HistoryStep,
): { history: HistoryStep[]; historyIndex: number } {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(step)
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

function withHistory(
  state: { annotations: AnnotationMap; history: HistoryStep[]; historyIndex: number },
  keys: string[],
  mutate: () => void,
) {
  const before = keys.map((k) => snapshotKey(state.annotations, k))
  mutate()
  const after = keys.map((k) => snapshotKey(state.annotations, k))
  const { history, historyIndex } = pushStep(
    state.history as HistoryStep[],
    state.historyIndex,
    { before, after },
  )
  state.history = history as typeof state.history
  state.historyIndex = historyIndex
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
      withHistory(state, [key], () => {
        if (!state.annotations[key]) state.annotations[key] = []
        state.annotations[key].push(annotation)
      })
    }),

    updateAnnotation: (key, id, changes) => set((state) => {
      withHistory(state, [key], () => {
        const list = state.annotations[key]
        if (!list) return
        const idx = list.findIndex((a) => a.id === id)
        if (idx !== -1) Object.assign(list[idx], changes)
      })
    }),

    deleteAnnotation: (key, id) => set((state) => {
      withHistory(state, [key], () => {
        if (state.annotations[key]) {
          state.annotations[key] = state.annotations[key].filter((a) => a.id !== id)
        }
      })
    }),

    clearAnnotations: (key) => set((state) => {
      withHistory(state, [key], () => {
        state.annotations[key] = []
      })
    }),

    undo: () => set((state) => {
      if (state.historyIndex < 0) return
      const step = state.history[state.historyIndex]
      for (const entry of step.before) {
        state.annotations[entry.key] = [...entry.annotations]
      }
      state.historyIndex--
    }),

    redo: () => set((state) => {
      if (state.historyIndex >= state.history.length - 1) return
      state.historyIndex++
      const step = state.history[state.historyIndex]
      for (const entry of step.after) {
        state.annotations[entry.key] = [...entry.annotations]
      }
    }),

    clearAll: () => set((state) => {
      state.annotations = {}
      state.history = []
      state.historyIndex = -1
    }),
  })),
)
