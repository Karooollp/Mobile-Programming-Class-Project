const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY; 
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODELO_TEXTO = "openai/gpt-oss-20b";
const MODELO_VISION = "qwen/qwen3.6-27b";

/**
 * Elimina caracteres de formato Markdown como **, __, #, ##, etc.
 */
function limpiarFormatoMarkdown(texto: string): string {
  if (!texto) return "";
  
  return texto
    .replace(/#{1,6}\s?/g, "") // Elimina encabezados (#, ##, ###)
    .replace(/\*{1,2}/g, "")   // Elimina asteriscos de negrita y cursiva (*, **)
    .replace(/_{1,2}/g, "")   // Elimina guiones bajos (_, __)
    .replace(/`{1,3}/g, "")   // Elimina bloques o comillas de código (`, ```)
    .trim();
}

/**
 * Paso 1: Analizar la imagen con Qwen únicamente para extraer una descripción técnica
 */
async function analizarImagenTecnica(imagenBase64: string, promptUsuario: string): Promise<string> {
  const base64Limpio = String(imagenBase64).replace(/[\r\n]/g, "").trim();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`, 
    },
    body: JSON.stringify({
      model: MODELO_VISION, 
      messages: [
        { 
          role: "system", 
          content: "Describe con precisión lo que ves en la imagen, enfocándote en aspectos relevantes para la salud, bienestar o entorno del usuario." 
        },
        {
          role: "user",
          content: [
            { type: "text", text: promptUsuario || "Describe esta imagen." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Limpio}` }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 300,
    })
  });

  if (!response.ok) throw new Error("Error analizando la imagen con el modelo de visión.");

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

/**
 * Función principal para Caremap Health
 */
export async function preguntarAGroq(
  mensajeDelUsuario: string, 
  historial: any[] = [], 
  imagenBase64?: string
): Promise<string> {
  try {
    if (!API_KEY) {
      console.error("❌ Error: EXPO_PUBLIC_GROQ_API_KEY no está definida en el archivo .env");
      return "¡Ups! Falta configurar las llaves de seguridad de la IA. Avisa al administrador. :c";
    }

    const systemInstruction = "Eres el asistente virtual médico inteligente de Caremap Health. Responde siempre de manera muy amable, linda, empática y clara. Tu enfoque es la salud preventiva, dar consejos de bienestar y recordar que ante emergencias deben ir al médico. Si se incluye la descripción de una imagen enviada por el usuario, analízala con cariño y da tu consejo médico de forma directa y cercana. Escribe en texto plano natural, sin usar símbolos de formato como asteriscos o numerales.";

    // Mapear historial
    const historialFormateado = (historial || []).map((msg) => ({
      role: msg.sender_type === "ai" || msg.sender_type === "bot" ? "assistant" : "user",
      content: String(msg.content || msg.texto || ""),
    }));

    let mensajeFinalPrompt = mensajeDelUsuario;

    // Si viene una imagen, la analiza Qwen en segundo plano
    if (imagenBase64) {
      console.log("👁️ Paso 1: Analizando imagen con el modelo de visión...");
      const descripcionImagen = await analizarImagenTecnica(imagenBase64, mensajeDelUsuario);
      
      console.log("📝 Paso 2: Pasando descripción al modelo de texto...");
      mensajeFinalPrompt = `[El usuario adjuntó una imagen. Descripción técnica de la imagen: "${descripcionImagen}"]. Consulta del usuario: "${mensajeDelUsuario || "Analiza la foto por favor"}"`;
    }

    // El modelo de texto redacta la respuesta final empática
    console.log(`🤖 Generando respuesta con: "${MODELO_TEXTO}"`);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`, 
      },
      body: JSON.stringify({
        model: MODELO_TEXTO, 
        messages: [
          { role: "system", content: systemInstruction }, 
          ...historialFormateado,
          { role: "user", content: mensajeFinalPrompt }    
        ],
        temperature: 0.7,
        max_tokens: 500,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Groq HTTP ${response.status}:`, JSON.stringify(errorData, null, 2));
      throw new Error(`Error ${response.status}: ${errorData?.error?.message ?? "desconocido"}`);
    }

    const data = await response.json();
    const respuestaCruda = data?.choices?.[0]?.message?.content || "No pude procesar la respuesta.";

    // Limpieza de símbolos Markdown antes de entregar la respuesta
    return limpiarFormatoMarkdown(respuestaCruda);

  } catch (error) {
    console.error("Error real en Groq:", error);
    return "Ups, ocurrió un error al conectar con la IA. ¡Inténtalo de nuevo! :c";
  }
}