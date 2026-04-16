import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:     'rounded-full bg-[#0064E0] text-white hover:bg-[#0143B5] active:bg-[#004BB9] shadow-sm focus-visible:ring-[#0064E0]',
        secondary:   'rounded-full border-2 text-[#1C2B33]/50 border-[rgba(10,19,23,0.12)] hover:bg-[rgba(70,90,105,0.7)] hover:text-white focus-visible:ring-[#0064E0]',
        ghost:       'rounded-2xl text-[#5D6C7B] hover:bg-[#F1F4F7] focus-visible:ring-[#0064E0]',
        outline:     'rounded-full border border-[#DEE3E9] bg-white text-[#1C2B33] hover:bg-[#F1F4F7] focus-visible:ring-[#0064E0]',
        destructive: 'rounded-full bg-[#C80A28] text-white hover:bg-[#a00820] focus-visible:ring-[#C80A28]',
        active:      'rounded-full bg-[#E8F3FF] text-[#0064E0] hover:bg-[#d0e8ff] focus-visible:ring-[#0064E0]',
      },
      size: {
        default: 'h-9 px-5 py-2',
        sm:      'h-7 px-3 py-1.5 text-xs',
        lg:      'h-11 px-6',
        icon:    'h-9 w-9 rounded-xl',
        'icon-sm': 'h-7 w-7 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
)
Button.displayName = 'Button'

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
