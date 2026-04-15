/**
 * 構造化ロガー
 * 本番環境では console.error/warn のみ出力し、
 * 将来的に Sentry などの外部サービスへ差し替え可能な設計。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
}

function buildEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
): LogEntry {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  }
}

const isDev = import.meta.env.DEV

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isDev) return
    console.debug('[DEBUG]', buildEntry('debug', message, context))
  },

  info(message: string, context?: Record<string, unknown>): void {
    if (!isDev) return
    console.info('[INFO]', buildEntry('info', message, context))
  },

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn('[WARN]', buildEntry('warn', message, context))
  },

  /**
   * エラーを記録する。
   * 本番環境でも出力し、将来的には外部モニタリングサービスへ送信する。
   * UI には絶対に err.message をそのまま表示しないこと。
   */
  error(message: string, err?: unknown, context?: Record<string, unknown>): void {
    const entry = buildEntry('error', message, {
      ...context,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    console.error('[ERROR]', entry)
    // TODO: Sentry.captureException(err, { extra: entry }) などに差し替える
  },
}
