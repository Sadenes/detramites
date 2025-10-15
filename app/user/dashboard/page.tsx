"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { Coins, Search, Calendar, TrendingUp, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useState, useEffect } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Query {
  id: string
  api: string
  status: string
  responseTime?: string
  createdAt: string
}

export default function UserDashboard() {
  const { user, token } = useAuth()
  const [queries, setQueries] = useState<Query[]>([])
  const [creditBalance, setCreditBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      // Fetch queries
      const queriesRes = await fetch(`${API_URL}/api/logs/my-queries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (queriesRes.ok) {
        const queriesData = await queriesRes.json()
        setQueries(queriesData.data || [])
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

  const isSubscription = user?.accountType === "subscription"
  const successfulQueries = queries.filter((q) => q.status === "success").length

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6 md:space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-white/70 text-sm md:text-base">Bienvenido, {user?.username}</p>
          </div>

          {/* Upgrade Notice for users with 1000+ credits */}
          {!isSubscription && creditBalance >= 1000 && (
            <Alert className="bg-orange-500/20 border-orange-500/50">
              <AlertCircle className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-white text-sm md:text-base">
                Tienes {creditBalance.toLocaleString()} créditos. Eres elegible para convertirte en distribuidor y
                obtener beneficios adicionales.
                <Button className="ml-0 sm:ml-4 mt-2 sm:mt-0 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  Solicitar Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Grid - Credits Account */}
          {!isSubscription && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatCard
                title="Créditos Disponibles"
                value={creditBalance.toLocaleString()}
                icon={Coins}
                className="border-orange-500/20"
              />
              <StatCard title="Consultas Realizadas" value={queries.length} icon={Search} />
              <StatCard
                title="Consultas Exitosas"
                value={successfulQueries}
                icon={TrendingUp}
              />
              <StatCard title="Este Mes" value={queries.length} icon={Calendar} />
            </div>
          )}

          {/* Stats Grid - Subscription Account */}
          {isSubscription && user?.subscription && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                  title="Plan Activo"
                  value={
                    user.subscription.plan === "weekly"
                      ? "Semanal"
                      : user.subscription.plan === "biweekly"
                        ? "Quincenal"
                        : "Mensual"
                  }
                  icon={Calendar}
                  className="border-blue-500/20"
                />
                <StatCard
                  title="Consultas Esta Hora"
                  value={`${user.subscription.queriesThisHour}/100`}
                  icon={Search}
                />
                <StatCard title="Consultas Hoy" value={user.subscription.queriesToday} icon={TrendingUp} />
                <StatCard
                  title="Total Este Periodo"
                  value={user.subscription.queriesThisPeriod.toLocaleString()}
                  icon={Calendar}
                />
              </div>

              {/* Subscription Info */}
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Información de Suscripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-white/70 text-sm">Plan</p>
                      <p className="text-white font-bold text-lg">
                        {user.subscription.plan === "weekly"
                          ? "Semanal"
                          : user.subscription.plan === "biweekly"
                            ? "Quincenal"
                            : "Mensual"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Vence el</p>
                      <p className="text-white font-bold text-lg">
                        {new Date(user.subscription.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Rate Limit</p>
                      <p className="text-white font-bold text-lg">100 consultas/hora</p>
                    </div>
                  </div>
                  <Button className="mt-4 w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white">
                    Renovar Suscripción
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 backdrop-blur-md border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white">Consultar API</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4 text-sm md:text-base">Realiza consultas a INFONAVIT</p>
                <Link href="/user/query">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Consultar Ahora</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 backdrop-blur-md border-green-500/20">
              <CardHeader>
                <CardTitle className="text-white">Historial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 mb-4 text-sm md:text-base">Revisa tus consultas anteriores</p>
                <Link href="/user/history">
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white">Ver Historial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* API Status */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">APIs Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="text-white font-medium">INFONAVIT</p>
                    <p className="text-white/60 text-sm">Consultas de crédito y saldo</p>
                  </div>
                  <Badge className="bg-green-500 text-white w-fit">Disponible</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="text-white font-medium">SAT</p>
                    <p className="text-white/60 text-sm">Consultas fiscales</p>
                  </div>
                  <Badge className="bg-yellow-500 text-white w-fit">Próximamente</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg gap-2">
                  <div className="flex-1">
                    <p className="text-white font-medium">IMSS</p>
                    <p className="text-white/60 text-sm">Consultas de seguridad social</p>
                  </div>
                  <Badge className="bg-yellow-500 text-white w-fit">Próximamente</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Queries */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Consultas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {queries.length > 0 ? (
                <div className="space-y-3">
                  {queries.slice(0, 5).map((query) => (
                    <div
                      key={query.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/5 rounded-lg gap-2"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{query.api}</p>
                        <p className="text-white/60 text-xs">{new Date(query.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-left sm:text-right">
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
                <div className="text-center py-8 text-white/70">No has realizado consultas aún</div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
