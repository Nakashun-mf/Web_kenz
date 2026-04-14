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
  const enterCountRef = useRef(0)
  // Stable ref so the effect never needs to re-run when onFile changes
  const onFileRef = useRef(onFile)
  onFileRef.current = onFile

  useEffect(() => {
    if (disabled) return

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
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
      onFileRef.current(file)
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      enterCountRef.current = 0
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [disabled])

  if (!dragging && !error) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-150 ${
          dragging ? 'opacity-100' : 'opacity-0'
        } bg-indigo-600/8 backdrop-blur-[2px]`}
      />

      {/* Drop target card */}
      {dragging && (
        <div className="relative flex flex-col items-center gap-5 rounded-3xl border-2 border-dashed border-indigo-400 bg-white/95 px-20 py-14 shadow-2xl">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100">
            <Upload className="h-10 w-10 text-indigo-600" />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-slate-800">{label}</p>
            <p className="mt-1.5 text-sm text-slate-400">PDF / TIF — 最大 100MB</p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && !dragging && (
        <div className="relative rounded-xl border border-red-200 bg-white px-6 py-4 shadow-2xl">
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
