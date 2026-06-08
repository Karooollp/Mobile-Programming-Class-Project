import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";

// Creamos la instancia del Tab Navigator 
const Tab = createBottomTabNavigator();

// ─── Pantalla temporal del Chatbot ─────────────────────────────────────────
function ChatbotScreen() {
  return (
    <View style={styles.chatbotContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={52} color="#94A3B8" />
      <Text style={styles.chatbotText}>
        Módulo de Chatbot Inteligente (Próximamente)
      </Text>
    </View>
  );
}

// ─── TabNavigator principal ────────────────────────────────────────────────
export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#0284C7",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarLabelStyle: styles.tabLabel,

        // Seleccionamos el ícono según el nombre de la pestaña activa
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "home-outline"; // valor por defecto

          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Métricas") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "Chatbot") {
            iconName = focused
              ? "chatbubble-ellipses"
              : "chatbubble-ellipses-outline";
          } else if (route.name === "Perfil") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio"   component={HomeScreen} />
      <Tab.Screen name="Métricas" component={DashboardScreen} />
      <Tab.Screen name="Chatbot"  component={ChatbotScreen} />
      <Tab.Screen name="Perfil"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Barra inferior
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
    // Sombra (iOS)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // Sombra (Android)
    elevation: 10,
  },

  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Pantalla placeholder del Chatbot
  chatbotContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 36,
  },

  chatbotText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 24,
  },
});