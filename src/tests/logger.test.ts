import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '@/lib/logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('logger.warn outputs to console.warn', () => {
    logger.warn('test warning', { key: 'value' })
    expect(console.warn).toHaveBeenCalledOnce()
    const [, entry] = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(entry.level).toBe('warn')
    expect(entry.message).toBe('test warning')
    expect(entry.context).toEqual({ key: 'value' })
    expect(entry.timestamp).toBeTruthy()
  })

  it('logger.error outputs to console.error with error details', () => {
    const err = new Error('something broke')
    logger.error('error occurred', err, { fileName: 'test.pdf' })
    expect(console.error).toHaveBeenCalledOnce()
    const [, entry] = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(entry.level).toBe('error')
    expect(entry.message).toBe('error occurred')
    expect(entry.context.errorMessage).toBe('something broke')
    expect(entry.context.fileName).toBe('test.pdf')
    expect(entry.context.stack).toContain('Error')
  })

  it('logger.error handles non-Error objects', () => {
    logger.error('unexpected', 'string error')
    const [, entry] = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(entry.context.errorMessage).toBe('string error')
    expect(entry.context.stack).toBeUndefined()
  })

  it('logger.error works without context', () => {
    logger.error('bare error')
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('logger.warn works without context', () => {
    logger.warn('bare warning')
    expect(console.warn).toHaveBeenCalledOnce()
  })
})
