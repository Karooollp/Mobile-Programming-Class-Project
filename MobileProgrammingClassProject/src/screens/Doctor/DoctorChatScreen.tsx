import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { Supabase } from "../../lib/Supabase";
import CustomInput from "../../components/CustomInput";
import CustomButton from "../../components/CustomButton";
import { getMyPatients } from "../../services/doctorService";
import { uploadChatImage } from "../../services/storageService";
import {
  getSesionActiva,
  crearSesionChat,
  getMensajesDeSesion,
  guardarMensajeDB,
  suscribirAMensajesDeSesion,
  desuscribirCanal,
  ChatMessage,
} from "../../services/chatService";

type PatientRow = {
  patient_id: string;
  patient: {
    user_id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
};

interface Mensaje {
  id: string;
  texto?: string;
  imagenUrl?: string;
  remitente: "patient" | "ia" | "doctor";
  esResumenIA?: boolean;
}

function chatMessageAMensaje(msg: ChatMessage): Mensaje {
  return {
    id: msg.id ?? Date.now().toString(),
    texto: msg.content ?? undefined,
    imagenUrl: msg.image_url ?? undefined,
    remitente: msg.sender_type,
    esResumenIA: msg.sender_type === "ia",
  };
}

// Pantalla de chat del doctor. Primero muestra la lista de sus pacientes
// asignados; al elegir uno, abre (o crea) la sesión tipo "doctor" con ese
// paciente y se suscribe en tiempo real, igual que hace ChatScreen del lado
// paciente.
export default function DoctorChatScreen() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<PatientRow[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);

  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PatientRow | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoChat, setCargandoChat] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [imagenTemporal, setImagenTemporal] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const canalRef = useRef<RealtimeChannel | null>(null);

  // Traer la lista de pacientes asignados. Separado en su propia función
  // para poder llamarla tanto al montar como cada vez que la pantalla
  // recupera el foco (fix de "lista stale").
  const cargarPacientes = useCallback(async (id: string) => {
    try {
      const lista = await getMyPatients(id);
      setPacientes(lista as unknown as PatientRow[]);
    } catch (error) {
      console.error("Error cargando pacientes del doctor:", error);
      Alert.alert("Error", "No se pudo cargar tu lista de pacientes.");
    }
  }, []);

  // Cargar el doctor autenticado y su lista de pacientes (una sola vez, al montar).
  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData, error: authError } = await Supabase.auth.getUser();
        if (authError || !authData.user) {
          Alert.alert("Sesión no válida", "Vuelve a iniciar sesión.");
          return;
        }
        setDoctorId(authData.user.id);
        await cargarPacientes(authData.user.id);
      } finally {
        setCargandoLista(false);
      }
    };
    init();

    return () => {
      desuscribirCanal(canalRef.current);
    };
  }, [cargarPacientes]);

  // 🔁 Fix de "lista stale": recargar la lista de pacientes cada vez que
  // esta pestaña vuelve a tener foco, pero SOLO si estás viendo la lista
  // (no mientras estás dentro de una conversación abierta, para no
  // interrumpirte el chat).
  useFocusEffect(
    useCallback(() => {
      if (doctorId && !pacienteSeleccionado) {
        cargarPacientes(doctorId);
      }
    }, [doctorId, pacienteSeleccionado, cargarPacientes])
  );

  const hacerScrollAlFinal = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Abrir el chat con un paciente: reusa la sesión activa tipo "doctor" si
  // existe (la misma que ChatScreen del paciente crea/usa), o la crea.
  const abrirChatConPaciente = useCallback(
    async (paciente: PatientRow) => {
      if (!doctorId) return;
      try {
        setCargandoChat(true);
        desuscribirCanal(canalRef.current);

        setPacienteSeleccionado(paciente);

        let sesion = await getSesionActiva(paciente.patient_id, "doctor");
        if (!sesion) {
          sesion = await crearSesionChat(paciente.patient_id, "doctor", doctorId);
        }
        setSessionId(sesion.id);
        console.log("🟩 DOCTOR sessionId:", sesion.id);
        
        const historial = await getMensajesDeSesion(sesion.id);
        setMensajes(historial.map(chatMessageAMensaje));

        canalRef.current = suscribirAMensajesDeSesion(sesion.id, (nuevoMsg) => {
  if (nuevoMsg.sender_id === doctorId) return; // ya está en pantalla, lo agregamos al enviarlo
  setMensajes((prev) =>
    prev.some((m) => m.id === nuevoMsg.id) ? prev : [...prev, chatMessageAMensaje(nuevoMsg)]
  );
  hacerScrollAlFinal();
});

        hacerScrollAlFinal();
      } catch (error) {
        console.error("Error abriendo chat con paciente:", error);
        Alert.alert("Error", "No se pudo abrir la conversación con este paciente.");
      } finally {
        setCargandoChat(false);
      }
    },
    [doctorId]
  );

  const volverALista = () => {
    desuscribirCanal(canalRef.current);
    setPacienteSeleccionado(null);
    setSessionId(null);
    setMensajes([]);
    setImagenTemporal(null);
  };

  // Adjuntar imágenes — mismo patrón de ChatScreen.tsx del paciente.
  const mostrarMenuAdjuntar = () => {
    if (enviando) return;
    const opciones = ["Tomar Foto (Cámara)", "Elegir de la Galería", "Cancelar"];
    const botonCancelarIndice = 2;
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opciones, cancelButtonIndex: botonCancelarIndice, title: "Adjuntar contenido", message: "¿De dónde quieres obtener la foto?" },
        (buttonIndex) => {
          if (buttonIndex === 0) abrirCamaraEnVivo();
          if (buttonIndex === 1) abrirGaleriaFotos();
        }
      );
    } else {
      Alert.alert("Adjuntar contenido", "¿De dónde quieres obtener la foto?", [
        { text: "Cámara", onPress: abrirCamaraEnVivo },
        { text: "Galería", onPress: abrirGaleriaFotos },
        { text: "Cancelar", style: "cancel" }
      ], { cancelable: true });
    }
  };

  const abrirCamaraEnVivo = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permisos necesarios", "Necesitamos acceso a tu cámara."); return; }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4 });
    if (!resultado.canceled && resultado.assets[0]) {
      setImagenTemporal(resultado.assets[0]);
    }
  };

  const abrirGaleriaFotos = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permisos necesarios", "Ocupamos acceso a tus fotos."); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4 });
    if (!resultado.canceled && resultado.assets[0]) {
      setImagenTemporal(resultado.assets[0]);
    }
  };

  const enviarMensaje = async () => {
    const texto = nuevoMensaje.trim();
    if ((!texto && !imagenTemporal) || !sessionId || !doctorId) return;

    const fotoParaEnviar = imagenTemporal;

    const mensajeLocal: Mensaje = {
      id: Date.now().toString(),
      remitente: "doctor",
      ...(texto ? { texto } : {}),
      // Mostramos la foto de inmediato con la URI local: en tu propio
      // teléfono sí es válida. Lo que se guarda en la BD (abajo) es la URL
      // pública ya subida, para que el paciente pueda verla en el suyo.
      ...(fotoParaEnviar ? { imagenUrl: fotoParaEnviar.uri } : {}),
    };
    setMensajes((prev) => [...prev, mensajeLocal]);
    setNuevoMensaje("");
    setImagenTemporal(null);
    setEnviando(true);
    hacerScrollAlFinal();

    try {
      let imageUrlSubida: string | undefined;
      if (fotoParaEnviar) {
        imageUrlSubida = await uploadChatImage(sessionId, doctorId, fotoParaEnviar.uri);
      }

      await guardarMensajeDB({
        session_id: sessionId,
        sender_type: "doctor",
        sender_id: doctorId,
        content: texto,
        image_url: imageUrlSubida,
      });
    } catch (error) {
      console.error("Error enviando mensaje del doctor:", error);
      Alert.alert("Error", "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Vista: lista de pacientes ──────────────────────────────────────────
  if (!pacienteSeleccionado) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.headerTitle}>Chats con pacientes</Text>

        {cargandoLista ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginTop: 40 }} />
        ) : pacientes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Todavía no tienes pacientes asignados. Agrégalos desde la pestaña Pacientes.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pacientes}
            keyExtractor={(item) => item.patient_id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.patientRow} onPress={() => abrirChatConPaciente(item)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.patient.first_name.charAt(0)}</Text>
                </View>
                <Text style={styles.patientName}>
                  {item.patient.first_name} {item.patient.last_name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Vista: chat con el paciente seleccionado ───────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={volverALista} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#18202A" />
        </TouchableOpacity>
        <Text style={styles.chatHeaderName}>
          {pacienteSeleccionado.patient.first_name} {pacienteSeleccionado.patient.last_name}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
        {cargandoChat ? (
          <ActivityIndicator size="large" color="#1E88E5" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensajes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubbleContainer,
                  item.remitente === "doctor" ? styles.doctorContainer : styles.otroContainer,
                ]}
              >
                <View
                  style={[
                    styles.burbuja,
                    item.esResumenIA
                      ? styles.burbujaResumen
                      : item.remitente === "doctor"
                      ? styles.burbujaDoctor
                      : styles.burbujaPaciente,
                  ]}
                >
                  {item.esResumenIA && <Text style={styles.resumenLabel}>📋 Resumen automático (IA)</Text>}
                  {item.imagenUrl && <Image source={{ uri: item.imagenUrl }} style={styles.imagenMensaje} />}
                  {item.texto && (
                    <Text style={item.remitente === "doctor" ? styles.textoDoctor : styles.textoOtro}>
                      {item.texto}
                    </Text>
                  )}
                </View>
              </View>
            )}
          />
        )}

        {enviando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#1E88E5" />
            <Text style={styles.loadingText}>Enviando...</Text>
          </View>
        )}

        {imagenTemporal && (
          <View style={styles.previewWrapper}>
            <View style={styles.imageContainerRelative}>
              <Image source={{ uri: imagenTemporal.uri }} style={styles.previewImagen} />
              <TouchableOpacity style={styles.deletePreviewButton} onPress={() => setImagenTemporal(null)}>
                <Text style={styles.deletePreviewText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.waitingText}>Imagen en espera para enviar</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.plusButton} onPress={mostrarMenuAdjuntar}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <CustomInput
              type="text"
              placeholder={imagenTemporal ? "Comenta la foto..." : "Escribe una respuesta..."}
              value={nuevoMensaje}
              onChange={setNuevoMensaje}
            />
          </View>
          <View style={{ width: 90, marginBottom: 8 }}>
            <CustomButton title="Enviar" onPress={enviarMensaje} variant="primary" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FA" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#18202A", padding: 16, paddingBottom: 0 },

  emptyContainer: { padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#727A84", textAlign: "center" },

  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "800", color: "#1976D2" },
  patientName: { flex: 1, fontSize: 15, fontWeight: "700", color: "#18202A" },

  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#ECEFF1",
    backgroundColor: "#FFFFFF",
  },
  chatHeaderName: { fontSize: 17, fontWeight: "800", color: "#18202A" },

  bubbleContainer: { marginVertical: 6, flexDirection: "row", width: "100%" },
  doctorContainer: { justifyContent: "flex-end" },
  otroContainer: { justifyContent: "flex-start" },
  burbuja: { maxWidth: "80%", padding: 14, borderRadius: 18 },
  burbujaDoctor: { backgroundColor: "#1E88E5", borderBottomRightRadius: 2 },
  burbujaPaciente: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#ECEFF1", borderBottomLeftRadius: 2 },
  burbujaResumen: { backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#FFE082" },
  resumenLabel: { fontSize: 11, fontWeight: "800", color: "#8A6500", marginBottom: 4 },
  textoDoctor: { color: "#FFFFFF", fontSize: 15 },
  textoOtro: { color: "#18202A", fontSize: 15 },
  imagenMensaje: { width: 220, height: 160, borderRadius: 12, marginBottom: 6, resizeMode: "cover" },

  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, fontStyle: "italic", color: "#727A84" },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderColor: "#ECEFF1",
    backgroundColor: "#FFFFFF",
  },
  plusButton: { height: 40, width: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#ECEFF1", backgroundColor: "#F5F7FA" },
  plusIcon: { fontSize: 22, fontWeight: "300", marginTop: -2, color: "#727A84" },

  previewWrapper: { padding: 12, flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderColor: "#ECEFF1", gap: 12, backgroundColor: "#FFFFFF" },
  imageContainerRelative: { position: "relative", width: 60, height: 60 },
  previewImagen: { width: 60, height: 60, borderRadius: 8, resizeMode: "cover" },
  deletePreviewButton: { backgroundColor: "rgba(0,0,0,0.7)", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", position: "absolute", top: -6, right: -6, zIndex: 10 },
  deletePreviewText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  waitingText: { fontSize: 13, fontStyle: "italic", color: "#727A84" },
});