import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";
import { useAppSelector } from "../store/hooks";

export const PaletaColores = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    primary: "#0284C7",
    cardShadow: "#000", 
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#334155",
    primary: "#38BDF8",
    cardShadow: "#000",
  },
};

// Mismo UUID que ya usa ProfileScreen.tsx para identificar el rol de doctor
const DOCTOR_ROLE_ID = "3639b033-377c-496f-8cc9-bf6c70d5ccc0";

type CaremapHealthContextsType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof PaletaColores.light;
};

const CaremapHealthContext =
  createContext<CaremapHealthContextsType | null>(null);

export const useCaremapHealth = () => {
  const context = useContext(CaremapHealthContext);

  if (!context) {
    throw new Error(
      "useCaremapHealth debe usarse dentro de CaremapHealthProvider"
    );
  }

  return context;
};

export const CaremapHealthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const systemScheme = useColorScheme();

  const [manualDarkMode, setManualDarkMode] = useState(systemScheme === "dark");

  // El modo oscuro es un "servicio" solo para pacientes. Si el perfil logueado
  // es doctor, ignoramos tanto el toggle manual como el modo oscuro del sistema
  // del celular, y forzamos modo claro siempre.
  const profile = useAppSelector((state) => state.userProfile.data);
  const isDoctor =
    profile?.role_name?.toLowerCase() === "doctor" ||
    profile?.roles_id === DOCTOR_ROLE_ID;

  const isDarkMode = isDoctor ? false : manualDarkMode;

  const toggleTheme = () => {
    // No-op para doctores: aunque no tengan el botón en pantalla, esto evita
    // que cualquier otro lugar del código que llame a toggleTheme() les meta
    // modo oscuro por accidente.
    if (isDoctor) return;
    setManualDarkMode((prev) => !prev);
  };

  const colors = isDarkMode ? PaletaColores.dark : PaletaColores.light;

  return (
    <CaremapHealthContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        colors,
      }}
    >
      {children}
    </CaremapHealthContext.Provider>
  );
};