import type { User, Query, Device } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    username: "admin_master",
    email: "master@admin.com",
    role: "superadmin_master",
    createdAt: "2025-01-01T00:00:00Z",
    isActive: true,
  },
  {
    id: "2",
    username: "admin_secondary",
    email: "secondary@admin.com",
    role: "superadmin_secondary",
    createdAt: "2025-01-02T00:00:00Z",
    isActive: true,
  },
  {
    id: "3",
    username: "distribuidor_test",
    email: "distribuidor@test.com",
    role: "distributor",
    credits: 10000,
    createdAt: "2025-02-01T00:00:00Z",
    isActive: true,
  },
  {
    id: "4",
    username: "distribuidor_maria",
    email: "maria@dist.com",
    role: "distributor",
    credits: 3200,
    createdAt: "2025-02-15T00:00:00Z",
    isActive: true,
  },
  {
    id: "5",
    username: "usuario_test",
    email: "usuario@test.com",
    role: "final_user",
    accountType: "credits",
    credits: 100,
    distributorId: "3",
    createdAt: "2025-03-01T00:00:00Z",
    isActive: true,
  },
  {
    id: "6",
    username: "usuario_ana",
    email: "ana@cliente.com",
    role: "final_user",
    accountType: "subscription",
    subscription: {
      plan: "monthly",
      endDate: "2025-11-08",
      queriesThisHour: 45,
      queriesToday: 320,
      queriesThisPeriod: 2450,
    },
    createdAt: "2025-03-10T00:00:00Z",
    isActive: true,
  },
]

export const mockQueries: Query[] = [
  {
    id: "1",
    userId: "5",
    userEmail: "carlos@cliente.com",
    api: "INFONAVIT",
    status: "success",
    createdAt: "2025-10-08T14:23:00Z",
    responseTime: "1.2s",
  },
  {
    id: "2",
    userId: "6",
    userEmail: "ana@cliente.com",
    api: "INFONAVIT",
    status: "success",
    createdAt: "2025-10-08T14:20:00Z",
    responseTime: "0.9s",
  },
  {
    id: "3",
    userId: "5",
    userEmail: "carlos@cliente.com",
    api: "INFONAVIT",
    status: "error",
    createdAt: "2025-10-08T13:45:00Z",
    responseTime: "2.1s",
  },
]

export const mockDevices: Device[] = [
  {
    id: "1",
    userId: "5",
    deviceName: "Chrome on Windows",
    ip: "192.168.1.100",
    location: "Ciudad de México, México",
    lastAccess: "2025-10-08T14:30:00Z",
  },
  {
    id: "2",
    userId: "5",
    deviceName: "Safari on iPhone",
    ip: "192.168.1.101",
    location: "Ciudad de México, México",
    lastAccess: "2025-10-07T18:20:00Z",
  },
]

// Mock credentials for login (NOTA: Ahora se usa autenticación real con el backend)
export const mockCredentials = {
  admin_master: "admin123",
  admin_secondary: "admin123",
  distribuidor_test: "dist123",
  distribuidor_maria: "dist123",
  usuario_test: "user123",
  usuario_ana: "user123",
}
