import axios, { AxiosError } from 'axios';
import https from 'https';
import AdmZip from 'adm-zip';
import { getRandomUserAgent } from '../utils/userAgents';
import { refundCredits } from './creditService';
import prisma from '../utils/prisma';
import { QueryStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { scrapflyJsonRequest, scrapflyXmlRequest } from './scrapflyService';
import { parseStringPromise } from 'xml2js';
import playwrightService from './playwrightService';

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

// 1. CAMBIAR CONTRASEÑA (MIGRADO A PLAYWRIGHT)
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
    const result = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/CambiarPwdMailSDS',
      {
        method: 'POST',
        body: {
          ID_CAT_APP: 'APL0211',
          grupo: 'cn=GS_MICUENTA,ou=atencionservicios,ou=areasapoyo,O=INFONAVIT',
          usuario: nss,
          valor: newPassword,
        },
        headers: {
          'X-Api-Key': process.env.INFONAVIT_API_KEY || '',
          'User-Agent': 'okhttp/5.1.0',
        },
      }
    );

    const response = JSON.parse(result.data);

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: response,
      },
    });

    return {
      success: true,
      newPassword,
      message: 'Contraseña actualizada correctamente',
      response,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 2. DESVINCULACIÓN DE DISPOSITIVO (MIGRADO A PLAYWRIGHT)
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
    // Paso 1: Desvincular dispositivo con Playwright
    const result = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/RealizaDesvinculacionSDS',
      {
        method: 'POST',
        body: {
          ID_CAT_APP: 'APL0211',
          grupo: 'cn=GS_MICUENTA,ou=atencionservicios,ou=areasapoyo,O=INFONAVIT',
          nss,
        },
        headers: {
          'User-Agent': 'okhttp/5.1.0',
        },
      }
    );

    const response = JSON.parse(result.data);

    // Paso 2: Cambiar contraseña automáticamente
    const newPassword = nss + generateRandomChars(4);

    try {
      await playwrightService.makeRequest(
        'https://serviciosweb.infonavit.org.mx/RESTAdapter/CambiarPwdMailSDS',
        {
          method: 'POST',
          body: {
            ID_CAT_APP: 'APL0211',
            grupo: 'cn=GS_MICUENTA,ou=atencionservicios,ou=areasapoyo,O=INFONAVIT',
            usuario: nss,
            valor: newPassword,
          },
          headers: {
            'X-Api-Key': process.env.INFONAVIT_API_KEY || '',
            'User-Agent': 'okhttp/5.1.0',
          },
        }
      );
    } catch (passwordError: any) {
      console.error('Error al cambiar contraseña después de desvinculación:', passwordError);
    }

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { ...response, newPassword },
      },
    });

    return {
      success: true,
      message: 'Dispositivo desvinculado y contraseña actualizada correctamente',
      newPassword,
      response,
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
        timeout: 15000,
      }
    );

    // Esperar 1 segundo (optimizado)
    await sleep(1000);

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
        timeout: 15000,
      }
    );

    // Validar respuesta del servidor
    if (!response2.data || !response2.data.contenido) {
      await prisma.apiQuery.update({
        where: { id: queryRecord.id },
        data: {
          status: QueryStatus.FAILED,
          errorMsg: 'Respuesta inválida del servidor INFONAVIT',
        },
      });

      throw new Error('Respuesta inválida del servidor INFONAVIT');
    }

    // Verificar si hay un error en la respuesta (status diferente de 200 o sin PDF)
    const contenido = response2.data.contenido;
    if (contenido.status && contenido.status !== 200) {
      const errorMessage = contenido.message || 'Error desconocido al consultar avisos';

      await prisma.apiQuery.update({
        where: { id: queryRecord.id },
        data: {
          status: QueryStatus.FAILED,
          errorMsg: `Error ${contenido.status}: ${errorMessage}`,
        },
      });

      throw new Error(errorMessage);
    }

    // Verificar que exista el PDF
    if (!contenido.pdf) {
      await prisma.apiQuery.update({
        where: { id: queryRecord.id },
        data: {
          status: QueryStatus.FAILED,
          errorMsg: 'No se encontraron avisos de retención para este crédito',
        },
      });

      throw new Error('No se encontraron avisos de retención para este crédito');
    }

    // Descomprimir ZIP y extraer PDFs
    const zipBase64 = contenido.pdf;
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

// 4. ESTADO DE CUENTA MENSUAL (MIGRADO A PLAYWRIGHT)
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
    // 4.1 Consultar periodos disponibles con Playwright
    const result1 = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndPeriodosDisponiblesAppMovil',
      {
        method: 'POST',
        body: { credito },
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      }
    );

    const periodosDisponibles = JSON.parse(result1.data);

    // Si no se especificaron períodos, solo retornar los disponibles
    if (periodos.length === 0) {
      await prisma.apiQuery.update({
        where: { id: queryRecord.id },
        data: {
          status: QueryStatus.COMPLETED,
          response: { availablePeriods: periodosDisponibles },
        },
      });

      return {
        success: true,
        availablePeriods: periodosDisponibles,
      };
    }

    // 4.2 Por cada periodo, obtener estado de cuenta (en paralelo)
    const pdfs: any[] = [];
    const errors: any[] = [];

    // Ejecutar todas las requests en paralelo usando Playwright
    const results = await Promise.allSettled(
      periodos.map(async (periodo) => {
        const result = await playwrightService.makeRequest(
          'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndEdoCuentaMensualConsultar',
          {
            method: 'POST',
            body: {
              numeroCredito: credito,
              periodo,
            },
            headers: {
              Authorization: `Bearer ${token || ''}`,
            },
          }
        );
        const response = JSON.parse(result.data);
        return { periodo, response };
      })
    );

    // Procesar resultados
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const periodo = periodos[i];

      if (result.status === 'fulfilled') {
        const { response } = result.value;

        // Verificar código de respuesta
        if (response.StatusServicio.codigo === '02') {
          errors.push({
            periodo,
            message: 'Este crédito no tiene información para este periodo',
          });
          await refundCredits(
            userId,
            1,
            `Devolución: periodo ${periodo} sin información`
          );
        } else if (response.reporte) {
          pdfs.push({
            periodo,
            filename: `estado_mensual_${credito}_${periodo}.pdf`,
            data: response.reporte,
          });
        }
      } else {
        const error = result.reason;
        errors.push({
          periodo,
          error: error.message,
        });

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

// 5. ESTADO DE CUENTA HISTÓRICO (MIGRADO A PLAYWRIGHT)
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
    const result = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/SndEdoCuentaHistoricoConsultar',
      {
        method: 'POST',
        body: { numeroCredito: credito },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const response = JSON.parse(result.data);

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { status: response.StatusServicio },
      },
    });

    return {
      success: true,
      pdf: {
        filename: `historico_${credito}.pdf`,
        data: response.reporte,
      },
      response,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 6. RESUMEN DE MOVIMIENTOS (2 requests automáticas - MIGRADO A PLAYWRIGHT)
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
    // Request 1: Solicitar ticket con Playwright
    await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/ServOrqResMov/SndReqTicketSummaryMovSSV',
      {
        method: 'POST',
        body: {
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
        headers: {
          'User-Agent': 'okhttp/4.12.0',
        },
      }
    );

    // Esperar 1.5 segundos
    await sleep(1500);

    // Request 2: Obtener resumen con Playwright
    const result2 = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/ServOrqResMov/SndReqSummaryMovSSV',
      {
        method: 'POST',
        body: {
          nss,
          ticket: '',
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    const response2 = JSON.parse(result2.data);

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { codeOp: response2.codeOp, message: response2.message },
      },
    });

    return {
      success: true,
      pdf: {
        filename: `${nss}_resumen_movs.pdf`,
        data: response2.pdf,
      },
      response: response2,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 8. VERIFICACIÓN DE CUENTA (GRATIS - NO CONSUME CRÉDITOS) - PLAYWRIGHT
export const verificarCuenta = async (nss: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/verificar-cuenta',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 0, // GRATIS
    },
  });

  try {
    const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mci2="http://mci2-registro.jaxws.infonavit.org.mx">
   <soapenv:Header/>
   <soapenv:Body>
      <mci2:validaNss>
         <arg0>
            <nss>${nss}</nss>
         </arg0>
      </mci2:validaNss>
   </soapenv:Body>
</soapenv:Envelope>`;

    const response = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/wps/MCI2-RegistroWS/jaxservicesNT',
      {
        method: 'POST',
        body: soapEnvelope,
        headers: {
          'Accept-Charset': 'utf-8',
          'X-Api-Key': process.env.INFONAVIT_API_KEY || '',
        },
        isXml: true,
      }
    );

    const xmlResponse = response.data;

    // Parsear XML a JSON
    const parsed = await parseStringPromise(xmlResponse, { explicitArray: false });
    const returnData = parsed['S:Envelope']['S:Body']['ns2:validaNssResponse']['return'];

    // Formatear respuesta en tabla
    const tabla = {
      'Código': returnData.codigo || 'N/A',
      'Descripción': returnData.descripcion || 'N/A',
      'NSS (Respuesta)': returnData.nss || 'N/A',
      'Paso Actual': returnData.pasoActual || 'N/A',
      'Apellido Materno': returnData.usuario?.apellidoMaterno || 'N/A',
      'Apellido Paterno': returnData.usuario?.apellidoPaterno || 'N/A',
      'CURP': returnData.usuario?.curp || 'N/A',
      'Existe en LDAP': returnData.usuario?.existeEnLdap || 'N/A',
      'Nombre': returnData.usuario?.nombre || 'N/A',
      'NSS': returnData.usuario?.nss || 'N/A',
      'Perdió Código Verificador': returnData.usuario?.perdioCodigoVerificador || 'N/A',
      'RFC': returnData.usuario?.rfc || 'N/A',
    };

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { tabla },
      },
    });

    return {
      success: true,
      data: tabla,
      raw: returnData,
    };
  } catch (error: any) {
    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.FAILED,
        errorMsg: error.message,
      },
    });
    throw error;
  }
};

// 9. CONSULTA DATOS DE CONTACTO - PLAYWRIGHT
export const consultarDatosContacto = async (nss: string, userId: string): Promise<any> => {
  const queryRecord = await prisma.apiQuery.create({
    data: {
      userId,
      endpoint: '/infonavit/consultar-datos-contacto',
      status: QueryStatus.PENDING,
      request: { nss },
      creditCost: 1,
    },
  });

  try {
    const result = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/sndConsultaDatosContactoNT',
      {
        method: 'POST',
        body: {
          nss,
          canalConsulta: 'Z4',
        },
        headers: {
          'X-Api-Key': process.env.INFONAVIT_API_KEY || '',
          'User-Agent': 'okhttp/5.1.0',
        },
      }
    );

    const response = JSON.parse(result.data);

    // Formatear respuesta en tabla
    const datosPrincipales = response.datosPrincipales?.[0] || {};
    const datosContacto = response.datosContacto?.[0] || {};

    const tabla = {
      'Cargo': response.cargo || 'N/A',
      'Mensaje': response.mensaje || 'N/A',
      'Nombre': datosPrincipales.nombre || 'N/A',
      'Apellido Paterno': datosPrincipales.apPaterno || 'N/A',
      'Apellido Materno': datosPrincipales.apMaterno || 'N/A',
      'RFC': datosPrincipales.rfc || 'N/A',
      'CURP': datosPrincipales.curp || 'N/A',
      'Teléfono Celular': datosContacto.telefonoCelular || 'N/A',
      'Teléfono Residencial': datosContacto.telefonoResidencial || 'N/A',
      'Email Personal': datosContacto.emailPersonal || 'N/A',
      'Email Alternativo': datosContacto.emailAlternativo || 'N/A',
      'Nombre Referencial': datosContacto.nombreReferencial || 'N/A',
      'Apellido Paterno Referencial': datosContacto.apPaternoReferencial || 'N/A',
      'Apellido Materno Referencial': datosContacto.apMaternoReferencial || 'N/A',
      'Teléfono Celular Referencial': datosContacto.telefonoCelularReferencial || 'N/A',
      'Domicilio Calle': datosContacto.DomicilioCalle || 'N/A',
      'Domicilio No. Exterior': datosContacto.DomicilioNoExterior || 'N/A',
      'Domicilio No. Interior': datosContacto.DomicilioNoInterior || 'N/A',
      'Domicilio Código Postal': datosContacto.DomicilioCodigoPostal || 'N/A',
      'Domicilio Colonia': datosContacto.DomicilioColonia || 'N/A',
      'Domicilio Delegación': datosContacto.DomicilioDelegacion || 'N/A',
      'Domicilio Estado República': datosContacto.DomicilioEstadoRepublica || 'N/A',
      'Domicilio ID Estado República': datosContacto.DomicilioIdEstadoRepublica || 'N/A',
    };

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response: { tabla },
      },
    });

    return {
      success: true,
      data: tabla,
      raw: response,
    };
  } catch (error: any) {
    await handleQueryError(queryRecord.id, userId, 1, error);
    throw error;
  }
};

// 7. BUSCAR CRÉDITO POR NSS (MIGRADO A PLAYWRIGHT)
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
    const result = await playwrightService.makeRequest(
      'https://serviciosweb.infonavit.org.mx/RESTAdapter/GetPrfoNss/Login/',
      {
        method: 'POST',
        body: { IP_CV_NSS: nss },
        headers: {
          'User-Agent': 'okhttp/5.1.0',
        },
      }
    );

    const response = JSON.parse(result.data);

    await prisma.apiQuery.update({
      where: { id: queryRecord.id },
      data: {
        status: QueryStatus.COMPLETED,
        response,
      },
    });

    // Formatear respuesta en 2 tablas
    const data = response[0]; // Asumiendo que devuelve un array

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
