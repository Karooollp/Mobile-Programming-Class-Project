import { Supabase } from "../lib/Supabase";
import { ScheduleConfig } from "../utils/types/scheduleHelper";

function parseScheduleTimes(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Trae todos los medicamentos ACTIVOS del usuario.
export async function fetchMedications(userId: string) {
  const { data, error } = await Supabase
    .from("medications")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((med) => ({
    id: med.id,
    userId: med.user_id,
    name: med.name,
    dosage: med.dosage,
    scheduleTimes: parseScheduleTimes(med.schedule_times),
  }));
}

// Agrega un nuevo medicamento
export async function addMedication(
  userId: string,
  name: string,
  dosage: string,
  scheduleTimes: string[],
  config?: ScheduleConfig
) {
  const { data, error } = await Supabase
    .from("medications")
    .insert([
      {
        user_id: userId,
        name,
        dosage,
        schedule_times: scheduleTimes,
        frequency_type: config?.type ?? "CUSTOM",
        interval_hours: config?.intervalHours ?? null,
        times_per_day: config?.timesPerDay ?? null,
        start_time: config?.startTime ?? null,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Trae los registros de tomas (logs) de HOY para un usuario
export async function fetchTodayLogs(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data, error } = await Supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("taken_at", startOfDay.toISOString());
  if (error) throw error;
  return data;
}

// Registra que el usuario tomó una dosis específica
export async function logMedicationTaken(
  userId: string,
  medicationId: string,
  scheduledTime: string
) {
  const { data, error } = await Supabase
    .from("medication_logs")
    .insert([
      {
        user_id: userId,
        medication_id: medicationId,
        scheduled_time: scheduledTime,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Elimina un log de toma de medicamento específico
export async function deleteMedicationLog(logId: string) {
  const { error } = await Supabase
    .from("medication_logs")
    .delete()
    .eq("id", logId);
  if (error) throw error;
}

// Desactiva un medicamento (active = false) en vez de borrarlo.
export async function deactivateMedication(medicationId: string) {
  const { error } = await Supabase
    .from("medications")
    .update({ active: false })
    .eq("id", medicationId);
  if (error) throw error;
}