import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// pdfjs-dist は Node/jsdom で DOMMatrix が未定義のためモック
vi.mock('@/lib/pdfLoader', () => ({
  renderPdfPageOffscreen: vi.fn(),
}))

import { triggerDownload } from '@/lib/exportPdf'

describe('triggerDownload', () => {
  let appendSpy: ReturnType<typeof vi.spyOn>
  let removeSpy: ReturnType<typeof vi.spyOn>
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el)
    removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el)
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a blob URL and triggers click, then revokes URL', () => {
    // <a> のクリックをモックするために createElement を一時的に差し替え
    const originalCreate = document.createElement.bind(document)
    const clickSpy = vi.fn()
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') el.click = clickSpy
      return el
    })

    triggerDownload(new Uint8Array([1, 2, 3]), 'output.pdf')

    expect(createObjectURLSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('sets correct download filename on the anchor element', () => {
    let capturedHref = ''
    let capturedDownload = ''
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        Object.defineProperty(el, 'href', { set: (v) => { capturedHref = v }, get: () => capturedHref })
        Object.defineProperty(el, 'download', { set: (v) => { capturedDownload = v }, get: () => capturedDownload })
        el.click = vi.fn()
      }
      return el
    })

    triggerDownload(new Uint8Array([0]), '検図済.pdf')
    expect(capturedHref).toBe('blob:mock-url')
    expect(capturedDownload).toBe('検図済.pdf')
  })

  it('appends and then removes the anchor from body', () => {
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementationOnce((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') el.click = vi.fn()
      return el
    })

    triggerDownload(new Uint8Array([0]), 'test.pdf')
    expect(appendSpy).toHaveBeenCalledOnce()
    expect(removeSpy).toHaveBeenCalledOnce()
  })
})
