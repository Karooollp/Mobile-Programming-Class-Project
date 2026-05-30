import { createContext, useContext, useState } from "react";
import { UserProfile } from "../utils/types/Types";

type CaremapHealthContextsType = {
  profile: UserProfile;
  updateProfile: (profile: Partial<UserProfile>) => void;
};

const defaultProfile: UserProfile = {
  id: "",
  firstName: "",
  lastName: "",
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
  
  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };
  
  return (
    <CaremapHealthContext.Provider value={{ profile, updateProfile }}>
      {children}
    </CaremapHealthContext.Provider>
  );
}