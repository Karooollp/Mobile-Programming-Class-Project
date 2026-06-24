import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TouchableOpacity, Alert, ActionSheetIOS } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker"; 
import { preguntarAGroq } from "../lib/groqService"; 
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";

// 📦 Importamos los hooks de Redux creados por tu compañero
import { useAppSelector } from "../store/hooks";

interface Mensaje {
  id: string;
  texto?: string;     
  imagenUrl?: string; 
  remitente: "usuario" | "ia";
}

export default function ChatScreen() {
  // 🎨 Cambiado a Redux para extraer los colores globales de forma limpia
  const theme = useAppSelector((state: any) => state.theme || state.userProfile?.theme);
  // Fallback seguro por si las moscas para que nunca falle al compilar
  const colors = theme?.colors || {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    primary: "#0284C7",
    border: "#E2E8F0",
    textPrimary: "#0F172A",
    textSecondary: "#64748B"
  };

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: "1", texto: "¡Hola, soy tu asistente de Caremap Health! 🩺 ¿En qué puedo ayudarte a cuidar tu bienestar hoy? :3", remitente: "ia" }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const hacerScrollAlFinal = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const mostrarMenuAdjuntar = () => {
    if (cargando) return;

    const opciones = ["📸 Tomar Foto (Cámara)", "🖼️ Elegir de la Galería", "Cancelar"];
    const botonCancelarIndice = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: opciones,
          cancelButtonIndex: botonCancelarIndice,
          title: "Adjuntar contenido",
          message: "¿De dónde quieres obtener la foto?",
        },
        (buttonIndex) => {
          if (buttonIndex === 0) abrirCamaraEnVivo();
          if (buttonIndex === 1) abrirGaleriaFotos();
        }
      );
    } else {
      Alert.alert(
        "Adjuntar contenido",
        "¿De dónde quieres obtener la foto?",
        [
          { text: "📸 Cámara", onPress: abrirCamaraEnVivo },
          { text: "🖼️ Galería", onPress: abrirGaleriaFotos },
          { text: "Cancelar", style: "cancel" }
        ],
        { cancelable: true }
      );
    }
  };

  const abrirCamaraEnVivo = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permisos necesarios", "¡Oye! Necesitamos acceso a tu cámara para tomar fotos en vivo.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      procesarImagenIA(resultado.assets[0]);
    }
  };

  const abrirGaleriaFotos = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permisos necesarios", "¡Oye! Ocupamos acceso a tus fotos para poder elegirlas. 😿");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.4,
      base64: true,
    });

    if (!resultado.canceled && resultado.assets[0]) {
      procesarImagenIA(resultado.assets[0]);
    }
  };

  const procesarImagenIA = async (fotoSeleccionada: ImagePicker.ImagePickerAsset) => {
    const mensajeFotoUsuario: Mensaje = {
      id: Date.now().toString(),
      imagenUrl: fotoSeleccionada.uri,
      remitente: "usuario",
    };

    setMensajes((prev) => [...prev, mensajeFotoUsuario]);
    setCargando(true);
    hacerScrollAlFinal();

    try {
      const promptVisual = "Analiza esta imagen y dime si tiene relación con el bienestar, alimentación o salud, dame tus comentarios lindos.";
      const respuestaIA = await preguntarAGroq(promptVisual, fotoSeleccionada.base64 ?? undefined);

      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        texto: respuestaIA,
        remitente: "ia",
      };

      setMensajes((prev) => [...prev, mensajeIA]);
    } catch (error) {
      console.error("Error al procesar imagen con Groq:", error);
    } finally {
      setCargando(false);
      hacerScrollAlFinal();
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || cargando) return;

    const textoUsuario = nuevoMensaje.trim();
    setNuevoMensaje(""); 

    const mensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      texto: textoUsuario,
      remitente: "usuario",
    };
    
    setMensajes((prev) => [...prev, mensajeUsuario]);
    setCargando(true);
    hacerScrollAlFinal();

    const respuestaIA = await preguntarAGroq(textoUsuario);

    const mensajeIA: Mensaje = {
      id: (Date.now() + 1).toString(),
      texto: respuestaIA,
      remitente: "ia",
    };

    setMensajes((prev) => [...prev, mensajeIA]);
    setCargando(false);
    hacerScrollAlFinal();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
        <FlatList
          ref={flatListRef}
          data={mensajes}
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
                {item.imagenUrl && (
                  <Image source={{ uri: item.imagenUrl }} style={styles.imagenMensaje} />
                )}
                
                {item.texto && (
                  <Text style={item.remitente === "usuario" ? styles.textoUsuario : [styles.textoIA, { color: colors.textPrimary }]}>
                    {item.texto}
                  </Text>
                )}
              </View>
            </View>
          )}
        />

        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Caremap IA está pensando... 7u7</Text>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.plusButton, { backgroundColor: colors.background, borderColor: colors.border }]} 
            onPress={mostrarMenuAdjuntar}
          >
            <Text style={[styles.plusIcon, { color: colors.textSecondary }]}>+</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <CustomInput
              type="text"
              placeholder="Pregúntame lo que quieras..."
              value={nuevoMensaje}
              onChange={setNuevoMensaje}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <CustomButton title="Enviar" onPress={enviarMensaje} variant="primary" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  bubbleContainer: { marginVertical: 6, flexDirection: "row", width: "100%" },
  usuarioContainer: { justifyContent: "flex-end" },
  iaContainer: { justifyContent: "flex-start" },
  burbuja: { maxWidth: "80%", padding: 14, borderRadius: 18 },
  textoUsuario: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  textoIA: { fontSize: 15, fontWeight: "500" },
  imagenMensaje: { width: 220, height: 160, borderRadius: 12, marginBottom: 6, resizeMode: "cover" }, 
  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, fontStyle: "italic" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  plusButton: { height: 40, width: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", borderWidth: 1 }, 
  plusIcon: { fontSize: 22, fontWeight: "300", marginTop: -2 },
  buttonWrapper: { width: 90, justifyContent: "center", marginBottom: 8 },
});