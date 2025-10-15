import { UserRole } from "./types"

/**
 * Normaliza un rol a mayúsculas para comparaciones consistentes
 */
export function normalizeRole(role: UserRole): string {
  return role.toUpperCase()
}

/**
 * Verifica si un usuario tiene alguno de los roles permitidos
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  const normalizedUserRole = normalizeRole(userRole)
  return allowedRoles.some((role) => normalizeRole(role) === normalizedUserRole)
}

/**
 * Verifica si el rol es de tipo superadmin
 */
export function isSuperadmin(role: UserRole): boolean {
  const normalized = normalizeRole(role)
  return normalized === "SUPERADMIN_MASTER" || normalized === "SUPERADMIN_SECONDARY"
}

/**
 * Verifica si el rol es distribuidor
 */
export function isDistributor(role: UserRole): boolean {
  return normalizeRole(role) === "DISTRIBUTOR"
}

/**
 * Verifica si el rol es usuario final
 */
export function isFinalUser(role: UserRole): boolean {
  return normalizeRole(role) === "FINAL_USER"
}

/**
 * Obtiene la ruta del dashboard según el rol
 */
export function getDashboardPath(role: UserRole): string {
  const normalized = normalizeRole(role)

  if (normalized === "SUPERADMIN_MASTER" || normalized === "SUPERADMIN_SECONDARY") {
    return "/superadmin/dashboard"
  }

  if (normalized === "DISTRIBUTOR") {
    return "/distributor/dashboard"
  }

  if (normalized === "FINAL_USER") {
    return "/user/dashboard"
  }

  return "/login"
}
