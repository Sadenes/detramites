import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-smooth overflow-hidden backdrop-blur-sm',
  {
    variants: {
      variant: {
        default:
          'bg-white/10 border border-white/30 text-foreground',
        secondary:
          'bg-muted/10 border border-muted/30 text-muted-foreground',
        destructive:
          'bg-destructive/10 border border-destructive/30 text-destructive',
        outline:
          'bg-transparent border border-white/30 text-foreground [a&]:hover:border-white/50',
        accent:
          'bg-accent/10 border border-accent/30 text-accent',
        success:
          'bg-green-500/10 border border-green-500/30 text-green-400',
        warning:
          'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400',
        info:
          'bg-blue-500/10 border border-blue-500/30 text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
