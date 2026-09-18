// services/chatService.ts
import { Supabase } from "../lib/Supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  created_at?: string;
}

// 1. Crear una nueva sesión de chat (IA o Doctor)
export const crearSesionChat = async (
  patientId: string,
  type: "ia" | "doctor",
  doctorId?: string
) => {
  const { data, error } = await Supabase
    .from("chat_sessions")
    .insert([{ patient_id: patientId, type, doctor_id: doctorId ?? null, status: "active" }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Trae la sesión activa de un tipo para un paciente, o null si no hay.
// Útil para no crear una sesión nueva cada vez que se abre el chat.
export const getSesionActiva = async (
  patientId: string,
  type: "ia" | "doctor"
) => {
  const { data, error } = await Supabase
    .from("chat_sessions")
    .select("*")
    .eq("patient_id", patientId)
    .eq("type", type)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// Trae el historial de mensajes de una sesión (para pintar el chat al entrar).
export const getMensajesDeSesion = async (sessionId: string) => {
  const { data, error } = await Supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

// 2. Guardar un mensaje individual en la BD
export const guardarMensajeDB = async (mensaje: ChatMessage) => {
  const { data, error } = await Supabase
    .from("chat_messages")
    .insert([mensaje])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 3. Finalizar consulta IA, guardar el resumen, y mandarlo también al chat
//    del doctor (Opción B) para que quede persistente y no solo en un Alert.
export const finalizarSesionConResumen = async (
  sessionIdIA: string,
  resumen: string,
  sessionIdDoctor?: string | null
) => {
  const { data, error } = await Supabase
    .from("chat_sessions")
    .update({ status: "finished", summary: resumen, updated_at: new Date().toISOString() })
    .eq("id", sessionIdIA)
    .select()
    .single();

  if (error) throw error;

  if (sessionIdDoctor) {
    await guardarMensajeDB({
      session_id: sessionIdDoctor,
      sender_type: "ia",
      content: `📋 Resumen automático de la consulta con IA:\n\n${resumen}`,
    });
  }

  return data;
};

// 4. Suscripción realtime a mensajes nuevos de una sesión.
//
//    CORREGIDO (bug nuevo encontrado): Supabase.channel(topic) reutiliza un
//    canal existente si ya hay uno con ese mismo "topic" registrado en el
//    cliente (por ejemplo, uno que quedó huérfano de una apertura anterior
//    del chat, de un Fast Refresh, o de no haberse desuscrito bien al salir
//    de la pantalla). Si ese canal viejo ya estaba subscribe()-ado, llamar
//    .on(...) sobre él para agregar un nuevo callback truena con:
//    "cannot add `postgres_changes` callbacks ... after `subscribe()`".
//    Eso deja la suscripción nueva a medias (o inexistente), y por eso
//    a veces los mensajes no llegan en tiempo real aunque el código "se vea"
//    correcto. La solución: antes de crear el canal, buscar y remover
//    cualquier canal previo con el mismo topic.
export const suscribirAMensajesDeSesion = (
  sessionId: string,
  onNuevoMensaje: (msg: ChatMessage) => void
): RealtimeChannel => {
  const topic = `chat_${sessionId}`;

  // Supabase antepone "realtime:" al nombre del topic internamente, por
  // eso comparamos contra ese prefijo.
  const canalViejo = Supabase.getChannels().find(
    (c) => c.topic === `realtime:${topic}`
  );
  if (canalViejo) {
    Supabase.removeChannel(canalViejo);
  }

  const channel = Supabase.channel(topic)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onNuevoMensaje(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return channel;
};

// Siempre desuscribirse al desmontar la pantalla de chat (useEffect cleanup),
// o los canales se van acumulando entre navegaciones.
export const desuscribirCanal = (channel: RealtimeChannel | null) => {
  if (channel) {
    Supabase.removeChannel(channel);
  }
};