import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { preguntarAGroq } from "../lib/groqService"; 
import { useCaremapHealth } from "../contexts/CaremapHealthContexts"; // 👈 Usamos tu context
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";

interface Mensaje {
  id: string;
  texto: string;
  remitente: "usuario" | "ia";
}

export default function ChatScreen() {
  const { colors } = useCaremapHealth(); // 👈 Traemos los colores dinámicos
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { id: "1", texto: "¡Hola, soy tu asistente de Caremap Health! 🩺 ¿En qué puedo ayudarte a cuidar tu bienestar hoy? :3", remitente: "ia" }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    const respuestaIA = await preguntarAGroq(textoUsuario);

    const mensajeIA: Mensaje = {
      id: (Date.now() + 1).toString(),
      texto: respuestaIA,
      remitente: "ia",
    };

    setMensajes((prev) => [...prev, mensajeIA]);
    setCargando(false);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
              <Text style={item.remitente === "usuario" ? styles.textoUsuario : [styles.textoIA, { color: colors.textPrimary }]}>
                {item.texto}
              </Text>
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
  loadingContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, fontStyle: "italic" },
  inputBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, gap: 8 },
  buttonWrapper: { width: 90, justifyContent: "center", marginBottom: 8 },
});