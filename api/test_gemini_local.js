import handler from './gemini.js';

// Prueba local que no hace llamadas externas: simulamos fetch y validamos el prompt enviado.
(async () => {
  // Mock environment
  process.env.GEMINI_KEY = 'TEST_KEY';

  // Capturadores para el fetch del sitio y el fetch a la API de Gemini
  let capturedApi = null;
  let capturedSite = null;

  globalThis.fetch = async (url, options) => {
    // Si la URL apunta al site del portafolio, devolvemos HTML y lo capturamos
    if (typeof url === 'string' && url.startsWith('https://anderjosue10.github.io/IngSistemas/')) {
      capturedSite = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => '<html><head><title>Anderson Portfolio</title></head><body><h1>Proyectos</h1><p>Proyecto X: microservicios y comunicación entre servicios.</p><p>Proyecto Y: aplicación web con React y Node.</p></body></html>'
      };
    }

    // Si no, asumimos que es la llamada a la API de Gemini
    capturedApi = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ test: 'ok' })
    };
  };

  // Prueba 1: prompt orientado al portafolio
  const greetingReq = { method: 'POST', body: { prompt: 'hola' } };
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
  if (!capturedApi || !capturedSite) {
    console.error('🚫 No hubo llamada a fetch (algo falló)');
    process.exit(1);
  }

  try {
    const bodyJson = JSON.parse(capturedApi.options.body);
    const text = bodyJson.contents?.[0]?.parts?.[0]?.text || '';

    console.log('\n=== Texto enviado al API ===\n');
    console.log(text);
    console.log('\n=== Validación ===');

    // Esperamos que el prompt incluya el saludo inicial y contexto para portafolio
    // Debe incluir el saludo, la información extraída del sitio y el contexto de portafolio
    if (text.includes('Hola, soy el asistente de Anderson') && /portafolio/i.test(text) && /Anderson/i.test(text) && /Proyecto X: microservicios/i.test(text)) {
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

  // --- Prueba 2: saludo simple ---
  // Probamos que si el usuario sólo dice "hola" la API envía el saludo exacto al modelo.
  capturedApi = null;
  capturedSite = null;
  await handler(greetingReq, res);

  if (!capturedApi) {
    console.error('🚫 No hubo llamada a fetch (prueba saludo: algo falló)');
    process.exit(6);
  }

  try {
    const bodyJsonGreeting = JSON.parse(capturedApi.options.body);
    const textGreeting = bodyJsonGreeting.contents?.[0]?.parts?.[0]?.text || '';
    console.log('\n=== Texto enviado al API (prueba saludo) ===\n');
    console.log(textGreeting);

    if (textGreeting.includes('Hola, soy el asistente de Anderson')) {
      console.log('✅ Respuesta de saludo incluida correctamente. (prueba saludo ok)');
    } else {
      console.error('❌ No se encontró el saludo esperado cuando el usuario dijo hola.');
      process.exit(7);
    }
  } catch (err) {
    console.error('❌ Error al parsear el body enviado a fetch (prueba saludo):', err);
    process.exit(8);
  }

  // --- Prueba 3: NO relacionado con portafolio ---
  capturedApi = null;
  capturedSite = null;
  await handler(req2, res);

  if (!capturedApi) {
    console.error('🚫 No hubo llamada a fetch (prueba 2: algo falló)');
    process.exit(6);
  }

  try {
    const bodyJson2 = JSON.parse(capturedApi.options.body);
    const text2 = bodyJson2.contents?.[0]?.parts?.[0]?.text || '';

    console.log('\n=== Texto enviado al API (prueba 2 - no portafolio) ===\n');
    console.log(text2);
    console.log('\n=== Validación (prueba 2) ===');

    const expectedIntro = 'De acuerdo, tu pregunta no está relacionada con el portafolio de Anderson. La respuesta es:';
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
