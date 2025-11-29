export default async function handler(req, res) {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://anderjosue10.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) {
      console.error("❌ GEMINI_KEY no configurada");
      return res.status(500).json({ error: "API key not configured" });
    }

    console.log("📤 Enviando a Gemini, prompt:", prompt?.substring(0, 50) + "...");

    // Contexto mejorado para evitar preguntas
    const systemPrompt = `Eres un asistente del portafolio de Anderson. Responde directamente sin hacer preguntas al usuario.

Si el usuario saluda: "¡Hola! Soy el asistente de Anderson. Puedo contarte sobre sus proyectos de ingeniería de sistemas, tecnologías que maneja y su experiencia profesional."

Para consultas del portafolio: proporciona información clara y directa.

Consulta: ${prompt}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800
          }
        })
      }
    );

    console.log("📥 Respuesta de Gemini - Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error de Gemini API:", response.status, errorText);
      return res.status(response.status).json({ 
        error: `Gemini API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();
    console.log("✅ Respuesta exitosa de Gemini!");
    
    // Extraer el texto de la respuesta
    let responseText = "";
    
    try {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text;
      } else {
        responseText = "Lo siento, no pude procesar tu solicitud.";
      }
    } catch (error) {
      console.error("Error procesando respuesta:", error);
      responseText = "Error procesando la respuesta.";
    }

    // 🔥 VERSIÓN COMPATIBLE: Devuelve la misma estructura que antes
    // pero con el texto ya procesado
    return res.status(200).json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: responseText
              }
            ]
          }
        }
      ]
    });

  } catch (err) {
    console.error("💥 Server error completo:", err);
    return res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
}