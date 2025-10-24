import axios from 'axios';

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'fb58e433135cb9e6f35ab1d56fba46d7';

interface ScraperApiRequestOptions {
  method: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  isXml?: boolean;
  ultraPremium?: boolean;
}

interface ScraperApiResponse {
  data: string;
  status: number;
}

/**
 * Realiza una request a través de ScraperAPI para bypasear Akamai Bot Manager
 *
 * ScraperAPI requiere formato especial para POST:
 * - Headers personalizados van con prefijo "X-"
 * - Body se envía directamente en el request body
 * - URL y parámetros van en query string
 */
export const makeScraperApiRequest = async (
  url: string,
  options: ScraperApiRequestOptions
): Promise<ScraperApiResponse> => {
  try {
    const { method, body, headers = {}, isXml = false, ultraPremium = false } = options;

    // Construir headers personalizados para ScraperAPI (sin prefijo sapi_)
    const customHeaders: Record<string, string> = {};

    Object.keys(headers).forEach((key) => {
      customHeaders[key] = headers[key];
    });

    if (method === 'GET') {
      // Para GET
      const params: any = {
        api_key: SCRAPER_API_KEY,
        url,
        country_code: 'mx',
      };

      if (ultraPremium) {
        params.ultra_premium = 'true';
      } else {
        params.premium = 'true';
      }

      const response = await axios.get('https://api.scraperapi.com/', {
        params,
        headers: customHeaders,
        timeout: 60000,
      });

      return {
        data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        status: response.status,
      };
    } else {
      // Para POST - enviar body directamente con headers custom
      const postData = isXml ? body : JSON.stringify(body);

      const finalHeaders: Record<string, string> = {
        'Content-Type': isXml ? 'text/xml; charset=utf-8' : 'application/json',
      };

      // Agregar headers originales
      Object.keys(headers).forEach((key) => {
        finalHeaders[key] = headers[key];
      });

      const params: any = {
        api_key: SCRAPER_API_KEY,
        url: url,
        country_code: 'mx',
      };

      if (ultraPremium) {
        params.ultra_premium = 'true';
      } else {
        params.premium = 'true';
      }

      // Log detallado de la request
      console.log('=== ScraperAPI POST Request Debug ===');
      console.log('Target URL:', url);
      console.log('Params:', JSON.stringify(params, null, 2));
      console.log('Headers:', JSON.stringify(finalHeaders, null, 2));
      console.log('Body (first 500 chars):', typeof postData === 'string' ? postData.substring(0, 500) : JSON.stringify(postData).substring(0, 500));
      console.log('Body type:', typeof postData);
      console.log('Body length:', typeof postData === 'string' ? postData.length : JSON.stringify(postData).length);
      console.log('=====================================');

      const response = await axios({
        method: 'POST',
        url: 'https://api.scraperapi.com/',
        params,
        data: postData,
        headers: finalHeaders,
        timeout: 60000,
      });

      return {
        data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        status: response.status,
      };
    }
  } catch (error: any) {
    console.error('=== ScraperAPI Error Debug ===');
    console.error('Error message:', error.message);
    console.error('Response status:', error.response?.status);
    console.error('Response data:', error.response?.data);
    console.error('Request config:', {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      headers: error.config?.headers,
      data: typeof error.config?.data === 'string' ? error.config?.data.substring(0, 500) : JSON.stringify(error.config?.data).substring(0, 500),
    });
    console.error('==============================');

    // Si ScraperAPI falla, lanzar error con detalles
    if (error.response) {
      const errorMsg = typeof error.response.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response.data);
      throw new Error(`ScraperAPI error (${error.response.status}): ${errorMsg}`);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('ScraperAPI timeout - request took too long');
    } else {
      throw new Error(`ScraperAPI error: ${error.message}`);
    }
  }
};

export default {
  makeRequest: makeScraperApiRequest,
};
