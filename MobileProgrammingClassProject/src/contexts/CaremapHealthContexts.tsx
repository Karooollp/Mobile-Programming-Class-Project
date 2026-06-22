import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native"; // 👈 Importamos para detectar el tema del sistema
import { UserProfile } from "../utils/types/Types";

// 1. Definimos la paleta de colores global 🎨
export const PaletaColores = {
  light: {
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textPrimary: "#0F172A",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    primary: "#0284C7", // Tu azul Caremap 🩺
    cardShadow: "#000",
  },
  dark: {
    background: "#0F172A", // Slate oscuro 🌙
    surface: "#1E293B",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    border: "#334155",
    primary: "#38BDF8", // Un celeste más brillante para que resalte en lo oscuro
    cardShadow: "#000",
  },
};

// 2. Actualizamos el tipo del contexto con las 3 nuevas propiedades 🛠️
type CaremapHealthContextsType = {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof PaletaColores.light;
};

const defaultProfile: UserProfile = {
  user_id: "",
  first_Name: "",
  last_Name: "",
  age: null,
  gender: null,
  birthDate: null,
  photoUrl: null,
  phone: null,
  email: "",
  address: null,
  bloodType: null,
  emergencyContact: null,
  status: "active",
  createdAt: new Date().toISOString(),
  profileCompleted: false,
};

const CaremapHealthContext = createContext<CaremapHealthContextsType | null>(null);

export const useCaremapHealth = () => {
  const context = useContext(CaremapHealthContext);
  if (!context) {
    throw new Error("useCaremapHealth debe usarse dentro de CaremapHealthProvider");
  }
  return context;
};

export const CaremapHealthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  
  // 3. Agregamos el estado para el modo oscuro 🌙
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // 4. Función para cambiar entre modos
  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  // 5. Elegimos los colores activos dependiendo del estado del booleano
  const colors = isDarkMode ? PaletaColores.dark : PaletaColores.light;

  return (
    <CaremapHealthContext.Provider 
      value={{ 
        profile, 
        updateProfile, 
        isDarkMode, 
        toggleTheme, 
        colors 
      }}
    >
      {children}
    </CaremapHealthContext.Provider>
  );
};