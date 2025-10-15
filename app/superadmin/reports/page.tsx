"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, TrendingUp, Users, Coins, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface User {
  id: string
  username: string
  email: string | null
  role: string
  credits: number
}

interface Query {
  id: string
  api: string
  status: string
  createdAt: string
}

export default function ReportsPage() {
  const { token } = useAuth()
  const [timeRange, setTimeRange] = useState("7d")
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

      // Fetch audit logs
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

  // Mock data for charts (will be replaced with real analytics later)
  const dailyQueriesData = [
    { date: "Lun", queries: queries.length > 0 ? Math.floor(queries.length / 7) : 0, success: queries.filter(q => q.status === 'success').length > 0 ? Math.floor(queries.filter(q => q.status === 'success').length / 7) : 0, error: 0 },
    { date: "Mar", queries: queries.length > 0 ? Math.floor(queries.length / 7) : 0, success: queries.filter(q => q.status === 'success').length > 0 ? Math.floor(queries.filter(q => q.status === 'success').length / 7) : 0, error: 0 },
    { date: "Mié", queries: queries.length > 0 ? Math.floor(queries.length / 7) : 0, success: queries.filter(q => q.status === 'success').length > 0 ? Math.floor(queries.filter(q => q.status === 'success').length / 7) : 0, error: 0 },
    { date: "Jue", queries: queries.length > 0 ? Math.floor(queries.length / 7) : 0, success: queries.filter(q => q.status === 'success').length > 0 ? Math.floor(queries.filter(q => q.status === 'success').length / 7) : 0, error: 0 },
    { date: "Vie", queries: queries.length > 0 ? Math.floor(queries.length / 7) : 0, success: queries.filter(q => q.status === 'success').length > 0 ? Math.floor(queries.filter(q => q.status === 'success').length / 7) : 0, error: 0 },
    { date: "Sáb", queries: 0, success: 0, error: 0 },
    { date: "Dom", queries: 0, success: 0, error: 0 },
  ]

  const infonavitQueries = queries.filter(q => q.api === 'INFONAVIT').length
  const apiUsageData = [
    { name: "INFONAVIT", value: infonavitQueries || 1, color: "#f97316" },
    { name: "SAT", value: 0, color: "#eab308" },
    { name: "IMSS", value: 0, color: "#3b82f6" },
  ]

  const userGrowthData = [
    { month: "Ene", users: Math.floor(users.length / 6) },
    { month: "Feb", users: Math.floor(users.length / 5) },
    { month: "Mar", users: Math.floor(users.length / 4) },
    { month: "Abr", users: Math.floor(users.length / 3) },
    { month: "May", users: Math.floor(users.length / 2) },
    { month: "Jun", users: users.length },
  ]

  const creditsFlowData = [
    { week: "Sem 1", distributed: 0, consumed: 0 },
    { week: "Sem 2", distributed: 0, consumed: 0 },
    { week: "Sem 3", distributed: 0, consumed: 0 },
    { week: "Sem 4", distributed: 0, consumed: 0 },
  ]

  const totalQueries = queries.length
  const successRate = totalQueries > 0 ? ((queries.filter((q) => q.status === "success").length / totalQueries) * 100).toFixed(1) : "0.0"
  const avgResponseTime = "N/A"

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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Reportes y Analytics</h1>
              <p className="text-white/70">Análisis detallado del uso de la plataforma</p>
            </div>
            <div className="flex gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                  <SelectItem value="1y">Último año</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <Search className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Total Consultas</p>
                    <p className="text-white text-2xl font-bold">{totalQueries}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Tasa de Éxito</p>
                    <p className="text-white text-2xl font-bold">{successRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Usuarios Totales</p>
                    <p className="text-white text-2xl font-bold">{users.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Coins className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/70 text-sm">Tiempo Promedio</p>
                    <p className="text-white text-2xl font-bold">{avgResponseTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Queries Chart */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Consultas Diarias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyQueriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff70" />
                    <YAxis stroke="#ffffff70" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="success" fill="#22c55e" name="Exitosas" />
                    <Bar dataKey="error" fill="#ef4444" name="Con Error" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* API Usage Pie Chart */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Uso por API</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={apiUsageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {apiUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Crecimiento de Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="month" stroke="#ffffff70" />
                    <YAxis stroke="#ffffff70" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Usuarios" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Credits Flow Chart */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Flujo de Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={creditsFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="week" stroke="#ffffff70" />
                    <YAxis stroke="#ffffff70" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #ffffff20",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="distributed" fill="#f97316" name="Distribuidos" />
                    <Bar dataKey="consumed" fill="#8b5cf6" name="Consumidos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Por Tipo de Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Superadmins</span>
                    <span className="text-white font-bold">
                      {users.filter((u) => u.role.includes("SUPERADMIN")).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Distribuidores</span>
                    <span className="text-white font-bold">
                      {users.filter((u) => u.role === "DISTRIBUTOR").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Usuarios Finales</span>
                    <span className="text-white font-bold">
                      {users.filter((u) => u.role === "FINAL_USER").length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Rendimiento de APIs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">INFONAVIT</span>
                    <span className="text-green-400 font-bold">{successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Tiempo Promedio</span>
                    <span className="text-white font-bold">{avgResponseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Uptime</span>
                    <span className="text-green-400 font-bold">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Créditos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Total Circulante</span>
                    <span className="text-white font-bold">
                      {users.reduce((sum, u) => sum + (u.credits || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Distribuidos Hoy</span>
                    <span className="text-orange-400 font-bold">N/A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Consumidos Hoy</span>
                    <span className="text-purple-400 font-bold">N/A</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
