// services/doctorService.ts
import { Supabase } from "../lib/Supabase";
import { ScheduleConfig } from "../utils/types/scheduleHelper";

// ============================================================================
// PACIENTES ASIGNADOS
// ============================================================================

// Trae todos los pacientes asignados al doctor autenticado, ya con el perfil.
export async function getMyPatients(doctorId: string) {
  const { data, error } = await Supabase
    .from("doctor_patients")
    .select(
      `
      patient_id,
      assigned_at,
      status,
      patient:users!doctor_patients_patient_id_fkey (
        user_id, first_name, last_name, age, gender, blood_type,
        photo_url, phone, email, status
      )
    `
    )
    .eq("doctor_id", doctorId)
    .eq("status", "active")
    .order("assigned_at", { ascending: false });

  if (error) throw error;
  return data;
}

// El doctor se asigna un paciente a sí mismo. RLS ya obliga a que
// doctor_id = auth.uid(), esto es solo por claridad/legibilidad en la app.
export async function assignPatientToMe(doctorId: string, patientId: string) {
  const { data, error } = await Supabase
    .from("doctor_patients")
    .insert([{ doctor_id: doctorId, patient_id: patientId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Búsqueda de pacientes NO asignados aún, por nombre o email, para el flujo
// de "agregar paciente". Requiere que el doctor pueda leer `users` en general;
// si solo quieres que busque entre pacientes con roles_id de Paciente, filtra
// también por roles_id aquí.
export async function searchAssignablePatients(
  doctorId: string,
  searchText: string,
  patientRoleId: string
) {
  const { data, error } = await Supabase
    .from("users")
    .select("user_id, first_name, last_name, email, photo_url")
    .eq("roles_id", patientRoleId)
    .or(`first_name.ilike.%${searchText}%,last_name.ilike.%${searchText}%,email.ilike.%${searchText}%`)
    .limit(20);
  if (error) throw error;
  return data;
}

// Devuelve el doctor activo asignado a un paciente (o null si no tiene).
// La usa el lado PACIENTE para saber a quién le va a llegar el chat/resumen.
export async function getAssignedDoctor(patientId: string) {
  const { data, error } = await Supabase
    .from("doctor_patients")
    .select(
      `doctor_id, doctor:users!doctor_patients_doctor_id_fkey(user_id, first_name, last_name, photo_url)`
    )
    .eq("patient_id", patientId)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ============================================================================
// PERFIL / EXPEDIENTE DE UN PACIENTE
// ============================================================================

export async function getPatientProfile(patientId: string) {
  const { data, error } = await Supabase
    .from("users")
    .select(
      `*, conditions:user_medical_conditions(
        id, diagnosed_at, notes, status,
        condition:medical_conditions(id, condition_name, description)
      )`
    )
    .eq("user_id", patientId)
    .single();
  if (error) throw error;
  return data;
}

export async function getPatientMedications(patientId: string) {
  const { data, error } = await Supabase
    .from("medications")
    .select("*")
    .eq("user_id", patientId)
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPatientMedicationLogs(patientId: string, sinceISO: string) {
  const { data, error } = await Supabase
    .from("medication_logs")
    .select("*")
    .eq("user_id", patientId)
    .gte("taken_at", sinceISO)
    .order("taken_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ============================================================================
// CITAS (asignadas por el doctor)
// ============================================================================

// Citas del doctor para un rango de fechas (por defecto, el día de hoy),
// para la vista de calendario.
export async function getDoctorAppointments(
  doctorId: string,
  fromISO: string,
  toISO: string
) {
  const { data, error } = await Supabase
    .from("appointments")
    .select(
      `*, patient:users!appointments_patient_fkey(user_id, first_name, last_name, photo_url)`
    )
    .eq("doctor_id", doctorId)
    .gte("appointment_date", fromISO)
    .lt("appointment_date", toISO)
    .order("appointment_date", { ascending: true });
  if (error) throw error;
  return data;
}

// El doctor crea una cita para uno de sus pacientes asignados.
export async function assignAppointment(
  doctorId: string,
  patientId: string,
  appointmentDate: string, // ISO
  reason?: string,
  location?: string
) {
  const { data, error } = await Supabase
    .from("appointments")
    .insert([
      {
        user_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        reason: reason ?? null,
        location: location ?? null,
        status: "scheduled",
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================================
// MEDICAMENTOS (asignados por el doctor)
// ============================================================================

export async function assignMedication(
  doctorId: string,
  patientId: string,
  name: string,
  dosage: string,
  scheduleTimes: string[],
  config?: ScheduleConfig
) {
  const { data, error } = await Supabase
    .from("medications")
    .insert([
      {
        user_id: patientId,
        assigned_by: doctorId,
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

// ============================================================================
// ALERTAS DE EMERGENCIA (de todos los pacientes del doctor)
// ============================================================================

export async function getAlertsForDoctor(doctorId: string) {
  // Primero, los IDs de los pacientes que SÍ son míos. No confiamos en que
  // RLS ya lo filtre solo — lo hacemos explícito aquí, porque
  // emergency_alerts no tiene columna doctor_id (solo user_id del paciente),
  // así que sin este paso cualquier doctor vería las alertas de TODOS los
  // pacientes de la app.
  const { data: misPacientes, error: pacientesError } = await Supabase
    .from("doctor_patients")
    .select("patient_id")
    .eq("doctor_id", doctorId)
    .eq("status", "active");
  if (pacientesError) throw pacientesError;

  const idsPacientes = (misPacientes ?? []).map((p) => p.patient_id);
  if (idsPacientes.length === 0) return [];

  // 1. Traer solo las alertas de esos pacientes.
  const { data: alertas, error: alertasError } = await Supabase
    .from("emergency_alerts")
    .select("*")
    .in("user_id", idsPacientes)
    .order("created_at", { ascending: false });
  if (alertasError) throw alertasError;
  if (!alertas || alertas.length === 0) return [];

  // 2. Traer los perfiles de esos pacientes en una sola query aparte,
  //    porque no existe una FK directa emergency_alerts -> public.users
  //    (la FK real es contra auth.users, PostgREST no puede autounir eso).
  const { data: pacientes, error: perfilesError } = await Supabase
    .from("users")
    .select("user_id, first_name, last_name, photo_url")
    .in("user_id", idsPacientes);
  if (perfilesError) throw perfilesError;

  const mapaPacientes = new Map(pacientes.map((p) => [p.user_id, p]));

  // 3. Combinar manualmente, con la misma forma que antes (patient: {...})
  //    para no romper el código que ya consume esta función.
  return alertas.map((alerta) => ({
    ...alerta,
    patient: mapaPacientes.get(alerta.user_id) ?? null,
  }));
}

  // Marca una alerta como atendida (no se borra, solo se guarda cuándo se
  // resolvió). resolved_at = null significa "todavía pendiente".
  export async function marcarAlertaComoAtendida(alertaId: string) {
    const { data, error } = await Supabase
      .from("emergency_alerts")
      .update({ resolved_at: new Date().toISOString() })
      .eq("id", alertaId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
// Próximas citas programadas del doctor (todas, sin filtrar por paciente
// individual), para poder mostrar "próxima cita" en cada tarjeta del Home.
export async function getUpcomingAppointmentsForDoctor(doctorId: string) {
  const { data, error } = await Supabase
    .from("appointments")
    .select("id, user_id, appointment_date, status")
    .eq("doctor_id", doctorId)
    .eq("status", "scheduled")
    .gte("appointment_date", new Date().toISOString())
    .order("appointment_date", { ascending: true });
  if (error) throw error;
  return data;
}

// ============================================================================
// RESUMEN GENERAL (para las tarjetas del dashboard, igual que el paciente)
// ============================================================================

export async function getDoctorDashboardSummary(doctorId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // 🔒 Igual que en getAlertsForDoctor: emergency_alerts no tiene doctor_id,
  // solo user_id del paciente. Sin este paso, el conteo de abajo contaría
  // las alertas de TODOS los pacientes de la app, no solo los míos.
  const { data: misPacientes, error: pacientesIdsError } = await Supabase
    .from("doctor_patients")
    .select("patient_id")
    .eq("doctor_id", doctorId)
    .eq("status", "active");
  if (pacientesIdsError) throw pacientesIdsError;

  const idsPacientes = (misPacientes ?? []).map((p) => p.patient_id);

  const [patients, todayAppointments, alerts] = await Promise.all([
    Supabase
      .from("doctor_patients")
      .select("patient_id", { count: "exact", head: true })
      .eq("doctor_id", doctorId)
      .eq("status", "active"),
    Supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("doctor_id", doctorId)
      .gte("appointment_date", startOfDay.toISOString())
      .lte("appointment_date", endOfDay.toISOString()),
    // 🔒 El fix: solo contamos alertas de mis pacientes asignados.
    // Si no tengo pacientes, ni siquiera hacemos la consulta (evita un
    // .in() con arreglo vacío, que en PostgREST no siempre se comporta
    // como uno esperaría).
    idsPacientes.length > 0
      ? Supabase
          .from("emergency_alerts")
          .select("id", { count: "exact", head: true })
          .in("user_id", idsPacientes)
          .is("resolved_at", null)
      : Promise.resolve({ count: 0, error: null } as any),
  ]);

  if (patients.error) throw patients.error;
  if (todayAppointments.error) throw todayAppointments.error;
  if (alerts.error) throw alerts.error;

  return {
    totalPatients: patients.count ?? 0,
    todayAppointments: todayAppointments.count ?? 0,
    totalAlerts: alerts.count ?? 0,
  };
}