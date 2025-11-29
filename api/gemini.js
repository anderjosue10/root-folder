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

    // Texto fijo de saludo y contexto para respuestas de portafolio
    const greetingText = "Hola, soy el asistente de Anderson. ¿Quieres saber algo de su portafolio o quieres preguntarme otra cosa?";

    const portfolioContext = `Eres un asistente que responde SOLO en el formato de un portafolio profesional para Anderson, ingeniero en sistemas.
  - Presenta una breve introducción (1-2 frases) que sitúe a Anderson y su rol.
  - Incluye un título claro, una descripción técnica breve, una lista de puntos técnicos (qué hiciste / cómo lo hiciste) y un resultado/impacto final.
  - Usa un tono profesional, conciso y orientado a posibles clientes o reclutadores.
  - Menciona las tecnologías clave usadas cuando aplique.
  Responde a la petición del usuario a continuación:`;

    const userPrompt = (prompt || "").trim();

    const portfolioKeywords = [
      'portafolio', 'portfolio', 'proyecto', 'proyectos', 'caso de estudio', 'presentación', 'portafolio profesional', 'descripción del proyecto', 'perfil', 'cv', 'currículum'
    ];

    const isPortfolio = portfolioKeywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(userPrompt));

    let modifiedPrompt = '';
    if (isPortfolio) {
      const portfolioUrl = 'https://anderjosue10.github.io/IngSistemas/';

      let siteText = '';
      try {
        const siteResp = await fetch(portfolioUrl, { method: 'GET' });
        if (siteResp && siteResp.ok) {
          const html = await siteResp.text();
          const cleaned = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

          siteText = cleaned.slice(0, 3000);
        } else {
          console.warn('⚠️ No se pudo descargar el sitio del portafolio: status', siteResp?.status);
        }
      } catch (err) {
        console.warn('⚠️ Error al descargar/parsing del sitio del portafolio:', err.message || err);
      }

      const siteSection = siteText ? `Información extraída del portafolio (https://anderjosue10.github.io/IngSistemas/):\n\n${siteText}\n\n` : '';
      modifiedPrompt = `${greetingText}\n\n${siteSection}${portfolioContext}\n\n${userPrompt}`;
    } else {
      const isGreeting = /^(hola|buenos?(?:\s+d[ií]as|\s+tardes|\s+noches))\b/i.test(userPrompt);

      if (isGreeting) {
        modifiedPrompt = greetingText;
      } else {
        const nonPortfolioIntro = 'De acuerdo, tu pregunta no está relacionada con el portafolio de Anderson. La respuesta es:';
        modifiedPrompt = `${nonPortfolioIntro}\n\n${userPrompt}\n\nResponde la pregunta de forma normal y completa.`;
      }
    }

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
                  text: modifiedPrompt
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