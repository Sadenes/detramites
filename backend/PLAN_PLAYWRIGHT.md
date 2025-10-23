# Plan de Implementación - Playwright para INFONAVIT

## Situación Actual

✅ **Completado:**
- Servicio ScrapFly implementado
- 2 nuevos endpoints (Verificar Cuenta + Datos Contacto)
- Infraestructura lista

❌ **Problema:**
- ScrapFly NO puede bypassear Akamai de INFONAVIT
- Error: `ERR::ASP::SHIELD_PROTECTION_FAILED` (403)

## Solución: Playwright + Stealth

### Paso 1: Instalación (5 min)

```bash
cd backend
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
npx playwright install chromium
```

### Paso 2: Crear Servicio Playwright (30 min)

**Archivo:** `backend/src/services/playwrightService.ts`

```typescript
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

chromium.use(StealthPlugin());

class PlaywrightService {
  private browser: any = null;

  async init() {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async makeRequest(url: string, options: any) {
    const page = await this.browser.newPage();

    // Configurar headers
    await page.setExtraHTTPHeaders(options.headers);

    // Hacer POST request
    const response = await page.evaluate(async ({url, body}) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      return {
        status: res.status,
        data: await res.text()
      };
    }, {url, body: options.body});

    await page.close();
    return response;
  }
}

export default new PlaywrightService();
```

### Paso 3: Migrar Endpoints (1 hora)

Reemplazar llamadas de ScrapFly por Playwright en:
- ✅ verificarCuenta
- ✅ consultarDatosContacto
- ✅ cambiarPassword
- ⏳ Los otros 6 endpoints

### Paso 4: Configurar Railway (15 min)

**Agregar a `railway.json`:**
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Agregar a `Dockerfile` (si es necesario):**
```dockerfile
# Instalar dependencias de Chrome
RUN apt-get update && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils
```

### Paso 5: Testing (30 min)

- Probar cada endpoint localmente
- Verificar que Akamai acepta las requests
- Optimizar timeouts y manejo de errores

## Tiempo Total Estimado

- Instalación: 5 min
- Código: 1.5 horas
- Testing: 30 min
- Deploy: 15 min
- **TOTAL: ~2.5 horas**

## Costos

- Railway Pro: $20/mes (ya lo tienes)
- Uso extra Playwright: ~$5-10/mes
- **TOTAL: $25-30/mes**

## Alternativas Si Falla

1. **Bright Data** ($500/mes) - 99% éxito
2. **ScraperAPI** ($49/mes) - 85% éxito
3. **Proxies residenciales** + Playwright ($50/mes)

## Comandos Rápidos

### Probar localmente:
```bash
npm run build
node dist/test-playwright.js
```

### Deploy a Railway:
```bash
git add .
git commit -m "feat: Implementar Playwright para bypass Akamai"
git push
```

## Contacto con Alternativas

**ScrapFly Premium:**
- Email: support@scrapfly.io
- Mensaje: "Necesito bypass de Akamai para serviciosweb.infonavit.org.mx"

**Bright Data:**
- Web: brightdata.com
- Plan necesario: Web Unblocker ($500/mes)

---

**Decisión Recomendada:** Implementar Playwright primero (2.5 horas, $10/mes extra)
