// services/chatService.ts
// Descomentar cuando tengas importado tu cliente:
// import { supabase } from "../lib/supabaseClient";

export interface ChatSession {
  id?: string;
  patient_id: string;
  doctor_id?: string | null;
  type: "ia" | "doctor";
  status?: "active" | "finished";
  summary?: string | null;
}

export interface ChatMessage {
  id?: string;
  session_id: string;
  sender_type: "patient" | "ia" | "doctor";
  sender_id?: string;
  content?: string;
  image_url?: string;
}

// 1. Crear una nueva sesión de chat (IA o Doctor)
export const crearSesionChat = async (patientId: string, type: "ia" | "doctor") => {
  /* AL CONECTAR SUPABASE:
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert([{ patient_id: patientId, type, status: 'active' }])
    .select()
    .single();

  if (error) throw error;
  return data;
  */
  console.log(`[STUB] Sesión creada tipo (${type}) para paciente:`, patientId);
  return { id: "mocked-session-id-" + Date.now() };
};

// 2. Guardar un mensaje individual en la BD
export const guardarMensajeDB = async (mensaje: ChatMessage) => {
  /* AL CONECTAR SUPABASE:
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([mensaje])
    .select()
    .single();

  if (error) throw error;
  return data;
  */
  console.log("[STUB] Mensaje listo para guardarse en BD:", mensaje);
  return { ...mensaje, id: Date.now().toString() };
};

// 3. Finalizar consulta y guardar el resumen de Groq
export const finalizarSesionConResumen = async (sessionId: string, resumen: string) => {
  /* AL CONECTAR SUPABASE:
  const { data, error } = await supabase
    .from('chat_sessions')
    .update({ status: 'finished', summary: resumen, updated_at: new Date() })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
  */
  console.log("[STUB] Sesión finalizada en BD con ID:", sessionId);
  console.log("[STUB] Resumen registrado:", resumen);
  return true;
};

// 4. PREPARADO PARA EL FUTURO: Escuchar mensajes en tiempo real (Doctor)
export const suscribirAMensajesDoctor = (sessionId: string, onNuevoMensaje: (msg: ChatMessage) => void) => {
  console.log("[STUB] Suscripción Realtime lista para la sesión:", sessionId);
  
  /* AL CONECTAR SUPABASE (Cuando la vista del médico esté lista):
  const channel = supabase
    .channel(`chat_${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
      (payload) => {
        onNuevoMensaje(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
  */
  return null;
};