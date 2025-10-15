"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockDevices } from "@/lib/mock-data"

export default function UserProfilePage() {
  const { user } = useAuth()

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
            <p className="text-white/70">Administra tu información personal</p>
          </div>

          {/* Profile Info */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Usuario</Label>
                <Input value={user?.username} disabled className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Email</Label>
                <Input value={user?.email} disabled className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Tipo de Cuenta</Label>
                <div className="mt-1">
                  <Badge
                    className={
                      user?.accountType === "subscription" ? "bg-blue-500 text-white" : "bg-green-500 text-white"
                    }
                  >
                    {user?.accountType === "subscription" ? "Suscripción" : "Créditos"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Cambiar Contraseña</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Contraseña Actual</Label>
                <Input type="password" placeholder="••••••••" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Nueva Contraseña</Label>
                <Input type="password" placeholder="••••••••" className="bg-white/10 border-white/20 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Confirmar Nueva Contraseña</Label>
                <Input type="password" placeholder="••••••••" className="bg-white/10 border-white/20 text-white" />
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Actualizar Contraseña</Button>
            </CardContent>
          </Card>

          {/* Devices */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Dispositivos y Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div>
                      <p className="text-white font-medium">{device.deviceName}</p>
                      <p className="text-white/60 text-sm">{device.ip}</p>
                      <p className="text-white/60 text-xs">{device.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-sm">{new Date(device.lastAccess).toLocaleString()}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-2"
                      >
                        Cerrar Sesión
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
