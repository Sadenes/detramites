"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Search, Plus, Coins, Trash2, Eye, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usersApi } from "@/lib/api"

export default function DistributorUsersPage() {
  const { user, refreshUserCredits } = useAuth()
  const { toast } = useToast()
  const [myUsers, setMyUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isAssignCreditsDialogOpen, setIsAssignCreditsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [creditsAmount, setCreditsAmount] = useState("")

  const filteredUsers = myUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const myCredits = user?.credits || 0
  const creditsDistributed = myUsers.reduce((sum, u) => sum + (u.credits || 0), 0)
  const creditsAvailable = myCredits - creditsDistributed

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setPageLoading(true)
      const response = await usersApi.getMyUsers()

      if (response.success && response.data) {
        setMyUsers(response.data)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar usuarios",
        variant: "destructive",
      })
    } finally {
      setPageLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUsername || !newPassword) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await usersApi.createFinalUser(newUsername, newPassword)

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Usuario creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewUsername("")
        setNewPassword("")
        await loadUsers()
        await refreshUserCredits()
      } else {
        throw new Error(response.error || "Error al crear usuario")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCredits = async () => {
    if (!selectedUser || !creditsAmount) {
      toast({
        title: "Error",
        description: "Por favor ingresa una cantidad",
        variant: "destructive",
      })
      return
    }

    const amount = parseInt(creditsAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Ingresa una cantidad válida",
        variant: "destructive",
      })
      return
    }

    if (amount > creditsAvailable) {
      toast({
        title: "Error",
        description: "No tienes suficientes créditos disponibles",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const response = await usersApi.assignCredits(selectedUser.id, amount)

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Créditos asignados exitosamente",
        })
        setIsAssignCreditsDialogOpen(false)
        setCreditsAmount("")
        await loadUsers()
        await refreshUserCredits()
      } else {
        throw new Error(response.error || "Error al asignar créditos")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al asignar créditos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      const response = await usersApi.deleteUser(selectedUser.id)

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Usuario eliminado exitosamente",
        })
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        await loadUsers()
        await refreshUserCredits()
      } else {
        throw new Error(response.error || "Error al eliminar usuario")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Mis Usuarios</h1>
              <p className="text-white/70">
                Créditos disponibles:{" "}
                <span className="text-orange-400 font-bold">{creditsAvailable.toLocaleString()}</span>
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Crea un usuario final. Podrás asignarle créditos después.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Usuario</Label>
                    <Input
                      placeholder="nombre_usuario"
                      className="bg-white/10 border-white/20 text-white"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-white/10 border-white/20 text-white"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateUser}
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Crear Usuario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Buscar por usuario o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white">Usuario</TableHead>
                  <TableHead className="text-white">Créditos</TableHead>
                  <TableHead className="text-white">Fecha Creación</TableHead>
                  <TableHead className="text-white">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{u.username}</TableCell>
                      <TableCell className="text-white font-bold">{u.credits?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-white/70">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                            onClick={() => {
                              setSelectedUser(u)
                              setIsDetailsDialogOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                            onClick={() => {
                              setSelectedUser(u)
                              setIsAssignCreditsDialogOpen(true)
                            }}
                          >
                            <Coins className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => {
                              setSelectedUser(u)
                              setIsDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-white/70">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Details Dialog */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Detalles del Usuario</DialogTitle>
              </DialogHeader>
              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/70 text-sm">Usuario</p>
                      <p className="text-white font-medium">{selectedUser.username}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Rol</p>
                      <p className="text-white font-medium">Usuario Final</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Créditos</p>
                      <p className="text-white font-bold text-lg">{selectedUser.credits?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-white/70 text-sm">Fecha de Creación</p>
                      <p className="text-white font-medium">
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Assign Credits Dialog */}
          <Dialog open={isAssignCreditsDialogOpen} onOpenChange={setIsAssignCreditsDialogOpen}>
            <DialogContent className="bg-zinc-900 border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Asignar Créditos</DialogTitle>
                <DialogDescription className="text-white/70">
                  Asigna créditos a {selectedUser?.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-white/70 text-sm">Créditos actuales del usuario</p>
                  <p className="text-white text-2xl font-bold">{selectedUser?.credits?.toLocaleString() || 0}</p>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad a asignar</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    className="bg-white/10 border-white/20 text-white"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                  />
                  <p className="text-white/60 text-xs">Disponibles: {creditsAvailable.toLocaleString()}</p>
                </div>
                <Button
                  onClick={handleAssignCredits}
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Asignar Créditos
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/70">
                  Esta acción no se puede deshacer. Se eliminará permanentemente el usuario{" "}
                  <span className="text-white font-medium">{selectedUser?.username}</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
