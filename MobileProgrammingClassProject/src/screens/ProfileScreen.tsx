import React from "react";
import { Text, View, Image, TouchableOpacity, Linking } from "react-native";

// 📦 Redux Hooks
import { useAppSelector, useAppDispatch } from "../store/hooks";
// NOTA: Si tu compañero creó una acción para cambiar el tema, impórtala aquí. Ejemplo:
// import { toggleTheme } from "../store/slices/themeSlice";

import CardProfile, { sharedStyles } from "../components/CardProfile";
import CustomButton from "../components/CustomButton";

export default function ProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  
  // 🌟 Extraemos los datos del perfil y del tema desde Redux
  const profile = useAppSelector(state => state.userProfile.data);
  const isDarkMode = useAppSelector((state: any) => state.theme?.isDarkMode || false);

  // Función para manejar el cambio de tema mediante Redux si existe la acción
  const handleToggleTheme = () => {
    // dispatch(toggleTheme()); 
    // Por ahora lo dejamos listo por si ocupan disparar la acción de Redux :3
    console.log("Cambiando tema global desde Redux... 7u7");
  };

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
          {/* 🌙 ¡Botón para cambiar el Modo Oscuro / Claro! ☀️ */}
          <CustomButton
            title={isDarkMode ? "Cambiar a Modo Claro ☀️" : "Cambiar a Modo Oscuro 🌙"}
            variant="secondary"
            onPress={handleToggleTheme}
          />

          <CustomButton
            title="Editar perfil"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <CustomButton
            title="Cerrar sesión"
            onPress={() => navigation.navigate("Login")}
          />
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