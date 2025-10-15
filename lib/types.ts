export type UserRole = "superadmin_master" | "superadmin_secondary" | "distributor" | "final_user" | "SUPERADMIN_MASTER" | "SUPERADMIN_SECONDARY" | "DISTRIBUTOR" | "FINAL_USER"

export type AccountType = "credits" | "subscription"

export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  accountType?: AccountType
  credits?: number
  subscription?: {
    plan: "weekly" | "biweekly" | "monthly"
    endDate: string
    queriesThisHour: number
    queriesToday: number
    queriesThisPeriod: number
  }
  distributorId?: string
  createdAt: string
  isActive: boolean
}

export interface Query {
  id: string
  userId: string
  userEmail: string
  api: "INFONAVIT" | "SAT" | "IMSS"
  status: "success" | "error"
  createdAt: string
  responseTime: string
  result?: any
}

export interface Device {
  id: string
  userId: string
  deviceName: string
  ip: string
  location: string
  lastAccess: string
}

export interface ApiKey {
  id: string
  userId: string
  key: string
  name: string
  createdAt: string
  lastUsed?: string
  isActive: boolean
}
