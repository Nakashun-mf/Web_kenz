import { cn } from '@/lib/utils'

type NotificationVariant = 'error' | 'success' | 'info' | 'warning'

interface InlineNotificationProps {
  message: string | null
  variant?: NotificationVariant
  className?: string
}

const variantStyles: Record<NotificationVariant, { bg: string; color: string; dot: string }> = {
  error:   { bg: '#FFF0F0', color: '#C80A28', dot: '#C80A28' },
  success: { bg: '#F0FFF4', color: '#007D1E', dot: '#007D1E' },
  info:    { bg: '#E8F3FF', color: '#0064E0', dot: '#0064E0' },
  warning: { bg: '#FFFBEB', color: '#92400E', dot: '#F7B928' },
}

export function InlineNotification({
  message,
  variant = 'error',
  className,
}: InlineNotificationProps) {
  if (!message) return null
  const styles = variantStyles[variant]
  return (
    <div
      role="alert"
      className={cn('shrink-0 flex items-center gap-2 px-5 py-2 text-sm', className)}
      style={{ fontWeight: 500, background: styles.bg, color: styles.color, borderBottom: `1px solid ${styles.dot}22` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: styles.dot }} />
      {message}
    </div>
  )
}
