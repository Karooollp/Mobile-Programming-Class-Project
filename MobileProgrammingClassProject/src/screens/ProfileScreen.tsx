import React from "react";
import { Text, View, Image } from "react-native";
import { useAppSelector } from "../store/hooks";

import CardProfile, { sharedStyles } from "../components/CardProfile";
import CustomButton from "../components/CustomButton";

export default function ProfileScreen({ navigation }: any) {
  const profile = useAppSelector((state) => state.userProfile.data);
  
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }
  
  return (
    <CardProfile
      footer={
        <View style={{ width: "100%", gap: 10 }}>
          <CustomButton
            title="Editar perfil"
            onPress={() => navigation.navigate("EditProfile")}
          />
          
          <CustomButton
            title="Cerrar sesión"
            onPress={() => navigation.navigate("Login")}
          />
        </View>
      }
    >
      <View style={sharedStyles.header}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={sharedStyles.avatar}
          />
        ) : (
          <View style={sharedStyles.avatarPlaceholder}>
            <Text>Sin foto</Text>
          </View>
        )}
        
        <Text>
          {profile.first_Name} {profile.last_Name}
        </Text>
        
        <Text>{profile.email}</Text>
        <Text>{profile.phone}</Text>
        <Text>{profile.address}</Text>
        <Text>{profile.birthDate}</Text>
        <Text>{profile.bloodType}</Text>
        <Text>{profile.emergencyContact}</Text>
      </View>
    </CardProfile>
  );
}