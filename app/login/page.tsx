"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(username, password)

    if (!success) {
      setError("Usuario o contraseña incorrectos")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with animated rays - same as homepage */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1200 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="neonPulse1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,1)" />
                <stop offset="30%" stopColor="rgba(251,146,60,1)" />
                <stop offset="70%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(249,115,22,0)" />
              </radialGradient>
              <linearGradient id="threadFade1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,1)" />
                <stop offset="15%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="85%" stopColor="rgba(249,115,22,0.8)" />
                <stop offset="100%" stopColor="rgba(0,0,0,1)" />
              </linearGradient>
              <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g>
              <path
                id="thread1"
                d="M50 720 Q200 590 350 540 Q500 490 650 520 Q800 550 950 460 Q1100 370 1200 340"
                stroke="url(#threadFade1)"
                strokeWidth="0.8"
                fill="none"
                opacity="0.8"
              />
              <circle r="2" fill="url(#neonPulse1)" opacity="1" filter="url(#neonGlow)">
                <animateMotion dur="4s" repeatCount="indefinite">
                  <mpath href="#thread1" />
                </animateMotion>
              </circle>
            </g>
          </svg>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <h1 className="text-4xl font-bold text-white tracking-tight">Detramites</h1>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">Iniciar Sesión</h1>
            <p className="text-white/70 text-center mb-8">Accede a tu cuenta para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Ingresa tu contraseña"
                  required
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
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-white/70 text-sm text-center mb-3">Credenciales de prueba:</p>
              <div className="space-y-2 text-xs text-white/60">
                <p>
                  <strong className="text-white/80">Superadmin:</strong> admin_master / admin123
                </p>
                <p>
                  <strong className="text-white/80">Distribuidor:</strong> distribuidor_test / dist123
                </p>
                <p>
                  <strong className="text-white/80">Usuario:</strong> usuario_test / user123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
