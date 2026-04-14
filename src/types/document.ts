export type FileType = 'pdf' | 'tif'

export interface PageInfo {
  index: number
  widthPt: number
  heightPt: number
  thumbnailDataUrl?: string
}

export interface DocumentFile {
  id: string
  name: string
  type: FileType
  arrayBuffer: ArrayBuffer
  pages: PageInfo[]
  totalPages: number
}

export interface Point {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}
