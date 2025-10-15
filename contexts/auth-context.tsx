"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/lib/types"
import { useRouter } from "next/navigation"
import { getDashboardPath } from "@/lib/role-utils"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  token: string | null
  refreshUserCredits: () => Promise<void>
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
      if (storedUser && storedToken) {
        try {
          setUser(JSON.parse(storedUser))
          setToken(storedToken)
        } catch (error) {
          console.error("Error parsing stored user:", error)
          localStorage.removeItem("user")
          localStorage.removeItem("token")
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
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

      // Guardar en localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);

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
    router.push("/login")
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
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing credits:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, token, refreshUserCredits }}>
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
