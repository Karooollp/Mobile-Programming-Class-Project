const API_KEY = "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"; 

const API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function preguntarAGroq(mensajeDelUsuario: string): Promise<string> {
  try {
    // Definimos las instrucciones de personalidad para Caremap Health 
    const systemInstruction = "Eres el asistente virtual médico inteligente de Caremap Health. Responde siempre de manera muy amable, linda, empática y clara. Tu enfoque es la salud preventiva, dar consejos de bienestar y recordar que ante emergencias deben ir al médico.";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`, 
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          { role: "system", content: systemInstruction }, 
          { role: "user", content: mensajeDelUsuario }    
        ],
        temperature: 0.7,
      })
    });

    // Si Groq nos rebota, atrapamos el error aquí
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