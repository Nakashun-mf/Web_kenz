import { useEffect, useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import { validateFile } from '@/lib/fileValidator'

interface GlobalDropZoneProps {
  onFile: (file: File) => void
  /** Label shown in the overlay */
  label?: string
  /** If true, the zone is disabled (e.g. a file is already loaded and D&D is not wanted) */
  disabled?: boolean
}

/**
 * Transparent full-window drag-and-drop zone.
 * Shows a visual overlay while a file is being dragged over the window.
 */
export function GlobalDropZone({ onFile, label = 'ファイルをドロップ', disabled = false }: GlobalDropZoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const enterCountRef = useRef(0)   // track nested dragenter/dragleave pairs

  useEffect(() => {
    if (disabled) return

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      // Only react to file drags
      if (!e.dataTransfer?.types.includes('Files')) return
      enterCountRef.current++
      setDragging(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      enterCountRef.current--
      if (enterCountRef.current <= 0) {
        enterCountRef.current = 0
        setDragging(false)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      enterCountRef.current = 0
      setDragging(false)

      const file = e.dataTransfer?.files[0]
      if (!file) return

      const result = validateFile(file)
      if (!result.valid) {
        setError(result.error ?? 'エラー')
        setTimeout(() => setError(null), 3000)
        return
      }

      setError(null)
      onFile(file)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [disabled, onFile])

  if (!dragging && !error) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-150 ${
          dragging ? 'opacity-100' : 'opacity-0'
        } bg-blue-700/10 backdrop-blur-[1px]`}
      />

      {/* Drop target card */}
      {dragging && (
        <div className="relative flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-blue-500 bg-white/90 px-16 py-12 shadow-2xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-blue-700">{label}</p>
            <p className="mt-1 text-sm text-slate-500">PDF / TIF — 最大 100MB</p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && !dragging && (
        <div className="relative rounded-xl border border-red-200 bg-white px-6 py-4 shadow-xl">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
