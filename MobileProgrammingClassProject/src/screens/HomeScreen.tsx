import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { useAppSelector } from "../store/hooks";
import { fetchMedications, fetchTodayLogs } from "../services/medicationService";
import { fetchNextAppointment } from "../services/appointmentService";
import { useFocusEffect } from "@react-navigation/native";

// Saludo según la hora del día — un detalle chico pero le quita lo "meh".
function getSaludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeScreen({ navigation }: any) {
  const { colors } = useCaremapHealth();
  const styles = getStyles(colors);
  const profile = useAppSelector((state) => state.userProfile.data);
  const userId = profile?.user_id;

  const [medications, setMedications] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

useFocusEffect(
  useCallback(() => {
    loadHomeData();
  }, [loadHomeData])
);

  const totalDosisHoy = medications.reduce(
    (sum, med) => sum + med.scheduleTimes.length,
    0
  );
  const dosisTomadasHoy = todayLogs.filter((log) =>
  medications.some((med) => med.id === log.medication_id)
).length;
  const pendientesHoy = totalDosisHoy - dosisTomadasHoy;

  // Próximas dosis pendientes de hoy
  const proximasDosis = medications
    .flatMap((med) =>
      med.scheduleTimes
        .filter(
          (time: string) =>
            !todayLogs.some((log) => log.medication_id === med.id && log.scheduled_time === time)
        )
        .map((time: string) => ({ nombre: med.name, hora: time }))
    )
    .sort((a, b) => a.hora.localeCompare(b.hora))
    .slice(0, 3);
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
        {getSaludo()}{profile?.first_name ? `, ${profile.first_name}` : ""} 👋
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Aquí tienes un resumen de tu día</Text>

      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation?.navigate?.("Métricas")}
        >
          <Text style={styles.quickActionIcon}>💊</Text>
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Registrar dosis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation?.navigate?.("Historial")}
        >
          <Text style={styles.quickActionIcon}>🗓️</Text>
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Ver historial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: colors.surface }]}
          onPress={() => navigation?.navigate?.("Métricas")}
        >
          <Text style={styles.quickActionIcon}>➕</Text>
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Agregar cita</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta 1: resumen + próximas dosis reales, no solo un texto genérico */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📋 Resumen médico del día</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          {totalDosisHoy === 0
            ? "Aún no tienes medicamentos registrados."
            : pendientesHoy > 0
            ? `Tienes ${pendientesHoy} dosis pendiente(s) de medicamentos para hoy.`
            : "¡Excelente trabajo! No tienes tareas médicas pendientes por hoy."}
        </Text>

        {proximasDosis.length > 0 && (
          <View style={{ marginTop: 10 }}>
            {proximasDosis.map((dosis, index) => (
              <View key={`${dosis.nombre}-${dosis.hora}-${index}`} style={[styles.doseRow, { borderColor: colors.border }]}>
                <Text style={{ color: colors.textPrimary, fontWeight: "600", fontSize: 13 }}>{dosis.nombre}</Text>
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>{dosis.hora}</Text>
              </View>
            ))}
          </View>
        )}

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

      {/* Tarjeta de emergencia: acceso directo sin tener que entrar al Dashboard */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#DC2626" }]}
        onPress={() => navigation?.navigate?.("Métricas")}
      >
        <Text style={[styles.cardTitle, { color: "#B91C1C" }]}>🚨 ¿Tienes una emergencia?</Text>
        <Text style={[styles.cardText, { color: "#991B1B" }]}>
          Si es una urgencia médica, llama al 911 ahora. Desde el Dashboard puedes además dejar un
          registro de la alerta.
        </Text>
      </TouchableOpacity>

      {/* Tarjeta destacada */}
      <View style={[styles.card, styles.cardHighlight, { backgroundColor: colors.primary }]}>
        <Text style={styles.cardTitleLight}>⚡ Acceso rápido</Text>
        <Text style={styles.cardTextLight}>
          Usa las pestañas inferiores para navegar entre secciones.
        </Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
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
      marginBottom: 20,
    },
    quickActionsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20,
    },
    quickAction: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    quickActionIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    quickActionText: {
      fontSize: 11,
      fontWeight: "600",
      textAlign: "center",
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
    doseRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
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
  });