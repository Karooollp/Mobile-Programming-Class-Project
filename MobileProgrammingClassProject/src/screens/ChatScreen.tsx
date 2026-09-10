import React, { useState, useRef, useEffect } from "react";
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
  Switch 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { preguntarAGroq } from "../lib/groqService";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";

// Importación del contexto de diseño
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

// Importación del servicio desacoplado para Supabase
import { 
  crearSesionChat, 
  guardarMensajeDB, 
  finalizarSesionConResumen, 
  suscribirAMensajesDoctor 
} from "../services/chatService";

interface Mensaje {
  id: string;
  texto?: string;
  imagenUrl?: string;
  remitente: "usuario" | "ia" | "doctor";
  mostrarBotonFinalizar?: boolean;
}

export default function ChatScreen() {
  const { colors, isDarkMode } = useCaremapHealth();

  // ID temporal del usuario hasta Auth global
  const PACIENTE_ID_TEMP = "usr_paciente_123";

  // Estado de modo
  const [esModoDoctor, setEsModoDoctor] = useState(false);

  // Sesiones independientes en BD
  const [sessionIdIA, setSessionIdIA] = useState<string | null>(null);
  const [sessionIdDoctor, setSessionIdDoctor] = useState<string | null>(null);

  // CHATS SEPARADOS: Un array para la IA y otro para el Doctor
  const [mensajesIA, setMensajesIA] = useState<Mensaje[]>([
    { 
      id: "ia_init", 
      texto: "¡Hola, soy tu asistente de Caremap Health! :3 ¿Quieres que lleve un registro de esta conversación para generar un resumen para tu médico al finalizar?", 
      remitente: "ia",
      mostrarBotonFinalizar: true
    }
  ]);

  const [mensajesDoctor, setMensajesDoctor] = useState<Mensaje[]>([
    { 
      id: "doc_init", 
      texto: "¡Hola! Estás en la línea directa con tu médico. Los mensajes enviados aquí quedan registrados para su revisión.", 
      remitente: "doctor" 
    }
  ]);

  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [imagenTemporal, setImagenTemporal] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Determinar qué lista de mensajes se muestra en pantalla
  const mensajesVisibles = esModoDoctor ? mensajesDoctor : mensajesIA;

  // Inicializar sesiones
  useEffect(() => {
    const initChats = async () => {
      const sesionIA = await crearSesionChat(PACIENTE_ID_TEMP, "ia");
      if (sesionIA?.id) setSessionIdIA(sesionIA.id);

      const sesionDoc = await crearSesionChat(PACIENTE_ID_TEMP, "doctor");
      if (sesionDoc?.id) {
        setSessionIdDoctor(sesionDoc.id);
        suscribirAMensajesDoctor(sesionDoc.id, (nuevoMsg) => {
          console.log("Mensaje entrante del médico:", nuevoMsg);
        });
      }
    };
    initChats();
  }, []);

  const hacerScrollAlFinal = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // 1. Iniciar un nuevo chat en el modo activo
  const iniciarNuevoChat = () => {
    const titulo = esModoDoctor ? "Nuevo Chat con Doctor" : "Nuevo Chat con IA";
    Alert.alert(
      titulo,
      `¿Deseas reiniciar la conversación actual de ${esModoDoctor ? "Doctor" : "IA"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Iniciar", 
          onPress: async () => {
            if (esModoDoctor) {
              const nuevaSesion = await crearSesionChat(PACIENTE_ID_TEMP, "doctor");
              if (nuevaSesion?.id) setSessionIdDoctor(nuevaSesion.id);

              setMensajesDoctor([
                { 
                  id: Date.now().toString(), 
                  texto: "Línea con el médico reiniciada. Puedes escribir tus consultas.", 
                  remitente: "doctor" 
                }
              ]);
            } else {
              const nuevaSesion = await crearSesionChat(PACIENTE_ID_TEMP, "ia");
              if (nuevaSesion?.id) setSessionIdIA(nuevaSesion.id);

              setMensajesIA([
                { 
                  id: Date.now().toString(), 
                  texto: "¡Hola de nuevo! :3 He iniciado una nueva consulta. ¿En qué te puedo ayudar?", 
                  remitente: "ia",
                  mostrarBotonFinalizar: true
                }
              ]);
            }
          } 
        }
      ]
    );
  };

  // 2. Alternar entre IA y Doctor (Solo cambia la vista sin alterar historiales)
  const toggleModoDoctor = (valor: boolean) => {
    setEsModoDoctor(valor);
    hacerScrollAlFinal();
  };

  // 3. Finalizar consulta de IA y enviar resumen
  const finalizarYResumirConsulta = async () => {
    try {
      setCargando(true);
      
      const historial = mensajesIA.map(m => `${m.remitente.toUpperCase()}: ${m.texto || "[Imagen]"}`).join("\n");
      const promptResumen = `Genera un resumen clínico conciso de la siguiente conversación entre un paciente y la IA para que lo lea un médico:\n${historial}`;
      
      const resumenGenerado = await preguntarAGroq(promptResumen, mensajesIA);

      if (sessionIdIA) {
        await finalizarSesionConResumen(sessionIdIA, resumenGenerado);
      }

      Alert.alert("¡Consulta Finalizada! ✨", `Resumen generado para el doctor:\n\n${resumenGenerado}`);

      // Reiniciar chat de IA tras finalizar
      const nuevaSesion = await crearSesionChat(PACIENTE_ID_TEMP, "ia");
      if (nuevaSesion?.id) setSessionIdIA(nuevaSesion.id);

      setMensajesIA([
        { 
          id: Date.now().toString(), 
          texto: "Consulta finalizada y resumen enviado. ¡Hola de nuevo! :3 ¿En qué te puedo ayudar hoy?", 
          remitente: "ia",
          mostrarBotonFinalizar: true 
        }
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el resumen en este momento.");
    } finally {
      setCargando(false);
      hacerScrollAlFinal();
    }
  };

  // Adjuntar imágenes
  const mostrarMenuAdjuntar = () => {
    if (cargando) return;
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
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (!resultado.canceled && resultado.assets[0]) {
      setImagenTemporal(resultado.assets[0]);
    }
  };

  const abrirGaleriaFotos = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert("Permisos necesarios", "Ocupamos acceso a tus fotos."); return; }
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.4, base64: true });
    if (!resultado.canceled && resultado.assets[0]) {
      setImagenTemporal(resultado.assets[0]);
    }
  };

  // Enviar mensaje en el canal correspondiente
  const enviarMensaje = async () => {
    const textoUsuario = nuevoMensaje.trim();
    if (!textoUsuario && !imagenTemporal) return;
    if (cargando) return;

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      remitente: "usuario",
      ...(textoUsuario ? { texto: textoUsuario } : {}),
      ...(imagenTemporal ? { imagenUrl: imagenTemporal.uri } : {})
    };

    const fotoParaEnviar = imagenTemporal;
    setNuevoMensaje("");
    setImagenTemporal(null);
    setCargando(true);

    // MODO DOCTOR (Agrega al chat del doctor y guarda en BD)
    if (esModoDoctor) {
      setMensajesDoctor((prev) => [...prev, nuevoMensajeUsuario]);

      if (sessionIdDoctor) {
        guardarMensajeDB({
          session_id: sessionIdDoctor,
          sender_type: "patient",
          content: textoUsuario,
          image_url: fotoParaEnviar?.uri
        });
      }

      setCargando(false);
      hacerScrollAlFinal();
      return;
    }

    // MODO IA (Agrega al chat de IA y consulta a Groq)
    const historialIAActual = [...mensajesIA, nuevoMensajeUsuario];
    setMensajesIA(historialIAActual);

    if (sessionIdIA) {
      guardarMensajeDB({
        session_id: sessionIdIA,
        sender_type: "patient",
        content: textoUsuario,
        image_url: fotoParaEnviar?.uri
      });
    }

    hacerScrollAlFinal();

    try {
      let respuestaIA = "";
      if (fotoParaEnviar) {
        const promptVisual = textoUsuario 
          ? `El usuario te manda esta imagen con el siguiente comentario: "${textoUsuario}". Analízala basándote en la salud y el bienestar.`
          : "Analiza esta imagen y dime si tiene relación con el bienestar, alimentación o salud.";
        
        respuestaIA = await preguntarAGroq(promptVisual, historialIAActual, fotoParaEnviar.base64 ?? undefined);
      } else {
        respuestaIA = await preguntarAGroq(textoUsuario, historialIAActual);
      }

      const mensajeIA: Mensaje = { 
        id: (Date.now() + 1).toString(), 
        texto: respuestaIA, 
        remitente: "ia",
        mostrarBotonFinalizar: true 
      };

      setMensajesIA((prev) => [...prev, mensajeIA]);

      if (sessionIdIA) {
        guardarMensajeDB({
          session_id: sessionIdIA,
          sender_type: "ia",
          content: respuestaIA
        });
      }

    } catch (error) {
      console.error("Error al procesar en Groq:", error);
    } finally {
      setCargando(false);
      hacerScrollAlFinal();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      
      {/* NAVBAR SUPERIOR CON SWITCH Y BOTÓN + */}
      <View style={[styles.navbar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: !esModoDoctor ? colors.primary : colors.textSecondary }]}>IA</Text>
          <Switch
            value={esModoDoctor}
            onValueChange={toggleModoDoctor}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDarkMode ? colors.surface : "#FFF"}
          />
          <Text style={[styles.switchLabel, { color: esModoDoctor ? colors.primary : colors.textSecondary }]}>Doctor</Text>
        </View>

        <TouchableOpacity style={styles.newChatButton} onPress={iniciarNuevoChat}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}>
        
        {/* LISTA DE MENSAJES (Muestra mensajesIA o mensajesDoctor según el switch) */}
        <FlatList
          ref={flatListRef}
          data={mensajesVisibles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          renderItem={({ item }) => (
            <View style={[
              styles.bubbleContainer, 
              item.remitente === "usuario" ? styles.usuarioContainer : styles.iaContainer
            ]}>
              <View style={[
                styles.burbuja, 
                item.remitente === "usuario"
                  ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                  : { backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border }
              ]}>
                {item.imagenUrl && <Image source={{ uri: item.imagenUrl }} style={styles.imagenMensaje} />}
                {item.texto && (
                  <Text style={item.remitente === "usuario" ? styles.textoUsuario : [styles.textoIA, { color: colors.textPrimary }]}>
                    {item.texto}
                  </Text>
                )}

                {/* BOTÓN "FINALIZAR Y RESUMIR" (Solo visible en modo IA) */}
                {item.mostrarBotonFinalizar && item.remitente === "ia" && !esModoDoctor && (
                  <TouchableOpacity style={styles.finishActionButton} onPress={finalizarYResumirConsulta}>
                    <Ionicons name="checkmark-done-circle-outline" size={16} color="#FFF" />
                    <Text style={styles.finishActionText}>Finalizar consulta y resumir</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />

        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {esModoDoctor ? "Enviando mensaje..." : "Caremap IA está pensando..."}
            </Text>
          </View>
        )}

        {/* CONTENEDOR DE ENTRADA */}
        <View style={[styles.inputContainerGlobal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          
          {imagenTemporal && (
            <View style={[styles.previewWrapper, { borderColor: colors.border }]}>
              <View style={styles.imageContainerRelative}>
                <Image source={{ uri: imagenTemporal.uri }} style={styles.previewImagen} />
                <TouchableOpacity style={styles.deletePreviewButton} onPress={() => setImagenTemporal(null)}>
                  <Text style={styles.deletePreviewText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.waitingText, { color: colors.textSecondary }]}>Imagen en espera para enviar</Text>
            </View>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity style={[styles.plusButton, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={mostrarMenuAdjuntar}>
              <Text style={[styles.plusIcon, { color: colors.textSecondary }]}>+</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <CustomInput 
                type="text" 
                placeholder={esModoDoctor ? "Escribe a tu médico..." : (imagenTemporal ? "Comenta la foto..." : "Pregúntame lo que quieras...")} 
                value={nuevoMensaje} 
                onChange={setNuevoMensaje} 
              />
            </View>
            <View style={styles.buttonWrapper}>
              <CustomButton title="Enviar" onPress={enviarMensaje} variant="primary" />
            </View>
          </View>

        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontWeight: "700",
    fontSize: 14,
  },
  newChatButton: {
    padding: 4,
  },

  chatContainer: { padding: 15, paddingBottom: 20 },
  bubbleContainer: { marginVertical: 6, flexDirection: "row", width: "100%" },
  usuarioContainer: { justifyContent: "flex-end" },
  iaContainer: { justifyContent: "flex-start" },
  burbuja: { maxWidth: "80%", padding: 14, borderRadius: 18 },
  textoUsuario: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  textoIA: { fontSize: 15, fontWeight: "500" },
  imagenMensaje: { width: 220, height: 160, borderRadius: 12, marginBottom: 6, resizeMode: "cover" },
  
  finishActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
    alignSelf: "flex-start"
  },
  finishActionText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600"
  },

  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, fontStyle: "italic" },
  
  inputContainerGlobal: { borderTopWidth: 1, flexDirection: "column" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  plusButton: { height: 40, width: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  plusIcon: { fontSize: 22, fontWeight: "300", marginTop: -2 },
  buttonWrapper: { width: 90, justifyContent: "center", marginBottom: 8 },
  
  previewWrapper: { padding: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, gap: 12 },
  imageContainerRelative: { position: "relative", width: 60, height: 60 },
  previewImagen: { width: 60, height: 60, borderRadius: 8, resizeMode: "cover" },
  deletePreviewButton: { backgroundColor: "rgba(0,0,0,0.7)", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", position: "absolute", top: -6, right: -6, zIndex: 10 },
  deletePreviewText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  waitingText: { fontSize: 13, fontStyle: "italic" }
});