import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Aplicar plugin stealth para bypass de Akamai
chromium.use(StealthPlugin());

class PlaywrightService {
  private browser: any = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--disable-features=BlockInsecurePrivateNetworkRequests',
        ],
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async makeRequest(
    url: string,
    options: {
      method?: 'GET' | 'POST';
      body?: any;
      headers?: Record<string, string>;
      isXml?: boolean;
    }
  ): Promise<{ status: number; data: string }> {
    await this.init();

    const context = await this.browser!.newContext({
      userAgent: options.headers?.['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      extraHTTPHeaders: options.headers || {},
      viewport: { width: 1920, height: 1080 },
      locale: 'es-MX',
      timezoneId: 'America/Mexico_City',
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Agregar scripts de evasión adicionales
    await page.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // @ts-ignore
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // @ts-ignore
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-MX', 'es', 'en-US', 'en'],
      });

      // @ts-ignore
      window.chrome = {
        runtime: {},
      };

      // @ts-ignore
      const originalQuery = window.navigator.permissions.query;
      // @ts-ignore
      window.navigator.permissions.query = (parameters) =>
        parameters.name === 'notifications'
          // @ts-ignore
          ? Promise.resolve({ state: 'denied' })
          : originalQuery(parameters);
    });

    try {
      // Navegar primero a la página principal para generar cookies Akamai
      await page.goto('https://serviciosweb.infonavit.org.mx', {
        waitUntil: 'networkidle',
        timeout: 60000,
      });

      // Esperar 8 segundos para que se generen las cookies Akamai
      await page.waitForTimeout(8000);

      // Hacer scroll y movimiento de mouse para parecer más humano
      await page.evaluate(() => {
        // @ts-ignore
        window.scrollTo(0, 100);
      });
      await page.waitForTimeout(500);

      // Usar page.request en vez de fetch dentro de evaluate
      const response = await page.request.post(url, {
        data: options.isXml ? options.body : options.body,
        headers: {
          'Content-Type': options.isXml ? 'text/xml' : 'application/json',
          ...options.headers,
        },
      });

      const responseText = await response.text();
      const status = response.status();

      await page.close();
      await context.close();

      // Si recibimos HTML (Akamai bloqueando), lanzar error específico
      if (status === 403 || responseText.includes('<HTML>') || responseText.includes('Access Denied')) {
        throw new Error(`Akamai bloqueó la request (${status}): ${responseText.substring(0, 200)}`);
      }

      return {
        status,
        data: responseText,
      };
    } catch (error: any) {
      await page.close();
      await context.close();
      throw error;
    }
  }
}

export default new PlaywrightService();
