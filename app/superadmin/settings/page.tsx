"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()
  const isMasterAdmin = user?.role === "superadmin_master"

  return (
    <ProtectedRoute allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Configuración del Sistema</h1>
            <p className="text-white/70">Administra la configuración global de la plataforma</p>
          </div>

          {/* Create Superadmin - Only for Master */}
          {isMasterAdmin && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Crear Superadmin Secundario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-orange-500/20 border-orange-500/50">
                  <AlertCircle className="h-4 w-4 text-orange-400" />
                  <AlertDescription className="text-white">
                    Solo el Superadmin Maestro puede crear otros superadmins
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label className="text-white">Usuario</Label>
                  <Input placeholder="admin_secundario" className="bg-white/10 border-white/20 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    placeholder="admin@ejemplo.com"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Contraseña</Label>
                  <Input type="password" placeholder="••••••••" className="bg-white/10 border-white/20 text-white" />
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">Crear Superadmin</Button>
              </CardContent>
            </Card>
          )}

          {/* API Configuration */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Configuración de APIs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">INFONAVIT</p>
                  <p className="text-white/60 text-sm">API de consultas de crédito</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">SAT</p>
                  <p className="text-white/60 text-sm">API de consultas fiscales</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">IMSS</p>
                  <p className="text-white/60 text-sm">API de seguridad social</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
