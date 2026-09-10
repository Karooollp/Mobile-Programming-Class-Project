import React from "react";
import { StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import DoctorHomeScreen from "../screens/Doctor/DoctorHomeScreen";

const Tab = createBottomTabNavigator();

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
          let iconName: keyof typeof Ionicons.glyphMap =
            "medical-outline";
          
          if (route.name === "Inicio") {
            iconName = focused ? "home" : "home-outline";
          }
          
          if (route.name === "Pacientes") {
            iconName = focused
              ? "people"
              : "people-outline";
          }
          
          if (route.name === "Citas") {
            iconName = focused
              ? "calendar"
              : "calendar-outline";
          }
          
          if (route.name === "Alertas") {
            iconName = focused
              ? "notifications"
              : "notifications-outline";
          }
          
          if (route.name === "Perfil") {
            iconName = focused
              ? "person"
              : "person-outline";
          }
          
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={DoctorHomeScreen}
      />
      
      {/* Estas las conectaremos después */}
      <Tab.Screen
        name="Pacientes"
        component={DoctorHomeScreen}
      />
      
      <Tab.Screen
        name="Citas"
        component={DoctorHomeScreen}
      />
      
      <Tab.Screen
        name="Alertas"
        component={DoctorHomeScreen}
      />
      
      <Tab.Screen
        name="Perfil"
        component={DoctorHomeScreen}
      />
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
});