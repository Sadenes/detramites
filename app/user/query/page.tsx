"use client"

import type React from "react"
import { Coins } from "lucide-react" // Import Coins here

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, CheckCircle, Clock, AlertCircle, Download } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function UserQueryPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const isSubscription = user?.accountType === "subscription"
  const hasCredits = !isSubscription && user?.credits && user.credits > 0
  const canQuery = isSubscription || hasCredits

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)

    if (!canQuery) {
      setError("No tienes créditos suficientes para realizar esta consulta")
      return
    }

    if (isSubscription && user?.subscription && user.subscription.queriesThisHour >= 100) {
      setError("Has alcanzado el límite de 100 consultas por hora. Intenta más tarde.")
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setResult({
        success: true,
        data: {
          nss: "12345678901",
          curp: "ABCD123456HDFXYZ00",
          nombre: "Juan Pérez García",
          credito: "Activo",
          saldo: "$450,000 MXN",
          mensualidad: "$3,200 MXN",
          plazo: "20 años",
          tasaInteres: "10.5%",
        },
        timestamp: new Date().toISOString(),
      })
      setIsLoading(false)
    }, 2000)
  }

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Consultar API</h1>
            <p className="text-white/70">Realiza consultas a las APIs disponibles</p>
          </div>

          {/* Credits/Subscription Info */}
          {!isSubscription && (
            <Alert className="bg-orange-500/20 border-orange-500/50">
              <Coins className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-white">
                Créditos disponibles: <strong>{user?.credits?.toLocaleString() || 0}</strong> (1 crédito por consulta)
              </AlertDescription>
            </Alert>
          )}

          {isSubscription && user?.subscription && (
            <Alert className="bg-blue-500/20 border-blue-500/50">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-white">
                Consultas esta hora: <strong>{user.subscription.queriesThisHour}/100</strong> | Hoy:{" "}
                <strong>{user.subscription.queriesToday}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* API Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white font-bold">INFONAVIT</p>
                    <Badge className="bg-green-500 text-white mt-1">Activa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-white font-bold">SAT</p>
                    <Badge className="bg-yellow-500 text-white mt-1">Próximamente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-400" />
                  <div>
                    <p className="text-white font-bold">IMSS</p>
                    <Badge className="bg-yellow-500 text-white mt-1">Próximamente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Query Form */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Consulta INFONAVIT</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Número de Seguridad Social (NSS)</Label>
                  <Input
                    placeholder="12345678901"
                    className="bg-white/10 border-white/20 text-white"
                    required
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">CURP</Label>
                  <Input
                    placeholder="ABCD123456HDFXYZ00"
                    className="bg-white/10 border-white/20 text-white"
                    required
                    maxLength={18}
                  />
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-white">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !canQuery}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    "Consultando..."
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Consultar {!isSubscription && "(1 crédito)"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className="bg-green-500/10 border-green-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Resultado de Consulta
                  </CardTitle>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">NSS</p>
                      <p className="text-white font-medium">{result.data.nss}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">CURP</p>
                      <p className="text-white font-medium">{result.data.curp}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Nombre Completo</p>
                      <p className="text-white font-medium">{result.data.nombre}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Estado del Crédito</p>
                      <Badge className="bg-green-500 text-white mt-1">{result.data.credito}</Badge>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Saldo Actual</p>
                      <p className="text-white font-bold text-lg">{result.data.saldo}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Mensualidad</p>
                      <p className="text-white font-medium">{result.data.mensualidad}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Plazo</p>
                      <p className="text-white font-medium">{result.data.plazo}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-lg">
                      <p className="text-white/70 text-sm">Tasa de Interés</p>
                      <p className="text-white font-medium">{result.data.tasaInteres}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-white/60 text-xs">
                      Consulta realizada el {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
