import { describe, it, expect, beforeEach } from 'vitest'
import { useAnnotationStore } from '@/store/annotationStore'
import type { RectAnnotation } from '@/types/annotation'

const makeRect = (id: string): RectAnnotation => ({
  id,
  type: 'rect',
  x: 10,
  y: 10,
  width: 100,
  height: 50,
  strokeWidth: 2,
})

describe('annotationStore', () => {
  beforeEach(() => {
    useAnnotationStore.getState().clearAll()
  })

  it('adds annotation', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    const anns = useAnnotationStore.getState().annotations['file1:0']
    expect(anns).toHaveLength(1)
    expect(anns[0].id).toBe('r1')
  })

  it('adds multiple annotations', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    store.addAnnotation('file1:0', makeRect('r2'))
    expect(useAnnotationStore.getState().annotations['file1:0']).toHaveLength(2)
  })

  it('deletes specific annotation', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    store.addAnnotation('file1:0', makeRect('r2'))
    useAnnotationStore.getState().deleteAnnotation('file1:0', 'r1')
    const anns = useAnnotationStore.getState().annotations['file1:0']
    expect(anns).toHaveLength(1)
    expect(anns[0].id).toBe('r2')
  })

  it('clears page annotations', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    store.addAnnotation('file1:0', makeRect('r2'))
    useAnnotationStore.getState().clearAnnotations('file1:0')
    expect(useAnnotationStore.getState().annotations['file1:0']).toHaveLength(0)
  })

  it('undo removes last added annotation', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    store.addAnnotation('file1:0', makeRect('r2'))
    useAnnotationStore.getState().undo()
    const anns = useAnnotationStore.getState().annotations['file1:0']
    expect(anns).toHaveLength(1)
    expect(anns[0].id).toBe('r1')
  })

  it('updates annotation', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    useAnnotationStore.getState().updateAnnotation('file1:0', 'r1', { x: 99 })
    expect(useAnnotationStore.getState().annotations['file1:0'][0].x).toBe(99)
  })

  it('keeps separate annotations per page key', () => {
    const store = useAnnotationStore.getState()
    store.addAnnotation('file1:0', makeRect('r1'))
    store.addAnnotation('file1:1', makeRect('r2'))
    expect(useAnnotationStore.getState().annotations['file1:0']).toHaveLength(1)
    expect(useAnnotationStore.getState().annotations['file1:1']).toHaveLength(1)
  })

  it('sets active tool', () => {
    useAnnotationStore.getState().setActiveTool('freehand')
    expect(useAnnotationStore.getState().activeTool).toBe('freehand')
  })

  it('sets active props', () => {
    useAnnotationStore.getState().setActiveProps({ fontSize: 24 })
    expect(useAnnotationStore.getState().activeProps.fontSize).toBe(24)
  })
})
