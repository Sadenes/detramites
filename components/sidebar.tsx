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
      return { label: "Superadmin Master", color: "glass border border-red-500/30 text-red-400" }
    }
    if (roleUpper === "SUPERADMIN_SECONDARY") {
      return { label: "Superadmin", color: "glass border border-red-400/30 text-red-300" }
    }
    if (roleUpper === "DISTRIBUTOR") {
      return { label: "Distribuidor", color: "glass border border-blue-400/30 text-blue-300" }
    }
    if (roleUpper === "FINAL_USER") {
      return { label: "Usuario", color: "glass border border-green-400/30 text-green-300" }
    }

    // Fallback por si el rol no coincide
    return { label: "Usuario", color: "glass border border-white/10 text-white/70" }
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
          "fixed left-0 top-0 h-screen glass border-r border-subtle transition-all duration-300 z-40",
          "lg:block",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-20 w-64" : "w-64",
          "max-lg:shadow-2xl",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-subtle flex items-center justify-between">
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col gap-2">
                <h2 className="text-white font-medium text-lg tracking-tight">Detramites</h2>
                <span className={cn("text-xs px-2 py-1 rounded-md w-fit backdrop-blur-sm", roleBadge.color)}>
                  {roleBadge.label}
                </span>
              </div>
            )}
            {collapsed && !mobileOpen && (
              <div className="flex justify-center w-full">
                <span className="text-white font-medium text-lg">D</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:block text-white/70 hover:text-white transition-smooth"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth group",
                    isActive
                      ? "text-white bg-accent/20"
                      : "text-white/70 hover:text-white hover:bg-white/5",
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full" />
                  )}
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || mobileOpen) && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* User info & logout */}
          <div className="p-4 border-t border-subtle">
            {(!collapsed || mobileOpen) && (
              <div className="mb-3 px-4 py-3 glass rounded-lg">
                <p className="text-white text-sm font-medium truncate">{user.username}</p>
                <p className="text-secondary text-xs truncate">{user.email}</p>
              </div>
            )}
            <Button
              onClick={logout}
              variant="ghost"
              className={cn("w-full justify-start text-white/70 hover:text-white hover:bg-red-500/10 transition-smooth", collapsed && !mobileOpen && "px-2")}
            >
              <LogOut className="w-5 h-5" />
              {(!collapsed || mobileOpen) && <span className="ml-2 text-sm">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
