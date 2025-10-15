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
        "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
          <p className="text-white text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn("text-sm mt-2", trend.isPositive ? "text-green-400" : "text-red-400")}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className="p-3 bg-orange-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-orange-400" />
        </div>
      </div>
    </div>
  )
}
