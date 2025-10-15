"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState } from "react"
import { mockUsers } from "@/lib/mock-data"
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
import { Coins, TrendingUp, Users, ArrowUpRight } from "lucide-react"
import { StatCard } from "@/components/stat-card"

export default function CreditsPage() {
  const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)

  const totalCredits = mockUsers.reduce((sum, u) => sum + (u.credits || 0), 0)
  const distributors = mockUsers.filter((u) => u.role === "distributor")
  const distributorCredits = distributors.reduce((sum, u) => sum + (u.credits || 0), 0)

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
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecciona un distribuidor" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 text-white">
                        {distributors.map((dist) => (
                          <SelectItem key={dist.id} value={dist.id}>
                            {dist.username} ({dist.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cantidad de Créditos</Label>
                    <Input type="number" placeholder="1000" className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas (opcional)</Label>
                    <Input
                      placeholder="Motivo de la asignación..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">Otorgar Créditos</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Créditos" value={totalCredits.toLocaleString()} icon={Coins} />
            <StatCard
              title="Créditos en Distribuidores"
              value={distributorCredits.toLocaleString()}
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
              <div className="space-y-3">
                {distributors.map((dist) => (
                  <div
                    key={dist.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium">{dist.username}</p>
                      <p className="text-white/60 text-sm">{dist.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-xl font-bold">{dist.credits?.toLocaleString()}</p>
                      <p className="text-white/60 text-sm">créditos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Créditos otorgados</p>
                      <p className="text-white/60 text-sm">distribuidor_juan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+1,100</p>
                    <p className="text-white/60 text-xs">Hace 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Créditos otorgados</p>
                      <p className="text-white/60 text-sm">distribuidor_maria</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+100</p>
                    <p className="text-white/60 text-xs">Hace 1 día</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
