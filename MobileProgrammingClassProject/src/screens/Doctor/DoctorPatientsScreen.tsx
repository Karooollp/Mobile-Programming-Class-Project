import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Supabase } from "../../lib/Supabase";
import {
  getMyPatients,
  searchAssignablePatients,
  assignPatientToMe,
} from "../../services/doctorService";

// roles_id de la tabla `roles`. Si algún día cambia, actualízalo aquí.
const PATIENT_ROLE_ID = "402801e3-dd4e-4034-86d6-fd1887b2a553";

type MiPaciente = {
  patient_id: string;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    age: number | null;
    photo_url: string | null;
  };
};

type PacienteBuscable = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  photo_url: string | null;
};

export default function DoctorPatientsScreen({ navigation }: any) {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [misPacientes, setMisPacientes] = useState<MiPaciente[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState("");
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  const [resultados, setResultados] = useState<PacienteBuscable[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [asignandoId, setAsignandoId] = useState<string | null>(null);

  const cargarMisPacientes = useCallback(async (id: string) => {
    try {
      const lista = await getMyPatients(id);
      setMisPacientes(lista as unknown as MiPaciente[]);
    } catch (error) {
      console.error("Error cargando pacientes:", error);
      Alert.alert("Error", "No se pudo cargar tu lista de pacientes.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await Supabase.auth.getUser();
      if (error || !data.user) {
        Alert.alert("Sesión no válida", "Vuelve a iniciar sesión.");
        return;
      }
      setDoctorId(data.user.id);
      await cargarMisPacientes(data.user.id);
    };
    init();
  }, [cargarMisPacientes]);

  // Filtro local sobre los pacientes ya asignados (igual que en DoctorHomeScreen).
  const misPacientesFiltrados = misPacientes.filter((p) => {
    if (!busqueda.trim()) return true;
    const texto = busqueda.trim().toLowerCase();
    const nombre = `${p.patient.first_name} ${p.patient.last_name}`.toLowerCase();
    return nombre.includes(texto);
  });

  // Búsqueda contra Supabase de pacientes NO asignados, para el panel de agregar.
  const buscarPacientesNuevos = async (texto: string) => {
    if (!doctorId) return;
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    try {
      setBuscando(true);
      const encontrados = await searchAssignablePatients(doctorId, texto.trim(), PATIENT_ROLE_ID);
      // Quitamos de los resultados a quien ya está asignado.
      const idsAsignados = new Set(misPacientes.map((p) => p.patient_id));
      setResultados((encontrados as PacienteBuscable[]).filter((r) => !idsAsignados.has(r.user_id)));
    } catch (error) {
      console.error("Error buscando pacientes:", error);
    } finally {
      setBuscando(false);
    }
  };

  const asignar = async (paciente: PacienteBuscable) => {
    if (!doctorId) return;
    try {
      setAsignandoId(paciente.user_id);
      await assignPatientToMe(doctorId, paciente.user_id);
      await cargarMisPacientes(doctorId);
      setResultados((prev) => prev.filter((r) => r.user_id !== paciente.user_id));
      Alert.alert("Listo", `${paciente.first_name} ${paciente.last_name} fue asignado a tu lista.`);
    } catch (error: any) {
      console.error("Error asignando paciente:", error);
      Alert.alert("Error", "No se pudo asignar este paciente. Puede que ya esté asignado a ti.");
    } finally {
      setAsignandoId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis pacientes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setMostrarBuscador((v) => !v)}
        >
          <Ionicons name={mostrarBuscador ? "close" : "add"} size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* PANEL DE BÚSQUEDA PARA AGREGAR PACIENTES NUEVOS */}
      {mostrarBuscador && (
        <View style={styles.addPanel}>
          <Text style={styles.addPanelTitle}>Buscar paciente por nombre o email</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#8A8A8A" style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Ej. Misael o misael@correo.com"
              placeholderTextColor="#8A8A8A"
              style={styles.searchInput}
              onChangeText={buscarPacientesNuevos}
            />
            {buscando && <ActivityIndicator size="small" color="#1E88E5" />}
          </View>

          {resultados.map((r) => (
            <View key={r.user_id} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>
                  {r.first_name} {r.last_name}
                </Text>
                <Text style={styles.resultEmail}>{r.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => asignar(r)}
                disabled={asignandoId === r.user_id}
              >
                {asignandoId === r.user_id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.assignButtonText}>Asignar</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* BUSCADOR SOBRE MIS PACIENTES YA ASIGNADOS */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#8A8A8A" style={{ marginRight: 8 }} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar en mis pacientes..."
          placeholderTextColor="#8A8A8A"
          style={styles.searchInput}
        />
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color="#1E88E5" style={{ marginTop: 30 }} />
      ) : misPacientesFiltrados.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyTitle}>Sin pacientes por aquí</Text>
          <Text style={styles.emptyText}>
            {misPacientes.length === 0
              ? "Usa el botón + para asignarte tu primer paciente."
              : "No hay coincidencias con esa búsqueda."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={misPacientesFiltrados}
          keyExtractor={(item) => item.patient_id}
          contentContainerStyle={{ padding: 16, paddingTop: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.patientCard}
              activeOpacity={0.8}
              onPress={() =>
                navigation?.navigate?.("DoctorPatientProfile", { patientId: item.patient_id })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.patient.first_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientName}>
                  {item.patient.first_name} {item.patient.last_name}
                </Text>
                {item.patient.age != null && (
                  <Text style={styles.patientAge}>{item.patient.age} años</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#18202A" },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E88E5",
    alignItems: "center",
    justifyContent: "center",
  },

  addPanel: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    elevation: 1,
  },
  addPanelTitle: { fontSize: 13, fontWeight: "700", color: "#68707A", marginBottom: 10 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#18202A" },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#ECEFF1",
  },
  resultName: { fontSize: 14, fontWeight: "700", color: "#18202A" },
  resultEmail: { fontSize: 12, color: "#727A84", marginTop: 2 },
  assignButton: {
    backgroundColor: "#1E88E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 78,
    alignItems: "center",
  },
  assignButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },

  patientCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
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
  avatarText: { fontSize: 18, fontWeight: "800", color: "#1976D2" },
  patientName: { fontSize: 15, fontWeight: "800", color: "#18202A" },
  patientAge: { fontSize: 12, color: "#727A84", marginTop: 2 },

  emptyContainer: { padding: 40, alignItems: "center" },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#18202A" },
  emptyText: { fontSize: 13, color: "#727A84", textAlign: "center", marginTop: 6 },
});