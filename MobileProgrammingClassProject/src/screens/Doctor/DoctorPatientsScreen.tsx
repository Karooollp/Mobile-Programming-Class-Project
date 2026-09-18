import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Supabase } from "../../lib/Supabase";
import {
  getMyPatients,
  getDoctorDashboardSummary,
  getAlertsForDoctor,
  getUpcomingAppointmentsForDoctor,
} from "../../services/doctorService";

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

type Resumen = {
  totalPatients: number;
  todayAppointments: number;
  totalAlerts: number;
};

export default function DoctorHomeScreen({ navigation }: any) {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<MiPaciente[]>([]);
  const [resumen, setResumen] = useState<Resumen>({ totalPatients: 0, todayAppointments: 0, totalAlerts: 0 });

  // patient_id -> texto de próxima cita
  const [proximasCitas, setProximasCitas] = useState<Record<string, string>>({});
  // patient_id -> nota de alerta más reciente (si la hay)
  const [alertasPorPaciente, setAlertasPorPaciente] = useState<Record<string, string>>({});

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [search, setSearch] = useState("");

  const cargarTodo = useCallback(async (id: string) => {
    try {
      const [listaPacientes, resumenData, citas, alertas] = await Promise.all([
        getMyPatients(id),
        getDoctorDashboardSummary(id),
        getUpcomingAppointmentsForDoctor(id),
        getAlertsForDoctor(id),
      ]);

      const listaTipada = listaPacientes as unknown as MiPaciente[];
      setPacientes(listaTipada);

      // 🔒 Lista de IDs de MIS pacientes (los que de verdad me fueron asignados).
      // La usamos como "lista de invitados": cualquier cita o alerta que no
      // pertenezca a alguien de esta lista se descarta, sin importar lo que
      // haya devuelto el backend.
      const idsAsignados = new Set(listaTipada.map((p) => p.patient_id));

      // Solo la próxima cita (la más cercana) por paciente, y solo de mis pacientes.
      const mapaCitas: Record<string, string> = {};
      for (const cita of citas as any[]) {
        if (!idsAsignados.has(cita.user_id)) continue;
        if (!mapaCitas[cita.user_id]) {
          mapaCitas[cita.user_id] = new Date(cita.appointment_date).toLocaleString("es-HN", {
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          });
        }
      }
      setProximasCitas(mapaCitas);

      // 🔒 Filtramos TODAS las alertas para quedarnos solo con las de mis
      // pacientes asignados. getAlertsForDoctor podría estar devolviendo
      // alertas de pacientes que no son míos (de ahí el bug), así que este
      // filtro es la red de seguridad final antes de mostrar nada en pantalla.
      const alertasFiltradas = (alertas as any[]).filter((alerta) => idsAsignados.has(alerta.user_id));

      // Solo la alerta más reciente por paciente (para el badge/cuadro amarillo).
      const mapaAlertas: Record<string, string> = {};
      for (const alerta of alertasFiltradas) {
        if (!mapaAlertas[alerta.user_id]) {
          mapaAlertas[alerta.user_id] = alerta.note ?? "Alerta de emergencia";
        }
      }
      setAlertasPorPaciente(mapaAlertas);

      // 🔒 El número del stat card "🚨 Alertas" también debe contar solo las
      // de mis pacientes. Aquí sobrescribimos lo que venga en resumenData
      // (que probablemente cuenta emergencias de TODO el sistema) con el
      // conteo ya filtrado localmente.
      setResumen({
        ...resumenData,
        totalAlerts: alertasFiltradas.length,
      });
    } catch (error) {
      console.error("Error cargando dashboard del doctor:", error);
      Alert.alert("Error", "No se pudo cargar la información del panel.");
    }
  }, []);

  // Carga inicial: obtenemos quién es el doctor autenticado y cargamos todo una vez.
  useEffect(() => {
    const init = async () => {
      const { data, error } = await Supabase.auth.getUser();
      if (error || !data.user) {
        Alert.alert("Sesión no válida", "Vuelve a iniciar sesión.");
        return;
      }
      setDoctorId(data.user.id);
      await cargarTodo(data.user.id);
      setCargando(false);
    };
    init();
  }, [cargarTodo]);

  // 🔁 Fix de "lista stale": cada vez que esta pantalla vuelve a tener foco
  // (por ejemplo, regresas de asignar un paciente nuevo en la pestaña
  // Pacientes), recargamos todo. No solo la primera vez que se monta.
  useFocusEffect(
    useCallback(() => {
      if (doctorId) {
        cargarTodo(doctorId);
      }
    }, [doctorId, cargarTodo])
  );

  const onRefresh = async () => {
    if (!doctorId) return;
    setRefrescando(true);
    await cargarTodo(doctorId);
    setRefrescando(false);
  };

  const filteredPatients = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return pacientes;
    return pacientes.filter((p) => {
      const nombre = `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase();
      return nombre.includes(text);
    });
  }, [search, pacientes]);

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centrado]}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Buenos días 👋</Text>
            <Text style={styles.doctorName}>Panel del médico</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation?.navigate?.("Alertas")}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* RESUMEN */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>Resumen de pacientes</Text>
            <Text style={styles.summarySubtitle}>Información general de tu consulta</Text>
          </View>

          <View style={styles.summaryNumberContainer}>
            <Text style={styles.summaryNumber}>{resumen.totalPatients}</Text>
            <Text style={styles.summaryLabel}>Pacientes</Text>
          </View>
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>{resumen.totalPatients}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>{resumen.todayAppointments}</Text>
            <Text style={styles.statLabel}>Citas hoy</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚨</Text>
            <Text style={styles.statNumber}>{resumen.totalAlerts}</Text>
            <Text style={styles.statLabel}>Alertas</Text>
          </View>
        </View>

        {/* BUSCADOR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis pacientes</Text>
          <Text style={styles.patientCount}>{filteredPatients.length}</Text>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar paciente..."
            placeholderTextColor="#8A8A8A"
            style={styles.searchInput}
          />
        </View>

        {/* LISTA DE PACIENTES */}
        {filteredPatients.map(({ patient_id, patient }) => {
          const alerta = alertasPorPaciente[patient_id];
          const proximaCita = proximasCitas[patient_id];

          return (
            <TouchableOpacity
              key={patient_id}
              style={styles.patientCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate?.("DoctorPatientProfile", { patientId: patient_id })}
            >
              <View style={styles.patientTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{patient.first_name.charAt(0)}</Text>
                </View>

                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>
                    {patient.first_name} {patient.last_name}
                  </Text>
                  <Text style={styles.patientDetails}>
                    {patient.age != null ? `${patient.age} años` : "Edad no registrada"}
                    {patient.blood_type ? ` · ${patient.blood_type}` : ""}
                  </Text>
                </View>

                <View style={[styles.statusBadge, alerta ? styles.statusWarning : styles.statusStable]}>
                  <Text style={styles.statusText}>{alerta ? "Requiere atención" : "Estable"}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.patientMetrics}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>📅 Próxima cita</Text>
                  <Text style={styles.appointmentText}>{proximaCita ?? "Sin cita programada"}</Text>
                </View>
              </View>

              {alerta && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>Alerta</Text>
                    <Text style={styles.alertText}>{alerta}</Text>
                  </View>
                </View>
              )}

              <View style={styles.viewProfile}>
                <Text style={styles.viewProfileText}>Ver expediente médico →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredPatients.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>
              {pacientes.length === 0 ? "Aún no tienes pacientes asignados" : "No se encontraron pacientes"}
            </Text>
            <Text style={styles.emptyText}>
              {pacientes.length === 0
                ? "Ve a la pestaña Pacientes para asignarte tu primer paciente."
                : "Intenta buscar utilizando otro nombre."}
            </Text>
          </View>
        )}

        {/* ACCIONES RÁPIDAS */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Acciones rápidas</Text>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.("Citas")}>
            <Text style={styles.quickIcon}>📅</Text>
            <Text style={styles.quickText}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.("Alertas")}>
            <Text style={styles.quickIcon}>🚨</Text>
            <Text style={styles.quickText}>Alertas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.("Pacientes")}>
            <Text style={styles.quickIcon}>👥</Text>
            <Text style={styles.quickText}>Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => navigation?.navigate?.("Perfil")}>
            <Text style={styles.quickIcon}>👨‍⚕️</Text>
            <Text style={styles.quickText}>Mi perfil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  centrado: { justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  welcome: { fontSize: 14, color: "#68707A", marginBottom: 4 },
  doctorName: { fontSize: 26, fontWeight: "800", color: "#18202A" },
  notificationButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", elevation: 2 },
  notificationIcon: { fontSize: 21 },
  summaryCard: { backgroundColor: "#1E88E5", borderRadius: 22, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  summaryTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  summarySubtitle: { color: "#E8F3FF", fontSize: 13, marginTop: 5 },
  summaryNumberContainer: { alignItems: "center" },
  summaryNumber: { color: "#FFFFFF", fontSize: 32, fontWeight: "900" },
  summaryLabel: { color: "#E8F3FF", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  statCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14, elevation: 1 },
  statIcon: { fontSize: 20, marginBottom: 8 },
  statNumber: { fontSize: 21, fontWeight: "800", color: "#18202A" },
  statLabel: { fontSize: 11, color: "#727A84", marginTop: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: "800", color: "#18202A" },
  patientCount: { marginLeft: 8, backgroundColor: "#E3F2FD", color: "#1976D2", fontWeight: "700", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, fontSize: 12 },
  searchContainer: { backgroundColor: "#FFFFFF", borderRadius: 15, height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 15, marginBottom: 16, elevation: 1 },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#18202A" },
  patientCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 17, marginBottom: 15, elevation: 2 },
  patientTop: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#1976D2" },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  patientDetails: { fontSize: 13, color: "#727A84", marginTop: 4 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  statusStable: { backgroundColor: "#E8F5E9" },
  statusWarning: { backgroundColor: "#FFF3E0" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#333333" },
  divider: { height: 1, backgroundColor: "#ECEFF1", marginVertical: 15 },
  patientMetrics: { gap: 9 },
  metric: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: "#7A828C", fontSize: 12 },
  appointmentText: { color: "#1976D2", fontSize: 12, fontWeight: "700", maxWidth: 180, textAlign: "right" },
  alertBox: { marginTop: 14, backgroundColor: "#FFF8E1", borderRadius: 12, padding: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  alertIcon: { fontSize: 18 },
  alertTitle: { fontSize: 11, fontWeight: "800", color: "#8A6500" },
  alertText: { fontSize: 12, color: "#725600", marginTop: 2 },
  viewProfile: { marginTop: 15, alignItems: "flex-end" },
  viewProfileText: { color: "#1976D2", fontSize: 13, fontWeight: "800" },
  emptyContainer: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 30, alignItems: "center" },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  emptyText: { fontSize: 13, color: "#727A84", textAlign: "center", marginTop: 5 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  quickAction: { width: "48%", backgroundColor: "#FFFFFF", borderRadius: 17, padding: 17, alignItems: "center", elevation: 1 },
  quickIcon: { fontSize: 24, marginBottom: 7 },
  quickText: { fontSize: 13, fontWeight: "700", color: "#303840" },
});