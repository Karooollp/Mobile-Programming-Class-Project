import React from "react";
import {Text, View, Image, TouchableOpacity, Linking} from "react-native";
import { useAppSelector } from "../store/hooks";

import CardProfile, { sharedStyles } from "../components/CardProfile";
import CustomButton from "../components/CustomButton";

export default function ProfileScreen({ navigation }: any) {
  const profile = useAppSelector(state => state.userProfile.data);
  
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
          {/* Botón de acceso rápido agregado para pruebas cómodas */}
          <CustomButton
            title="Ir a Inicio / Dashboard"
            variant="secondary"
            onPress={() => navigation.navigate("UserTabs")}
          />
        </View>
      }
    >
      {/* HEADER */}
      <View style={sharedStyles.header}>
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={sharedStyles.avatar} />
        ) : (
          <View style={sharedStyles.avatarPlaceholder}>
            <Text style={sharedStyles.avatarText}>Sin foto</Text>
          </View>
        )}
        
        <Text style={sharedStyles.name}>
          {profile.first_Name} {profile.last_Name}
        </Text>
        
        <Text style={sharedStyles.email}>{profile.email}</Text>
      </View>
      
      {/* PERSONAL */}
      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Información Personal</Text>
        
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Nombre completo</Text>
            <Text style={sharedStyles.fieldValue}>
              {profile.first_Name} {profile.last_Name}
            </Text>
          </View>
          
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Nacimiento</Text>
            <Text style={sharedStyles.fieldValue}>
              {profile.birthDate
                ? new Date(profile.birthDate).toLocaleDateString()
                : "-"}
            </Text>
          </View>
        </View>
      </View>
      
      {/* CONTACTO */}
      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Contacto</Text>
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Correo</Text>
            <Text style={sharedStyles.fieldValue}>{profile.email ?? "-"}</Text>
          </View>
          
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Teléfono</Text>
            <Text style={sharedStyles.fieldValue}>{profile.phone ?? "-"}</Text>
          </View>
          
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Dirección</Text>
            <Text style={sharedStyles.fieldValue}>{profile.address ?? "-"}</Text>
          </View>
          
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Emergencia</Text>
            <Text style={sharedStyles.fieldValue}>{profile.emergencyContact ?? "-"}</Text>
          </View>
        </View>
      </View>
      
      {/* MÉDICO */}
      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Médico</Text>
        
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Tipo de sangre</Text>
            <Text style={sharedStyles.fieldValue}>
              {profile.bloodType ?? "-"}
            </Text>
          </View>
          
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>
              Acta Medica
            </Text>
            
            {profile.birthCertificateUrl ? (
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(profile.birthCertificateUrl!)
                }
              >
                <Text
                  style={[
                    sharedStyles.fieldValue,
                    { color: "blue" },
                  ]}
                >
                  Ver documento
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={sharedStyles.fieldValue}>
                No hay documento
              </Text>
            )}
          </View>
        </View>
      </View>
    </CardProfile>
  );
}