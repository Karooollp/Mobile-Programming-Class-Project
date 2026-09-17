import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getPatientProfile } from "../../services/doctorService";

export default function DoctorPatientProfileScreen({ route }: any) {
  const { patientId } = route.params;
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    getPatientProfile(patientId)
      .then(setPerfil)
      .catch((e) => console.error("Error cargando perfil del paciente:", e))
      .finally(() => setCargando(false));
  }, [patientId]);

  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={styles.centrado}>
        <Text>No se pudo cargar el perfil.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7FA" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.header}>
          {perfil.photo_url ? (
            <Image source={{ uri: perfil.photo_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={{ color: "#1976D2", fontWeight: "800" }}>
                {perfil.first_name?.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{perfil.first_name} {perfil.last_name}</Text>
          <Text style={styles.email}>{perfil.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Edad</Text>
          <Text style={styles.value}>{perfil.age ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de sangre</Text>
          <Text style={styles.value}>{perfil.blood_type ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.value}>{perfil.phone ?? "-"}</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Contacto de emergencia</Text>
          <Text style={styles.value}>{perfil.emergency_contact ?? "-"}</Text>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Condiciones médicas</Text>
        {perfil.conditions?.length > 0 ? (
          perfil.conditions.map((c: any) => (
            <View key={c.id} style={styles.conditionCard}>
              <Text style={styles.value}>{c.condition?.condition_name}</Text>
              {c.notes && <Text style={styles.notes}>{c.notes}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.value}>Sin condiciones registradas.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centrado: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  avatarPlaceholder: { backgroundColor: "#E3F2FD", justifyContent: "center", alignItems: "center" },
  name: { fontSize: 20, fontWeight: "800", color: "#18202A" },
  email: { fontSize: 13, color: "#727A84" },
  section: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: "#68707A" },
  value: { fontSize: 15, color: "#18202A", marginTop: 2 },
  conditionCard: { backgroundColor: "#FFF", padding: 12, borderRadius: 12, marginBottom: 8 },
  notes: { fontSize: 12, color: "#727A84", marginTop: 4 },
});