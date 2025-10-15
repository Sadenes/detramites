import axios, { AxiosError } from 'axios';
import https from 'https';
import AdmZip from 'adm-zip';
import { getRandomUserAgent } from '../utils/userAgents';
import { refundCredits } from './creditService';
import prisma from '../utils/prisma';
import { QueryStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Agente HTTPS que ignora certificados autofirmados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Utilidad para generar caracteres aleatorios
const generateRandomChars = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Utilidad para esperar (delay)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utilidad para verificar si debe reembolsarse por error
const shouldRefund = (error: any, status?: number): boolean => {
  // Errores 5xx
  if (status && [500, 502, 503, 504].includes(status)) return true;

  // Timeout
  if (error.code === 'ECONNABORTED') return true;

  // Error de parsing
  if (error.message?.includes('parse')) return true;

  return false;
};

// Utilidad para registrar query y manejar devolución de créditos
const handleQueryError = async (
  queryId: string,
  userId: string,
  creditCost: number,
  error: any
): Promise<void> => {
  const status = error.response?.status;

  if (shouldRefund(error, status)) {
    await refundCredits(userId, creditCost, `Devolución por fallo en consulta: ${error.message}`);

    await prisma.apiQuery.update({
      where: { id: queryId },
      data: {
        status: QueryStatus.REFUNDED,
        errorMsg: error.message,
      },
    });
  } else {
    await prisma.apiQuery.update({
      where: { id: queryId },
      data: {
        status: QueryStatus.FAILED,
        errorMsg: error.message,
      },
    });
  }
};

// 1. CAMBIAR CONTRASEÑA
export const cambiarPassword = async (nss: string, userId: string): Promise<any> => {
  const newPassword = nss + generateRandomChars(4);

  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/cambiar-password',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 1,
    },
  });

  try {
    const response = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/CambiarPwdMailSDS',
      {
        ID_CAT_APP: 'APL0211',
        grupo: 'cn=GS_MICUENTA,ou=atencionservicios,ou=areasapoyo,O=INFONAVIT',
        usuario: nss,
        valor: newPassword,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': getRandomUserAgent(),
          'X-Api-Key': process.env.INFONAVIT_API_KEY || '',
        },
        timeout: 30000,
      }
    );

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: response.data,
      },
    });

    return {
      success: true,
      newPassword,
      message: 'Contraseña actualizada correctamente',
      response: response.data,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 2. DESVINCULACIÓN DE DISPOSITIVO
export const desvincularDispositivo = async (nss: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/desvincular-dispositivo',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 1,
    },
  });

  try {
    const response = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/RealizaDesvinculacionSDS',
      {
        ID_CAT_APP: 'APL0211',
        grupo: 'cn=GS_MICUENTA,ou=atencionservicios,ou=areasapoyo,O=INFONAVIT',
        nss,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': getRandomUserAgent(),
        },
        timeout: 30000,
      }
    );

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: response.data,
      },
    });

    return {
      success: true,
      message: 'Dispositivo desvinculado correctamente',
      response: response.data,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 3. CONSULTAR AVISOS (2 requests secuenciales)
export const consultarAvisos = async (credito: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/consultar-avisos',
      status: QueryStatus.PENDING,
      request: { credito },
      creditCost: 1,
    },
  });

  try {
    // Primera request
    const response1 = await axios.post(
      'https://gtwservices.infonavit.org.mx:8065/aviretsus/websocket/document',
      {
        credito,
        nrp: '',
      },
      {
        headers: {
          IDSISTEMA: 'APL0211',
          KeyId: 'c1176b68-a9e0-46f2-a7a7-a7f6c13f6cc8',
          'Content-Type': 'application/json',
        },
        httpsAgent,
        timeout: 30000,
      }
    );

    // Esperar 2 segundos
    await sleep(2000);

    // Segunda request (mismo payload)
    const response2 = await axios.post(
      'https://gtwservices.infonavit.org.mx:8065/aviretsus/websocket/document',
      {
        credito,
        nrp: '',
      },
      {
        headers: {
          IDSISTEMA: 'APL0211',
          KeyId: 'c1176b68-a9e0-46f2-a7a7-a7f6c13f6cc8',
          'Content-Type': 'application/json',
        },
        httpsAgent,
        timeout: 30000,
      }
    );

    // Descomprimir ZIP y extraer PDFs
    const zipBase64 = response2.data.contenido.pdf;
    const zipBuffer = Buffer.from(zipBase64, 'base64');
    const zip = new AdmZip(zipBuffer);

    const pdfs: any[] = [];
    const zipEntries = zip.getEntries();

    zipEntries.forEach((entry) => {
      if (entry.entryName.endsWith('.pdf')) {
        pdfs.push({
          filename: entry.entryName,
          data: entry.getData().toString('base64'),
        });
      }
    });

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { pdfCount: pdfs.length },
      },
    });

    return {
      success: true,
      pdfs,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 4. ESTADO DE CUENTA MENSUAL
export const estadoCuentaMensual = async (
  credito: string,
  periodos: string[],
  userId: string,
  token?: string
): Promise<any> => {
  const totalCost = periodos.length;

  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/estado-mensual',
      status: QueryStatus.PENDING,
      request: { credito, periodos },
      creditCost: totalCost,
    },
  });

  try {
    // 4.1 Consultar periodos disponibles
    const periodosDisponibles = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndPeriodosDisponiblesAppMovil',
      { credito },
      {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    // Si no se especificaron períodos, solo retornar los disponibles
    if (periodos.length === 0) {
      await prisma.apiQuery.update({
        where: { id: queryRecord.id },
        data: {
          status: QueryStatus.COMPLETED,
          response: { availablePeriods: periodosDisponibles.data },
        },
      });

      return {
        success: true,
        availablePeriods: periodosDisponibles.data,
      };
    }

    // 4.2 Por cada periodo, obtener estado de cuenta
    const pdfs: any[] = [];
    const errors: any[] = [];

    for (const periodo of periodos) {
      try {
        const response = await axios.post(
          'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndEdoCuentaMensualConsultar',
          {
            numeroCredito: credito,
            periodo,
          },
          {
            headers: {
              Authorization: `Bearer ${token || ''}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        // Verificar código de respuesta
        if (response.data.StatusServicio.codigo === '02') {
          errors.push({
            periodo,
            message: 'Este crédito no tiene información para este periodo',
          });
          // Devolver 1 crédito por este periodo
          await refundCredits(
            userId,
            1,
            `Devolución: periodo ${periodo} sin información`
          );
        } else if (response.data.reporte) {
          pdfs.push({
            periodo,
            filename: `estado_mensual_${credito}_${periodo}.pdf`,
            data: response.data.reporte,
          });
        }
      } catch (error: any) {
        errors.push({
          periodo,
          error: error.message,
        });

        // Devolver 1 crédito por este periodo fallido
        if (shouldRefund(error, error.response?.status)) {
          await refundCredits(userId, 1, `Devolución: error en periodo ${periodo}`);
        }
      }
    }

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { pdfCount: pdfs.length, errors },
      },
    });

    return {
      success: true,
      pdfs,
      errors,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, totalCost, error);
    throw error;
  }
};

// 5. ESTADO DE CUENTA HISTÓRICO
export const estadoCuentaHistorico = async (credito: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/estado-historico',
      status: QueryStatus.PENDING,
      request: { credito },
      creditCost: 1,
    },
  });

  try {
    const response = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndEdoCuentaHistoricoConsultar',
      { numeroCredito: credito },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        },
        timeout: 30000,
      }
    );

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { status: response.data.StatusServicio },
      },
    });

    return {
      success: true,
      pdf: {
        filename: `historico_${credito}.pdf`,
        data: response.data.reporte,
      },
      response: response.data,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 6. RESUMEN DE MOVIMIENTOS (2 requests automáticas)
export const resumenMovimientos = async (nss: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/resumen-movimientos',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 1,
    },
  });

  try {
    // Request 1: Solicitar ticket
    const response1 = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/ServOrqResMov/SndReqTicketSummaryMovSSV',
      {
        docFa: 0,
        docTodo: 1,
        docViv92: 0,
        docViv97Todo: 0,
        emailDh: '',
        idSistema: 4,
        nombreDh: '',
        nss,
        subCatA: 0,
        subCatB: 0,
        subCatC: 0,
        tipoFormato: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'User-Agent': 'okhttp/4.12.0',
        },
        timeout: 30000,
      }
    );

    // Esperar 3 segundos
    await sleep(3000);

    // Request 2: Obtener resumen
    const response2 = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/ServOrqResMov/SndReqSummaryMovSSV',
      {
        nss,
        ticket: '',
      },
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        },
        timeout: 30000,
      }
    );

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { codeOp: response2.data.codeOp, message: response2.data.message },
      },
    });

    return {
      success: true,
      pdf: {
        filename: `${nss}_resumen_movs.pdf`,
        data: response2.data.pdf,
      },
      response: response2.data,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 7. BUSCAR CRÉDITO POR NSS
export const buscarCreditoPorNSS = async (nss: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/buscar-credito',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 1,
    },
  });

  try {
    const response = await axios.post(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/GetPrfoNss/Login/',
      { IP_CV_NSS: nss },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'okhttp/5.1.0',
        },
        timeout: 30000,
      }
    );

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: response.data,
      },
    });

    // Formatear respuesta en 2 tablas
    const data = response.data[0]; // Asumiendo que devuelve un array

    const tabla1 = {
      'NSS': data.nss || 'N/A',
      'Número de Crédito': data.num_credito || 'N/A',
      'Tipo de Crédito': data.tipo_credito || 'N/A',
      'Producto': data.producto || 'N/A',
      'Estatus Crédito': data.estatus_credito || 'N/A',
      'Situación Crédito': data.situacioncredito || 'N/A',
      'Meses Omisos': data.mesesomisos || '0',
      'Régimen': data.regimen || 'N/A',
      'Moneda': data.moneda || 'N/A',
      'Fecha Origen': data.fechaOrigen || 'N/A',
      'Marca Fallecido': data.marcaDeFallecido || 'N/A',
      'Marca Prórroga': data.marcadeprorrogavigente || 'N/A',
      'Marca Cierre': data.marcadecierre || 'N/A',
    };

    const tabla2 = {
      'Nombre Completo': `${data.nombre || ''} ${data.apPaterno || ''} ${data.apMaterno || ''}`.trim() || 'N/A',
      'RFC': data.rfc || 'N/A',
      'CURP': data.scurp || 'N/A',
      'Teléfono Celular': data.telefonoCelular || 'N/A',
      'Email Personal': data.emailPersonal || 'N/A',
    };

    return {
      success: true,
      data: {
        tabla1,
        tabla2,
        raw: data,
      },
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};
