"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"
import { getDashboardPath } from "@/lib/role-utils"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  token: string | null
  refreshUserCredits: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored session
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user")
      const storedToken = localStorage.getItem("token")
      const rememberMe = localStorage.getItem("rememberMe") === "true"

      if (storedUser && storedToken && rememberMe) {
        try {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)
        } catch (error) {
          console.error("Error parsing stored user:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          localStorage.removeItem("rememberMe")
        }
      } else if (!rememberMe) {
        // Si no está marcado "recordarme", limpiar sesión al recargar
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("rememberMe")
      }
    }
    setIsLoading(false)
  }, [])

  // Auto-refresh token cada 50 minutos (antes de que expire en 1 hora)
  useEffect(() => {
    if (!token) return

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken()
      if (!success) {
        console.error("Failed to refresh token, logging out")
        logout()
      }
    }, 50 * 60 * 1000) // 50 minutos

    return () => clearInterval(refreshInterval)
  }, [token])

  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error('Login failed:', data.message || data.error);
        return false;
      }

      // Guardar usuario y token
      const userData: User = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email || `${data.user.username}@test.com`,
        role: data.user.role as UserRole,
        credits: data.user.credits,
        distributorId: data.user.distributorId || undefined,
        createdAt: data.user.createdAt || new Date().toISOString(),
        isActive: true,
      };

      setUser(userData);
      setToken(data.token);

      // Guardar en localStorage solo si "recordarme" está activado
      if (rememberMe) {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", data.token);
        localStorage.setItem("rememberMe", "true");
      } else {
        // Guardar solo en sessionStorage si no quiere ser recordado
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("token", data.token);
        localStorage.setItem("rememberMe", "false");
      }

      // Redirigir según rol
      router.push(getDashboardPath(data.user.role as UserRole));

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    localStorage.removeItem("rememberMe")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token")
    router.push("/login")
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      if (!token) return false;

      const response = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        setToken(data.token);

        // Actualizar en el storage correspondiente
        const rememberMe = localStorage.getItem("rememberMe") === "true";
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  const refreshUserCredits = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${API_URL}/api/credits/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success && user) {
        const updatedUser = { ...user, credits: data.data.balance };
        setUser(updatedUser);

        // Actualizar en el storage correspondiente
        const rememberMe = localStorage.getItem("rememberMe") === "true";
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, token, refreshUserCredits, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
