# root-folder — Gemini API wrapper

Este proyecto contiene un pequeño endpoint `api/gemini.js` que envía prompts a Google Gemini.

Cambios principales:
- Todas las solicitudes ahora se envuelven automáticamente con un contexto del portafolio: las respuestas deben formatearse para el portafolio de **Anderson, ingeniero en sistemas**.

Cómo probar localmente (Node 18+ con `type: module`):

1) Ejecuta la prueba local que simula `fetch` y verifica que el prompt enviado incluye el contexto:

```powershell
node api/test_gemini_local.js
```

La prueba NO hace llamadas reales a la API de Gemini; solo valida que el texto enviado contiene el contexto del portafolio y el nombre Anderson.

---

Si quieres que el texto final también incluya plantillas exactas o ejemplos con estilo, dímelo y adapto el formato a tu preferencia (por ejemplo más técnico, menos explicativo, con enlaces, etc.).
