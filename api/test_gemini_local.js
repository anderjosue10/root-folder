import handler from './gemini.js';

// Prueba local que no hace llamadas externas: simulamos fetch y validamos el prompt enviado.
(async () => {
  // Mock environment
  process.env.GEMINI_KEY = 'TEST_KEY';

  // Capturador para ver qué cuerpo se envía al fetch
  let captured = null;

  globalThis.fetch = async (url, options) => {
    captured = { url, options };

    return {
      ok: true,
      status: 200,
      json: async () => ({ test: 'ok' })
    };
  };

  // Simulamos una petición POST con un prompt de ejemplo
  const req = {
    method: 'POST',
    body: { prompt: 'Describe mi proyecto de microservicios.' }
  };

  // Respuesta simulada
  const res = {
    statusCode: 200,
    headers: {},
    _data: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this._data = obj; console.log('Response JSON:', obj); return this; },
    end() { console.log('end'); }
  };

  // Ejecutamos el handler
  await handler(req, res);

  // Validamos que el body enviado a fetch contiene el contexto de portafolio y tu nombre
  if (!captured) {
    console.error('🚫 No hubo llamada a fetch (algo falló)');
    process.exit(1);
  }

  try {
    const bodyJson = JSON.parse(captured.options.body);
    const text = bodyJson.contents?.[0]?.parts?.[0]?.text || '';

    console.log('\n=== Texto enviado al API ===\n');
    console.log(text);
    console.log('\n=== Validación ===');

    if (/portafolio/i.test(text) && /Anderson/i.test(text)) {
      console.log('✅ El prompt incluye el contexto del portafolio y el nombre Anderson.');
      process.exit(0);
    } else {
      console.error('❌ El prompt NO contiene el contexto esperado.');
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ Error al parsear el body enviado a fetch:', err);
    process.exit(3);
  }
})();
