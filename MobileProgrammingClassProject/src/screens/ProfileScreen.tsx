import React from "react";
import { Text, View, Image, StyleSheet } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import CardProfile, { useSharedStyles } from "../components/CardProfile";
import CustomButton from "../components/CustomButton";

import { useAppSelector } from "../store/hooks";

export default function ProfileScreen({ navigation }: any) {
  const DOCTOR_ROLE_ID = "3639b033-377c-496f-8cc9-bf6c70d5ccc0";
  const { isDarkMode, toggleTheme, colors } = useCaremapHealth();
  const sharedStyles = useSharedStyles();

  const profile = useAppSelector((state) => state.userProfile.data);

  if (!profile || !profile.user_id) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cargando perfil... uwu</Text>
      </View>
    );
  }

  // Regla: primero confiamos en role_name (viene del JOIN con "roles").
  // Si por algún motivo llega vacío, usamos roles_id como respaldo,
  // como tener una segunda llave por si la primera no abre la puerta.
  const isDoctor =
    profile.role_name?.toLowerCase() === "doctor" ||
    profile.roles_id === DOCTOR_ROLE_ID;

  const dashboardLabel = isDoctor ? "Ir a Dashboard Médico" : "Ir a Inicio / Dashboard";

  const goToDashboard = () => {
  if (isDoctor) {
    navigation.navigate("DoctorTabs", { screen: "Inicio" });
  } else {
    navigation.navigate("UserTabs", { screen: "Inicio" });
  }
};

  return (
    <CardProfile
      footer={
        <View style={{ width: "100%", gap: 10 }}>
          {/* El modo oscuro solo se ofrece a pacientes. Para doctores lo
              quitamos por completo en vez de solo deshabilitarlo, así no
              queda un botón "fantasma" sin función. */}
          {!isDoctor && (
            <CustomButton
              title={isDarkMode ? "Cambiar a Modo Claro " : "Cambiar a Modo Oscuro "}
              variant="secondary"
              onPress={toggleTheme}
            />
          )}
          <CustomButton title="Editar perfil" onPress={() => navigation.navigate("EditProfile")} />
          <CustomButton title="Cerrar sesión" onPress={() => navigation.navigate("Login")} />
          <CustomButton
            title={dashboardLabel}
            variant="secondary"
            onPress={goToDashboard}
          />
        </View>
      }
    >
      <View style={sharedStyles.header}>
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url ?? undefined }} style={sharedStyles.avatar} />
        ) : (
          <View style={sharedStyles.avatarPlaceholder}>
            <Text style={sharedStyles.avatarText}>Sin foto</Text>
          </View>
        )}
        <Text style={sharedStyles.name}>{profile.first_name} {profile.last_name}</Text>

        <View
          style={[
            styles.roleBadge,
            {
              backgroundColor: isDoctor ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.roleBadgeText,
              { color: isDoctor ? "#FFFFFF" : colors.textPrimary },
            ]}
          >
            {isDoctor ? "👨‍⚕️ Doctor" : "🧑 Paciente"}
          </Text>
        </View>

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

      {!isDoctor && (
        <View style={sharedStyles.section}>
          <Text style={sharedStyles.sectionTitle}>Médico</Text>
          <View style={sharedStyles.cardSection}>
            <View style={sharedStyles.fieldCard}>
              <Text style={sharedStyles.fieldLabel}>Tipo de sangre</Text>
              <Text style={sharedStyles.fieldValue}>{profile.blood_type ?? "-"}</Text>
            </View>
          </View>
        </View>
      )}
    </CardProfile>
  );
}

const styles = StyleSheet.create({
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 4,
    marginBottom: 2,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});