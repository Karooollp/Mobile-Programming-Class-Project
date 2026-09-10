
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";

type Patient = {
  id: string;
  name: string;
  age: number;
  bloodType: string;
  status: "Estable" | "Requiere atención" | "Crítico";
  pressure: string;
  heartRate: number;
  nextAppointment: string;
  alert?: string;
};

const PATIENTS: Patient[] = [
  {
    id: "patient-001",
    name: "María López",
    age: 68,
    bloodType: "O+",
    status: "Estable",
    pressure: "120/80",
    heartRate: 72,
    nextAppointment: "10 de septiembre · 9:00 AM",
  },
  {
    id: "patient-002",
    name: "Juan Martínez",
    age: 54,
    bloodType: "A+",
    status: "Requiere atención",
    pressure: "145/92",
    heartRate: 86,
    nextAppointment: "11 de septiembre · 10:30 AM",
    alert: "Presión arterial elevada",
  },
  {
    id: "patient-003",
    name: "Ana Hernández",
    age: 42,
    bloodType: "B+",
    status: "Estable",
    pressure: "118/76",
    heartRate: 69,
    nextAppointment: "13 de septiembre · 8:00 AM",
  },
];

export default function DoctorHomeScreen({ navigation }: any) {
  const [search, setSearch] = useState("");

  const filteredPatients = useMemo(() => {
    const text = search.trim().toLowerCase();

    if (!text) return PATIENTS;

    return PATIENTS.filter(
      (patient) =>
        patient.name.toLowerCase().includes(text) ||
        patient.id.toLowerCase().includes(text)
    );
  }, [search]);

  const getStatusStyle = (status: Patient["status"]) => {
    switch (status) {
      case "Crítico":
        return styles.statusCritical;

      case "Requiere atención":
        return styles.statusWarning;

      default:
        return styles.statusStable;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Buenos días 👋</Text>
            <Text style={styles.doctorName}>Panel del médico</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation?.navigate?.("DoctorNotifications")}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* RESUMEN */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>Resumen de pacientes</Text>
            <Text style={styles.summarySubtitle}>
              Información general de tu consulta
            </Text>
          </View>

          <View style={styles.summaryNumberContainer}>
            <Text style={styles.summaryNumber}>{PATIENTS.length}</Text>
            <Text style={styles.summaryLabel}>Pacientes</Text>
          </View>
        </View>

        {/* ESTADÍSTICAS */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>{PATIENTS.length}</Text>
            <Text style={styles.statLabel}>Pacientes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Citas hoy</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚨</Text>
            <Text style={styles.statNumber}>1</Text>
            <Text style={styles.statLabel}>Alertas</Text>
          </View>
        </View>

        {/* BUSCADOR */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis pacientes</Text>
          <Text style={styles.patientCount}>
            {filteredPatients.length}
          </Text>
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
        {filteredPatients.map((patient) => (
          <TouchableOpacity
            key={patient.id}
            style={styles.patientCard}
            activeOpacity={0.8}
            onPress={() =>
              navigation?.navigate?.("DoctorPatientProfile", {
                patientId: patient.id,
              })
            }
          >
            <View style={styles.patientTop}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {patient.name.charAt(0)}
                </Text>
              </View>

              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>

                <Text style={styles.patientDetails}>
                  {patient.age} años · {patient.bloodType}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  getStatusStyle(patient.status),
                ]}
              >
                <Text style={styles.statusText}>
                  {patient.status}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.patientMetrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Presión</Text>
                <Text style={styles.metricValue}>
                  {patient.pressure}
                </Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>❤️ Pulso</Text>
                <Text style={styles.metricValue}>
                  {patient.heartRate} BPM
                </Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricLabel}>📅 Próxima cita</Text>
                <Text style={styles.appointmentText}>
                  {patient.nextAppointment}
                </Text>
              </View>
            </View>

            {patient.alert && (
              <View style={styles.alertBox}>
                <Text style={styles.alertIcon}>⚠️</Text>

                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Alerta</Text>
                  <Text style={styles.alertText}>
                    {patient.alert}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.viewProfile}>
              <Text style={styles.viewProfileText}>
                Ver expediente médico →
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredPatients.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>
              No se encontraron pacientes
            </Text>
            <Text style={styles.emptyText}>
              Intenta buscar utilizando otro nombre o ID.
            </Text>
          </View>
        )}

        {/* ACCIONES RÁPIDAS */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Acciones rápidas
        </Text>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation?.navigate?.("DoctorAppointments")}
          >
            <Text style={styles.quickIcon}>📅</Text>
            <Text style={styles.quickText}>Citas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation?.navigate?.("DoctorAlerts")}
          >
            <Text style={styles.quickIcon}>🚨</Text>
            <Text style={styles.quickText}>Alertas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation?.navigate?.("DoctorPatients")}
          >
            <Text style={styles.quickIcon}>👥</Text>
            <Text style={styles.quickText}>Pacientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation?.navigate?.("DoctorProfile")}
          >
            <Text style={styles.quickIcon}>👨‍⚕️</Text>
            <Text style={styles.quickText}>Mi perfil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  welcome: {
    fontSize: 14,
    color: "#68707A",
    marginBottom: 4,
  },

  doctorName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#18202A",
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  notificationIcon: {
    fontSize: 21,
  },

  summaryCard: {
    backgroundColor: "#1E88E5",
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  summarySubtitle: {
    color: "#E8F3FF",
    fontSize: 13,
    marginTop: 5,
  },

  summaryNumberContainer: {
    alignItems: "center",
  },

  summaryNumber: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
  },

  summaryLabel: {
    color: "#E8F3FF",
    fontSize: 12,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 26,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    elevation: 1,
  },

  statIcon: {
    fontSize: 20,
    marginBottom: 8,
  },

  statNumber: {
    fontSize: 21,
    fontWeight: "800",
    color: "#18202A",
  },

  statLabel: {
    fontSize: 11,
    color: "#727A84",
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#18202A",
  },

  patientCount: {
    marginLeft: 8,
    backgroundColor: "#E3F2FD",
    color: "#1976D2",
    fontWeight: "700",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 12,
  },

  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 16,
    elevation: 1,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#18202A",
  },

  patientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 15,
    elevation: 2,
  },

  patientTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1976D2",
  },

  patientInfo: {
    flex: 1,
  },

  patientName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18202A",
  },

  patientDetails: {
    fontSize: 13,
    color: "#727A84",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  statusStable: {
    backgroundColor: "#E8F5E9",
  },

  statusWarning: {
    backgroundColor: "#FFF3E0",
  },

  statusCritical: {
    backgroundColor: "#FFEBEE",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#333333",
  },

  divider: {
    height: 1,
    backgroundColor: "#ECEFF1",
    marginVertical: 15,
  },

  patientMetrics: {
    gap: 9,
  },

  metric: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#7A828C",
    fontSize: 12,
  },

  metricValue: {
    color: "#18202A",
    fontSize: 13,
    fontWeight: "700",
  },

  appointmentText: {
    color: "#1976D2",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: 180,
    textAlign: "right",
  },

  alertBox: {
    marginTop: 14,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  alertIcon: {
    fontSize: 18,
  },

  alertTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#8A6500",
  },

  alertText: {
    fontSize: 12,
    color: "#725600",
    marginTop: 2,
  },

  viewProfile: {
    marginTop: 15,
    alignItems: "flex-end",
  },

  viewProfileText: {
    color: "#1976D2",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#18202A",
  },

  emptyText: {
    fontSize: 13,
    color: "#727A84",
    textAlign: "center",
    marginTop: 5,
  },

  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },

  quickAction: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    padding: 17,
    alignItems: "center",
    elevation: 1,
  },

  quickIcon: {
    fontSize: 24,
    marginBottom: 7,
  },

  quickText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#303840",
  },
});
