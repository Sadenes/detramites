"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { UserRole } from "@/lib/types"
import { getDashboardPath, hasRole } from "@/lib/role-utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (allowedRoles && !hasRole(user.role, allowedRoles)) {
        // Redirect to appropriate dashboard if user doesn't have permission
        router.push(getDashboardPath(user.role))
      }
    }
  }, [user, isLoading, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  if (!user || (allowedRoles && !hasRole(user.role, allowedRoles))) {
    return null
  }

  return <>{children}</>
}
