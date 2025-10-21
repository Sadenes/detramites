import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-smooth overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'glass backdrop-blur-sm text-foreground',
        secondary:
          'glass backdrop-blur-sm text-muted-foreground',
        destructive:
          'bg-destructive/20 text-destructive-foreground backdrop-blur-sm border border-destructive/30',
        outline:
          'border border-subtle text-foreground [a&]:hover:border-subtle-hover backdrop-blur-sm',
        accent:
          'bg-accent/20 text-accent-foreground backdrop-blur-sm border border-accent/30',
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
