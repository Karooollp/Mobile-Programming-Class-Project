import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Supabase } from "../../lib/Supabase";
import { getAlertsForDoctor } from "../../services/doctorService";

// Lo que devuelve getAlertsForDoctor: la fila de "emergency_alerts" + el
// paciente ya unido a mano (ver el comentario en doctorService.ts sobre por
// qué no se puede hacer con un join automático).
type EmergencyAlert = {
  id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
};

export default function DoctorAlertsScreen({ navigation }: any) {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<EmergencyAlert[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargarAlertas = useCallback(async (id: string) => {
    try {
      const data = await getAlertsForDoctor(id);
      setAlertas((data as unknown as EmergencyAlert[]) || []);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      Alert.alert("Error", "No se pudieron cargar las alertas.");
    }
  }, []);

  useEffect(() => {
    // Mismo patrón que DoctorHomeScreen.tsx: el doctorId sale directo del
    // usuario logueado en Supabase, no de Redux.
    const init = async () => {
      const { data, error } = await Supabase.auth.getUser();
      if (error || !data.user) {
        Alert.alert("Sesión no válida", "Vuelve a iniciar sesión.");
        return;
      }
      setDoctorId(data.user.id);
      await cargarAlertas(data.user.id);
      setCargando(false);
    };
    init();
  }, [cargarAlertas]);

  const onRefresh = async () => {
    if (!doctorId) return;
    setRefrescando(true);
    await cargarAlertas(doctorId);
    setRefrescando(false);
  };

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleString("es-HN", {
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    });

  if (cargando) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centrado]}>
        <ActivityIndicator size="large" color="#E53935" />
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
        <Text style={styles.titulo}>🚨 Alertas de emergencia</Text>
        <Text style={styles.subtitulo}>
          {alertas.length === 0
            ? "No hay alertas registradas por tus pacientes."
            : `${alertas.length} alerta${alertas.length === 1 ? "" : "s"} registrada${
                alertas.length === 1 ? "" : "s"
              }`}
        </Text>

        {alertas.map((alerta) => (
          <TouchableOpacity
            key={alerta.id}
            style={styles.tarjeta}
            activeOpacity={0.8}
            onPress={() =>
              navigation?.navigate?.("DoctorPatientProfile", { patientId: alerta.user_id })
            }
          >
            <View style={styles.filaSuperior}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {alerta.patient?.first_name?.charAt(0) ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombrePaciente}>
                  {alerta.patient
                    ? `${alerta.patient.first_name} ${alerta.patient.last_name}`
                    : "Paciente"}
                </Text>
                <Text style={styles.fecha}>{formatearFecha(alerta.created_at)}</Text>
              </View>
            </View>

            <Text style={styles.nota}>
              {alerta.note || "Alerta de emergencia sin nota adicional."}
            </Text>

            <Text style={styles.verPerfil}>Ver expediente médico →</Text>
          </TouchableOpacity>
        ))}

        {alertas.length === 0 && (
          <View style={styles.vacioContainer}>
            <Text style={styles.vacioIcono}>✅</Text>
            <Text style={styles.vacioTitulo}>Todo tranquilo por ahora</Text>
            <Text style={styles.vacioTexto}>
              Cuando un paciente active una alerta de emergencia, aparecerá aquí.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  centrado: { justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  titulo: { fontSize: 24, fontWeight: "800", color: "#18202A" },
  subtitulo: { fontSize: 13, color: "#68707A", marginTop: 4, marginBottom: 18 },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#E53935",
  },
  filaSuperior: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FDEAEA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTexto: { fontSize: 18, fontWeight: "800", color: "#E53935" },
  nombrePaciente: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  fecha: { fontSize: 12, color: "#8A8A8A", marginTop: 2 },
  nota: { fontSize: 14, color: "#3A4048", marginBottom: 10 },
  verPerfil: { fontSize: 12, fontWeight: "700", color: "#1976D2", textAlign: "right" },
  vacioContainer: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 30, alignItems: "center" },
  vacioIcono: { fontSize: 32, marginBottom: 10 },
  vacioTitulo: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  vacioTexto: { fontSize: 13, color: "#727A84", textAlign: "center", marginTop: 5 },
});