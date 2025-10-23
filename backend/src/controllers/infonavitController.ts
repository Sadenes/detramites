import { Response } from 'express';
import { AuthRequest } from '../types';
import { consumeCredits } from '../services/creditService';
import {
  cambiarPassword,
  desvincularDispositivo,
  consultarAvisos,
  estadoCuentaMensual,
  estadoCuentaHistorico,
  resumenMovimientos,
  buscarCreditoPorNSS,
  verificarCuenta,
  consultarDatosContacto,
} from '../services/infonavitService';

// 1. Cambiar Contraseña
export const cambiarPasswordHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Consumir crédito
    const hasCredits = await consumeCredits(req.user.id, 1, 'Cambiar contraseña INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await cambiarPassword(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al cambiar contraseña',
    });
  }
};

// 2. Desvincular Dispositivo
export const desvincularDispositivoHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Desvincular dispositivo INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await desvincularDispositivo(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al desvincular dispositivo',
    });
  }
};

// 3. Consultar Avisos
export const consultarAvisosHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { credito } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Consultar avisos INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await consultarAvisos(credito, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar avisos',
    });
  }
};

// 4. Estado Cuenta Mensual
export const estadoCuentaMensualHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { credito, periodos } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const creditCost = periodos.length;

    const hasCredits = await consumeCredits(
      req.user.id,
      creditCost,
      'Estado cuenta mensual INFONAVIT'
    );

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await estadoCuentaMensual(credito, periodos, req.user.id, token);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener estado de cuenta mensual',
    });
  }
};

// 5. Estado Cuenta Histórico
export const estadoCuentaHistoricoHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { credito } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Estado cuenta histórico INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await estadoCuentaHistorico(credito, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener estado de cuenta histórico',
    });
  }
};

// 6. Resumen de Movimientos
export const resumenMovimientosHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Resumen movimientos INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await resumenMovimientos(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener resumen de movimientos',
    });
  }
};

// 7. Buscar Crédito por NSS
export const buscarCreditoHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Buscar crédito por NSS INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await buscarCreditoPorNSS(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al buscar crédito',
    });
  }
};

// 8. Verificar Cuenta (GRATIS)
export const verificarCuentaHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // NO consume créditos - GRATIS
    const result = await verificarCuenta(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al verificar cuenta',
    });
  }
};

// 9. Consultar Datos de Contacto
export const consultarDatosContactoHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { nss } = req.body;

    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    const hasCredits = await consumeCredits(req.user.id, 1, 'Consultar datos de contacto INFONAVIT');

    if (!hasCredits) {
      res.status(400).json({
        success: false,
        error: 'Créditos insuficientes',
      });
      return;
    }

    const result = await consultarDatosContacto(nss, req.user.id);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error al consultar datos de contacto',
    });
  }
};
