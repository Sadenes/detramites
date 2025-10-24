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
    });

    const page = await context.newPage();

    try {
      // Navegar primero a la página principal para generar cookies Akamai
      await page.goto('https://serviciosweb.infonavit.org.mx', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Esperar 5 segundos para que se generen las cookies Akamai (stealth plugin)
      await page.waitForTimeout(5000);

      // Ahora hacer el POST request con las cookies ya generadas
      const response = await page.evaluate(
        async ({ url, body, headers, isXml }) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': isXml ? 'text/xml' : 'application/json',
              ...headers,
            },
            body: isXml ? body : JSON.stringify(body),
          });

          return {
            status: res.status,
            data: await res.text(),
          };
        },
        {
          url,
          body: options.body,
          headers: options.headers || {},
          isXml: options.isXml || false,
        }
      );

      await page.close();
      await context.close();

      return response;
    } catch (error: any) {
      await page.close();
      await context.close();
      throw error;
    }
  }
}

export default new PlaywrightService();
