import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Supabase } from '../../lib/Supabase';
import {
  getDoctorAppointments,
  assignAppointment,
  getMyPatients,
} from '../../services/doctorService';
import {
  toggleAppointmentAttended,
  deleteAppointment,
} from '../../services/appointmentService'; // AJUSTA la ruta si tu archivo queda en otro lugar
import { DoctorQueue, PatientAppointment } from '../../services/doctorQueueService'; // AJUSTA la ruta si tu archivo queda en otro lugar

// Cuántos pacientes puede atender el doctor en un mismo día. Ajusta el número
// si en tu proyecto este límite debe salir de otro lado (config, BD, etc.).
const CUPO_MAXIMO_DIARIO = 10;

// ---- Tipos (según lo que realmente devuelven doctorService.ts) ----

// Igual que MiPaciente en DoctorHomeScreen.tsx
type MiPaciente = {
  patient_id: string;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    age: number | null;
    blood_type: string | null;
    photo_url: string | null;
  };
};

// Lo que devuelve getDoctorAppointments: la fila de "appointments" + el
// paciente ya unido (patient:users!appointments_patient_fkey(...))
type Appointment = {
  id: string;
  user_id: string; // id del paciente
  doctor_id: string;
  appointment_date: string; // ISO string
  reason: string | null;
  location: string | null;
  status: string;
  attended: boolean;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
};

interface DayCell {
  date: Date;
  inCurrentMonth: boolean;
}

// DoctorQueue espera objetos con la forma PatientAppointment, así que
// "traducimos" cada cita de Supabase a esa forma antes de metérsela.
// Piénsalo como convertir monedas antes de entrar a otro país: mismo valor,
// distinto formato.
function aPatientAppointment(cita: Appointment): PatientAppointment {
  return {
    id: cita.id,
    patientName: cita.patient ? `${cita.patient.first_name} ${cita.patient.last_name}` : 'Paciente',
    appointmentDate: cita.appointment_date,
    reason: cita.reason ?? undefined,
    attended: cita.attended,
  };
}

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export default function DoctorAppointmentsScreen() {
  // Igual que en DoctorHomeScreen.tsx: el doctorId no viene de Redux,
  // se obtiene directo del usuario logueado en Supabase.
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<MiPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalVisible, setModalVisible] = useState(false);

  // Formulario para agregar cita
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  // 🔁 Antes esto era un texto libre ("09:00") en un TextInput. Ahora
  // guardamos directamente un objeto Date (solo nos importan sus horas y
  // minutos) y lo llenamos con el selector nativo de hora.
  const [horaSeleccionada, setHoraSeleccionada] = useState<Date>(new Date());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [reasonText, setReasonText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [saving, setSaving] = useState(false);

  // Obtener el id del doctor logueado, una sola vez.
  useEffect(() => {
    const initDoctor = async () => {
      const { data, error } = await Supabase.auth.getUser();
      if (error || !data.user) {
        Alert.alert('Sesión no válida', 'Vuelve a iniciar sesión.');
        return;
      }
      setDoctorId(data.user.id);
    };
    initDoctor();
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const inicioMes = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const finMes = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

      const [citasData, pacientesData] = await Promise.all([
        getDoctorAppointments(doctorId, inicioMes.toISOString(), finMes.toISOString()),
        getMyPatients(doctorId),
      ]);

      // "Sin excepción": mostramos TODAS las citas que devuelve el backend
      // para este doctor en el rango de fechas, sin filtrar por paciente.
      setAppointments((citasData as unknown as Appointment[]) || []);
      setPatients((pacientesData as unknown as MiPaciente[]) || []);
    } catch (error) {
      console.error('Error cargando citas:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentMonth]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ---- Construcción del calendario tipo grilla (sin librerías externas) ----
  const construirDiasDelMes = (): DayCell[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const diaSemanaInicio = primerDiaMes.getDay(); // 0 = domingo

    const dias: DayCell[] = [];

    // Días del mes anterior para rellenar la primera semana
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const fecha = new Date(year, month, -i);
      dias.push({ date: fecha, inCurrentMonth: false });
    }

    // Días del mes actual
    const ultimoDiaMes = new Date(year, month + 1, 0).getDate();
    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
      dias.push({ date: new Date(year, month, dia), inCurrentMonth: true });
    }

    // Completar hasta que la grilla sea múltiplo de 7 (semanas completas)
    while (dias.length % 7 !== 0) {
      const ultimaFecha = dias[dias.length - 1].date;
      const siguiente = new Date(ultimaFecha);
      siguiente.setDate(siguiente.getDate() + 1);
      dias.push({ date: siguiente, inCurrentMonth: false });
    }

    return dias;
  };

  const mismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const citasDelDia = (fecha: Date) =>
    appointments.filter((c) => mismoDia(new Date(c.appointment_date), fecha));

  const diasDelMes = construirDiasDelMes();
  const citasSeleccionadas = citasDelDia(selectedDate).sort(
    (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  );

  // Fila (FIFO) de ese día: quien tiene la cita más temprana es el turno 1,
  // y así sucesivamente. También nos dice si el día ya está lleno.
  const colaDelDia = new DoctorQueue(
    citasDelDia(selectedDate).map(aPatientAppointment),
    CUPO_MAXIMO_DIARIO
  );
  const diaLleno = colaDelDia.isFull();
  const siguientePaciente = colaDelDia.getNextPatient();

  const cambiarMes = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const abrirModalParaAgregar = () => {
    setSelectedPatientId(patients[0]?.patient_id ?? null);

    // Hora por defecto al abrir el modal: 9:00 AM. El picker solo lee las
    // horas y minutos de este Date, el día/mes/año no importan aquí.
    const horaPorDefecto = new Date();
    horaPorDefecto.setHours(9, 0, 0, 0);
    setHoraSeleccionada(horaPorDefecto);
    setMostrarPicker(false);

    setReasonText('');
    setLocationText('');
    setModalVisible(true);
  };

  // Se llama cuando el usuario mueve el selector de hora nativo.
  const onCambiarHora = (event: any, seleccionada?: Date) => {
    // En Android el picker se cierra solo tras elegir; en iOS lo dejamos
    // visible tipo "spinner" embebido en el modal.
    setMostrarPicker(Platform.OS === 'ios');
    if (event.type === 'set' && seleccionada) {
      setHoraSeleccionada(seleccionada);
    }
  };

  const guardarCita = async () => {
    if (!doctorId) return;
    if (!selectedPatientId) {
      Alert.alert('Falta el paciente', 'Selecciona un paciente para la cita.');
      return;
    }

    const horas = horaSeleccionada.getHours();
    const minutos = horaSeleccionada.getMinutes();

    const fechaCita = new Date(selectedDate);
    fechaCita.setHours(horas, minutos, 0, 0);

    // El doctor no puede atender a dos pacientes a la misma hora.
    const horarioOcupado = citasDelDia(selectedDate).some((c) => {
      const horaExistente = new Date(c.appointment_date);
      return horaExistente.getHours() === horas && horaExistente.getMinutes() === minutos;
    });
    if (horarioOcupado) {
      Alert.alert('Horario ocupado', 'Ya hay una cita a esa hora. Elige otra hora para este día.');
      return;
    }

    // Límite de pacientes por día (fila FIFO ya llena).
    if (diaLleno) {
      Alert.alert(
        'Cupo lleno',
        `Ya se alcanzó el límite de ${CUPO_MAXIMO_DIARIO} pacientes para este día.`
      );
      return;
    }

    setSaving(true);
    try {
      await assignAppointment(
        doctorId,
        selectedPatientId,
        fechaCita.toISOString(),
        reasonText || undefined,
        locationText || undefined
      );
      setModalVisible(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error guardando cita:', error);
      Alert.alert('Error', 'No se pudo guardar la cita. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const marcarComoCompletada = async (citaId: string) => {
    try {
      await toggleAppointmentAttended(citaId, true);
      await cargarDatos();
    } catch (error) {
      console.error('Error marcando cita como completada:', error);
      Alert.alert('Error', 'No se pudo marcar la cita como completada.');
    }
  };

  const eliminarCita = (citaId: string, attended: boolean) => {
    // deleteAppointment (appointmentService.ts) solo debería llamarse cuando
    // la cita ya fue atendida, así que lo forzamos aquí también.
    if (!attended) {
      Alert.alert(
        'Marca la cita primero',
        'Solo se pueden eliminar citas que ya fueron atendidas. Márcala como completada antes de eliminarla.'
      );
      return;
    }

    Alert.alert(
      'Eliminar cita',
      '¿Seguro que quieres eliminar esta cita? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAppointment(citaId);
              await cargarDatos();
            } catch (error) {
              console.error('Error eliminando cita:', error);
              Alert.alert('Error', 'No se pudo eliminar la cita.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.contenedor, styles.centrado]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      {/* Encabezado del mes */}
      <View style={styles.encabezadoMes}>
        <TouchableOpacity onPress={() => cambiarMes(-1)}>
          <Text style={styles.flecha}>{'‹'}</Text>
        </TouchableOpacity>
        <Text style={styles.tituloMes}>
          {currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => cambiarMes(1)}>
          <Text style={styles.flecha}>{'›'}</Text>
        </TouchableOpacity>
      </View>

      {/* Fila de nombres de días */}
      <View style={styles.filaSemana}>
        {WEEKDAYS.map((d, idx) => (
          <Text key={idx} style={styles.textoDiaSemana}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grilla del calendario */}
      <View style={styles.grilla}>
        {diasDelMes.map((celda, idx) => {
          const tieneCitas = citasDelDia(celda.date).length > 0;
          const esSeleccionado = mismoDia(celda.date, selectedDate);
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.celdaDia, esSeleccionado && styles.celdaSeleccionada]}
              onPress={() => setSelectedDate(celda.date)}
            >
              <Text
                style={[
                  styles.textoDia,
                  !celda.inCurrentMonth && styles.textoDiaFuera,
                  esSeleccionado && styles.textoDiaSeleccionado,
                ]}
              >
                {celda.date.getDate()}
              </Text>
              {tieneCitas && <View style={styles.puntoIndicador} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de citas del día seleccionado */}
      <View style={styles.encabezadoLista}>
        <Text style={styles.tituloLista}>
          Citas del {selectedDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
        </Text>
        <TouchableOpacity
          style={[styles.botonAgregar, diaLleno && styles.botonAgregarDeshabilitado]}
          onPress={abrirModalParaAgregar}
          disabled={diaLleno}
        >
          <Text style={styles.textoBotonAgregar}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.contadorCupo}>
        {colaDelDia.getWaitingCount()} / {CUPO_MAXIMO_DIARIO} citas
        {diaLleno ? ' · Cupo lleno para este día' : ''}
      </Text>

      {siguientePaciente && (
        <Text style={styles.siguienteTurno}>
          🔜 Siguiente en turno: {siguientePaciente.patientName}
        </Text>
      )}

      <FlatList
        data={citasSeleccionadas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listaContenido}
        ListEmptyComponent={<Text style={styles.textoVacio}>No hay citas este día.</Text>}
        renderItem={({ item }) => (
          <View style={styles.tarjetaCita}>
            <Text style={styles.horaCita}>
              {new Date(item.appointment_date).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View style={styles.infoCita}>
              <Text style={styles.nombrePaciente}>
                {item.patient ? `${item.patient.first_name} ${item.patient.last_name}` : 'Paciente'}
                {'  '}
                <Text style={styles.turnoTexto}>· Turno {colaDelDia.getPatientPosition(item.id)}</Text>
              </Text>
              {!!item.reason && <Text style={styles.detalleCita}>{item.reason}</Text>}
              {!!item.location && <Text style={styles.detalleCita}>📍 {item.location}</Text>}

              <View style={styles.filaAcciones}>
                {item.attended ? (
                  <Text style={styles.badgeCompletada}>✅ Completada</Text>
                ) : (
                  <TouchableOpacity onPress={() => marcarComoCompletada(item.id)}>
                    <Text style={styles.accionCompletar}>✓ Marcar completada</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => eliminarCita(item.id, item.attended)}>
                  <Text style={styles.accionEliminar}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      {/* Modal para agregar una nueva cita */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.fondoModal}>
          <View style={styles.contenidoModal}>
            <Text style={styles.tituloModal}>Nueva cita</Text>
            <Text style={styles.fechaModal}>
              {selectedDate.toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>

            <Text style={styles.etiqueta}>Paciente</Text>
            <ScrollView style={styles.listaPacientes} nestedScrollEnabled>
              {patients.map((p) => (
                <TouchableOpacity
                  key={p.patient_id}
                  style={[
                    styles.opcionPaciente,
                    selectedPatientId === p.patient_id && styles.opcionPacienteSeleccionada,
                  ]}
                  onPress={() => setSelectedPatientId(p.patient_id)}
                >
                  <Text
                    style={[
                      styles.textoOpcionPaciente,
                      selectedPatientId === p.patient_id && styles.textoOpcionPacienteSeleccionada,
                    ]}
                  >
                    {p.patient.first_name} {p.patient.last_name}
                  </Text>
                </TouchableOpacity>
              ))}
              {patients.length === 0 && (
                <Text style={styles.textoVacio}>No tienes pacientes asignados todavía.</Text>
              )}
            </ScrollView>

            <Text style={styles.etiqueta}>Hora</Text>
            {/* 🔁 Antes era un TextInput libre ("09:00"). Ahora es un botón
                que abre el reloj nativo del teléfono — ya no se puede
                escribir una hora inválida. */}
            <TouchableOpacity style={styles.botonHora} onPress={() => setMostrarPicker(true)}>
              <Text style={styles.textoBotonHora}>
                {horaSeleccionada.toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>

            {mostrarPicker && (
              <DateTimePicker
                value={horaSeleccionada}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onCambiarHora}
              />
            )}

            <Text style={styles.etiqueta}>Motivo (opcional)</Text>
            <TextInput
              style={styles.input}
              value={reasonText}
              onChangeText={setReasonText}
              placeholder="Ej. Revisión mensual"
            />

            <Text style={styles.etiqueta}>Lugar (opcional)</Text>
            <TextInput
              style={styles.input}
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Ej. Consultorio 3"
            />

            <View style={styles.filaBotonesModal}>
              <TouchableOpacity
                style={[styles.botonModal, styles.botonCancelar]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.textoBotonCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botonModal, styles.botonGuardar]}
                onPress={guardarCita}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.textoBotonGuardar}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#fff' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  encabezadoMes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  flecha: { fontSize: 28, color: '#2563eb', paddingHorizontal: 12 },
  tituloMes: { fontSize: 18, fontWeight: '600', textTransform: 'capitalize' },
  filaSemana: { flexDirection: 'row', paddingHorizontal: 8, marginTop: 12 },
  textoDiaSemana: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  celdaDia: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celdaSeleccionada: {
    backgroundColor: '#2563eb',
    borderRadius: 20,
  },
  textoDia: { fontSize: 14, color: '#111827' },
  textoDiaFuera: { color: '#d1d5db' },
  textoDiaSeleccionado: { color: '#fff', fontWeight: '700' },
  puntoIndicador: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 2,
  },
  encabezadoLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tituloLista: { fontSize: 16, fontWeight: '600', flexShrink: 1, textTransform: 'capitalize' },
  botonAgregar: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  textoBotonAgregar: { color: '#fff', fontWeight: '600' },
  botonAgregarDeshabilitado: { backgroundColor: '#9ca3af' },
  contadorCupo: { paddingHorizontal: 20, marginTop: 6, fontSize: 12, color: '#6b7280' },
  siguienteTurno: { paddingHorizontal: 20, marginTop: 4, fontSize: 13, color: '#1d4ed8', fontWeight: '600' },
  turnoTexto: { fontSize: 12, fontWeight: '400', color: '#6b7280' },
  filaAcciones: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  accionCompletar: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  badgeCompletada: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  accionEliminar: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  listaContenido: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  textoVacio: { textAlign: 'center', color: '#9ca3af', marginTop: 20 },
  tarjetaCita: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  horaCita: {
    fontWeight: '700',
    color: '#2563eb',
    width: 60,
  },
  infoCita: { flex: 1 },
  nombrePaciente: { fontWeight: '600', fontSize: 15 },
  detalleCita: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  contenidoModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  tituloModal: { fontSize: 18, fontWeight: '700' },
  fechaModal: { color: '#6b7280', marginTop: 4, marginBottom: 12, textTransform: 'capitalize' },
  etiqueta: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  listaPacientes: { maxHeight: 140, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  opcionPaciente: { paddingVertical: 10, paddingHorizontal: 12 },
  opcionPacienteSeleccionada: { backgroundColor: '#dbeafe' },
  textoOpcionPaciente: { fontSize: 15, color: '#111827' },
  textoOpcionPacienteSeleccionada: { color: '#1d4ed8', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  botonHora: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  textoBotonHora: { fontSize: 15, color: '#111827', fontWeight: '600' },
  filaBotonesModal: { flexDirection: 'row', marginTop: 20, gap: 10 },
  botonModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonCancelar: { backgroundColor: '#f3f4f6' },
  botonGuardar: { backgroundColor: '#2563eb' },
  textoBotonCancelar: { color: '#111827', fontWeight: '600' },
  textoBotonGuardar: { color: '#fff', fontWeight: '600' },
});