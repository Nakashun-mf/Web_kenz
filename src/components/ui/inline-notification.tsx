import { cn } from '@/lib/utils'

type NotificationVariant = 'error' | 'success' | 'info' | 'warning'

interface InlineNotificationProps {
  message: string | null
  variant?: NotificationVariant
  className?: string
}

const variantStyles: Record<NotificationVariant, string> = {
  error:   'border-red-100 bg-red-50 text-red-600',
  success: 'border-green-100 bg-green-50 text-green-700',
  info:    'border-indigo-100 bg-indigo-50 text-indigo-600',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
}

export function InlineNotification({
  message,
  variant = 'error',
  className,
}: InlineNotificationProps) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={cn(
        'shrink-0 border-b px-5 py-2 text-sm font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {message}
    </div>
  )
}
