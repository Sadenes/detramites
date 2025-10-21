import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { LoginResponse } from '../types';
import { logAudit } from '../services/auditService';
import { createSession, logFailedLogin, isIPBlocked, closeSession } from '../services/monitoringService';
import * as UAParser from 'ua-parser-js';
import { getClientIP } from '../utils/ipHelper';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.get('user-agent') || 'unknown';

    // Verificar si la IP está bloqueada
    const blocked = await isIPBlocked(ipAddress);
    if (blocked) {
      res.status(429).json({
        success: false,
        message: 'Demasiados intentos fallidos. Intenta de nuevo más tarde.',
      } as LoginResponse);
      return;
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      await logAudit('LOGIN_FAILED', undefined, { username, reason: 'user_not_found' }, ipAddress);
      await logFailedLogin(username, ipAddress, 'Usuario no encontrado', userAgent);
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      } as LoginResponse);
      return;
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      await logAudit('LOGIN_FAILED', user.id, { username, reason: 'invalid_password' }, ipAddress);
      await logFailedLogin(username, ipAddress, 'Contraseña incorrecta', userAgent);
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      } as LoginResponse);
      return;
    }

    // Generar JWT
    const jwtSecret = process.env.JWT_SECRET || 'detramites2025';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );

    // Parsear user agent para obtener info del dispositivo
    const parser = new UAParser.UAParser(userAgent);
    const result = parser.getResult();
    const deviceInfo = {
      deviceName: `${result.browser.name || 'Unknown'} en ${result.os.name || 'Unknown'}`,
      deviceType: result.device.type || 'desktop',
      browser: result.browser.name,
      os: result.os.name,
      ipAddress,
    };

    // Crear sesión
    await createSession(user.id, token, deviceInfo);

    await logAudit('LOGIN_SUCCESS', user.id, { username }, ipAddress);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        credits: user.credits,
      },
    } as LoginResponse);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
    } as LoginResponse);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
        await logAudit('LOGOUT', payload.userId, {}, getClientIP(req));
        // Cerrar sesión en la base de datos
        await closeSession(token);
      } catch (error) {
        // Token inválido, ignorar
      }
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión',
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token no proporcionado',
      });
      return;
    }

    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Verificar que el usuario todavía existe
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    // Generar nuevo token
    const jwtSecret = process.env.JWT_SECRET || 'detramites2025';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const newToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
};
