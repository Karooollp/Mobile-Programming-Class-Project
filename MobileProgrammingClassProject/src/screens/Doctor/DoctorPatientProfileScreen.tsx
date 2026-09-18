import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Supabase } from "../../lib/Supabase";
import { getPatientProfile, getPatientMedications, assignMedication } from "../../services/doctorService";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import { generateScheduleTimes, FrequencyType } from "../../utils/types/scheduleHelper";

// Mismo normalizador que hay en medicationService.ts: schedule_times puede
// llegar como array real (jsonb/text[]) o como string con el JSON adentro
// (columna text). No se pudo reusar el de medicationService.ts porque ahí
// no está exportado.
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

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function parseTimeStringToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return date;
}

function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

type PatientMedication = {
  id: string;
  name: string;
  dosage: string;
  scheduleTimes: string[];
};

export default function DoctorPatientProfileScreen({ route }: any) {
  const { patientId } = route.params;
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [medicamentos, setMedicamentos] = useState<PatientMedication[]>([]);
  const [cargandoMeds, setCargandoMeds] = useState(true);

  const cargarMedicamentos = useCallback(async () => {
    try {
      const data = await getPatientMedications(patientId);
      const normalizados = (data ?? []).map((med: any) => ({
        id: med.id,
        name: med.name,
        dosage: med.dosage,
        scheduleTimes: parseScheduleTimes(med.schedule_times),
      }));
      setMedicamentos(normalizados);
    } catch (e) {
      console.error("Error cargando medicamentos del paciente:", e);
    } finally {
      setCargandoMeds(false);
    }
  }, [patientId]);

  useEffect(() => {
    getPatientProfile(patientId)
      .then(setPerfil)
      .catch((e) => console.error("Error cargando perfil del paciente:", e))
      .finally(() => setCargando(false));

    Supabase.auth.getUser().then(({ data }) => {
      if (data.user) setDoctorId(data.user.id);
    });

    cargarMedicamentos();
  }, [patientId, cargarMedicamentos]);

  // ============== MODAL: Asignar medicamento (mismo patrón que DashboardScreen) ==============
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");

  const [freqType, setFreqType] = useState<FrequencyType>("TIMES_PER_DAY");
  const [intervalHours, setIntervalHours] = useState<number>(8);
  const [timesPerDay, setTimesPerDay] = useState<number>(2);
  const [startTime, setStartTime] = useState<string>("08:00");

  const [customSchedule, setCustomSchedule] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [savingMed, setSavingMed] = useState(false);

  const computedSchedule = useMemo(() => {
    const raw =
      freqType === "CUSTOM"
        ? customSchedule
        : generateScheduleTimes({
            type: freqType,
            intervalHours,
            timesPerDay,
            startTime,
          });
    return Array.from(new Set(raw)).sort();
  }, [freqType, intervalHours, timesPerDay, startTime, customSchedule]);

  const resetMedModal = () => {
    setMedName("");
    setMedDosage("");
    setFreqType("TIMES_PER_DAY");
    setIntervalHours(8);
    setTimesPerDay(2);
    setStartTime("08:00");
    setCustomSchedule([]);
  };

  const handleAddTimeToCustomSchedule = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event?.type === "dismissed" || !selectedDate) return;
    const formatted = formatTime(selectedDate);
    if (!customSchedule.includes(formatted)) {
      setCustomSchedule((prev) => [...prev, formatted].sort());
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(false);
    if (event?.type === "dismissed" || !selectedDate) return;
    setStartTime(formatTime(selectedDate));
  };

  const handleRemoveCustomTime = (time: string) => {
    setCustomSchedule((prev) => prev.filter((t) => t !== time));
  };

  const handleSaveMedication = async () => {
    if (!doctorId || savingMed) return;
    if (!medName.trim() || !medDosage.trim() || computedSchedule.length === 0) {
      return Alert.alert("Campos incompletos", "Por favor completa el nombre, dosis y horarios.");
    }
    setSavingMed(true);
    try {
      await assignMedication(doctorId, patientId, medName.trim(), medDosage.trim(), computedSchedule, {
        type: freqType,
        intervalHours: freqType === "INTERVAL" ? intervalHours : undefined,
        timesPerDay: freqType === "TIMES_PER_DAY" ? timesPerDay : undefined,
        startTime,
      });
      Alert.alert("¡Listo! 💊", "Medicamento asignado al paciente.");
      resetMedModal();
      setShowMedModal(false);
      await cargarMedicamentos();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo asignar el medicamento.");
    } finally {
      setSavingMed(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={styles.centrado}>
        <Text>No se pudo cargar el perfil.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          {perfil.photo_url ? (
            <Image source={{ uri: perfil.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={{ color: "#1976D2", fontWeight: "800" }}>
                {perfil.first_name?.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{perfil.first_name} {perfil.last_name}</Text>
          <Text style={styles.email}>{perfil.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Edad</Text>
          <Text style={styles.value}>{perfil.age ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de sangre</Text>
          <Text style={styles.value}>{perfil.blood_type ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.value}>{perfil.phone ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Contacto de emergencia</Text>
          <Text style={styles.value}>{perfil.emergency_contact ?? "-"}</Text>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Condiciones médicas</Text>
        {perfil.conditions?.length > 0 ? (
          perfil.conditions.map((c: any) => (
            <View key={c.id} style={styles.conditionCard}>
              <Text style={styles.value}>{c.condition?.condition_name}</Text>
              {c.notes && <Text style={styles.notes}>{c.notes}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.value}>Sin condiciones registradas.</Text>
        )}

        {/* ============== MEDICAMENTOS ============== */}
        <View style={styles.medHeaderRow}>
          <Text style={[styles.label, { marginTop: 0 }]}>Medicamentos activos</Text>
          <TouchableOpacity style={styles.medAddButton} onPress={() => setShowMedModal(true)}>
            <Text style={styles.medAddButtonText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {cargandoMeds ? (
          <ActivityIndicator size="small" color="#1E88E5" style={{ marginTop: 8 }} />
        ) : medicamentos.length > 0 ? (
          medicamentos.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDosage}>{med.dosage}</Text>
              <View style={styles.medChipsRow}>
                {med.scheduleTimes.map((t) => (
                  <View key={t} style={styles.medChip}>
                    <Text style={styles.medChipText}>{formatTimeDisplay(t)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.value, { marginTop: 4 }]}>Este paciente no tiene medicamentos activos.</Text>
        )}
      </ScrollView>

      {/* ============== MODAL: Asignar medicamento ============== */}
      <Modal
        visible={showMedModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          resetMedModal();
          setShowMedModal(false);
        }}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Asignar medicamento 💊</Text>
              <Text style={styles.modalSubtitle}>
                Para {perfil.first_name} {perfil.last_name}
              </Text>

              <CustomInput placeholder="Nombre del medicamento (ej: Paracetamol)" value={medName} onChange={setMedName} />
              <CustomInput placeholder="Dosis (ej: 1 tableta / 500mg)" value={medDosage} onChange={setMedDosage} />

              <Text style={styles.modalLabel}>Frecuencia de tomas</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, freqType === "TIMES_PER_DAY" && styles.tabButtonActive]}
                  onPress={() => setFreqType("TIMES_PER_DAY")}
                >
                  <Text style={[styles.tabText, freqType === "TIMES_PER_DAY" && styles.tabTextActive]}>Tomas/día</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, freqType === "INTERVAL" && styles.tabButtonActive]}
                  onPress={() => setFreqType("INTERVAL")}
                >
                  <Text style={[styles.tabText, freqType === "INTERVAL" && styles.tabTextActive]}>Intervalo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, freqType === "CUSTOM" && styles.tabButtonActive]}
                  onPress={() => setFreqType("CUSTOM")}
                >
                  <Text style={[styles.tabText, freqType === "CUSTOM" && styles.tabTextActive]}>Manual</Text>
                </TouchableOpacity>
              </View>

              {freqType === "TIMES_PER_DAY" && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.modalLabel}>¿Cuántas veces al día?</Text>
                  <View style={styles.chipsContainer}>
                    {[1, 2, 3, 4].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[styles.optionChip, timesPerDay === num && styles.optionChipActive]}
                        onPress={() => setTimesPerDay(num)}
                      >
                        <Text style={timesPerDay === num ? styles.optionChipTextActive : styles.optionChipText}>
                          {num} {num === 1 ? "toma" : "tomas"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {freqType === "INTERVAL" && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.modalLabel}>¿Cada cuántas horas?</Text>
                  <View style={styles.chipsContainer}>
                    {[4, 6, 8, 12, 24].map((hrs) => (
                      <TouchableOpacity
                        key={hrs}
                        style={[styles.optionChip, intervalHours === hrs && styles.optionChipActive]}
                        onPress={() => setIntervalHours(hrs)}
                      >
                        <Text style={intervalHours === hrs ? styles.optionChipTextActive : styles.optionChipText}>
                          Cada {hrs} hrs
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {freqType !== "CUSTOM" && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.modalLabel}>Hora de la primera toma</Text>
                  <TouchableOpacity style={styles.modalInput} onPress={() => setShowStartTimePicker(true)}>
                    <Text style={{ color: "#18202A", fontWeight: "600" }}>⏰ {formatTimeDisplay(startTime)}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showStartTimePicker && (
                <DateTimePicker value={parseTimeStringToDate(startTime)} mode="time" onChange={handleStartTimeChange} />
              )}

              <Text style={styles.modalLabel}>Horarios resultantes</Text>
              <View style={styles.chipsContainer}>
                {computedSchedule.map((time) => (
                  <View key={time} style={styles.chip}>
                    <Text style={styles.chipText}>{formatTimeDisplay(time)}</Text>
                    {freqType === "CUSTOM" && (
                      <TouchableOpacity onPress={() => handleRemoveCustomTime(time)}>
                        <Text style={styles.chipRemove}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {freqType === "CUSTOM" && (
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.secondaryButtonText}>+ Agregar horario</Text>
                </TouchableOpacity>
              )}

              {showTimePicker && (
                <DateTimePicker value={new Date()} mode="time" onChange={handleAddTimeToCustomSchedule} />
              )}

              <View style={{ marginTop: 16, opacity: savingMed ? 0.6 : 1 }} pointerEvents={savingMed ? "none" : "auto"}>
                <CustomButton
                  title={savingMed ? "Guardando..." : "Asignar medicamento"}
                  onPress={handleSaveMedication}
                  variant="primary"
                />
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                disabled={savingMed}
                onPress={() => {
                  resetMedModal();
                  setShowMedModal(false);
                }}
              >
                <Text style={{ color: "#727A84" }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  avatarPlaceholder: { backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
  name: { fontSize: 20, fontWeight: "800", color: "#18202A" },
  email: { fontSize: 13, color: "#727A84" },
  section: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: "#68707A" },
  value: { fontSize: 15, color: "#18202A", marginTop: 2 },
  conditionCard: { backgroundColor: "#FFF", padding: 12, borderRadius: 12, marginBottom: 8 },
  notes: { fontSize: 12, color: "#727A84", marginTop: 4 },

  medHeaderRow: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  medAddButton: { backgroundColor: "#1976D2", borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 },
  medAddButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  medCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  medName: { fontSize: 15, fontWeight: "800", color: "#18202A" },
  medDosage: { fontSize: 12, color: "#727A84", marginTop: 2, marginBottom: 8 },
  medChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  medChip: { backgroundColor: "#E3F2FD", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  medChipText: { color: "#1976D2", fontSize: 11, fontWeight: "700" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#18202A" },
  modalSubtitle: { fontSize: 13, color: "#727A84", marginBottom: 16, marginTop: 2 },
  modalLabel: { fontSize: 13, fontWeight: "600", color: "#68707A", marginBottom: 8, marginTop: 4 },
  modalInput: { borderWidth: 1, borderColor: "#DDE3E8", borderRadius: 10, padding: 12, marginBottom: 12, justifyContent: "center" },
  modalCloseButton: { marginTop: 14, alignItems: "center", paddingVertical: 8 },

  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#1976D2",
    backgroundColor: "#F5F9FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { color: "#1976D2", fontWeight: "600" },
  chipRemove: { color: "#1976D2", marginLeft: 6, fontWeight: "700" },

  optionChip: { borderWidth: 1.5, borderColor: "#1976D2", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  optionChipActive: { backgroundColor: "#1976D2" },
  optionChipText: { color: "#1976D2", fontWeight: "600" },
  optionChipTextActive: { color: "#FFFFFF", fontWeight: "600" },

  secondaryButton: { marginTop: 4, marginBottom: 10, paddingVertical: 10, borderRadius: 8, alignItems: "center", borderWidth: 1.5, borderColor: "#1976D2" },
  secondaryButtonText: { color: "#1976D2", fontSize: 14, fontWeight: "600" },

  tabContainer: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 10, padding: 4, marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabButtonActive: { backgroundColor: "#1976D2" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#666" },
  tabTextActive: { color: "#FFFFFF" },
});