"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Users, Search, Coins, Activity, CheckCircle, Clock, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface User {
  id: string
  username: string
  email: string | null
  role: string
  credits: number
  isActive: boolean
}

interface Query {
  id: string
  userId: string
  api: string
  status: string
  responseTime: string
  createdAt: string
  user?: {
    email?: string
  }
}

export default function SuperadminDashboard() {
  const { token } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [queries, setQueries] = useState<Query[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      // Fetch all users
      const usersRes = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.data || [])
      }

      // Fetch audit logs (queries)
      const logsRes = await fetch(`${API_URL}/api/logs/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setQueries(logsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate metrics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.isActive).length
  const totalQueries = queries.length
  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0)
  const distributors = users.filter((u) => u.role === "DISTRIBUTOR")

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70">Vista general del sistema</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Usuarios Activos"
              value={activeUsers}
              icon={Users}
            />
            <StatCard
              title="Total Consultas"
              value={totalQueries}
              icon={Search}
            />
            <StatCard title="Créditos Circulantes" value={totalCredits.toLocaleString()} icon={Coins} />
            <StatCard
              title="Distribuidores Activos"
              value={distributors.length}
              icon={Activity}
            />
          </div>

          {/* API Status */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Estado de APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">INFONAVIT</p>
                      <p className="text-white/60 text-sm">Operando normalmente</p>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">Activa</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">SAT</p>
                      <p className="text-white/60 text-sm">En desarrollo</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500 text-white">Próximamente</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">IMSS</p>
                      <p className="text-white/60 text-sm">En desarrollo</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500 text-white">Próximamente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Queries */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Consultas Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {queries.length > 0 ? (
                  <div className="space-y-3">
                    {queries.slice(0, 5).map((query) => (
                      <div key={query.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white text-sm font-medium">{query.user?.email || 'Usuario desconocido'}</p>
                          <p className="text-white/60 text-xs">{query.api}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={query.status === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                          >
                            {query.status}
                          </Badge>
                          <p className="text-white/60 text-xs mt-1">{query.responseTime || 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No hay consultas recientes</p>
                )}
              </CardContent>
            </Card>

            {/* Top Distributors */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Top Distribuidores</CardTitle>
              </CardHeader>
              <CardContent>
                {distributors.length > 0 ? (
                  <div className="space-y-3">
                    {distributors
                      .sort((a, b) => (b.credits || 0) - (a.credits || 0))
                      .slice(0, 5)
                      .map((dist) => (
                        <div key={dist.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white text-sm font-medium">{dist.username}</p>
                            <p className="text-white/60 text-xs">{dist.email || 'Sin email'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-orange-400 font-bold">{dist.credits?.toLocaleString() || 0}</p>
                            <p className="text-white/60 text-xs">créditos</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">No hay distribuidores registrados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
