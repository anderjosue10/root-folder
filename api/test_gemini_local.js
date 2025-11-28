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

  // Prueba 1: prompt orientado al portafolio
  const req1 = { method: 'POST', body: { prompt: 'Describe mi proyecto de microservicios.' } };

  // Prueba 2: prompt NO relacionado con el portafolio
  const req2 = { method: 'POST', body: { prompt: '¿Cuál es la mejor manera de aprender Python?' } };

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

  // Ejecutamos el handler para la primera prueba (portafolio)
  await handler(req1, res);

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
      console.log('✅ El prompt incluye el contexto del portafolio y el nombre Anderson. (prueba 1 ok)');
      // proceed to test 2
    } else {
      console.error('❌ El prompt NO contiene el contexto esperado. (prueba 1)');
      process.exit(2);
    }
  } catch (err) {
    console.error('❌ Error al parsear el body enviado a fetch:', err);
    process.exit(3);
  }

  // --- Prueba 2: NO relacionado con portafolio ---
  captured = null;
  await handler(req2, res);

  if (!captured) {
    console.error('🚫 No hubo llamada a fetch (prueba 2: algo falló)');
    process.exit(6);
  }

  try {
    const bodyJson2 = JSON.parse(captured.options.body);
    const text2 = bodyJson2.contents?.[0]?.parts?.[0]?.text || '';

    console.log('\n=== Texto enviado al API (prueba 2 - no portafolio) ===\n');
    console.log(text2);
    console.log('\n=== Validación (prueba 2) ===');

    const expectedIntro = 'No está relacionado al portafolio, pero como asistente del ingeniero Anderson te doy la respuesta:';
    const expectedFollow = 'Responde la pregunta de forma normal y completa.';

    if (text2.includes(expectedIntro) && text2.includes(req2.body.prompt) && text2.includes(expectedFollow)) {
      console.log('✅ La introducción exacta y la instrucción de respuesta están presentes. (prueba 2 ok)');
      process.exit(0);
    } else {
      console.error('❌ La introducción para preguntas no relacionadas no aparece en el prompt enviado. (prueba 2)');
      process.exit(4);
    }
  } catch (err) {
    console.error('❌ Error al parsear el body enviado a fetch (prueba 2):', err);
    process.exit(5);
  }
})();
