import { useEffect } from 'react'
import { useAnnotationStore } from '@/store/annotationStore'
import { useDocumentStore } from '@/store/documentStore'

export function useKeyboard() {
  const { undo, redo, deleteAnnotation, annotations } = useAnnotationStore()
  const { file, currentPage } = useDocumentStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Don't intercept when typing in an input
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, deleteAnnotation, annotations, file, currentPage])
}
