import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { useAppSelector } from "../store/hooks";
import {
  fetchAppointmentsRange,
  toggleAppointmentAttended,
  deleteAppointment,
} from "../services/appointmentService";

type Appointment = {
  id: string;
  doctorName: string;
  reason?: string;
  appointmentDate: string;
  attended: boolean;
};

// Pantalla dedicada al historial de citas: aquí vive TODO el listado
// (pasadas y futuras), con fecha/hora y un botón de eliminar siempre
// visible — a diferencia del Dashboard, que ahora solo muestra la próxima
// cita para no saturarse.
export default function HistorialScreen({ navigation }: any) {
  const { colors } = useCaremapHealth();
  const styles = getStyles(colors);
  const profile = useAppSelector((state) => state.userProfile.data);
  const userId = profile?.user_id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      // 365 días hacia atrás (y las que vengan hacia adelante, según cómo
      // esté implementado fetchAppointmentsRange) para que el historial
      // sea realmente un historial y no solo "los últimos 30 días".
      const data = await fetchAppointmentsRange(userId, 365);
      const ordenadas = [...data].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
      setAppointments(ordenadas);
    } catch (error) {
      console.log("Error cargando historial:", error);
      Alert.alert("Error", "No se pudo cargar tu historial de citas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Recarga cada vez que entras a la pantalla (por si agregaste/eliminaste
  // una cita desde el Dashboard).
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleToggleAttended = async (id: string, current: boolean) => {
    try {
      await toggleAppointmentAttended(id, !current);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, attended: !current } : a))
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "No se pudo actualizar la cita");
    }
  };

  // Mismo criterio que ya tenías en el Dashboard: solo se puede eliminar
  // una cita después de marcarla como asistida (evita borrar por error una
  // cita futura que todavía necesitas). La diferencia es que aquí el botón
  // de eliminar SIEMPRE es visible, en vez de estar escondido en un
  // long-press.
  const handleDelete = (id: string, attended: boolean) => {
    if (!attended) {
      Alert.alert(
        "Cita no completada",
        "Solo puedes eliminar una cita después de marcarla como asistida (toca el círculo de la izquierda)."
      );
      return;
    }
    Alert.alert(
      "Eliminar cita",
      "¿Seguro que quieres eliminar esta cita? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppointment(id);
              setAppointments((prev) => prev.filter((a) => a.id !== id));
            } catch (error) {
              console.log(error);
              Alert.alert("Error", "No se pudo eliminar la cita");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const isPast = new Date(item.appointmentDate) < new Date();
    return (
      <View style={[styles.row, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            { borderColor: colors.primary },
            item.attended && { backgroundColor: colors.primary },
          ]}
          onPress={() => handleToggleAttended(item.id, item.attended)}
        >
          {item.attended && <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>✓</Text>}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>
            {item.doctorName} {item.reason ? `· ${item.reason}` : ""}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
            {new Date(item.appointmentDate).toLocaleDateString()} ·{" "}
            {new Date(item.appointmentDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {isPast && !item.attended ? " · No asististe" : ""}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: item.attended ? "#DC2626" : colors.border }]}
          onPress={() => handleDelete(item.id, item.attended)}
        >
          <Text style={{ color: item.attended ? "#DC2626" : colors.textSecondary, fontWeight: "700" }}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.textPrimary }}>Cargando tu historial...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {navigation?.goBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: "600" }}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Historial de citas</Text>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 40 }}>
            Todavía no tienes citas registradas.
          </Text>
        }
      />
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    screen: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingTop: 52,
      paddingBottom: 16,
    },
    title: { fontSize: 22, fontWeight: "700" },
    listContent: { paddingHorizontal: 24, paddingBottom: 32 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1.5,
      justifyContent: "center",
      alignItems: "center",
    },
  });