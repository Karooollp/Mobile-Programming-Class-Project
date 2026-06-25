const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY; 
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Función extendida para enviar consultas de texto o imágenes a Groq
 * @param mensajeDelUsuario El prompt de texto
 * @param imagenBase64 Opcional: El string de la imagen en formato Base64 obtenido de Expo ImagePicker
 */
export async function preguntarAGroq(mensajeDelUsuario: string, imagenBase64?: string): Promise<string> {
  try {
    // Validacion por si falta la key
    if (!API_KEY) {
      console.error("❌ Error: EXPO_PUBLIC_GROQ_API_KEY no está definida en el archivo .env");
      return "¡Ups! Falta configurar las llaves de seguridad de la IA. Avisa al administrador. :c";
    }

    const systemInstruction = "Eres el asistente virtual médico inteligente de Caremap Health. Responde siempre de manera muy amable, linda, empática y clara. Tu enfoque es la salud preventiva, dar consejos de bienestar y recordar que ante emergencias deben ir al médico. Si te envían una foto, analízala con cuidado bajo este mismo enfoque cariñoso.";

    let modeloAUsar = "llama-3.1-8b-instant"; 
    let contenidoMensaje: any = mensajeDelUsuario; 

    if (imagenBase64) {
      const base64Limpio = imagenBase64.replace(/[\n\r]/g, "").trim();

      modeloAUsar = "meta-llama/llama-4-scout-17b-16e-instruct"; 
      contenidoMensaje = [
        { 
          type: "text", 
          text: mensajeDelUsuario || "Analiza esta imagen relacionada con la salud o bienestar, por favor. :3" 
        },
        {
          type: "image_url",
          image_url: {
            // Usamos el string ya purificado aquí
            url: `data:image/jpeg;base64,${base64Limpio}` 
          }
        }
      ];
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`, 
      },
      body: JSON.stringify({
        model: modeloAUsar, 
        messages: [
          { role: "system", content: systemInstruction }, 
          { role: "user", content: contenidoMensaje }    
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Groq HTTP ${response.status}:`, JSON.stringify(errorData, null, 2));
      throw new Error(`Error ${response.status}: ${errorData?.error?.message ?? "desconocido"}`);
    }

    const data = await response.json();
    const respuestaTexto = data?.choices?.[0]?.message?.content;

    return respuestaTexto || "No pude procesar la respuesta";

  } catch (error) {
    console.error("Error real en Groq:", error);
    return "Ups, ocurrió un error al conectar con la IA. ¡Inténtalo de nuevo! :c";
  }
}