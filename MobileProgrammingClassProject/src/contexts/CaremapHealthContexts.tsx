import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

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

  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
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