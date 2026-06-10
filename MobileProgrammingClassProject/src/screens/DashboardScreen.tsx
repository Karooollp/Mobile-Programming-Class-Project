import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from "react-native";

export default function DashboardScreen() {
  // 1. Creamos un estado para controlar las dosis tomadas (empieza en 2)
  const [dosisTomadas, setDosisTomadas] = useState(2);
  const dosisTotales = 3;

  // 2. Función para registrar una nueva dosis al hacer clic
  const handleTomarMedicamento = () => {
    if (dosisTomadas < dosisTotales) {
      setDosisTomadas(dosisTomadas + 1);
      Alert.alert("¡Excelente!", "Has registrado tu dosis correctamente.");
    } else {
      Alert.alert("Dosis completas", "Ya has tomado todas las dosis programadas para hoy.");
    }
  };

  // 3. Calculamos el porcentaje de la barra dinámicamente
  const porcentajeProgreso = (dosisTomadas / dosisTotales) * 100;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <Text style={styles.title}>🩺 Control Médico</Text>
      <Text style={styles.subtitle}>Seguimiento de tu tratamiento y citas</Text>

      {/* ── Métrica 1: Medicamentos del Día (INTERACTIVO) ──────────────── */}
      <View style={styles.card}>
        <Text style={styles.metricLabel}>Dosis de medicamentos tomadas hoy</Text>
        
        {/* Aquí el texto cambia dinámicamente gracias al estado */}
        <Text style={styles.metricValue}>{dosisTomadas} de {dosisTotales}</Text>

        {/* Barra de progreso interactiva */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${porcentajeProgreso}%` }]} />
        </View>

        {/* El mensaje cambia según las dosis que falten */}
        <Text style={styles.metricNote}>
          {dosisTomadas < dosisTotales 
            ? `Te falta ${dosisTotales - dosisTomadas} dosis para completar el día 💊`
            : "¡Felicidades! Completaste tus dosis de hoy 🎉"}
        </Text>

        {/* Botón para simular la actualización en la app */}
        <TouchableOpacity style={styles.actionButton} onPress={handleTomarMedicamento}>
          <Text style={styles.actionButtonText}>+ Registrar Dosis Tomada</Text>
        </TouchableOpacity>
      </View>

      {/* ── Métrica 2: Próxima Cita ───────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.metricLabel}>Próxima consulta médica</Text>
        <Text style={styles.metricValue}>En 3 días</Text>
        <Text style={styles.metricNote}>Jueves a las 2:00 PM con el especialista 🗓️</Text>
      </View>

      {/* ── Métrica 3: Síntomas Registrados ────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.metricLabel}>Monitoreo de síntomas (Este mes)</Text>
        <Text style={styles.metricValue}>0 Alertas</Text>

        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: "0%" }]} />
        </View>

        <Text style={styles.metricNote}>No has reportado malestares graves, ¡excelente!</Text>
      </View>

      {/* ── Fila de 2 tarjetas pequeñas ───────────────────────────────── */}
      <View style={styles.row}>
        <View style={[styles.card, styles.cardSmall]}>
          <Text style={styles.metricLabel}>Última Presión</Text>
          <Text style={styles.metricValueSmall}>120/80</Text>
          <Text style={styles.metricNote}>mmHg (Normal)</Text>
        </View>

        <View style={[styles.card, styles.cardSmall]}>
          <Text style={styles.metricLabel}>Temp. Promedio</Text>
          <Text style={styles.metricValueSmall}>36.5°C</Text>
          <Text style={styles.metricNote}>Últimos 7 días</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 24,
    paddingTop: 52,
    paddingBottom: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  metricLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 10,
  },

  metricNote: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
  },

  progressBarBackground: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
  },

  progressBarFill: {
    height: 8,
    backgroundColor: "#0284C7",
    borderRadius: 4,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  cardSmall: {
    flex: 1,
  },

  metricValueSmall: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 4,
  },

  // Estilo del nuevo botón de acción para el mockup
  actionButton: {
    marginTop: 14,
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});