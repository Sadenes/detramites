import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    username: string;
    role: string;
    credits: number;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// INFONAVIT Request/Response types
export interface CambiarPasswordRequest {
  nss: string;
}

export interface DesvincularDispositivoRequest {
  nss: string;
}

export interface ConsultarAvisosRequest {
  credito: string;
}

export interface EstadoMensualRequest {
  credito: string;
  periodos: string[];
}

export interface EstadoHistoricoRequest {
  credito: string;
}

export interface ResumenMovimientosRequest {
  nss: string;
}

export interface BuscarCreditoRequest {
  nss: string;
}
