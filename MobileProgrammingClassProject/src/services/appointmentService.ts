import { Supabase } from "../lib/Supabase";

// Trae todas las citas del usuario, ordenadas por fecha
export async function fetchAppointments(userId: string) {
  const { data, error } = await Supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .order("appointment_date", { ascending: true });
  if (error) throw error;
  return data.map((appt) => ({
    id: appt.id,
    userId: appt.user_id,
    doctorName: appt.doctor_name,
    reason: appt.reason,
    appointmentDate: appt.appointment_date,
    attended: appt.attended ?? false,
  }));
}

// Trae solo la próxima cita (la más cercana en el futuro)
export async function fetchNextAppointment(userId: string) {
  const { data, error } = await Supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("appointment_date", new Date().toISOString())
    .order("appointment_date", { ascending: true })
    .limit(1)
    .maybeSingle(); 
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    doctorName: data.doctor_name,
    reason: data.reason,
    appointmentDate: data.appointment_date,
    attended: data.attended ?? false,
  };
}

// Trae citas en un rango: futuras + pasadas de los últimos X días (por defecto 30 días)
export async function fetchAppointmentsRange(userId: string, pastDays: number = 30) {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - pastDays);
  const { data, error } = await Supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("appointment_date", sinceDate.toISOString())
    .order("appointment_date", { ascending: true });
  if (error) throw error;
  return data.map((appt) => ({
    id: appt.id,
    doctorName: appt.doctor_name,
    reason: appt.reason,
    appointmentDate: appt.appointment_date,
    attended: appt.attended ?? false,
  }));
}

// Marca o desmarca una cita como asistida (toggle simple)
export async function toggleAppointmentAttended(appointmentId: string, attended: boolean) {
  const { data, error } = await Supabase
    .from("appointments")
    .update({ attended })
    .eq("id", appointmentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Agrega una nueva cita
export async function addAppointment(
  userId: string,
  doctorName: string,
  reason: string,
  appointmentDate: string // ISO string
) {
  const { data, error } = await Supabase
    .from("appointments")
    .insert([
      {
        user_id: userId,
        doctor_name: doctorName,
        reason,
        appointment_date: appointmentDate,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Elimina una cita. Solo debería llamarse cuando la cita ya está marcada como asistida
export async function deleteAppointment(appointmentId: string) {
  const { error } = await Supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);
  if (error) throw error;
}