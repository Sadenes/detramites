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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Trash2, Eye, Loader2, Coins } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { usersApi } from "@/lib/api"

type UserRoleType = "distributor" | "final_user" | "superadmin_secondary"

export default function UsersPage() {
  const { user, refreshUserCredits } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAssignCreditsDialogOpen, setIsAssignCreditsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState<UserRoleType | "">("")
  const [canCreateUsers, setCanCreateUsers] = useState(true)
  const [creditsAmount, setCreditsAmount] = useState("")

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "superadmin_master":
      case "SUPERADMIN_MASTER":
        return <Badge className="bg-red-600 text-white">Superadmin Master</Badge>
      case "superadmin_secondary":
      case "SUPERADMIN_SECONDARY":
        return <Badge className="bg-red-500 text-white">Superadmin</Badge>
      case "distributor":
      case "DISTRIBUTOR":
        return <Badge className="bg-blue-500 text-white">Distribuidor</Badge>
      case "final_user":
      case "FINAL_USER":
        return <Badge className="bg-green-500 text-white">Usuario</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setPageLoading(true)
      const response = await usersApi.getAllUsers()

      if (response.success && response.data) {
        setUsers(response.data)
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
    if (!newUsername || !newPassword || !newUserRole) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      let response

      if (newUserRole === "distributor") {
        response = await usersApi.createDistributor(newUsername, newPassword, canCreateUsers)
      } else if (newUserRole === "final_user") {
        response = await usersApi.createFinalUser(newUsername, newPassword)
      } else if (newUserRole === "superadmin_secondary") {
        response = await usersApi.createSuperadminSecondary(newUsername, newPassword)
      }

      if (response && response.success) {
        toast({
          title: "Éxito",
          description: "Usuario creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewUsername("")
        setNewPassword("")
        setNewUserRole("")
        setCanCreateUsers(true)
        await loadUsers()
      } else {
        throw new Error(response?.error || "Error al crear usuario")
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
      <ProtectedRoute
        allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}
      >
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute
      allowedRoles={["superadmin_master", "superadmin_secondary", "SUPERADMIN_MASTER", "SUPERADMIN_SECONDARY"]}
    >
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Gestión de Usuarios</h1>
              <p className="text-white/70">Administra todos los usuarios del sistema</p>
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
                    Completa los datos para crear un nuevo usuario
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
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRoleType)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        <SelectItem value="distributor">Distribuidor</SelectItem>
                        <SelectItem value="final_user">Usuario Final</SelectItem>
                        {user?.role === "superadmin_master" || user?.role === "SUPERADMIN_MASTER" ? (
                          <SelectItem value="superadmin_secondary">Superadmin Secundario</SelectItem>
                        ) : null}
                      </SelectContent>
                    </Select>
                  </div>
                  {newUserRole === "distributor" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canCreateUsers"
                        checked={canCreateUsers}
                        onCheckedChange={(checked) => setCanCreateUsers(checked as boolean)}
                        className="border-white/20"
                      />
                      <Label htmlFor="canCreateUsers" className="text-sm font-normal cursor-pointer">
                        Puede crear usuarios finales
                      </Label>
                    </div>
                  )}
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
                  <TableHead className="text-white">Rol</TableHead>
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
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-white font-bold">
                        {u.credits !== undefined ? u.credits.toLocaleString() : "-"}
                      </TableCell>
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
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {(u.role === "distributor" || u.role === "DISTRIBUTOR") && (
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
                          )}
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
                    <TableCell colSpan={5} className="text-center py-8 text-white/70">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* View User Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
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
                      <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                    </div>
                    {selectedUser.credits !== undefined && (
                      <div>
                        <p className="text-white/70 text-sm">Créditos</p>
                        <p className="text-white font-bold text-lg">{selectedUser.credits.toLocaleString()}</p>
                      </div>
                    )}
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
                  <p className="text-white/70 text-sm">Créditos actuales del distribuidor</p>
                  <p className="text-white text-2xl font-bold">{selectedUser?.credits?.toLocaleString() || 0}</p>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad a asignar</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    className="bg-white/10 border-white/20 text-white"
                    value={creditsAmount}
                    onChange={(e) => setCreditsAmount(e.target.value)}
                  />
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
