import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { useAppSelector } from "../store/hooks";
import { fetchMedications, fetchTodayLogs } from "../services/medicationService";
import { fetchNextAppointment } from "../services/appointmentService";

export default function HomeScreen() {
  const { colors } = useCaremapHealth();
  const profile = useAppSelector((state) => state.userProfile.data);
  const userId = profile?.user_id;

  const [medications, setMedications] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mismo patrón que DashboardScreen: una sola función reusable que carga
  // todo en paralelo con Promise.all.
  const loadHomeData = useCallback(async () => {
    if (!userId) return;
    try {
      const [meds, logs, appt] = await Promise.all([
        fetchMedications(userId),
        fetchTodayLogs(userId),
        fetchNextAppointment(userId),
      ]);
      setMedications(meds);
      setTodayLogs(logs);
      setNextAppointment(appt);
    } catch (error) {
      console.log("Error cargando home:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  // Mismo cálculo que en DashboardScreen: total de dosis programadas hoy
  // vs cuántas ya se registraron como tomadas.
  const totalDosisHoy = medications.reduce(
    (sum, med) => sum + med.scheduleTimes.length,
    0
  );
  const dosisTomadasHoy = todayLogs.length;
  const pendientesHoy = totalDosisHoy - dosisTomadasHoy;
  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textPrimary }}>Cargando tu información...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>
        ¡Bienvenido{profile?.first_Name ? `, ${profile.first_Name}` : ""}! 👋
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Aquí tienes un resumen de tu día</Text>
      {/* Tarjeta 1 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📋 Resumen médico del día</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          {totalDosisHoy === 0
            ? "Aún no tienes medicamentos registrados."
            : pendientesHoy > 0
            ? `Tienes ${pendientesHoy} dosis pendiente(s) de medicamentos para hoy.`
            : "¡Excelente trabajo! No tienes tareas médicas pendientes por hoy."}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 4 }]}>🗓️ Próxima consulta</Text>
        {nextAppointment ? (
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            {nextAppointment.doctorName}
            {nextAppointment.reason ? ` · ${nextAppointment.reason}` : ""}
            {" — "}
            {new Date(nextAppointment.appointmentDate).toLocaleDateString()}{" "}
            {new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        ) : (
          <Text style={[styles.cardText, { color: colors.textSecondary }]}>
            No tienes citas programadas.
          </Text>
        )}
      </View>
      {/* Tarjeta 2 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>💚 Estado de salud</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Tratamiento activo. Todo en orden con tus últimas lecturas de presión y temperatura.
        </Text>
      </View>
      {/* Tarjeta 4 (Highlight mantiene su color de marca fuerte) */}
      <View style={[styles.card, styles.cardHighlight, { backgroundColor: colors.primary }]}>
        <Text style={styles.cardTitleLight}>⚡ Acceso rápido</Text>
        <Text style={styles.cardTextLight}>
          Usa las pestañas inferiores para navegar entre secciones.
        </Text>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 52,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardHighlight: {
  },
  cardTitleLight: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  cardTextLight: {
    fontSize: 13,
    color: "#BAE6FD",
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});