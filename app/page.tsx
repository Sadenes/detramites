"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getDashboardPath } from "@/lib/role-utils"

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push(getDashboardPath(user.role))
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-white text-xl">Cargando...</div>
    </div>
  )
}
