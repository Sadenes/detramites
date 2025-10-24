// Test de Playwright con stealth plugin para bypass de Akamai
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

chromium.use(StealthPlugin());

async function testAkamaiBypass() {
  console.log('🚀 Iniciando prueba con Playwright + Stealth Plugin...\n');

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
  });

  const page = await context.newPage();

  try {
    console.log('📍 Paso 1: Navegando a página principal de INFONAVIT...');
    await page.goto('https://serviciosweb.infonavit.org.mx', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('✅ Navegación exitosa\n');

    console.log('⏳ Paso 2: Esperando 5 segundos para cookies Akamai...');
    await page.waitForTimeout(5000);

    const cookies = await context.cookies();
    const akamaiCookies = cookies.filter(c => c.name.includes('bm_') || c.name.includes('_abck') || c.name.includes('ak_'));
    console.log(`✅ Cookies generadas: ${akamaiCookies.length > 0 ? akamaiCookies.map(c => c.name).join(', ') : 'Ninguna cookie Akamai'}\n`);

    console.log('📡 Paso 3: Ejecutando request de verificación de cuenta...');
    const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:mci2="http://mci2-registro.jaxws.infonavit.org.mx">
   <soapenv:Header/>
   <soapenv:Body>
      <mci2:validaNss>
         <arg0>
            <nss>12345678901</nss>
         </arg0>
      </mci2:validaNss>
   </soapenv:Body>
</soapenv:Envelope>`;

    const response = await page.evaluate(
      async ({ url, body }) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml',
            'Accept-Charset': 'utf-8',
          },
          body: body,
        });

        return {
          status: res.status,
          statusText: res.statusText,
          data: await res.text(),
        };
      },
      {
        url: 'https://serviciosweb.infonavit.org.mx/wps/MCI2-RegistroWS/jaxservicesNT',
        body: soapEnvelope,
      }
    );

    console.log(`✅ Response Status: ${response.status} ${response.statusText}\n`);

    if (response.status === 200) {
      console.log('🎉 ÉXITO: Akamai bypass funcional con Stealth Plugin!\n');
      console.log('Primeros 500 caracteres de respuesta:');
      console.log(response.data.substring(0, 500));
      console.log('\n✅ ¡Playwright está funcionando correctamente!');
    } else if (response.status === 403) {
      console.log('❌ FALLO: Akamai bloqueó la request (403 Forbidden)');
      console.log('Primeros 500 caracteres:', response.data.substring(0, 500));
    } else {
      console.log(`⚠️  Status inesperado: ${response.status}`);
      console.log('Respuesta:', response.data.substring(0, 500));
    }

    await browser.close();
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    await browser.close();
    return false;
  }
}

testAkamaiBypass()
  .then((success) => {
    console.log(success ? '\n✅ Prueba exitosa' : '\n❌ Prueba fallida');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
