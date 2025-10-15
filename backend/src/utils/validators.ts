import { z } from 'zod';

// Validación de NSS (11 dígitos)
export const nssSchema = z.string().regex(/^\d{11}$/, 'NSS debe tener 11 dígitos');

// Validación de Crédito (10 dígitos)
export const creditoSchema = z.string().regex(/^\d{10}$/, 'Número de crédito debe tener 10 dígitos');

// Validación de Periodo (YYYYMM format)
export const periodoSchema = z.string().regex(/^\d{6}$/, 'Periodo debe tener formato YYYYMM');

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3, 'Username debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
});

// Create user schema
export const createUserSchema = z.object({
  username: z.string().min(3, 'Username debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  role: z.enum(['SUPERADMIN_SECONDARY', 'DISTRIBUTOR', 'FINAL_USER']).optional(),
  canCreateUsers: z.boolean().optional(), // Solo para distribuidores
});

// Assign credits schema
export const assignCreditsSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  amount: z.number().int().positive('Cantidad debe ser un número positivo'),
});

// INFONAVIT request schemas
export const cambiarPasswordSchema = z.object({
  nss: nssSchema,
});

export const desvincularDispositivoSchema = z.object({
  nss: nssSchema,
});

export const consultarAvisosSchema = z.object({
  credito: creditoSchema,
});

export const estadoMensualSchema = z.object({
  credito: creditoSchema,
  periodos: z.array(periodoSchema), // Permitir array vacío para consultar períodos disponibles
});

export const estadoHistoricoSchema = z.object({
  credito: creditoSchema,
});

export const resumenMovimientosSchema = z.object({
  nss: nssSchema,
});

export const buscarCreditoSchema = z.object({
  nss: nssSchema,
});

// Helper para sanitizar inputs
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[^\w\s-]/gi, '');
};
