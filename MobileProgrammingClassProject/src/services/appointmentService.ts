import { Supabase } from "../lib/Supabase";

export async function fetchDoctors() {
  const { data, error } = await Supabase
    .from("users")
    .select(`
      user_id,
      first_name,
      last_name,
      photo_url,
      phone,
      email,
      roles_id,
      roles (
        role_name
      )
    `)
    .eq("status", "active");
  
  if (error) {
    console.error("Error obteniendo médicos:", error);
    throw error;
  }

  console.log("RAW users con roles:", JSON.stringify(data, null, 2));

  return (data ?? [])
    .filter((user: any) => user.roles?.role_name === "Doctor")
    .map((doctor: any) => ({
      id: doctor.user_id,
      name: `${doctor.first_name} ${doctor.last_name}`,
      firstName: doctor.first_name,
      lastName: doctor.last_name,
      photoUrl: doctor.photo_url,
      phone: doctor.phone,
      email: doctor.email,
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
  patientId: string,
  doctorId: string,
  doctorName: string,
  reason: string,
  appointmentDate: string,
  location?: string
) {
  const { data, error } = await Supabase
    .from("appointments")
    .insert([
      {
        user_id: patientId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        reason,
        appointment_date: appointmentDate,
        location: location ?? null,
        attended: false,
        status: "scheduled",
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