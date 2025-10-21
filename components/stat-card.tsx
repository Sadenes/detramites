import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl p-6 card-hover-scale transition-smooth group",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-secondary text-sm font-medium mb-2">{title}</p>
          <p className="text-white text-3xl font-semibold tracking-tight">{value}</p>
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1 text-sm mt-3 px-2 py-0.5 rounded-md",
              trend.isPositive
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span className="font-medium">{trend.value}</span>
            </div>
          )}
        </div>
        <div className="icon-bg-accent p-3 rounded-xl transition-all duration-300 group-hover:scale-110">
          <Icon className="w-6 h-6 text-accent" />
        </div>
      </div>
    </div>
  )
}
