/**
 * Test simple de ScrapFly - SIN render_js
 */
const axios = require('axios');

const SCRAPFLY_API_KEY = 'scp-live-5fb7ed62e8024e33b9eab1448f372930';

async function testSimple() {
  console.log('🧪 TEST SIMPLE: Consultar Datos de Contacto SIN render_js\n');

  const params = new URLSearchParams({
    key: SCRAPFLY_API_KEY,
    url: 'https://serviciosweb.infonavit.org.mx/RESTAdapter/sndConsultaDatosContactoNT',
    asp: 'true',
    country: 'mx',
    proxy_pool: 'public_residential_pool',
    method: 'POST',
    body: JSON.stringify({ nss: '44220476251', canalConsulta: 'Z4' }),
    'headers[Content-Type]': 'application/json',
    'headers[X-Api-Key]': 'U2FsdGVkX1+eW7Ijv9i9oCct9uET6H+lumIa/sPO2+0+fgG2skYMmx6EY010HRalIGG54lfn4FoFwU6RbH6eDcOA3e7XsM0+56sMwHrlV5lqq4wp7MmHLoPN4LXwSyxr',
    'headers[User-Agent]': 'okhttp/5.1.0',
  });

  try {
    console.log('📤 Enviando request...\n');
    const response = await axios.get(`https://api.scrapfly.io/scrape?${params.toString()}`, {
      timeout: 60000,
    });

    const result = response.data.result;
    console.log('✅ Status HTTP:', result.status_code);
    console.log('📊 Créditos usados:', response.data.config?.cost || 'N/A');
    console.log('📊 ASP activado:', response.data.config?.asp || false);
    console.log('\n📦 Response:\n', result.content);

    // Intentar parsear JSON
    try {
      const data = JSON.parse(result.content);
      console.log('\n✅ JSON parseado correctamente:');
      console.log('  - Cargo:', data.cargo);
      console.log('  - Mensaje:', data.mensaje);
      if (data.datosPrincipales?.[0]) {
        console.log('  - Nombre:', data.datosPrincipales[0].nombre);
        console.log('  - RFC:', data.datosPrincipales[0].rfc);
      }

      if (data.mensaje === 'Consulta Exitosa') {
        console.log('\n🎉 ¡ÉXITO! ScrapFly funcionó correctamente');
        return true;
      }
    } catch (e) {
      console.log('❌ No es JSON válido - probablemente HTML de error');
    }

    return false;
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    return false;
  }
}

testSimple();
