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
          className="flex items-center gap-2.5 rounded-full border-2 border-dashed px-6 py-3 text-sm transition-all"
          style={{
            fontWeight: 500,
            borderColor: dragging ? '#0064E0' : '#DEE3E9',
            background: dragging ? '#E8F3FF' : 'transparent',
            color: dragging ? '#0064E0' : '#5D6C7B',
            transform: dragging ? 'scale(1.02)' : 'scale(1)',
          }}
          onMouseEnter={e => {
            if (!dragging) {
              (e.currentTarget as HTMLElement).style.borderColor = '#0064E0'
              ;(e.currentTarget as HTMLElement).style.background = '#E8F3FF'
              ;(e.currentTarget as HTMLElement).style.color = '#0064E0'
            }
          }}
          onMouseLeave={e => {
            if (!dragging) {
              (e.currentTarget as HTMLElement).style.borderColor = '#DEE3E9'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = '#5D6C7B'
            }
          }}
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </button>
        {error && <p className="text-xs" style={{ color: '#C80A28' }}>{error}</p>}
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
        className="group relative flex w-full flex-col items-center gap-5 overflow-hidden rounded-[20px] border-2 border-dashed px-5 py-10 text-center transition-all duration-200"
        style={{
          borderColor: dragging ? '#0064E0' : '#DEE3E9',
          background: dragging ? '#E8F3FF' : '#ffffff',
          boxShadow: dragging ? '0 12px 28px 0 rgba(0,100,224,0.15), 0 2px 4px 0 rgba(0,100,224,0.08)' : '0 2px 4px 0 rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          if (!dragging) {
            (e.currentTarget as HTMLElement).style.borderColor = '#47A5FA'
            ;(e.currentTarget as HTMLElement).style.background = '#F7FBFF'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px 0 rgba(0,0,0,0.1), 0 2px 4px 0 rgba(0,0,0,0.06)'
          }
        }}
        onMouseLeave={e => {
          if (!dragging) {
            (e.currentTarget as HTMLElement).style.borderColor = '#DEE3E9'
            ;(e.currentTarget as HTMLElement).style.background = '#ffffff'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 4px 0 rgba(0,0,0,0.06)'
          }
        }}
      >
        {/* Icon */}
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-[20px] transition-all duration-200"
          style={{
            background: dragging ? '#E8F3FF' : '#F1F4F7',
            transform: dragging ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {dragging ? (
            <Upload className="h-7 w-7" style={{ color: '#0064E0' }} />
          ) : (
            <FileText className="h-7 w-7 transition-colors" style={{ color: '#5D6C7B' }} />
          )}
        </div>

        {/* Text */}
        <div className="relative">
          <p className="text-[15px]" style={{ fontWeight: 500, color: '#1C2B33' }}>
            {dragging ? 'ここにドロップ' : label}
          </p>
          <p className="mt-1.5 text-sm" style={{ color: '#5D6C7B' }}>
            ドラッグ&ドロップ または クリックして選択
          </p>
          {/* Format badges */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
              style={{ fontWeight: 600, background: '#F1F4F7', color: '#5D6C7B' }}
            >
              <FileText className="h-3 w-3" />
              PDF
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px]"
              style={{ fontWeight: 600, background: '#F1F4F7', color: '#5D6C7B' }}
            >
              <FileImage className="h-3 w-3" />
              TIF / TIFF
            </span>
            <span
              className="rounded-full px-3 py-1.5 text-[11px]"
              style={{ fontWeight: 600, background: '#F1F4F7', color: '#5D6C7B' }}
            >
              最大 100MB
            </span>
          </div>
        </div>
      </button>

      {error && (
        <p
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm"
          style={{ fontWeight: 500, background: '#FFF0F0', color: '#C80A28' }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#C80A28' }} />
          {error}
        </p>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.tif,.tiff" className="hidden" onChange={handleChange} />
    </div>
  )
}
