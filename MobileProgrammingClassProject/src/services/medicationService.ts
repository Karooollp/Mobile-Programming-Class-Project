import { Supabase } from "../lib/Supabase";

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
    scheduleTimes: med.schedule_times as string[],
  }));
}

// Agrega un nuevo medicamento
export async function addMedication(
  userId: string,
  name: string,
  dosage: string,
  scheduleTimes: string[]
) {
  const { data, error } = await Supabase
    .from("medications")
    .insert([
      {
        user_id: userId,
        name,
        dosage,
        schedule_times: scheduleTimes,
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

// Elimina un log de toma de medicamento específico (una dosis ya registrada). Solo elimina el estado de "ya la tomé hoy",
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