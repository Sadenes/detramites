"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Shield, Monitor, AlertTriangle, Search, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { monitoringApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Session {
  id: string
  token: string
  deviceName?: string
  ipAddress: string
  lastActivity: string
  createdAt: string
  user: {
    id: string
    username: string
    role: string
  }
}

interface FailedAttempt {
  id: string
  username: string
  ipAddress: string
  reason: string
  createdAt: string
}

export default function MonitoringPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [failedAttempts, setFailedAttempts] = useState<FailedAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [sessionsResponse, attemptsResponse] = await Promise.all([
        monitoringApi.getActiveSessions(),
        monitoringApi.getFailedLoginAttempts(20),
      ])

      if (sessionsResponse.success && sessionsResponse.data) {
        setSessions(sessionsResponse.data)
      }

      if (attemptsResponse.success && attemptsResponse.data) {
        setFailedAttempts(attemptsResponse.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar datos de monitoreo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSession = async (sessionToken: string) => {
    try {
      const response = await monitoringApi.closeSession(sessionToken)

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Sesión cerrada exitosamente",
        })
        await loadData()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cerrar sesión",
        variant: "destructive",
      })
    }
  }

  const filteredSessions = sessions.filter(
    (session) =>
      session.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
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
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Monitoreo y Seguridad</h1>
            <p className="text-white/70">Supervisa la actividad y seguridad del sistema</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white/70 text-sm">Sesiones Activas</p>
                    <p className="text-white text-2xl font-bold">{sessions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-white/70 text-sm">Intentos Fallidos</p>
                    <p className="text-white text-2xl font-bold">{failedAttempts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Monitor className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-white/70 text-sm">Usuarios Únicos</p>
                    <p className="text-white text-2xl font-bold">
                      {new Set(sessions.map((s) => s.user.id)).size}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Sessions */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Sesiones Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <Input
                    placeholder="Buscar por usuario o IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <div className="space-y-3">
                {filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{session.user.username}</p>
                        <p className="text-white/60 text-sm">IP: {session.ipAddress}</p>
                        <p className="text-white/60 text-xs">
                          {session.deviceName || "Dispositivo desconocido"} • Última actividad:{" "}
                          {new Date(session.lastActivity).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500 text-white">Activo</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleCloseSession(session.token)}
                        >
                          Cerrar Sesión
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-white/70 text-center py-8">No hay sesiones activas</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Failed Login Attempts */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Intentos de Login Fallidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedAttempts.length > 0 ? (
                  failedAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                    >
                      <div>
                        <p className="text-white font-medium">{attempt.username}</p>
                        <p className="text-white/60 text-sm">IP: {attempt.ipAddress}</p>
                        <p className="text-white/60 text-xs">{new Date(attempt.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className="bg-red-500 text-white">{attempt.reason}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-white/70 text-center py-8">No hay intentos fallidos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
