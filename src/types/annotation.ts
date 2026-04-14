export type AnnotationTool = 'select' | 'freehand' | 'line' | 'rect' | 'circle' | 'text'

export type AnnotationBgColor = 'transparent' | 'white' | 'yellow'

export interface AnnotationProps {
  fontSize: number
  showBorder: boolean
  bgColor: AnnotationBgColor
}

export type AnnotationType = 'freehand' | 'line' | 'rect' | 'circle' | 'text'

export interface BaseAnnotation {
  id: string
  type: AnnotationType
  // PDF logical coordinates (pt)
  x: number
  y: number
}

export interface FreehandAnnotation extends BaseAnnotation {
  type: 'freehand'
  points: number[]
  strokeWidth: number
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line'
  x2: number
  y2: number
  strokeWidth: number
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect'
  width: number
  height: number
  strokeWidth: number
}

export interface CircleAnnotation extends BaseAnnotation {
  type: 'circle'
  // cx, cy = center in pt (stored in x, y)
  rx: number  // half-width in pt
  ry: number  // half-height in pt
  strokeWidth: number
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  text: string
  fontSize: number
  showBorder: boolean
  bgColor: AnnotationBgColor
}

export type Annotation =
  | FreehandAnnotation
  | LineAnnotation
  | RectAnnotation
  | CircleAnnotation
  | TextAnnotation

// Key format: `${fileId}:${pageIndex}`
export type AnnotationMap = Record<string, Annotation[]>
