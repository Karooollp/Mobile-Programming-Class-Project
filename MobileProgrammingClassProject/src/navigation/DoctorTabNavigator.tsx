import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DoctorHomeScreen from "../screens/Doctor/DoctorHomeScreen";
import DoctorPatientsScreen from "../screens/Doctor/DoctorPatientsScreen";
import DoctorChatScreen from "../screens/Doctor/DoctorChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DoctorAppointmentsScreen from "../screens/Doctor/DoctorAppointmentsScreen";
import DoctorAlertsScreen from "../screens/Doctor/DoctorAlertsScreen";

const Tab = createBottomTabNavigator();

// ─── Placeholders que faltan (Citas y Alertas) ─────────────────────────────
// Se reemplazan cuando construyamos esas pantallas.
function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>{label}</Text>
      <Text style={styles.placeholderSubtitle}>[ Pantalla pendiente de construir ]</Text>
    </View>
  );
}

export default function DoctorTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: styles.tabBar,

        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarLabelStyle: styles.tabLabel,

        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "medical-outline";

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          }

          if (route.name === "Pacientes") {
            iconName = focused ? "people" : "people-outline";
          }

          if (route.name === "Chat") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }

          if (route.name === "Citas") {
            iconName = focused ? "calendar" : "calendar-outline";
          }

          if (route.name === "Alertas") {
            iconName = focused ? "notifications" : "notifications-outline";
          }

          if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={DoctorHomeScreen} />
      <Tab.Screen name="Pacientes" component={DoctorPatientsScreen} />
      <Tab.Screen name="Chat" component={DoctorChatScreen} />
      <Tab.Screen name="Citas" component={DoctorAppointmentsScreen} />
      <Tab.Screen name="Alertas" component={DoctorAlertsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 10,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0284C7",
    textAlign: "center",
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
  },
});