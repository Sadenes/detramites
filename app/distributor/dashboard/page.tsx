"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Coins, Users, TrendingUp, ShoppingCart, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface User {
  id: string
  username: string
  email: string | null
  credits: number
  role: string
}

export default function DistributorDashboard() {
  const { user, token } = useAuth()
  const [myUsers, setMyUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [creditBalance, setCreditBalance] = useState(0)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      // Fetch my users
      const usersRes = await fetch(`${API_URL}/api/users/my-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setMyUsers(usersData.data || [])
      }

      // Fetch credit balance
      const balanceRes = await fetch(`${API_URL}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setCreditBalance(balanceData.data?.credits || 0)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const creditsDistributed = myUsers.reduce((sum, u) => sum + (u.credits || 0), 0)
  const creditsAvailable = creditBalance - creditsDistributed

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["distributor", "DISTRIBUTOR"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["distributor", "DISTRIBUTOR"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70 text-sm md:text-base">Bienvenido, {user?.username}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatCard
              title="Créditos Disponibles"
              value={creditsAvailable.toLocaleString()}
              icon={Coins}
              className="border-orange-500/20"
            />
            <StatCard title="Créditos Distribuidos" value={creditsDistributed.toLocaleString()} icon={TrendingUp} />
            <StatCard title="Mis Usuarios" value={myUsers.length} icon={Users} />
            <StatCard title="Total Créditos" value={creditBalance.toLocaleString()} icon={ShoppingCart} />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-md border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl font-bold">Gestionar Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold mb-4 text-base md:text-lg">Crea y administra tus usuarios finales</p>
                <Link href="/distributor/users">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">Ver Usuarios</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-md border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white text-xl font-bold">Consultar API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white font-bold mb-4 text-base md:text-lg">Realiza consultas a las APIs disponibles</p>
                <Link href="/distributor/consultas">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold">Consultar Ahora</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* My Users List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Mis Usuarios Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {myUsers.length > 0 ? (
                <div className="space-y-3">
                  {myUsers.slice(0, 5).map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{u.username}</p>
                        <p className="text-white/60 text-sm truncate">{u.email || 'Sin email'}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-white font-bold">{u.credits?.toLocaleString() || 0}</p>
                        <p className="text-white/60 text-sm">créditos</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70">No tienes usuarios aún</p>
                  <Link href="/distributor/users">
                    <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">Crear Primer Usuario</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
