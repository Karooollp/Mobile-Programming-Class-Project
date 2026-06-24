import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { Supabase } from "../lib/Supabase";
export default function HomeScreen() {
  const { colors } = useCaremapHealth();
  const [actividadesCompletadas, setActividadesCompletadas] = useState(false);

  const handleCompletarDia = () => {
    setActividadesCompletadas(true);
    Alert.alert("¡Todo listo! ✨", "Has completado tus actividades de salud por hoy.");
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>¡Bienvenido! 👋</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Aquí tienes un resumen de tu día</Text>

      {/* Tarjeta 1 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📋 Resumen médico del día</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          {actividadesCompletadas 
            ? "¡Excelente trabajo! No tienes tareas médicas pendientes por hoy." 
            : "Tienes actividades y dosis de medicamentos pendientes para hoy."}
        </Text>

        {!actividadesCompletadas && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleCompletarDia}>
            <Text style={styles.actionButtonText}>✓ Completar Tareas de Hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tarjeta 2 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>💚 Estado de salud</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Tratamiento activo. Todo en orden con tus últimas lecturas de presión y temperatura.
        </Text>
      </View>

      {/* Tarjeta 3 */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>💊 Alerta de tratamiento</Text>
        <Text style={[styles.cardText, { color: colors.textSecondary }]}>
          Recuerda mantener al día tus registros en la pestaña de Control Médico para evitar alertas.
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