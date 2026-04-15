import { describe, it, expect, beforeEach } from 'vitest'
import { useComparisonStore } from '@/store/comparisonStore'
import type { DocumentFile } from '@/types/document'

const makeDoc = (id: string): DocumentFile => ({
  id,
  name: `${id}.pdf`,
  type: 'pdf',
  arrayBuffer: new ArrayBuffer(8),
  pages: [{ index: 0, widthPt: 595, heightPt: 842 }],
  totalPages: 1,
})

describe('comparisonStore', () => {
  beforeEach(() => {
    const store = useComparisonStore.getState()
    store.setOldFile(null)
    store.setNewFile(null)
    store.setLayout('sideBySide')
    store.setOverlayOpacity(0.5)
    store.setActivePanel('old')
    store.setOldPage(0)
  })

  it('starts with both files null', () => {
    const { oldFile, newFile } = useComparisonStore.getState()
    expect(oldFile).toBeNull()
    expect(newFile).toBeNull()
  })

  it('sets oldFile and resets oldPage', () => {
    const store = useComparisonStore.getState()
    store.setOldPage(5)
    store.setOldFile(makeDoc('old1'))
    const s = useComparisonStore.getState()
    expect(s.oldFile?.id).toBe('old1')
    expect(s.oldPage).toBe(0)
  })

  it('sets newFile and resets newPage', () => {
    const store = useComparisonStore.getState()
    store.setNewFile(makeDoc('new1'))
    const s = useComparisonStore.getState()
    expect(s.newFile?.id).toBe('new1')
    expect(s.newPage).toBe(0)
  })

  it('setOldPage syncs both pages', () => {
    const store = useComparisonStore.getState()
    store.setOldPage(3)
    const s = useComparisonStore.getState()
    expect(s.oldPage).toBe(3)
    expect(s.newPage).toBe(3)
  })

  it('clamps oldZoom to [0.1, 8]', () => {
    const store = useComparisonStore.getState()
    store.setOldZoom(0)
    expect(useComparisonStore.getState().oldZoom).toBe(0.1)
    store.setOldZoom(100)
    expect(useComparisonStore.getState().oldZoom).toBe(8)
  })

  it('clamps newZoom to [0.1, 8]', () => {
    const store = useComparisonStore.getState()
    store.setNewZoom(0)
    expect(useComparisonStore.getState().newZoom).toBe(0.1)
    store.setNewZoom(100)
    expect(useComparisonStore.getState().newZoom).toBe(8)
  })

  it('switches layout', () => {
    useComparisonStore.getState().setLayout('overlay')
    expect(useComparisonStore.getState().layout).toBe('overlay')
  })

  it('sets overlayOpacity', () => {
    useComparisonStore.getState().setOverlayOpacity(0.75)
    expect(useComparisonStore.getState().overlayOpacity).toBe(0.75)
  })

  it('sets activePanel', () => {
    useComparisonStore.getState().setActivePanel('new')
    expect(useComparisonStore.getState().activePanel).toBe('new')
  })
})
