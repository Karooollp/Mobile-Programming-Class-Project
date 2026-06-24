import React from "react";
import { Text, View, Image } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import CardProfile, { useSharedStyles } from "../components/CardProfile";
import CustomButton from "../components/CustomButton";


export default function ProfileScreen({ navigation }: any) {
  const { isDarkMode, toggleTheme, profile } = useCaremapHealth();
  const sharedStyles = useSharedStyles();

  if (!profile.user_id) {
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
            title={isDarkMode ? "Cambiar a Modo Claro " : "Cambiar a Modo Oscuro "}
            variant="secondary"
            onPress={toggleTheme}
          />
          <CustomButton title="Editar perfil" onPress={() => navigation.navigate("EditProfile")} />
          <CustomButton title="Cerrar sesión" onPress={() => navigation.navigate("Login")} />
          <CustomButton
            title="Ir a Inicio / Dashboard"
            variant="secondary"
            onPress={() => navigation.navigate("UserTabs", { screen: "Inicio" })}
          />
        </View>
      }
    >
      <View style={sharedStyles.header}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={sharedStyles.avatar} />
        ) : (
          <View style={sharedStyles.avatarPlaceholder}>
            <Text style={sharedStyles.avatarText}>Sin foto</Text>
          </View>
        )}
        <Text style={sharedStyles.name}>{profile.first_name} {profile.last_name}</Text>
        <Text style={sharedStyles.email}>{profile.email}</Text>
      </View>

      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Información Personal</Text>
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Nombre completo</Text>
            <Text style={sharedStyles.fieldValue}>{profile.first_name} {profile.last_name}</Text>
          </View>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Edad</Text>
            <Text style={sharedStyles.fieldValue}>{profile.age ?? "-"}</Text>
          </View>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Género</Text>
            <Text style={sharedStyles.fieldValue}>{profile.gender ?? "-"}</Text>
          </View>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Nacimiento</Text>
            <Text style={sharedStyles.fieldValue}>
              {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString() : "-"}
            </Text>
          </View>
        </View>
      </View>

      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Contacto</Text>
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Correo</Text>
            <Text style={sharedStyles.fieldValue}>{profile.email}</Text>
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
            <Text style={sharedStyles.fieldValue}>{profile.emergency_contact ?? "-"}</Text>
          </View>
        </View>
      </View>

      <View style={sharedStyles.section}>
        <Text style={sharedStyles.sectionTitle}>Médico</Text>
        <View style={sharedStyles.cardSection}>
          <View style={sharedStyles.fieldCard}>
            <Text style={sharedStyles.fieldLabel}>Tipo de sangre</Text>
            <Text style={sharedStyles.fieldValue}>{profile.blood_type ?? "-"}</Text>
          </View>
        </View>
      </View>
    </CardProfile>
  );
}