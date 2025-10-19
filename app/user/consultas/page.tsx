"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Key,
  Smartphone,
  FileText,
  History,
  Calendar,
  Info,
  Copy,
  Download,
  CheckCircle2,
  Loader2,
  X,
  FileStack,
  ArrowLeft,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { infonavitApi, downloadPDF } from "@/lib/api"

type ConsultationService = "password" | "device" | "notices" | "historical" | "monthly" | "status" | "summary" | null

export default function ConsultasPage() {
  const { user, refreshUserCredits } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])
  const [selectedService, setSelectedService] = useState<ConsultationService>(null)
  const [error, setError] = useState<string | null>(null)
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([])

  const handleQuery = async (service: string, inputValue: string) => {
    if (!inputValue.trim()) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      let response;

      switch (service) {
        case "password":
          response = await infonavitApi.cambiarPassword(inputValue)
          setResult({ type: "password", data: response })
          break

        case "device":
          response = await infonavitApi.desvincularDispositivo(inputValue)
          setResult({ type: "device", data: response })
          break

        case "notices":
          response = await infonavitApi.consultarAvisos(inputValue)
          setResult({ type: "notices", data: response })
          break

        case "historical":
          response = await infonavitApi.estadoHistorico(inputValue)
          setResult({ type: "historical", data: response })
          break

        case "monthly_periods":
          // Consulta períodos disponibles mediante estado mensual vacío
          response = await infonavitApi.estadoMensual(inputValue, [])
          console.log("Períodos response:", JSON.stringify(response, null, 2))
          if (response.availablePeriods) {
            // Los períodos vienen en availablePeriods.root
            const periods = response.availablePeriods.root || response.availablePeriods
            setResult({ type: "monthly_periods", data: { periods } })
            setAvailablePeriods(periods)
          } else {
            throw new Error('No se pudieron obtener los períodos disponibles')
          }
          break

        case "credit_status":
          response = await infonavitApi.buscarCredito(inputValue)
          console.log("Buscar credito response:", JSON.stringify(response, null, 2))
          // Formatear respuesta para que coincida con el componente
          if (response.data) {
            console.log("Setting result with tabla1 and tabla2")
            setResult({ type: "credit_status", data: {
              principal: response.data.tabla1,
              secundaria: response.data.tabla2
            }})
          } else {
            console.error("No data in response:", response)
            throw new Error('No se obtuvieron datos del crédito')
          }
          break

        case "summary":
          response = await infonavitApi.resumenMovimientos(inputValue)
          console.log("Resumen de movimientos response:", JSON.stringify(response, null, 2))
          console.log("PDF data exists?", !!response.pdf)
          console.log("PDF data content?", response.pdf?.data ? "Yes" : "No")
          setResult({ type: "summary", data: response })
          break
      }

      // Refrescar créditos después de consulta exitosa
      await refreshUserCredits()
    } catch (err: any) {
      console.error('Error en consulta:', err)
      setError(err.message || 'Error al realizar la consulta')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePeriod = (period: number | string) => {
    const periodStr = String(period)
    setSelectedPeriods((prev) => (prev.includes(periodStr) ? prev.filter((p) => p !== periodStr) : [...prev, periodStr]))
  }

  const downloadSelectedPeriods = async () => {
    if (selectedPeriods.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const creditInput = document.getElementById("credit-monthly") as HTMLInputElement
      const credito = creditInput?.value

      if (!credito) {
        setError("Por favor ingresa un número de crédito")
        return
      }

      const response = await infonavitApi.estadoMensual(credito, selectedPeriods)

      // Descargar cada PDF
      if (response.pdfs && response.pdfs.length > 0) {
        response.pdfs.forEach((pdf: any) => {
          downloadPDF(pdf.data, pdf.filename)
        })
      }

      if (response.errors && response.errors.length > 0) {
        setError(`Algunos períodos no tienen información: ${response.errors.map((e: any) => e.periodo).join(', ')}`)
      }

      setResult({
        type: "monthly_downloaded",
        data: {
          downloadedCount: response.pdfs?.length || 0,
          errors: response.errors || []
        }
      })

      // Refrescar créditos después de descargar períodos
      await refreshUserCredits()
    } catch (err: any) {
      console.error('Error al descargar períodos:', err)
      setError(err.message || 'Error al descargar los períodos')
    } finally {
      setLoading(false)
    }
  }

  const consultationServices = [
    {
      id: "password" as ConsultationService,
      icon: Key,
      title: "Cambio de Contraseña",
      description: "Genera una nueva contraseña para el NSS",
      color: "from-orange-500/20 to-red-500/20",
      borderColor: "border-orange-500/30",
    },
    {
      id: "device" as ConsultationService,
      icon: Smartphone,
      title: "Desvincular Dispositivo",
      description: "Permite iniciar sesión en nuevo dispositivo",
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
    },
    {
      id: "notices" as ConsultationService,
      icon: FileText,
      title: "Consultar Avisos",
      description: "Avisos de suspensión y retención",
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
    },
    {
      id: "historical" as ConsultationService,
      icon: History,
      title: "Estado Histórico",
      description: "Historial completo del crédito",
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
    },
    {
      id: "monthly" as ConsultationService,
      icon: Calendar,
      title: "Estado Mensual",
      description: "Consulta períodos y descarga estados",
      color: "from-yellow-500/20 to-orange-500/20",
      borderColor: "border-yellow-500/30",
    },
    {
      id: "status" as ConsultationService,
      icon: Info,
      title: "Estatus de Crédito",
      description: "Información completa del crédito",
      color: "from-indigo-500/20 to-blue-500/20",
      borderColor: "border-indigo-500/30",
    },
    {
      id: "summary" as ConsultationService,
      icon: FileStack,
      title: "Resumen de Movimientos",
      description: "Historial completo de movimientos",
      color: "from-teal-500/20 to-cyan-500/20",
      borderColor: "border-teal-500/30",
    },
  ]

  const renderServiceForm = () => {
    if (!selectedService) return null

    switch (selectedService) {
      case "password":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Cambio de Contraseña
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">
                Genera una nueva contraseña para el NSS proporcionado
              </CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nss-password" className="text-white">
                  NSS (Número de Seguro Social)
                </Label>
                <Input
                  id="nss-password"
                  placeholder="Ej: 47937648609"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={11}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("nss-password") as HTMLInputElement
                  handleQuery("password", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Generar Nueva Contraseña
              </Button>

              {result?.type === "password" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{result.data.message || 'Contraseña generada exitosamente'}</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg mb-3">
                    <p className="text-white/70 text-sm">
                      Nueva contraseña: <strong className="text-orange-400">{result.data.newPassword}</strong>
                    </p>
                    <p className="text-white/60 text-xs mt-2">
                      Esta contraseña ha sido generada con el formato: NSS + 4 caracteres aleatorios
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="flex-1 p-3 bg-white/10 rounded text-white font-mono text-lg break-all">
                      {result.data.newPassword}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(result.data.newPassword)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "device":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Desvinculación de Dispositivo
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">
                Permite al usuario iniciar sesión en un nuevo dispositivo
              </CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nss-device" className="text-white">
                  NSS (Número de Seguro Social)
                </Label>
                <Input
                  id="nss-device"
                  placeholder="Ej: 47937648609"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={11}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("nss-device") as HTMLInputElement
                  handleQuery("device", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Desvincular Dispositivo
              </Button>

              {result?.type === "device" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">{result.data.message}</span>
                  </div>
                  {result.data.newPassword && (
                    <>
                      <div className="p-3 bg-white/5 rounded-lg mb-3">
                        <p className="text-white/70 text-sm">
                          Nueva contraseña generada: <strong className="text-orange-400">{result.data.newPassword}</strong>
                        </p>
                        <p className="text-white/60 text-xs mt-2">
                          Esta contraseña ha sido generada automáticamente con el formato: NSS + 4 caracteres aleatorios
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="flex-1 p-3 bg-white/10 rounded text-white font-mono text-lg break-all">
                          {result.data.newPassword}
                        </code>
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(result.data.newPassword)}
                          className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "notices":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Consultar Avisos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">
                Consulta avisos de suspensión, retención y modificación
              </CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credit-notices" className="text-white">
                  Número de Crédito
                </Label>
                <Input
                  id="credit-notices"
                  placeholder="Ej: 1904070964"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("credit-notices") as HTMLInputElement
                  handleQuery("notices", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Consultar Avisos
              </Button>

              {result?.type === "notices" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Avisos obtenidos exitosamente</span>
                  </div>
                  <div className="space-y-2">
                    {result.data.pdfs && result.data.pdfs.map((pdf: any, index: number) => (
                      <Button
                        key={index}
                        onClick={() => downloadPDF(pdf.data, pdf.filename)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white justify-start"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {pdf.filename}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "historical":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Estado de Cuenta Histórico
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">Obtén el historial completo del crédito</CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credit-historical" className="text-white">
                  Número de Crédito
                </Label>
                <Input
                  id="credit-historical"
                  placeholder="Ej: 1904070964"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("credit-historical") as HTMLInputElement
                  handleQuery("historical", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Obtener Estado Histórico
              </Button>

              {result?.type === "historical" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Estado histórico obtenido</span>
                  </div>
                  {result.data.pdf && (
                    <Button
                      onClick={() => downloadPDF(result.data.pdf.data, result.data.pdf.filename)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {result.data.pdf.filename}
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "monthly":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Estado de Cuenta Mensual
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                    setSelectedPeriods([])
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">
                Consulta períodos disponibles y descarga estados de cuenta
              </CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito por período</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="credit-monthly" className="text-white">
                  Número de Crédito
                </Label>
                <Input
                  id="credit-monthly"
                  placeholder="Ej: 1904070964"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={10}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("credit-monthly") as HTMLInputElement
                  handleQuery("monthly_periods", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Consultar Períodos Disponibles
              </Button>

              {result?.type === "monthly_periods" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Períodos disponibles</span>
                  </div>
                  <div className="space-y-2">
                    {result.data.periods.map((period: any) => {
                      const periodStr = String(period.PERIODO)
                      return (
                        <div
                          key={period.PERIODO}
                          onClick={() => togglePeriod(period.PERIODO)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedPeriods.includes(periodStr)
                              ? "bg-orange-500/20 border-2 border-orange-500"
                              : "bg-white/10 border border-white/20 hover:bg-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-medium">
                                Período: {periodStr.slice(0, 4)}-{periodStr.slice(4)}
                              </p>
                              <p className="text-white/70 text-sm">{period.MENSAJE}</p>
                            </div>
                            {selectedPeriods.includes(periodStr) && (
                              <CheckCircle2 className="w-5 h-5 text-orange-500" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {selectedPeriods.length > 0 && (
                    <div className="pt-4 border-t border-white/10 space-y-3">
                      <div className="flex items-center justify-between text-white">
                        <span>Períodos seleccionados:</span>
                        <Badge className="bg-orange-500 text-white">{selectedPeriods.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-white">
                        <span>Costo total:</span>
                        <Badge className="bg-orange-500 text-white">{selectedPeriods.length} crédito(s)</Badge>
                      </div>
                      <Button
                        onClick={downloadSelectedPeriods}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Seleccionados
                      </Button>
                    </div>
                  )}

                  {result?.type === "monthly_downloaded" && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg mt-4">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">
                          {result.data.downloadedCount} período(s) descargado(s) exitosamente
                        </span>
                      </div>
                      {result.data.errors && result.data.errors.length > 0 && (
                        <p className="text-yellow-400 text-sm mt-2">
                          Algunos períodos no tenían información disponible
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "summary":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileStack className="w-5 h-5" />
                  Resumen de Movimientos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">
                Obtén el historial completo de movimientos del trabajador
              </CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nss-summary" className="text-white">
                  NSS (Número de Seguro Social)
                </Label>
                <Input
                  id="nss-summary"
                  placeholder="Ej: 02230301760"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={11}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("nss-summary") as HTMLInputElement
                  handleQuery("summary", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Obtener Resumen de Movimientos
              </Button>

              {result?.type === "summary" && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Resumen de movimientos obtenido</span>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg mb-3">
                    <p className="text-white/70 text-sm mb-2">
                      📄 El resumen incluye todos los movimientos históricos del trabajador en INFONAVIT.
                    </p>
                    <p className="text-white/70 text-sm">
                      Este documento contiene información detallada de todos los depósitos, retiros y movimientos realizados.
                    </p>
                  </div>
                  {result.data.pdf && (
                    <Button
                      onClick={() => {
                        console.log("About to download PDF for summary")
                        console.log("PDF data:", result.data.pdf.data ? "exists" : "missing")
                        console.log("PDF filename:", result.data.pdf.filename)
                        console.log("First 100 chars of PDF data:", result.data.pdf.data?.substring(0, 100))
                        downloadPDF(result.data.pdf.data, result.data.pdf.filename)
                      }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white justify-start"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {result.data.pdf.filename}
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "status":
        return (
          <Card className="bg-white/5 backdrop-blur-md border-white/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Estatus de Crédito
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(null)
                    setResult(null)
                  }}
                  className="text-white/70 hover:text-white border-white/20 hover:bg-white/10"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Realizar otra consulta
                </Button>
              </div>
              <CardDescription className="text-white/70">Consulta información completa del crédito</CardDescription>
              <Badge className="bg-orange-500 text-white w-fit">Costo: 1 crédito</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nss-status" className="text-white">
                  NSS (Número de Seguro Social)
                </Label>
                <Input
                  id="nss-status"
                  placeholder="Ej: 47937648609"
                  className="bg-white/10 border-white/20 text-white"
                  maxLength={11}
                />
              </div>
              <Button
                onClick={(e) => {
                  const input = document.getElementById("nss-status") as HTMLInputElement
                  handleQuery("credit_status", input.value)
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Consultar Estatus
              </Button>

              {result?.type === "credit_status" && result.data && (
                <div className="space-y-4">
                  {/* Información Principal */}
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 mb-4">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">📋 Información Principal del Crédito</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-2 text-white/70 font-medium">Campo</th>
                            <th className="text-left py-2 px-2 text-white/70 font-medium">Valor</th>
                            <th className="text-left py-2 px-2 text-white/70 font-medium hidden md:table-cell">
                              Significado
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.data.principal).map(([key, value]) => (
                            <tr key={key} className="border-b border-white/5">
                              <td className="py-2 px-2 text-white font-medium">{key}</td>
                              <td className="py-2 px-2 text-white">{value as string}</td>
                              <td className="py-2 px-2 text-white/70 text-xs hidden md:table-cell">
                                {key === "NSS" && "Tu número de seguro social"}
                                {key === "Número de Crédito" && "Número de tu crédito Infonavit"}
                                {key === "Meses Omisos" && "Meses de atraso (0 = al corriente)"}
                                {key === "Fecha Origen" && "Fecha de origen del crédito"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Información Secundaria */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <Info className="w-5 h-5" />
                      <span className="font-medium">🧾 Información Secundaria</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-2 px-2 text-white/70 font-medium">Campo</th>
                            <th className="text-left py-2 px-2 text-white/70 font-medium">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.data.secundaria).map(([key, value]) => (
                            <tr key={key} className="border-b border-white/5">
                              <td className="py-2 px-2 text-white font-medium">{key}</td>
                              <td className="py-2 px-2 text-white">{value as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="w-5 h-5" />
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <ProtectedRoute allowedRoles={["final_user", "FINAL_USER"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Consultas Infonavit</h1>
            <p className="text-white/70 text-sm md:text-base">Servicios de API para consultas de Infonavit</p>
          </div>

          {!selectedService ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consultationServices.map((service) => {
                const Icon = service.icon
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`group relative cursor-pointer transition-all duration-300 hover:scale-105`}
                  >
                    {/* Glassmorphism card */}
                    <div
                      className={`relative p-6 rounded-xl bg-gradient-to-br ${service.color} backdrop-blur-md border ${service.borderColor} hover:border-opacity-60 transition-all duration-300 h-full`}
                    >
                      {/* Icon */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <Badge className="bg-orange-500 text-white text-xs">1 crédito</Badge>
                      </div>

                      {/* Content */}
                      <h3 className="text-white font-bold text-lg mb-2 group-hover:text-orange-300 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">{service.description}</p>

                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10 transition-all duration-300" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">{renderServiceForm()}</div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
