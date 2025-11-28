# root-folder — Gemini API wrapper

Este proyecto contiene un pequeño endpoint `api/gemini.js` que envía prompts a Google Gemini.

Cambios principales:
- Todas las solicitudes ahora se envuelven automáticamente con un contexto del portafolio: las respuestas deben formatearse para el portafolio de **Anderson, ingeniero en sistemas** cuando el prompt esté orientado a portafolio.
-- Si la pregunta NO está relacionada con el portafolio, el backend responde primero con la nota exacta: "No está relacionado al portafolio, pero como asistente del ingeniero Anderson te doy la respuesta:" y a continuación pide a Gemini que responda la pregunta de forma normal y completa (se añade la instrucción "Responde la pregunta de forma normal y completa.").

Cómo probar localmente (Node 18+ con `type: module`):

1) Ejecuta la prueba local que simula `fetch` y verifica que el prompt enviado incluye el contexto:

```powershell
node api/test_gemini_local.js
```

La prueba NO hace llamadas reales a la API de Gemini; valida dos escenarios:
- Prompt relacionado con portafolio -> la petición enviada contiene el wrapper de portafolio y el nombre Anderson.
- Prompt NO relacionado -> la petición enviada incluye la frase "No está relacionado al portafolio, pero como asistente del ingeniero Anderson te doy la respuesta:" seguida por la pregunta del usuario.

---

Si quieres que el texto final también incluya plantillas exactas o ejemplos con estilo, dímelo y adapto el formato a tu preferencia (por ejemplo más técnico, menos explicativo, con enlaces, etc.).
