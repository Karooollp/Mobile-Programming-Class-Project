import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { useAppSelector } from "../store/hooks";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import {
  fetchMedications,
  fetchTodayLogs,
  addMedication,
  logMedicationTaken,
  deleteMedicationLog,
  deactivateMedication,
} from "../services/medicationService";
import {
  fetchNextAppointment,
  fetchAppointmentsRange,
  toggleAppointmentAttended,
  addAppointment,
  deleteAppointment,
} from "../services/appointmentService";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  scheduleTimes: string[];
};

type PendingDose = {
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
};

// Formatea un objeto Date a "HH:MM" en 24h, que es como lo guardamos en BD
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Convierte "14:00" a "2:00 PM" solo para mostrarlo bonito en pantalla
function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function DashboardScreen() {
  const { colors } = useCaremapHealth();
  const styles = getStyles(colors);
  const profile = useAppSelector((state) => state.userProfile.data);
  const userId = profile?.user_id;

  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [appointmentsRange, setAppointmentsRange] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!userId) return;
    try {
      const [meds, logs, appt, apptRange] = await Promise.all([
        fetchMedications(userId),
        fetchTodayLogs(userId),
        fetchNextAppointment(userId),
        fetchAppointmentsRange(userId, 30),
      ]);
      setMedications(meds);
      setTodayLogs(logs);
      setNextAppointment(appt);
      setAppointmentsRange(apptRange);
    } catch (error) {
      console.log("Error cargando dashboard:", error);
      Alert.alert("Error", "No se pudo cargar la información del dashboard");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const totalDosisHoy = medications.reduce(
    (sum, med) => sum + med.scheduleTimes.length,
    0
  );
  const dosisTomadasHoy = todayLogs.length;

  const pendingDoses: PendingDose[] = medications.flatMap((med) =>
    med.scheduleTimes
      .filter(
        (time) =>
          !todayLogs.some(
            (log) => log.medication_id === med.id && log.scheduled_time === time
          )
      )
      .map((time) => ({
        medicationId: med.id,
        medicationName: med.name,
        scheduledTime: time,
      }))
  );

  const porcentajeProgreso =
    totalDosisHoy > 0 ? (dosisTomadasHoy / totalDosisHoy) * 100 : 0;

  // 👇 Desglose por medicamento: cuántas tomas de HOY tiene cada uno vs
  // cuántas le tocaban en total hoy. Ej: Paracetamol 2/3, Losartán 1/1.
  const medicationBreakdown = medications.map((med) => {
    const takenCount = todayLogs.filter(
      (log) => log.medication_id === med.id
    ).length;
    return {
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      taken: takenCount,
      total: med.scheduleTimes.length,
    };
  });

  // 👇 Toggle de asistencia: actualiza la cita en BD y refleja el cambio
  // localmente sin tener que recargar todo el dashboard de nuevo.
  const handleToggleAttended = async (appointmentId: string, current: boolean) => {
    try {
      await toggleAppointmentAttended(appointmentId, !current);
      setAppointmentsRange((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, attended: !current } : a))
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo actualizar la cita");
    }
  };

  // 👇 Borra una cita, pero SOLO si ya está marcada como asistida.
  // Esta es la regla de negocio: no se puede borrar una cita "pendiente",
  // solo una que ya se completó (attended = true). La validación vive aquí
  // porque appointmentService.deleteAppointment no valida nada por su cuenta.
  const handleDeleteAppointment = (appointmentId: string, attended: boolean) => {
    if (!attended) {
      Alert.alert(
        "Cita no completada",
        "Solo puedes eliminar una cita después de marcarla como asistida."
      );
      return;
    }
    Alert.alert(
      "Eliminar cita",
      "¿Seguro que quieres eliminar esta cita? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppointment(appointmentId);
              setAppointmentsRange((prev) => prev.filter((a) => a.id !== appointmentId));
            } catch (error) {
              console.log(error);
              Alert.alert("Error", "No se pudo eliminar la cita");
            }
          },
        },
      ]
    );
  };

  // 👇 Desactiva un medicamento (no lo borra de la BD, solo deja de contar
  // para hoy y días futuros — ver deactivateMedication). Si todavía tiene
  // dosis pendientes hoy, se muestra una advertencia extra en el mensaje,
  // pero el botón "Eliminar" sigue ahí y procede si el usuario insiste.
  const handleDeactivateMedication = (medicationId: string, medicationName: string) => {
    const breakdown = medicationBreakdown.find((m) => m.id === medicationId);
    const tienePendientesHoy = !!breakdown && breakdown.taken < breakdown.total;

    const mensaje = tienePendientesHoy
      ? `Aún tienes dosis pendientes de "${medicationName}" hoy. Si lo eliminas, dejará de aparecer en tu lista (hoy y en adelante). ¿Deseas continuar?`
      : `¿Eliminar "${medicationName}" de tu lista de medicamentos? Ya no aparecerá hoy ni en días futuros. Tu historial de tomas anteriores se conserva.`;

    Alert.alert("Eliminar medicamento", mensaje, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deactivateMedication(medicationId);
            setMedications((prev) => prev.filter((m) => m.id !== medicationId));
          } catch (error) {
            console.log(error);
            Alert.alert("Error", "No se pudo eliminar el medicamento");
          }
        },
      },
    ]);
  };

  // ============== MODAL: Registrar Dosis Tomada ==============
  const [showDoseModal, setShowDoseModal] = useState(false);

  // ============== Selección múltiple para borrar "Dosis registradas hoy" ==============
  // selectionMode: si estamos en modo "elige varias para borrar".
  // selectedLogIds: ids de medication_logs marcados en este modo.
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Long-press en una fila: si no estábamos en modo selección, lo activa
  // y marca esa fila de una vez. Si ya estábamos, no hace nada extra
  // (el tap normal ya se encarga de marcar/desmarcar).
  const handleLongPressLog = (logId: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedLogIds([logId]);
    }
  };

  // Tap normal sobre una fila DURANTE el modo selección: toggle de marcado.
  const handleTogglePressLog = (logId: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedLogIds([]);
  };

  // Borra todos los logs marcados. El número en "Pastillas de hoy por
  // medicamento" se actualiza solo, porque medicationBreakdown se calcula
  // a partir de todayLogs en cada render.
  const handleDeleteSelectedLogs = () => {
    if (selectedLogIds.length === 0) return;
    Alert.alert(
      "Eliminar dosis",
      `¿Eliminar ${selectedLogIds.length} registro(s) de dosis tomada? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(selectedLogIds.map((id) => deleteMedicationLog(id)));
              setTodayLogs((prev) => prev.filter((log) => !selectedLogIds.includes(log.id)));
              setSelectionMode(false);
              setSelectedLogIds([]);
            } catch (error) {
              console.log(error);
              Alert.alert("Error", "No se pudieron eliminar todos los registros");
            }
          },
        },
      ]
    );
  };

  const handleRegistrarDosis = async (dose: PendingDose) => {
    if (!userId) return;
    try {
      await logMedicationTaken(userId, dose.medicationId, dose.scheduledTime);
      Alert.alert("¡Excelente!", `Registraste tu dosis de ${dose.medicationName}.`);
      await loadDashboardData();
      if (pendingDoses.length <= 1) setShowDoseModal(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo registrar la dosis");
    }
  };

  // ============== MODAL: Agregar Medicamento ==============
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medSchedule, setMedSchedule] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetMedModal = () => {
    setMedName("");
    setMedDosage("");
    setMedSchedule([]);
  };

  const handleAddTimeToSchedule = (_: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (selectedDate) {
      const formatted = formatTime(selectedDate);
      if (!medSchedule.includes(formatted)) {
        setMedSchedule((prev) => [...prev, formatted].sort());
      }
    }
  };

  const handleRemoveTime = (time: string) => {
    setMedSchedule((prev) => prev.filter((t) => t !== time));
  };

  const handleSaveMedication = async () => {
    if (!userId) return;
    if (!medName.trim() || !medDosage.trim() || medSchedule.length === 0) {
      return Alert.alert(
        "Campos incompletos",
        "Agrega nombre, dosis y al menos un horario."
      );
    }
    try {
      await addMedication(userId, medName.trim(), medDosage.trim(), medSchedule);
      Alert.alert("Listo", "Medicamento agregado correctamente.");
      resetMedModal();
      setShowMedModal(false);
      await loadDashboardData();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo guardar el medicamento");
    }
  };

  // ============== MODAL: Agregar Cita ==============
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptReason, setApptReason] = useState("");
  const [apptDate, setApptDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showApptTimePicker, setShowApptTimePicker] = useState(false);

  const resetApptModal = () => {
    setApptDoctor("");
    setApptReason("");
    setApptDate(new Date());
  };

  const handleSaveAppointment = async () => {
    if (!userId) return;
    if (!apptDoctor.trim()) {
      return Alert.alert("Campo incompleto", "Indica el doctor o lugar de la cita.");
    }
    try {
      await addAppointment(
        userId,
        apptDoctor.trim(),
        apptReason.trim(),
        apptDate.toISOString()
      );
      Alert.alert("Listo", "Cita agregada correctamente.");
      resetApptModal();
      setShowApptModal(false);
      await loadDashboardData();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo guardar la cita");
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textPrimary }}>Cargando tu información...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>🩺 Control Médico</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Seguimiento de tu tratamiento y citas</Text>

      {/* Tarjeta de dosis */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Dosis de medicamentos tomadas hoy</Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>
          {dosisTomadasHoy} de {totalDosisHoy}
        </Text>

        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: `${porcentajeProgreso}%`, backgroundColor: colors.primary }]} />
        </View>

        <Text style={[styles.metricNote, { color: colors.textSecondary }]}>
          {totalDosisHoy === 0
            ? "Aún no tienes medicamentos registrados 💊"
            : pendingDoses.length > 0
            ? `Te falta ${pendingDoses.length} dosis para completar el día 💊`
            : "¡Felicidades! Completaste tus dosis de hoy 🎉"}
        </Text>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => (pendingDoses.length > 0 ? setShowDoseModal(true) : Alert.alert("Dosis completas", "Ya tomaste todas tus dosis de hoy."))}
        >
          <Text style={styles.actionButtonText}>+ Registrar Dosis Tomada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButtonSecondary, { borderColor: colors.primary }]}
          onPress={() => setShowMedModal(true)}
        >
          <Text style={[styles.actionButtonSecondaryText, { color: colors.primary }]}>+ Agregar Medicamento</Text>
        </TouchableOpacity>
      </View>

      {/* Desglose de pastillas de hoy, por medicamento */}
      {medicationBreakdown.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary, marginBottom: 10 }]}>
            Pastillas de hoy por medicamento (mantén presionado para eliminar)
          </Text>
          {medicationBreakdown.map((med) => (
            <TouchableOpacity
              key={med.id}
              style={[styles.breakdownRow, { borderColor: colors.border }]}
              onLongPress={() => handleDeactivateMedication(med.id, med.name)}
              delayLongPress={400}
              activeOpacity={0.6}
            >
              <View>
                <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{med.name}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{med.dosage}</Text>
              </View>
              <Text
                style={{
                  color: med.taken >= med.total ? colors.primary : colors.textSecondary,
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {med.taken}/{med.total}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Dosis ya registradas hoy — mantén presionado para activar selección múltiple */}
      {todayLogs.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary, marginBottom: 10 }]}>
            {selectionMode
              ? "Toca para seleccionar las dosis a eliminar"
              : "Dosis registradas hoy (mantén presionado para eliminar)"}
          </Text>
          {todayLogs.map((log) => {
            const med = medications.find((m) => m.id === log.medication_id);
            const isSelected = selectedLogIds.includes(log.id);
            return (
              <TouchableOpacity
                key={log.id}
                style={[styles.breakdownRow, { borderColor: colors.border }]}
                onPress={() => selectionMode && handleTogglePressLog(log.id)}
                onLongPress={() => handleLongPressLog(log.id)}
                delayLongPress={400}
                activeOpacity={selectionMode ? 0.6 : 1}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  {selectionMode && (
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: colors.primary },
                        isSelected && { backgroundColor: colors.primary },
                      ]}
                    >
                      {isSelected && <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                    </View>
                  )}
                  <View>
                    <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                      {med?.name ?? "Medicamento"}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                      {formatTimeDisplay(log.scheduled_time)}
                    </Text>
                  </View>
                </View>
                {!selectionMode && <Text style={{ color: colors.primary, fontWeight: "700" }}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          {selectionMode && (
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.actionButtonSecondary, { borderColor: colors.border, flex: 1, marginTop: 0 }]}
                onPress={handleCancelSelection}
              >
                <Text style={[styles.actionButtonSecondaryText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.primary, flex: 1, marginTop: 0 },
                  selectedLogIds.length === 0 && { opacity: 0.5 },
                ]}
                onPress={handleDeleteSelectedLogs}
                disabled={selectedLogIds.length === 0}
              >
                <Text style={styles.actionButtonText}>Eliminar ({selectedLogIds.length})</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Tarjeta de próxima cita */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Próxima consulta médica</Text>

        {nextAppointment ? (
          <>
            <Text style={[styles.metricValue, { color: colors.primary, fontSize: 20 }]}>
              {new Date(nextAppointment.appointmentDate).toLocaleDateString()} ·{" "}
              {new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={[styles.metricNote, { color: colors.textSecondary }]}>
              {nextAppointment.doctorName} {nextAppointment.reason ? `· ${nextAppointment.reason}` : ""}
            </Text>
          </>
        ) : (
          <Text style={[styles.metricNote, { color: colors.textSecondary }]}>
            No tienes citas programadas 🗓️
          </Text>
        )}

        <TouchableOpacity
          style={[styles.actionButtonSecondary, { borderColor: colors.primary }]}
          onPress={() => setShowApptModal(true)}
        >
          <Text style={[styles.actionButtonSecondaryText, { color: colors.primary }]}>+ Agregar Cita</Text>
        </TouchableOpacity>
      </View>

      {/* Lista completa de citas (futuras + últimos 30 días) con check de asistencia */}
      {appointmentsRange.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary, marginBottom: 10 }]}>
            Mis citas (últimos 30 días y próximas) — mantén presionada para eliminar
          </Text>
          {appointmentsRange.map((appt) => {
            const isPast = new Date(appt.appointmentDate) < new Date();
            return (
              <TouchableOpacity
                key={appt.id}
                style={[styles.appointmentRow, { borderColor: colors.border }]}
                onPress={() => handleToggleAttended(appt.id, appt.attended)}
                onLongPress={() => handleDeleteAppointment(appt.id, appt.attended)}
                delayLongPress={400}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.primary },
                    appt.attended && { backgroundColor: colors.primary },
                  ]}
                >
                  {appt.attended && <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
                    {appt.doctorName} {appt.reason ? `· ${appt.reason}` : ""}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                    {new Date(appt.appointmentDate).toLocaleDateString()} ·{" "}
                    {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isPast && !appt.attended ? " · No asististe" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tarjeta de síntomas (se queda igual, no es prioridad hoy) */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Monitoreo de síntomas (Este mes)</Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>0 Alertas</Text>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: "0%", backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.metricNote, { color: colors.textSecondary }]}>No has reportado malestares graves, ¡excelente!</Text>
      </View>

      {/* Fila pequeña (queda igual, no es prioridad hoy) */}
      <View style={styles.row}>
        <View style={[styles.card, styles.cardSmall, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Última Presión</Text>
          <Text style={[styles.metricValueSmall, { color: colors.primary }]}>120/80</Text>
          <Text style={[styles.metricNote, { color: colors.textSecondary }]}>mmHg (Normal)</Text>
        </View>

        <View style={[styles.card, styles.cardSmall, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Temp. Promedio</Text>
          <Text style={[styles.metricValueSmall, { color: colors.primary }]}>36.5°C</Text>
          <Text style={[styles.metricNote, { color: colors.textSecondary }]}>Últimos 7 días</Text>
        </View>
      </View>

      {/* ============== MODAL: Registrar Dosis ============== */}
      <Modal visible={showDoseModal} transparent animationType="slide" onRequestClose={() => setShowDoseModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>¿Qué dosis tomaste?</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {pendingDoses.map((dose, index) => (
                <TouchableOpacity
                  key={`${dose.medicationId}-${dose.scheduledTime}-${index}`}
                  style={[styles.doseItem, { borderColor: colors.border }]}
                  onPress={() => handleRegistrarDosis(dose)}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{dose.medicationName}</Text>
                  <Text style={{ color: colors.textSecondary }}>{formatTimeDisplay(dose.scheduledTime)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDoseModal(false)}>
              <Text style={{ color: colors.textSecondary }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============== MODAL: Agregar Medicamento ============== */}
      <Modal
        visible={showMedModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetMedModal();
          setShowMedModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nuevo medicamento</Text>

            <CustomInput
              placeholder="Nombre del medicamento"
              value={medName}
              onChange={setMedName}
            />
            <CustomInput
              placeholder="Dosis (ej: 1 tableta)"
              value={medDosage}
              onChange={setMedDosage}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Horarios</Text>

            <View style={styles.chipsContainer}>
              {medSchedule.map((time) => (
                <View key={time} style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                  <Text style={{ color: colors.primary, fontWeight: "600" }}>{formatTimeDisplay(time)}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTime(time)}>
                    <Text style={{ color: colors.primary, marginLeft: 6, fontWeight: "700" }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.actionButtonSecondary, { borderColor: colors.primary }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={[styles.actionButtonSecondaryText, { color: colors.primary }]}>+ Agregar horario</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker value={new Date()} mode="time" onChange={handleAddTimeToSchedule} />
            )}

            <View style={{ marginTop: 16 }}>
              <CustomButton title="Guardar medicamento" onPress={handleSaveMedication} variant="primary" />
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                resetMedModal();
                setShowMedModal(false);
              }}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============== MODAL: Agregar Cita ============== */}
      <Modal
        visible={showApptModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetApptModal();
          setShowApptModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nueva cita médica</Text>

            <CustomInput
              placeholder="Doctor o lugar"
              value={apptDoctor}
              onChange={setApptDoctor}
            />
            <CustomInput
              placeholder="Motivo de la cita"
              value={apptReason}
              onChange={setApptReason}
            />

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Fecha y hora</Text>

            <TouchableOpacity
              style={[styles.modalInput, { borderColor: colors.border, justifyContent: "center" }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: colors.textPrimary }}>{apptDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalInput, { borderColor: colors.border, justifyContent: "center" }]}
              onPress={() => setShowApptTimePicker(true)}
            >
              <Text style={{ color: colors.textPrimary }}>
                {apptDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={apptDate}
                mode="date"
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    const updated = new Date(apptDate);
                    updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                    setApptDate(updated);
                  }
                }}
              />
            )}

            {showApptTimePicker && (
              <DateTimePicker
                value={apptDate}
                mode="time"
                onChange={(_, selected) => {
                  setShowApptTimePicker(false);
                  if (selected) {
                    const updated = new Date(apptDate);
                    updated.setHours(selected.getHours(), selected.getMinutes());
                    setApptDate(updated);
                  }
                }}
              />
            )}

            <View style={{ marginTop: 16 }}>
              <CustomButton title="Guardar cita" onPress={handleSaveAppointment} variant="primary" />
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                resetApptModal();
                setShowApptModal(false);
              }}
            >
              <Text style={{ color: colors.textSecondary }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    screen: { flex: 1 },
    content: { padding: 24, paddingTop: 52, paddingBottom: 32 },
    title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 28 },
    card: { borderRadius: 16, padding: 18, marginBottom: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
    metricLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
    metricValue: { fontSize: 32, fontWeight: "700", marginBottom: 10 },
    metricNote: { fontSize: 12, marginTop: 6, marginBottom: 10 },
    progressBarBackground: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
    progressBarFill: { height: 8, borderRadius: 4 },
    row: { flexDirection: "row", gap: 12 },
    cardSmall: { flex: 1 },
    metricValueSmall: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
    actionButton: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
    actionButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
    actionButtonSecondary: { marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1.5 },
    actionButtonSecondaryText: { fontSize: 14, fontWeight: "600" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "85%" },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
    modalLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
    modalInput: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
    modalCloseButton: { marginTop: 14, alignItems: "center", paddingVertical: 8 },
    doseItem: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    chip: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
    breakdownRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
    appointmentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  });