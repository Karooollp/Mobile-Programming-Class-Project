import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { getAlertsForDoctor, marcarAlertaComoAtendida } from "../../services/doctorService";

// Lo que devuelve getAlertsForDoctor: la fila de "emergency_alerts" + el
// paciente ya unido a mano (ver el comentario en doctorService.ts sobre por
// qué no se puede hacer con un join automático).
type EmergencyAlert = {
  id: string;
  user_id: string;
  note: string | null;
  created_at: string;
  resolved_at: string | null;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  } | null;
};

type Filtro = "pendientes" | "todas";

export default function DoctorAlertsScreen({ navigation }: any) {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<EmergencyAlert[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [atendiendoId, setAtendiendoId] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");

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

  const marcarAtendida = async (alerta: EmergencyAlert) => {
    setAtendiendoId(alerta.id);
    // Optimista: la marcamos de una vez en la UI.
    const anterior = alertas;
    const ahoraISO = new Date().toISOString();
    setAlertas((prev) =>
      prev.map((a) => (a.id === alerta.id ? { ...a, resolved_at: ahoraISO } : a))
    );
    try {
      await marcarAlertaComoAtendida(alerta.id);
    } catch (error) {
      console.error("Error marcando alerta como atendida:", error);
      Alert.alert("Error", "No se pudo marcar la alerta como atendida.");
      setAlertas(anterior); // revertimos si falló
    } finally {
      setAtendiendoId(null);
    }
  };

  const formatearFecha = (iso: string) =>
    new Date(iso).toLocaleString("es-HN", {
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    });

  const alertasFiltradas = useMemo(() => {
    if (filtro === "pendientes") return alertas.filter((a) => !a.resolved_at);
    return alertas;
  }, [alertas, filtro]);

  const totalPendientes = useMemo(() => alertas.filter((a) => !a.resolved_at).length, [alertas]);

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
          {totalPendientes === 0
            ? "No hay alertas pendientes por atender."
            : `${totalPendientes} alerta${totalPendientes === 1 ? "" : "s"} pendiente${
                totalPendientes === 1 ? "" : "s"
              }`}
        </Text>

        {/* FILTRO */}
        <View style={styles.filtroContainer}>
          <TouchableOpacity
            style={[styles.filtroBoton, filtro === "pendientes" && styles.filtroBotonActivo]}
            onPress={() => setFiltro("pendientes")}
          >
            <Text style={[styles.filtroTexto, filtro === "pendientes" && styles.filtroTextoActivo]}>
              Pendientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroBoton, filtro === "todas" && styles.filtroBotonActivo]}
            onPress={() => setFiltro("todas")}
          >
            <Text style={[styles.filtroTexto, filtro === "todas" && styles.filtroTextoActivo]}>
              Todas
            </Text>
          </TouchableOpacity>
        </View>

        {alertasFiltradas.map((alerta) => {
          const atendida = !!alerta.resolved_at;
          return (
            <View
              key={alerta.id}
              style={[styles.tarjeta, atendida && styles.tarjetaAtendida]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation?.navigate?.("DoctorAlertDetail", { alert: alerta })}
              >
                <View style={styles.filaSuperior}>
                  <View style={[styles.avatar, atendida && styles.avatarAtendida]}>
                    <Text style={[styles.avatarTexto, atendida && styles.avatarTextoAtendida]}>
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
                  <View style={[styles.estadoBadge, atendida ? styles.estadoAtendida : styles.estadoPendiente]}>
                    <Text style={[styles.estadoTexto, atendida ? styles.estadoTextoAtendida : styles.estadoTextoPendiente]}>
                      {atendida ? "Atendida" : "Pendiente"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.nota} numberOfLines={2}>
                  {alerta.note || "Alerta de emergencia sin nota adicional."}
                </Text>

                <Text style={styles.verDetalle}>Ver detalle →</Text>
              </TouchableOpacity>

              {!atendida && (
                <TouchableOpacity
                  style={styles.botonAtender}
                  activeOpacity={0.8}
                  disabled={atendiendoId === alerta.id}
                  onPress={() => marcarAtendida(alerta)}
                >
                  {atendiendoId === alerta.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.botonAtenderIcono}>✓</Text>
                      <Text style={styles.botonAtenderTexto}>Marcar como atendida</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {alertasFiltradas.length === 0 && (
          <View style={styles.vacioContainer}>
            <Text style={styles.vacioIcono}>✅</Text>
            <Text style={styles.vacioTitulo}>
              {filtro === "pendientes" ? "Todo tranquilo por ahora" : "No hay alertas registradas"}
            </Text>
            <Text style={styles.vacioTexto}>
              {filtro === "pendientes"
                ? "Cuando un paciente active una alerta de emergencia, aparecerá aquí."
                : "Aquí aparecerá el historial completo de alertas de tus pacientes."}
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
  subtitulo: { fontSize: 13, color: "#68707A", marginTop: 4, marginBottom: 14 },
  filtroContainer: {
    flexDirection: "row",
    backgroundColor: "#EAEDF1",
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  filtroBoton: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
  filtroBotonActivo: { backgroundColor: "#FFFFFF", elevation: 1 },
  filtroTexto: { fontSize: 13, fontWeight: "700", color: "#727A84" },
  filtroTextoActivo: { color: "#18202A" },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#E53935",
  },
  tarjetaAtendida: { borderLeftColor: "#43A047", opacity: 0.85 },
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
  avatarAtendida: { backgroundColor: "#E8F5E9" },
  avatarTexto: { fontSize: 18, fontWeight: "800", color: "#E53935" },
  avatarTextoAtendida: { color: "#43A047" },
  nombrePaciente: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  fecha: { fontSize: 12, color: "#8A8A8A", marginTop: 2 },
  estadoBadge: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  estadoPendiente: { backgroundColor: "#FFF3E0" },
  estadoAtendida: { backgroundColor: "#E8F5E9" },
  estadoTexto: { fontSize: 10, fontWeight: "700" },
  estadoTextoPendiente: { color: "#B45309" },
  estadoTextoAtendida: { color: "#2E7D32" },
  nota: { fontSize: 14, color: "#3A4048", marginBottom: 10 },
  verDetalle: { fontSize: 12, fontWeight: "700", color: "#1976D2", textAlign: "right" },
  botonAtender: {
    marginTop: 12,
    backgroundColor: "#43A047",
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  botonAtenderIcono: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  botonAtenderTexto: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  vacioContainer: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 30, alignItems: "center" },
  vacioIcono: { fontSize: 32, marginBottom: 10 },
  vacioTitulo: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  vacioTexto: { fontSize: 13, color: "#727A84", textAlign: "center", marginTop: 5 },
});