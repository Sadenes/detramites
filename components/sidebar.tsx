"use client"

import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Coins,
  Shield,
  BarChart3,
  Search,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Smartphone,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const getSidebarItems = () => {
    const roleUpper = user.role.toUpperCase()

    if (roleUpper === "SUPERADMIN_MASTER" || roleUpper === "SUPERADMIN_SECONDARY") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/superadmin/dashboard" },
        { icon: Users, label: "Usuarios", href: "/superadmin/users" },
        { icon: Coins, label: "Créditos", href: "/superadmin/credits" },
        { icon: Search, label: "Consultas", href: "/superadmin/consultas" },
        { icon: Shield, label: "Monitoreo", href: "/superadmin/monitoring" },
        { icon: BarChart3, label: "Reportes", href: "/superadmin/reports" },
        { icon: Settings, label: "Configuración", href: "/superadmin/settings" },
      ]
    }

    if (roleUpper === "DISTRIBUTOR") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/distributor/dashboard" },
        { icon: Users, label: "Mis Usuarios", href: "/distributor/users" },
        { icon: Search, label: "Consultas", href: "/distributor/consultas" },
        { icon: Smartphone, label: "Dispositivos", href: "/distributor/devices" },
        { icon: Settings, label: "Mi Perfil", href: "/distributor/profile" },
      ]
    }

    if (roleUpper === "FINAL_USER") {
      return [
        { icon: LayoutDashboard, label: "Dashboard", href: "/user/dashboard" },
        { icon: Search, label: "Consultas", href: "/user/consultas" },
        { icon: BarChart3, label: "Historial", href: "/user/history" },
        { icon: Smartphone, label: "Dispositivos", href: "/user/devices" },
        { icon: Settings, label: "Mi Perfil", href: "/user/profile" },
      ]
    }

    return []
  }

  const items = getSidebarItems()

  const getRoleBadge = () => {
    const roleUpper = user.role.toUpperCase()

    if (roleUpper === "SUPERADMIN_MASTER") {
      return { label: "Superadmin Master", color: "bg-red-500" }
    }
    if (roleUpper === "SUPERADMIN_SECONDARY") {
      return { label: "Superadmin", color: "bg-red-400" }
    }
    if (roleUpper === "DISTRIBUTOR") {
      return { label: "Distribuidor", color: "bg-blue-500" }
    }
    if (roleUpper === "FINAL_USER") {
      return { label: "Usuario", color: "bg-green-500" }
    }

    // Fallback por si el rol no coincide
    return { label: "Usuario", color: "bg-gray-500" }
  }

  const roleBadge = getRoleBadge()

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-black/95 backdrop-blur-md border-r border-white/10 transition-all duration-300 z-40",
          "lg:block",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20 w-64" : "w-64",
          "max-lg:shadow-2xl",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {!collapsed && (
              <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-xl tracking-tight">Detramites</h2>
                <span className={cn("text-xs px-2 py-0.5 rounded-full text-white w-fit", roleBadge.color)}>
                  {roleBadge.label}
                </span>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center w-full">
                <span className="text-white font-bold text-lg">D</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                      : "text-white/70 hover:text-white hover:bg-white/10",
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-white/10">
            {!collapsed && (
              <div className="mb-3 px-3 py-2 bg-white/5 rounded-lg">
                <p className="text-white text-sm font-medium truncate">{user.username}</p>
                <p className="text-white/50 text-xs truncate">{user.email}</p>
              </div>
            )}
            <Button
              onClick={logout}
              variant="ghost"
              className={cn("w-full text-white/70 hover:text-white hover:bg-red-500/20", collapsed && "px-2")}
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
