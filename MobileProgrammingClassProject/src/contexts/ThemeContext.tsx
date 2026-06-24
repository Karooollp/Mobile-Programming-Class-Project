import React, { createContext, useContext, useState, ReactNode } from "react";
import { useColorScheme } from "react-native";

// 1. Definimos la paleta de colores global 🎨
export const PaletaColores = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textPrimary: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    primary: "#0284C7", // Tu azul Caremap 🩺
  },
  dark: {
    background: "#0F172A", // Slate oscuro lindo
    surface: "#1E293B",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#334155",
    primary: "#0ea5e9",
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  colors: typeof PaletaColores.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Detecta automáticamente el tema del sistema del celular (opcional)
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // Seleccionamos los colores dinámicamente según el estado
  const colors = isDarkMode ? PaletaColores.dark : PaletaColores.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook personalizado para usarlo en tus pantallas de forma limpia ⚡
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}