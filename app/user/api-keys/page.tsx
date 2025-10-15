"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Copy, Trash2, AlertCircle, Key } from "lucide-react"

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState([
    {
      id: "1",
      name: "Producción",
      key: "apk_live_1234567890abcdef",
      createdAt: "2025-10-01T10:00:00Z",
      lastUsed: "2025-10-08T14:30:00Z",
      isActive: true,
    },
    {
      id: "2",
      name: "Desarrollo",
      key: "apk_test_abcdef1234567890",
      createdAt: "2025-09-15T08:00:00Z",
      lastUsed: "2025-10-07T16:20:00Z",
      isActive: true,
    },
  ])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [generatedKey, setGeneratedKey] = useState("")

  const handleCreateKey = () => {
    if (apiKeys.length >= 3) {
      alert("Solo puedes tener hasta 3 API Keys activas")
      return
    }

    const newKey = {
      id: String(apiKeys.length + 1),
      name: newKeyName,
      key: `apk_${Math.random().toString(36).substring(2, 15)}`,
      createdAt: new Date().toISOString(),
      lastUsed: undefined,
      isActive: true,
    }

    setApiKeys([...apiKeys, newKey])
    setGeneratedKey(newKey.key)
    setNewKeyName("")
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    alert("API Key copiada al portapapeles")
  }

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id))
  }

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">API Keys</h1>
              <p className="text-white/70">Genera y administra tus claves de API para uso programático</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" disabled={apiKeys.length >= 3}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generar API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Generar Nueva API Key</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Crea una nueva clave de API para integrar con tus aplicaciones
                  </DialogDescription>
                </DialogHeader>
                {!generatedKey ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nombre de la API Key</Label>
                      <Input
                        placeholder="Ej: Producción, Desarrollo, Testing"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyName}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Generar API Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-orange-500/20 border-orange-500/50">
                      <AlertCircle className="h-4 w-4 text-orange-400" />
                      <AlertDescription className="text-white">
                        Guarda esta clave en un lugar seguro. No podrás verla nuevamente.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label>Tu nueva API Key</Label>
                      <div className="flex gap-2">
                        <Input
                          value={generatedKey}
                          readOnly
                          className="bg-white/10 border-white/20 text-white font-mono"
                        />
                        <Button
                          onClick={() => handleCopyKey(generatedKey)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setGeneratedKey("")
                        setIsCreateDialogOpen(false)
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white"
                    >
                      Cerrar
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-500/20 border-blue-500/50">
            <Key className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-white">
              Puedes generar hasta 3 API Keys. Úsalas para integrar nuestras APIs en tus aplicaciones.
            </AlertDescription>
          </Alert>

          {/* API Keys List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Mis API Keys ({apiKeys.length}/3)</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeys.length > 0 ? (
                <div className="space-y-3">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{apiKey.name}</p>
                          <Badge
                            className={apiKey.isActive ? "bg-green-500 text-white mt-1" : "bg-red-500 text-white mt-1"}
                          >
                            {apiKey.isActive ? "Activa" : "Revocada"}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleRevokeKey(apiKey.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={apiKey.key}
                          readOnly
                          className="bg-white/10 border-white/20 text-white font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleCopyKey(apiKey.key)}
                          className="bg-white/10 hover:bg-white/20 text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>Creada: {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                        {apiKey.lastUsed && <span>Último uso: {new Date(apiKey.lastUsed).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/70">No tienes API Keys generadas</div>
              )}
            </CardContent>
          </Card>

          {/* Documentation */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Cómo usar tu API Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-white/70 text-sm mb-2">Incluye tu API Key en el header de tus peticiones:</p>
                  <pre className="bg-black/50 p-4 rounded-lg text-white/80 text-sm overflow-x-auto">
                    {`curl -X POST https://api.ejemplo.com/infonavit \\
  -H "Authorization: Bearer TU_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"nss": "12345678901", "curp": "ABCD123456HDFXYZ00"}'`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
