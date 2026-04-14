import '@testing-library/jest-dom'

// Mock canvas getContext
const mockCtx = {
  clearRect: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  fill: () => {},
  arc: () => {},
  measureText: () => ({ width: 0 }),
  fillText: () => {},
  strokeText: () => {},
  save: () => {},
  restore: () => {},
  scale: () => {},
  translate: () => {},
  rotate: () => {},
  drawImage: () => {},
  putImageData: () => {},
  createImageData: () => ({ data: new Uint8ClampedArray() }),
  getImageData: () => ({ data: new Uint8ClampedArray() }),
  toDataURL: () => 'data:image/png;base64,',
  canvas: { width: 0, height: 0 },
  strokeStyle: '',
  fillStyle: '',
  lineWidth: 0,
  lineCap: '',
  lineJoin: '',
  font: '',
  globalAlpha: 1,
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(HTMLCanvasElement.prototype as any).getContext = () => mockCtx

HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,'
