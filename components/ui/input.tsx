import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground/50 selection:bg-accent/30 glass h-9 w-full min-w-0 rounded-lg px-3 py-1 text-base transition-smooth outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 md:text-sm',
        'focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
        'aria-invalid:ring-destructive/30 aria-invalid:border-destructive/50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
