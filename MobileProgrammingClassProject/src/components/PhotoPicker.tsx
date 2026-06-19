import React from "react";
import { View, Text } from "react-native";
import { Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import CustomButton from "./CustomButton";


type Props = {
  value: string | null;
  onChange: (uri: string) => void;
  label?: string;
  variant?: "profile" | "full";
};


export default function PhotoPicker({
                                      value,
                                      onChange,
                                      label = "Editar imagen",
                                    }: Props) {
  const AVATAR_SIZE = 130;
  
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      alert("Debes permitir acceso a la galería");
      return;
    }
    
    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
    
    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  };
  
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: AVATAR_SIZE,
          height: AVATAR_SIZE,
          borderRadius: AVATAR_SIZE / 2,
          overflow: "hidden",
          borderWidth: 3,
          borderColor: "#4F46E5",
          backgroundColor: "#F3F4F6",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {value ? (
          <Image
            source={{ uri: value }}
            style={{
              width: "100%",
              height: "100%",
            }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ color: "#6B7280" }}>
            Sin foto
          </Text>
        )}
      </View>
      
      <View
        style={{
          marginTop: 15,
          width: "100%",
        }}
      >
        <CustomButton
          title={label}
          onPress={pickImage}
        />
      </View>
    </View>
  );
}