/**
 * Script para probar ScrapFly con INFONAVIT
 *
 * Uso: node test-scrapfly.js
 */

const axios = require('axios');

const SCRAPFLY_API_KEY = 'scp-live-5fb7ed62e8024e33b9eab1448f372930';
const SCRAPFLY_API_URL = 'https://api.scrapfly.io/scrape';

// Test 1: Verificar Cuenta (SOAP/XML) - GRATIS
async function testVerificarCuenta() {
  console.log('\n========== TEST 1: Verificar Cuenta (GRATIS) ==========');

  const nss = '30038212277';
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

  const params = new URLSearchParams({
    key: SCRAPFLY_API_KEY,
    url: 'https://serviciosweb.infonavit.org.mx/wps/MCI2-RegistroWS/jaxservicesNT',
    asp: 'true',
    country: 'mx',
    proxy_pool: 'public_residential_pool',
    method: 'POST',
    body: soapEnvelope,
    'headers[Content-Type]': 'text/xml',
    'headers[Accept-Charset]': 'utf-8',
    'headers[X-Api-Key]': 'U2FsdGVkX1+eW7Ijv9i9oCct9uET6H+lumIa/sPO2+0+fgG2skYMmx6EY010HRalIGG54lfn4FoFwU6RbH6eDcOA3e7XsM0+56sMwHrlV5lqq4wp7MmHLoPN4LXwSyxr',
    // Activar JavaScript rendering para generar cookies Akamai
    render_js: 'true',
    rendering_wait: '5000', // Esperar 5 segundos
    // Usar sesión para mantener cookies
    session: 'infonavit_test_session',
    session_sticky_proxy: 'true',
  });

  try {
    console.log('🚀 Enviando request a ScrapFly...');
    const response = await axios.get(`${SCRAPFLY_API_URL}?${params.toString()}`, {
      timeout: 60000,
    });

    console.log('✅ Status:', response.data.result.status_code);
    console.log('📊 Créditos usados:', response.data.config?.cost || 'N/A');
    console.log('📊 ASP Score:', response.data.result?.asp_score || 'N/A');
    console.log('📦 Response preview:', response.data.result.content.substring(0, 200) + '...');

    // Verificar si contiene datos esperados
    if (response.data.result.content.includes('validaNssResponse')) {
      console.log('✅ ÉXITO: Recibió respuesta válida de INFONAVIT');
      console.log('📊 Créditos usados:', response.data.config.cost || 'N/A');
      return true;
    } else {
      console.log('❌ ERROR: Respuesta no contiene datos esperados');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Consultar Datos de Contacto (JSON)
async function testDatosContacto() {
  console.log('\n========== TEST 2: Consultar Datos de Contacto ==========');

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
    // Activar JavaScript rendering para generar cookies Akamai
    render_js: 'true',
    rendering_wait: '5000', // Esperar 5 segundos
    // Usar sesión para mantener cookies
    session: 'infonavit_test_session',
    session_sticky_proxy: 'true',
  });

  try {
    console.log('🚀 Enviando request a ScrapFly...');
    const response = await axios.get(`${SCRAPFLY_API_URL}?${params.toString()}`, {
      timeout: 60000,
    });

    console.log('✅ Status:', response.data.result.status_code);
    console.log('📊 Créditos usados:', response.data.config?.cost || 'N/A');
    console.log('📊 ASP Score:', response.data.result?.asp_score || 'N/A');
    console.log('📦 Response preview:', response.data.result.content.substring(0, 200));

    const data = JSON.parse(response.data.result.content);
    console.log('📦 Mensaje:', data.mensaje);
    console.log('📊 Nombre:', data.datosPrincipales?.[0]?.nombre);

    if (data.mensaje === 'Consulta Exitosa') {
      console.log('✅ ÉXITO: Datos de contacto obtenidos correctamente');
      return true;
    } else {
      console.log('⚠️ ADVERTENCIA: Respuesta recibida pero mensaje inesperado');
      return false;
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    return false;
  }
}

// Ejecutar tests
async function runTests() {
  console.log('🧪 INICIANDO PRUEBAS DE SCRAPFLY CON INFONAVIT');
  console.log('API Key:', SCRAPFLY_API_KEY.substring(0, 20) + '...');

  const test1 = await testVerificarCuenta();
  const test2 = await testDatosContacto();

  console.log('\n========== RESUMEN ==========');
  console.log('Test 1 (Verificar Cuenta):', test1 ? '✅ PASÓ' : '❌ FALLÓ');
  console.log('Test 2 (Datos Contacto):', test2 ? '✅ PASÓ' : '❌ FALLÓ');

  if (test1 && test2) {
    console.log('\n🎉 TODOS LOS TESTS PASARON - SCRAPFLY FUNCIONANDO CORRECTAMENTE');
  } else {
    console.log('\n⚠️ ALGUNOS TESTS FALLARON - REVISAR CONFIGURACIÓN');
  }
}

runTests().catch(console.error);
