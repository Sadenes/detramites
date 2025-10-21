"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Smartphone, Monitor, Loader2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { monitoringApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface Session {
  id: string
  token: string
  deviceName?: string
  deviceType?: string
  browser?: string
  os?: string
  ipAddress: string
  lastActivity: string
  createdAt: string
}

export default function DevicesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await monitoringApi.getUserSessions(user.id)

      if (response.success && response.data) {
        setSessions(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar sesiones",
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
        await loadSessions()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cerrar sesión",
        variant: "destructive",
      })
    }
  }

  const getDeviceIcon = (deviceType?: string) => {
    if (deviceType === "mobile" || deviceType === "tablet") {
      return <Smartphone className="w-6 h-6 text-blue-400" />
    }
    return <Monitor className="w-6 h-6 text-blue-400" />
  }

  // Convertir IPv6 a IPv4 cuando sea posible
  const formatIpAddress = (ip: string): string => {
    if (!ip) return 'Desconocida'

    // Si es IPv6 localhost, mostrar IPv4 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1'
    }

    // Si es IPv6 mapeada a IPv4 (::ffff:x.x.x.x)
    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '')
    }

    // Si es una IPv6 completa, intentar mostrar una versión más corta
    if (ip.includes(':') && !ip.includes('.')) {
      // Para otras IPv6, mostrar versión acortada
      return ip.replace(/\b0+/g, '0').replace(/:{2,}/g, '::')
    }

    return ip
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["distributor", "DISTRIBUTOR"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["distributor", "DISTRIBUTOR"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dispositivos y Sesiones</h1>
            <p className="text-white/70">Administra tus sesiones activas y dispositivos conectados</p>
          </div>

          {/* Stats */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Smartphone className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-white/70 text-sm">Sesiones Activas</p>
                  <p className="text-white text-2xl font-bold">{sessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Tus Sesiones Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-4">
                        {getDeviceIcon(session.deviceType)}
                        <div>
                          <p className="text-white font-medium">
                            {session.browser || "Navegador"} en {session.os || "Sistema"}
                          </p>
                          <p className="text-white/60 text-sm">IP: {formatIpAddress(session.ipAddress)}</p>
                          <p className="text-white/60 text-xs">
                            Última actividad: {new Date(session.lastActivity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500 text-white">Activo</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleCloseSession(session.token)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cerrar
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

          {/* Info Card */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Información de Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-white/70 text-sm">
                <p>• Las sesiones expiran automáticamente después de 7 días de inactividad</p>
                <p>• Puedes cerrar sesiones sospechosas o en dispositivos que ya no uses</p>
                <p>• Si detectas actividad no autorizada, cierra todas las sesiones y cambia tu contraseña</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
