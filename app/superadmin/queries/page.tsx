"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Query {
  id: string
  userId: string
  api: string
  status: string
  responseTime?: string
  createdAt: string
  user?: {
    email?: string
    username?: string
  }
}

export default function QueriesPage() {
  const { token } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterApi, setFilterApi] = useState("all")
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [queries, setQueries] = useState<Query[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQueries()
  }, [token])

  const fetchQueries = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      const response = await fetch(`${API_URL}/api/logs/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setQueries(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching queries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQueries = queries.filter((query) => {
    const userEmail = query.user?.email || query.user?.username || ''
    const matchesSearch =
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.api.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || query.status === filterStatus
    const matchesApi = filterApi === "all" || query.api === filterApi
    return matchesSearch && matchesStatus && matchesApi
  })

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
              <h1 className="text-3xl font-bold text-white mb-2">Historial Global de Consultas</h1>
              <p className="text-white/70">Todas las consultas realizadas en la plataforma</p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Total</p>
                <p className="text-white text-3xl font-bold">{queries.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Exitosas</p>
                <p className="text-white text-3xl font-bold">
                  {queries.filter((q) => q.status === "success").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Con Error</p>
                <p className="text-white text-3xl font-bold">
                  {queries.filter((q) => q.status === "error" || q.status === "failed").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Tiempo Promedio</p>
                <p className="text-white text-3xl font-bold">N/A</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                placeholder="Buscar por usuario o API..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={filterApi} onValueChange={setFilterApi}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filtrar por API" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="all">Todas las APIs</SelectItem>
                <SelectItem value="INFONAVIT">INFONAVIT</SelectItem>
                <SelectItem value="SAT">SAT</SelectItem>
                <SelectItem value="IMSS">IMSS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="success">Exitosas</SelectItem>
                <SelectItem value="error">Con Error</SelectItem>
                <SelectItem value="failed">Fallidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queries List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Consultas ({filteredQueries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredQueries.length > 0 ? (
                <div className="space-y-3">
                  {filteredQueries.map((query) => (
                    <div
                      key={query.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-medium">{query.api}</p>
                          <Badge
                            className={query.status === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                          >
                            {query.status}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm">{query.user?.email || query.user?.username || 'Usuario desconocido'}</p>
                        <p className="text-white/60 text-xs">{new Date(query.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-white/70 text-sm">Tiempo de respuesta</p>
                          <p className="text-white font-medium">{query.responseTime || 'N/A'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-white/70 hover:text-white hover:bg-white/10"
                          onClick={() => {
                            setSelectedQuery(query)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">
                  {queries.length === 0 ? 'No hay consultas registradas' : 'No se encontraron consultas con los filtros aplicados'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* View Query Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Detalles de Consulta</DialogTitle>
                <DialogDescription className="text-white/70">Información completa de la consulta</DialogDescription>
              </DialogHeader>
              {selectedQuery && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/70 text-sm">API</p>
                      <p className="text-white font-medium">{selectedQuery.api}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Estado</p>
                      <Badge
                        className={
                          selectedQuery.status === "success"
                            ? "bg-green-500 text-white mt-1"
                            : "bg-red-500 text-white mt-1"
                        }
                      >
                        {selectedQuery.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Usuario</p>
                      <p className="text-white font-medium">{selectedQuery.user?.email || selectedQuery.user?.username || 'Usuario desconocido'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Fecha</p>
                      <p className="text-white font-medium">{new Date(selectedQuery.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Tiempo de Respuesta</p>
                      <p className="text-white font-medium">{selectedQuery.responseTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">ID de Consulta</p>
                      <p className="text-white font-medium">{selectedQuery.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
