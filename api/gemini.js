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

    // Contexto más estricto para evitar que Gemini haga preguntas
    const systemPrompt = `Eres un asistente del portafolio de Anderson, un ingeniero en sistemas. 
Responde directamente a las consultas sobre su experiencia, proyectos y habilidades.
NO hagas preguntas al usuario. 
NO preguntes "¿qué quieres saber?" o variaciones.
Proporciona información clara y directa basada en el portafolio.

Si el usuario saluda, responde con un saludo breve y ofrécele información sobre Anderson.

Ejemplos:
- Usuario: "hola" → Respuesta: "¡Hola! Soy el asistente del portafolio de Anderson. Puedo contarte sobre sus proyectos, habilidades y experiencia como ingeniero en sistemas."
- Usuario: "cuéntame sobre tus proyectos" → Respuesta directa sobre proyectos
- Usuario: "qué tecnologías manejas" → Respuesta directa sobre tecnologías

Consulta actual del usuario: ${prompt}`;

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
            temperature: 0.3, // Reducido para respuestas más directas
            maxOutputTokens: 500,
            topK: 40,
            topP: 0.8
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
    
    // 🔥 ESTA ES LA PARTE CRÍTICA QUE TE FALTA
    // Extraer solo el texto de la respuesta de Gemini
    let responseText = "";
    
    try {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        responseText = data.candidates[0].content.parts[0].text;
      } else {
        responseText = "Lo siento, no pude procesar tu solicitud en este momento.";
      }
    } catch (error) {
      console.error("Error procesando respuesta de Gemini:", error);
      responseText = "Error procesando la respuesta.";
    }

    // Enviar solo el texto procesado, no toda la respuesta de Gemini
    return res.status(200).json({ 
      success: true,
      response: responseText 
    });

  } catch (err) {
    console.error("💥 Server error completo:", err);
    return res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
}