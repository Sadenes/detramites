import axios from 'axios';

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'fb58e433135cb9e6f35ab1d56fba46d7';
const SCRAPER_API_URL = 'https://api.scraperapi.com/';

interface ScraperApiRequestOptions {
  method: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
  isXml?: boolean;
}

interface ScraperApiResponse {
  data: string;
  status: number;
}

/**
 * Realiza una request a través de ScraperAPI para bypasear Akamai Bot Manager
 */
export const makeScraperApiRequest = async (
  url: string,
  options: ScraperApiRequestOptions
): Promise<ScraperApiResponse> => {
  try {
    const { method, body, headers = {}, isXml = false } = options;

    // Configurar headers personalizados para ScraperAPI
    const customHeaders: Record<string, string> = {};

    // Pasar headers originales a ScraperAPI
    Object.keys(headers).forEach((key) => {
      customHeaders[`sapi_${key.toLowerCase().replace(/-/g, '_')}`] = headers[key];
    });

    // Configurar Content-Type
    if (isXml) {
      customHeaders['sapi_content_type'] = 'text/xml; charset=utf-8';
    } else {
      customHeaders['sapi_content_type'] = 'application/json';
    }

    if (method === 'GET') {
      // Para GET, solo pasar la URL
      const response = await axios.get(SCRAPER_API_URL, {
        params: {
          api_key: SCRAPER_API_KEY,
          url,
          device_type: 'desktop',
          premium: 'true',
          country_code: 'mx',
        },
        headers: customHeaders,
        timeout: 60000,
      });

      return {
        data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        status: response.status,
      };
    } else {
      // Para POST, usar el parámetro method=post y enviar el body
      const postData = isXml ? body : JSON.stringify(body);

      const response = await axios.post(
        SCRAPER_API_URL,
        postData,
        {
          params: {
            api_key: SCRAPER_API_KEY,
            url,
            method: 'post',
            device_type: 'desktop',
            premium: 'true',
            country_code: 'mx',
          },
          headers: {
            ...customHeaders,
            'Content-Type': isXml ? 'text/xml; charset=utf-8' : 'application/json',
          },
          timeout: 60000,
        }
      );

      return {
        data: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
        status: response.status,
      };
    }
  } catch (error: any) {
    console.error('ScraperAPI request failed:', error.message);

    // Si ScraperAPI falla, lanzar error con detalles
    if (error.response) {
      throw new Error(`ScraperAPI error (${error.response.status}): ${error.response.data}`);
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
