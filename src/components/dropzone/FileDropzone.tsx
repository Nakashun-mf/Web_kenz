import { useRef, useState } from 'react'
import { Upload, FileText, FileImage } from 'lucide-react'
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
            'flex items-center gap-2.5 rounded-xl border-2 border-dashed px-5 py-3 text-sm font-medium text-slate-500 transition-all',
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
          'group relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all duration-200',
          dragging
            ? 'border-indigo-400 bg-indigo-50/60 shadow-lg shadow-indigo-100'
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 hover:shadow-md',
        )}
      >
        {/* Subtle background pattern on hover */}
        <div className={cn(
          'absolute inset-0 transition-opacity duration-200',
          dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04)_0%,transparent_70%)]" />
        </div>

        {/* Icon */}
        <div className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200',
          dragging
            ? 'bg-indigo-100 scale-110'
            : 'bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm group-hover:from-indigo-50 group-hover:to-indigo-100',
        )}>
          {dragging ? (
            <Upload className="h-7 w-7 text-indigo-600" />
          ) : (
            <FileText className="h-7 w-7 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          )}
        </div>

        {/* Text */}
        <div className="relative">
          <p className="text-[15px] font-semibold text-slate-700">
            {dragging ? 'ここにドロップ' : label}
          </p>
          <p className="mt-1.5 text-sm text-slate-400">
            ドラッグ&ドロップ または クリックして選択
          </p>
          {/* Format badges */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              <FileText className="h-3 w-3" />
              PDF
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
              <FileImage className="h-3 w-3" />
              TIF / TIFF
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-400">
              最大 100MB
            </span>
          </div>
        </div>
      </button>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
          {error}
        </p>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.tif,.tiff" className="hidden" onChange={handleChange} />
    </div>
  )
}
