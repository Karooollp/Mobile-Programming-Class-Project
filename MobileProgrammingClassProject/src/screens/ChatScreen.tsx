import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, TouchableOpacity, Alert, ActionSheetIOS } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { preguntarAGroq } from "../lib/groqService";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

interface Mensaje {
  id: string;
  texto?: string;
  imagenUrl?: string;
  remitente: "usuario" | "ia";
}

export default function ChatScreen() {
  const { colors } = useCaremapHealth();

  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: "1", texto: "¡Hola, soy tu asistente de Caremap Health! ¿En qué puedo ayudarte a cuidar tu bienestar hoy? :3", remitente: "ia" }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [imagenTemporal, setImagenTemporal] = useState<ImagePicker.ImagePickerAsset | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  const hacerScrollAlFinal = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

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

  const enviarMensaje = async () => {
    const textoUsuario = nuevoMensaje.trim();
    
    if (!textoUsuario && !imagenTemporal) return;
    if (cargando) return;

    const idMensaje = Date.now().toString();
    
    const nuevoMensajeUsuario: Mensaje = {
      id: idMensaje,
      remitente: "usuario",
      ...(textoUsuario ? { texto: textoUsuario } : {}),
      ...(imagenTemporal ? { imagenUrl: imagenTemporal.uri } : {})
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    
    const fotoParaEnviar = imagenTemporal;
    setNuevoMensaje("");
    setImagenTemporal(null);
    
    setCargando(true);
    hacerScrollAlFinal();

    try {
      let respuestaIA = "";
      
      if (fotoParaEnviar) {
        const promptVisual = textoUsuario 
          ? `El usuario te manda esta imagen con el siguiente comentario: "${textoUsuario}". Analízala basándote en la salud y el bienestar.`
          : "Analiza esta imagen y dime si tiene relación con el bienestar, alimentación o salud.";
        
        respuestaIA = await preguntarAGroq(promptVisual, fotoParaEnviar.base64 ?? undefined);
      } else {
        respuestaIA = await preguntarAGroq(textoUsuario);
      }

      setMensajes((prev) => [...prev, { id: (Date.now() + 1).toString(), texto: respuestaIA, remitente: "ia" }]);
    } catch (error) {
      console.error("Error al procesar en Groq:", error);
    } finally {
      setCargando(false);
      hacerScrollAlFinal();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}>
        
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          renderItem={({ item }) => (
            <View style={[styles.bubbleContainer, item.remitente === "usuario" ? styles.usuarioContainer : styles.iaContainer]}>
              <View style={[styles.burbuja, item.remitente === "usuario"
                ? { backgroundColor: colors.primary, borderBottomRightRadius: 2 }
                : { backgroundColor: colors.surface, borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.border }]}>
                {item.imagenUrl && <Image source={{ uri: item.imagenUrl }} style={styles.imagenMensaje} />}
                {item.texto && <Text style={item.remitente === "usuario" ? styles.textoUsuario : [styles.textoIA, { color: colors.textPrimary }]}>{item.texto}</Text>}
              </View>
            </View>
          )}
        />

        {cargando && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Caremap IA está pensando...</Text>
          </View>
        )}

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
              <CustomInput type="text" placeholder={imagenTemporal ? "Comenta algo sobre la foto..." : "Pregúntame lo que quieras..."} value={nuevoMensaje} onChange={setNuevoMensaje} />
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