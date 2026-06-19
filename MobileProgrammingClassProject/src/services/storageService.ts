import { Supabase } from "../lib/Supabase";
import * as DocumentPicker from "expo-document-picker";

export const uploadImage = async (userId: string, imageUri: string) => {
  const fileName = `${userId}-${Date.now()}.jpg`;
  
  const formData = new FormData();
  
  formData.append("file", {
    uri: imageUri,
    name: fileName,
    type: "image/jpeg",
  } as any);
  
  const { error } = await Supabase.storage
    .from("profile-images")
    .upload(fileName, formData, {
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
  const fileName = `${userId}-${Date.now()}.${file.name.split(".").pop() || "pdf"}`;
  
  const formData = new FormData();
  
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/pdf",
  } as any);
  
  const { error } = await Supabase.storage
    .from("medical-files")
    .upload(fileName, formData, {
      contentType: file.mimeType || "application/pdf",
      upsert: true,
    });
  
  if (error) throw error;
  
  const { data } = Supabase.storage
    .from("medical-files")
    .getPublicUrl(fileName);
  
  return data.publicUrl;
};