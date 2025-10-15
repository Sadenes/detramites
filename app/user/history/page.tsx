"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import { logsApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Eye, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Query {
  id: string
  endpoint: string
  status: string
  creditCost: number
  createdAt: string
  request?: any
  response?: any
  errorMsg?: string
}

export default function UserHistoryPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [queries, setQueries] = useState<Query[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQueries()
  }, [])

  const loadQueries = async () => {
    try {
      setLoading(true)
      const response = await logsApi.getMyQueries()

      if (response.success && response.data) {
        setQueries(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar historial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredQueries = queries.filter((query) => {
    const matchesSearch = query.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || query.status.toLowerCase() === filterStatus.toLowerCase()
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "completed") {
      return <Badge className="bg-green-500 text-white">Exitosa</Badge>
    } else if (statusLower === "failed") {
      return <Badge className="bg-red-500 text-white">Error</Badge>
    } else {
      return <Badge className="bg-yellow-500 text-white">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Historial de Consultas</h1>
            <p className="text-white/70">Revisa todas tus consultas anteriores</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <Input
                placeholder="Buscar por API..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Exitosas</SelectItem>
                <SelectItem value="failed">Con Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Total de Consultas</p>
                <p className="text-white text-3xl font-bold">{queries.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Exitosas</p>
                <p className="text-white text-3xl font-bold">
                  {queries.filter((q) => q.status.toLowerCase() === "completed").length}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/20">
              <CardContent className="pt-6">
                <p className="text-white/70 text-sm">Con Error</p>
                <p className="text-white text-3xl font-bold">{queries.filter((q) => q.status.toLowerCase() === "failed").length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Queries List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Consultas</CardTitle>
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
                          <p className="text-white font-medium">{query.endpoint}</p>
                          {getStatusBadge(query.status)}
                        </div>
                        <p className="text-white/60 text-sm">{new Date(query.createdAt).toLocaleString()}</p>
                        <p className="text-white/60 text-xs">Créditos: {query.creditCost}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/70">No se encontraron consultas</div>
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
                      <p className="text-white/70 text-sm">Endpoint</p>
                      <p className="text-white font-medium">{selectedQuery.endpoint}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Estado</p>
                      <div className="mt-1">{getStatusBadge(selectedQuery.status)}</div>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Fecha</p>
                      <p className="text-white font-medium">{new Date(selectedQuery.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Créditos</p>
                      <p className="text-white font-medium">{selectedQuery.creditCost}</p>
                    </div>
                  </div>
                  {selectedQuery.errorMsg && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{selectedQuery.errorMsg}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
