import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentStore } from '@/store/documentStore'
import type { DocumentFile } from '@/types/document'

const makeDoc = (id = 'doc1'): DocumentFile => ({
  id,
  name: 'test.pdf',
  type: 'pdf',
  arrayBuffer: new ArrayBuffer(8),
  pages: [{ index: 0, widthPt: 595, heightPt: 842 }],
  totalPages: 1,
})

describe('documentStore', () => {
  beforeEach(() => {
    useDocumentStore.getState().setFile(null)
  })

  it('starts with no file loaded', () => {
    expect(useDocumentStore.getState().file).toBeNull()
  })

  it('sets a file', () => {
    useDocumentStore.getState().setFile(makeDoc())
    expect(useDocumentStore.getState().file?.id).toBe('doc1')
  })

  it('resets page/zoom/rotation when file is set', () => {
    const store = useDocumentStore.getState()
    store.setFile(makeDoc())
    store.setCurrentPage(5)
    store.setZoom(3)
    store.setRotation(90)
    store.setFile(makeDoc('doc2'))
    const s = useDocumentStore.getState()
    expect(s.currentPage).toBe(0)
    expect(s.zoom).toBe(1)
    expect(s.rotation).toBe(0)
  })

  it('clears file with null', () => {
    useDocumentStore.getState().setFile(makeDoc())
    useDocumentStore.getState().setFile(null)
    expect(useDocumentStore.getState().file).toBeNull()
  })

  it('clamps zoom between 0.1 and 8', () => {
    const store = useDocumentStore.getState()
    store.setFile(makeDoc())
    store.setZoom(0.001)
    expect(useDocumentStore.getState().zoom).toBe(0.1)
    store.setZoom(999)
    expect(useDocumentStore.getState().zoom).toBe(8)
  })

  it('normalises rotation to 0–359', () => {
    const store = useDocumentStore.getState()
    store.setFile(makeDoc())
    store.setRotation(360)
    expect(useDocumentStore.getState().rotation).toBe(0)
    store.setRotation(-90)
    expect(useDocumentStore.getState().rotation).toBe(270)
  })

  it('updates page thumbnail', () => {
    const store = useDocumentStore.getState()
    store.setFile(makeDoc())
    store.updatePageThumbnail(0, 'data:image/jpeg;base64,abc')
    expect(useDocumentStore.getState().file?.pages[0].thumbnailDataUrl).toBe('data:image/jpeg;base64,abc')
  })

  it('does not crash updatePageThumbnail for out-of-range index', () => {
    const store = useDocumentStore.getState()
    store.setFile(makeDoc())
    expect(() => store.updatePageThumbnail(999, 'data:image/jpeg;base64,abc')).not.toThrow()
  })
})
