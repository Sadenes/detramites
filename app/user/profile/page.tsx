"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function UserProfilePage() {
  const { user, token } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas nuevas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setIsChangingPassword(true)

      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente",
        })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudo cambiar la contraseña",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

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
                <Input value={user?.email || 'No configurado'} disabled className="bg-white/10 border-white/20 text-white" />
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
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Nueva Contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Confirmar Nueva Contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Contraseña'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Devices - Note: This feature requires backend implementation */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Dispositivos y Sesiones</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/60 text-center py-8">
                La gestión de dispositivos estará disponible próximamente
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
