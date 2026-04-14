import { useRef, useState } from 'react'
import { Upload, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/fileValidator'

interface FileDropzoneProps {
  onFile: (file: File) => void
  label?: string
  className?: string
  compact?: boolean
}

export function FileDropzone({ onFile, label = 'ファイルを読み込む', className, compact = false }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const result = validateFile(file)
    if (!result.valid) {
      setError(result.error ?? 'エラー')
      return
    }
    setError(null)
    onFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (compact) {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-2.5 text-sm font-medium text-slate-500 transition-all',
            'hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600',
            dragging && 'border-indigo-500 bg-indigo-50 text-indigo-600 scale-[1.02]',
          )}
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <input ref={inputRef} type="file" accept=".pdf,.tif,.tiff" className="hidden" onChange={handleChange} />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all',
          'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 shadow-sm hover:shadow-md',
          dragging && 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-md',
        )}
      >
        <div className={cn(
          'rounded-2xl p-4 transition-colors',
          dragging ? 'bg-indigo-100' : 'bg-slate-100',
        )}>
          <FileText className={cn(
            'h-8 w-8 transition-colors',
            dragging ? 'text-indigo-600' : 'text-slate-400',
          )} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{label}</p>
          <p className="mt-1 text-xs text-slate-400">PDF / TIF ドラッグ&ドロップ または クリック</p>
          <p className="mt-0.5 text-xs text-slate-300">最大 100MB</p>
        </div>
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept=".pdf,.tif,.tiff" className="hidden" onChange={handleChange} />
    </div>
  )
}
