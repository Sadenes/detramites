"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      <main className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
