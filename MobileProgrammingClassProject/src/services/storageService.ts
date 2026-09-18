import { Supabase } from "../lib/Supabase";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { Alert } from "react-native";

// Helper: lee cualquier archivo local y lo convierte a ArrayBuffer
// (el formato que Supabase Storage necesita en vez de FormData)
const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decode(base64);
};

export const uploadImage = async (userId: string, imageUri: string) => {
  const fileName = `${userId}/profile.jpg`;

  const arrayBuffer = await uriToArrayBuffer(imageUri);

  const { error } = await Supabase.storage
    .from("profile-images")
    .upload(fileName, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) throw error;

  const { data } = Supabase.storage
    .from("profile-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const uploadDocument = async (
  userId: string,
  file: DocumentPicker.DocumentPickerAsset
) => {
  const isPdf =
    file.mimeType === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    Alert.alert("Archivo no válido", "Solo se permiten archivos PDF.");
    return;
  }

  const fileName = `${userId}/medical-file.pdf`;
  const contentType = file.mimeType || "application/pdf";

  const arrayBuffer = await uriToArrayBuffer(file.uri);

  const { error } = await Supabase.storage
    .from("medical-files")
    .upload(fileName, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (error) throw error;

  const { data } = Supabase.storage
    .from("medical-files")
    .getPublicUrl(fileName);

  return data.publicUrl;
};

// Sube una imagen enviada dentro de un chat (doctor <-> paciente) al bucket
// "chat-images", organizada por carpeta = sessionId (esto es importante:
// la política RLS de Storage usa ese primer segmento de la ruta para saber
// a qué sesión de chat pertenece el archivo y así decidir quién puede
// subir/leer). El nombre del archivo incluye quién lo mandó y un timestamp
// para que nunca choquen dos imágenes en la misma sesión.
export const uploadChatImage = async (
  sessionId: string,
  senderId: string,
  imageUri: string
): Promise<string> => {
  const fileName = `${sessionId}/${senderId}_${Date.now()}.jpg`;

  const arrayBuffer = await uriToArrayBuffer(imageUri);

  const { error } = await Supabase.storage
    .from("chat-images")
    .upload(fileName, arrayBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) throw error;

  const { data } = Supabase.storage
    .from("chat-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
};