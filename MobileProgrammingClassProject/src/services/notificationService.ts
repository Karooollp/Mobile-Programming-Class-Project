// services/notificationService.ts
import { Supabase } from "../lib/Supabase";

// ❌ Desactivado para evitar errores de expo-notifications en Expo Go SDK 53+
// import * as Notifications from "expo-notifications";
// import { Platform } from "react-native";

/*
// Configurar cómo se comportan las notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
*/

// Pedir permisos al usuario
export async function solicitarPermisosNotificaciones() {
  /*
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Permiso de notificaciones denegado");
    return false;
  }

  // En Android creamos un canal con máxima importancia para simular alarma
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("alarmas-citas", {
      name: "Alarmas de Citas Médicas",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  return true;
  */
  console.log("Notificaciones desactivadas en Expo Go :3");
  return true;
}

/**
 * Programa los 3 recordatorios para una cita médica
 */
export async function programarRecordatoriosCita(
  idCita: string,
  nombreDoctor: string,
  fechaCita: Date
) {
  /*
  const idsNotificaciones: string[] = [];
  const ahora = new Date();

  // 1. Notificación 24 horas antes
  const fecha24h = new Date(fechaCita.getTime() - 24 * 60 * 60 * 1000);
  if (fecha24h > ahora) {
    const id24h = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Recordatorio de Cita Médica",
        body: `Mañana tienes tu cita médica con el Dr. ${nombreDoctor} a las ${fechaCita.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fecha24h 
      },
    });
    idsNotificaciones.push(id24h);
  }

  // 2. Notificación 3 horas antes
  const fecha3h = new Date(fechaCita.getTime() - 3 * 60 * 60 * 1000);
  if (fecha3h > ahora) {
    const id3h = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🏥 Cita médica hoy",
        body: `En 3 horas es tu cita con el Dr. ${nombreDoctor}. ¡No olvides alistarte!`,
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fecha3h 
      },
    });
    idsNotificaciones.push(id3h);
  }

  // 3. ALARMA a la mera hora (Prioridad máxima)
  if (fechaCita > ahora) {
    const idAlarma = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 ¡HORA DE TU CITA MÉDICA!",
        body: `Es momento de tu cita con el Dr. ${nombreDoctor}.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: "ALARMA_CITA",
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: "alarmas-citas",
        date: fechaCita 
      },
    });
    idsNotificaciones.push(idAlarma);
  }

  return idsNotificaciones;
  */
  console.log(`Notificaciones omitidas para ${nombreDoctor} 7u7`);
  return [];
}

/**
 * Desactivar/Cancelar notificaciones pendientes si la cita se atiende antes o se cancela
 */
export async function cancelarNotificacionesProgramadas(idsNotificaciones: string[]) {
  /*
  for (const id of idsNotificaciones) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
  */
  return;
}

// ============================================================================
// 🚨 ALERTA DE EMERGENCIA
// ============================================================================
// IMPORTANTE: esto NO avisa a nadie en tiempo real (no hay push, SMS, ni
// smartwatch conectado todavía). Lo único que hace es dejar un registro con
// fecha/hora en Supabase, para que quede evidencia de que el paciente activó
// una emergencia. El aviso real (llamar al médico o a servicios de
// emergencia) lo tiene que hacer el usuario mismo — la pantalla que llama a
// esta función debe dejarlo clarísimo, no insinuar que "ya se avisó".
export async function registrarAlertaEmergencia(userId: string, nota?: string) {
  const { data, error } = await Supabase
    .from("emergency_alerts")
    .insert([{ user_id: userId, note: nota ?? null }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function contarAlertasDelMes(userId: string): Promise<number> {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const { count, error } = await Supabase
    .from("emergency_alerts")          // <- tu tabla real
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", inicioMes);     // <- tu columna de fecha real

  if (error) throw error;
  return count ?? 0;
}