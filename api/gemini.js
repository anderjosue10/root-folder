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

    // 🔥 USA LA MISMA URL QUE FUNCIONA EN EL PROYECTO DE TU AMIGO
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
                  text: prompt  
                }
              ]
            }
          ],
          // 🔥 AGREGA LA CONFIGURACIÓN DE GENERACIÓN (opcional)
          generationConfig: {
            temperature: 0.7,
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
    return res.status(200).json(data);

  } catch (err) {
    console.error("💥 Server error completo:", err);
    return res.status(500).json({ 
      error: "Internal server error",
      details: err.message 
    });
  }
}