"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, TrendingUp, Users, ArrowUpRight, Loader2 } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { toast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface User {
  id: string
  username: string
  email: string | null
  role: string
  credits: number
}

interface CreditTransaction {
  id: string
  userId: string
  amount: number
  type: string
  description: string | null
  createdAt: string
  user: {
    username: string
  }
}

export default function CreditsPage() {
  const { token } = useAuth()
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
  const [distributors, setDistributors] = useState<User[]>([])
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDistributor, setSelectedDistributor] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [isGranting, setIsGranting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return

    try {
      setIsLoading(true)

      // Fetch users (distributors)
      const usersRes = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const dists = usersData.data?.filter((u: User) => u.role === 'DISTRIBUTOR') || []
        setDistributors(dists)
      }

      // Fetch credit transactions
      const txRes = await fetch(`${API_URL}/api/credits/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGrantCredits = async () => {
    if (!selectedDistributor || !creditAmount || !token) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGranting(true)

      const response = await fetch(`${API_URL}/api/users/assign-credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedDistributor,
          amount: parseInt(creditAmount),
          description: notes || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Créditos otorgados",
          description: `Se asignaron ${creditAmount} créditos exitosamente`,
        })
        setIsGrantDialogOpen(false)
        setSelectedDistributor("")
        setCreditAmount("")
        setNotes("")
        fetchData() // Refresh data
      } else {
        toast({
          title: "Error",
          description: data.message || "No se pudieron otorgar los créditos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error granting credits:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al otorgar los créditos",
        variant: "destructive",
      })
    } finally {
      setIsGranting(false)
    }
  }

  const totalCredits = distributors.reduce((sum, u) => sum + (u.credits || 0), 0)

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
              <h1 className="text-3xl font-bold text-white mb-2">Gestión de Créditos</h1>
              <p className="text-white/70">Administra y otorga créditos a distribuidores</p>
            </div>
            <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Coins className="w-4 h-4 mr-2" />
                  Otorgar Créditos
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Otorgar Créditos</DialogTitle>
                  <DialogDescription className="text-white/70">Asigna créditos a un distribuidor</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Distribuidor</Label>
                    <Select value={selectedDistributor} onValueChange={setSelectedDistributor}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecciona un distribuidor" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        {distributors.map((dist) => (
                          <SelectItem key={dist.id} value={dist.id}>
                            {dist.username} ({dist.email || 'Sin email'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de Créditos</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      className="bg-white/10 border-white/20 text-white"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Input
                      placeholder="Motivo de la asignación..."
                      className="bg-white/10 border-white/20 text-white"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleGrantCredits}
                    disabled={isGranting}
                  >
                    {isGranting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Otorgando...
                      </>
                    ) : (
                      'Otorgar Créditos'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Créditos" value={totalCredits.toLocaleString()} icon={Coins} />
            <StatCard
              title="Créditos en Distribuidores"
              value={totalCredits.toLocaleString()}
              icon={TrendingUp}
            />
            <StatCard title="Distribuidores Activos" value={distributors.length} icon={Users} />
          </div>

          {/* Distributors List */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Distribuidores</CardTitle>
            </CardHeader>
            <CardContent>
              {distributors.length === 0 ? (
                <p className="text-white/60 text-center py-8">No hay distribuidores registrados</p>
              ) : (
                <div className="space-y-3">
                  {distributors.map((dist) => (
                    <div
                      key={dist.id}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="text-white font-medium">{dist.username}</p>
                        <p className="text-white/60 text-sm">{dist.email || 'Sin email'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xl font-bold">{dist.credits?.toLocaleString()}</p>
                        <p className="text-white/60 text-sm">créditos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-white/60 text-center py-8">No hay transacciones recientes</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-lg`}>
                          <ArrowUpRight className={`w-5 h-5 ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.type === 'ASSIGNED' ? 'Créditos otorgados' : 'Créditos consumidos'}</p>
                          <p className="text-white/60 text-sm">{tx.user?.username || 'Usuario desconocido'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`${tx.amount > 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-white/60 text-xs">
                          {new Date(tx.createdAt).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
