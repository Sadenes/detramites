import axios from 'axios';

const SCRAPFLY_API_KEY = process.env.SCRAPFLY_API_KEY || 'scp-live-5fb7ed62e8024e33b9eab1448f372930';
const SCRAPFLY_API_URL = 'https://api.scrapfly.io/scrape';

interface ScrapFlyOptions {
  url: string;
  method?: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  asp?: boolean; // Anti-Scraping Protection (Akamai bypass)
  country?: string;
  proxyPool?: string;
  renderJs?: boolean;
}

interface ScrapFlyResponse {
  success: boolean;
  content: string;
  status: number;
  headers: Record<string, string>;
}

/**
 * Servicio para realizar requests a través de ScrapFly
 * ScrapFly maneja automáticamente el bypass de Akamai
 */
export const scrapflyRequest = async (options: ScrapFlyOptions): Promise<ScrapFlyResponse> => {
  try {
    const params = new URLSearchParams({
      key: SCRAPFLY_API_KEY,
      url: options.url,
      asp: options.asp !== false ? 'true' : 'false', // Por defecto activado
      country: options.country || 'mx', // Usar IPs mexicanas
      proxy_pool: options.proxyPool || 'public_residential_pool',
    });

    // Agregar método si es POST
    if (options.method === 'POST') {
      params.append('method', 'POST');
    }

    // Agregar body si existe
    if (options.body) {
      params.append('body', options.body);
    }

    // Agregar headers personalizados
    // ScrapFly requiere formato: headers[HeaderName]=HeaderValue
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        params.append(`headers[${key}]`, value);
      });
    }

    // Renderizar JavaScript si es necesario
    if (options.renderJs) {
      params.append('render_js', 'true');
    }

    const response = await axios.get(`${SCRAPFLY_API_URL}?${params.toString()}`, {
      timeout: 60000, // 60 segundos
    });

    const scrapflyData = response.data;

    return {
      success: true,
      content: scrapflyData.result.content,
      status: scrapflyData.result.status_code,
      headers: scrapflyData.result.response_headers || {},
    };
  } catch (error: any) {
    console.error('ScrapFly error:', error.response?.data || error.message);

    // Si ScrapFly falla, lanzar error con detalles
    throw new Error(
      error.response?.data?.error || error.message || 'Error en ScrapFly'
    );
  }
};

/**
 * Request JSON a través de ScrapFly
 */
export const scrapflyJsonRequest = async (
  url: string,
  data: any,
  headers: Record<string, string> = {}
): Promise<any> => {
  const response = await scrapflyRequest({
    url,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  return JSON.parse(response.content);
};

/**
 * Request XML/SOAP a través de ScrapFly
 */
export const scrapflyXmlRequest = async (
  url: string,
  xmlBody: string,
  headers: Record<string, string> = {}
): Promise<string> => {
  const response = await scrapflyRequest({
    url,
    method: 'POST',
    body: xmlBody,
    headers: {
      'Content-Type': 'text/xml',
      ...headers,
    },
  });

  return response.content;
};
