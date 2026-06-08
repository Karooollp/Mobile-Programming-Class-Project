import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function HomeScreen() {
  // 1. Estado para simular si las actividades de salud del día ya se completaron
  const [actividadesCompletadas, setActividadesCompletadas] = useState(false);

  // 2. Función para simular que el usuario completa su rutina clínica diaria
  const handleCompletarDia = () => {
    setActividadesCompletadas(true);
    Alert.alert("¡Todo listo! ✨", "Has completado tus actividades de salud por hoy.");
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* ── Encabezado de bienvenida ──────────────────────────────────── */}
      <Text style={styles.greeting}>¡Bienvenido! 👋</Text>
      <Text style={styles.subtitle}>Aquí tienes un resumen de tu día</Text>

      {/* ── Tarjeta 1: Resumen del día (AHORA INTERACTIVA) ─────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Resumen médico del día</Text>
        
        {/* El texto cambia dinámicamente según el estado del día */}
        <Text style={styles.cardText}>
          {actividadesCompletadas 
            ? "¡Excelente trabajo! No tienes tareas médicas pendientes por hoy." 
            : "Tienes actividades y dosis de medicamentos pendientes para hoy."}
        </Text>

        {/* Botón interactivo para simular el cambio en el flujo de la app */}
        {!actividadesCompletadas && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCompletarDia}>
            <Text style={styles.actionButtonText}>✓ Completar Tareas de Hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tarjeta 2: Estado de salud ────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💚 Estado de salud</Text>
        <Text style={styles.cardText}>
          Tratamiento activo. Todo en orden con tus últimas lecturas de presión y temperatura.
        </Text>
      </View>

      {/* ── Tarjeta 3: Recordatorio de Tratamiento ────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💊 Alerta de tratamiento</Text>
        <Text style={styles.cardText}>
          Recuerda mantener al día tus registros en la pestaña de Control Médico para evitar alertas.
        </Text>
      </View>

      {/* ── Tarjeta 4: Acceso rápido ──────────────────────────────────── */}
      <View style={[styles.card, styles.cardHighlight]}>
        <Text style={styles.cardTitleLight}>⚡ Acceso rápido</Text>
        <Text style={styles.cardTextLight}>
          Usa las pestañas inferiores para navegar entre secciones.
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── Estilos (Manteniendo el 100% de tus estilos originales) ───────────────
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

  greeting: {
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

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
  },

  cardText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
  },

  cardHighlight: {
    backgroundColor: "#0284C7",
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

  // Estilo del botón interactivo para el nivel universitario
  actionButton: {
    marginTop: 12,
    backgroundColor: "#0284C7",
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