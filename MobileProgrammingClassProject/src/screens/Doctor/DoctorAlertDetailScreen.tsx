import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { marcarAlertaComoAtendida } from "../../services/doctorService";

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

export default function DoctorAlertDetailScreen({ navigation, route }: any) {
  const alertaInicial = route?.params?.alert as EmergencyAlert;
  const [alerta, setAlerta] = useState<EmergencyAlert>(alertaInicial);
  const [atendiendo, setAtendiendo] = useState(false);

  const atendida = !!alerta.resolved_at;

  const formatearFechaCompleta = (iso: string) =>
    new Date(iso).toLocaleString("es-HN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const marcarAtendida = async () => {
    setAtendiendo(true);
    try {
      const actualizada = await marcarAlertaComoAtendida(alerta.id);
      setAlerta((prev) => ({ ...prev, resolved_at: actualizada.resolved_at }));
    } catch (error) {
      console.error("Error marcando alerta como atendida:", error);
      Alert.alert("Error", "No se pudo marcar la alerta como atendida.");
    } finally {
      setAtendiendo(false);
    }
  };

  if (!alerta) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centrado]}>
        <Text style={styles.errorTexto}>No se encontró la alerta.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>Detalle de alerta</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ESTADO */}
        <View style={[styles.estadoCard, atendida ? styles.estadoCardAtendida : styles.estadoCardPendiente]}>
          <Text style={styles.estadoIcono}>{atendida ? "✅" : "🚨"}</Text>
          <Text style={styles.estadoTitulo}>{atendida ? "Alerta atendida" : "Alerta pendiente"}</Text>
          {atendida && (
            <Text style={styles.estadoSubtitulo}>
              Atendida el {formatearFechaCompleta(alerta.resolved_at as string)}
            </Text>
          )}
        </View>

        {/* PACIENTE */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Paciente</Text>
          <TouchableOpacity
            style={styles.pacienteCard}
            activeOpacity={0.8}
            onPress={() =>
              navigation?.navigate?.("DoctorPatientProfile", { patientId: alerta.user_id })
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{alerta.patient?.first_name?.charAt(0) ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pacienteNombre}>
                {alerta.patient ? `${alerta.patient.first_name} ${alerta.patient.last_name}` : "Paciente"}
              </Text>
              <Text style={styles.verExpediente}>Ver expediente médico →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* INFORMACIÓN DE LA ALERTA */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoFila}>
              <Text style={styles.infoLabel}>📅 Fecha y hora</Text>
              <Text style={styles.infoValor}>{formatearFechaCompleta(alerta.created_at)}</Text>
            </View>
            <View style={styles.divider} />
            <View>
              <Text style={styles.infoLabel}>📝 Nota del paciente</Text>
              <Text style={styles.infoNota}>
                {alerta.note || "Sin nota adicional — el paciente no dejó más detalles."}
              </Text>
            </View>
          </View>
        </View>

        {/* ACCIÓN */}
        {!atendida && (
          <TouchableOpacity
            style={styles.botonAtender}
            activeOpacity={0.8}
            disabled={atendiendo}
            onPress={marcarAtendida}
          >
            {atendiendo ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.botonAtenderIcono}>✓</Text>
                <Text style={styles.botonAtenderTexto}>Marcar como atendida</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  centrado: { justifyContent: "center", alignItems: "center" },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  backIcon: { fontSize: 20, color: "#18202A" },
  headerTitulo: { fontSize: 17, fontWeight: "800", color: "#18202A" },
  errorTexto: { fontSize: 14, color: "#68707A" },
  estadoCard: { borderRadius: 18, padding: 22, alignItems: "center", marginBottom: 22 },
  estadoCardPendiente: { backgroundColor: "#FDEAEA" },
  estadoCardAtendida: { backgroundColor: "#E8F5E9" },
  estadoIcono: { fontSize: 34, marginBottom: 8 },
  estadoTitulo: { fontSize: 17, fontWeight: "800", color: "#18202A" },
  estadoSubtitulo: { fontSize: 12, color: "#3A4048", marginTop: 4, textAlign: "center" },
  seccion: { marginBottom: 20 },
  seccionTitulo: { fontSize: 13, fontWeight: "800", color: "#68707A", marginBottom: 10, textTransform: "uppercase" },
  pacienteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTexto: { fontSize: 18, fontWeight: "800", color: "#1976D2" },
  pacienteNombre: { fontSize: 15, fontWeight: "800", color: "#18202A" },
  verExpediente: { fontSize: 12, color: "#1976D2", fontWeight: "700", marginTop: 3 },
  infoCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, elevation: 1 },
  infoFila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 12, color: "#7A828C", fontWeight: "700" },
  infoValor: { fontSize: 13, color: "#18202A", fontWeight: "700", maxWidth: 180, textAlign: "right" },
  infoNota: { fontSize: 14, color: "#3A4048", marginTop: 8, lineHeight: 20 },
  divider: { height: 1, backgroundColor: "#ECEFF1", marginVertical: 14 },
  botonAtender: {
    backgroundColor: "#43A047",
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 2,
  },
  botonAtenderIcono: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  botonAtenderTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});