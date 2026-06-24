import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts"; // 👈 Importamos tu context

export default function DashboardScreen() {
  const { colors } = useCaremapHealth(); // 👈 Obtenemos colores globales
  const [dosisTomadas, setDosisTomadas] = useState(2);
  const dosisTotales = 3;

  const handleTomarMedicamento = () => {
    if (dosisTomadas < dosisTotales) {
      setDosisTomadas(dosisTomadas + 1);
      Alert.alert("¡Excelente!", "Has registrado tu dosis correctamente.");
    } else {
      Alert.alert("Dosis completas", "Ya has tomado todas las dosis programadas para hoy.");
    }
  };

  const porcentajeProgreso = (dosisTomadas / dosisTotales) * 100;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]} // 👈 Fondo dinámico
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>🩺 Control Médico</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Seguimiento de tu tratamiento y citas</Text>

      {/* Tarjeta 1 */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Dosis de medicamentos tomadas hoy</Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>{dosisTomadas} de {dosisTotales}</Text>

        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: `${porcentajeProgreso}%`, backgroundColor: colors.primary }]} />
        </View>

        <Text style={[styles.metricNote, { color: colors.textSecondary }]}>
          {dosisTomadas < dosisTotales 
            ? `Te falta ${dosisTotales - dosisTomadas} dosis para completar el día 💊`
            : "¡Felicidades! Completaste tus dosis de hoy 🎉"}
        </Text>

        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleTomarMedicamento}>
          <Text style={styles.actionButtonText}>+ Registrar Dosis Tomada</Text>
        </TouchableOpacity>
      </View>

      {/* Tarjeta 2 */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Próxima consulta médica</Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>En 3 días</Text>
        <Text style={[styles.metricNote, { color: colors.textSecondary }]}>Jueves a las 2:00 PM con el especialista 🗓️</Text>
      </View>

      {/* Tarjeta 3 */}
      <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Monitoreo de síntomas (Este mes)</Text>
        <Text style={[styles.metricValue, { color: colors.primary }]}>0 Alertas</Text>

        <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
          <View style={[styles.progressBarFill, { width: "0%", backgroundColor: colors.primary }]} />
        </View>

        <Text style={[styles.metricNote, { color: colors.textSecondary }]}>No has reportado malestares graves, ¡excelente!</Text>
      </View>

      {/* Fila pequeña */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, paddingTop: 52, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 28 },
  card: { borderRadius: 16, padding: 18, marginBottom: 14, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  metricLabel: { fontSize: 13, fontWeight: "500", marginBottom: 4 },
  metricValue: { fontSize: 32, fontWeight: "700", marginBottom: 10 },
  metricNote: { fontSize: 12, marginTop: 6 },
  progressBarBackground: { height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  progressBarFill: { height: 8, borderRadius: 4 },
  row: { flexDirection: "row", gap: 12 },
  cardSmall: { flex: 1 },
  metricValueSmall: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  actionButton: { marginTop: 14, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  actionButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});