import { Supabase } from "../lib/Supabase";

export async function fetchDoctorAppointments(doctorId: string) {
  const { data, error } = await Supabase
    .from("appointments")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("appointment_date", {
      ascending: true,
    });

  if (error) throw error;

  return data ?? [];
}