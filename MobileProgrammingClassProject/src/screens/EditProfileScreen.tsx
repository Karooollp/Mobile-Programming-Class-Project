import { useState } from "react";
import { View, Text, Button } from "react-native";

import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import CustomInput from "../components/CustomInput";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

export default function EditProfileScreen() {
  const { profile, updateProfile } = useCaremapHealth();
  
  const [age, setAge] = useState(profile.age?.toString() ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [bloodType, setBloodType] = useState(profile.bloodType ?? "");
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact ?? "");
  
  const handleSave = () => {
    updateProfile({
      age: age ? Number(age) : null,
      gender,
      birthDate,
      phone,
      address,
      bloodType,
      emergencyContact,
    });
    
    // router.replace("/home");
  };
  
  return (
    <LoginAndRegisterCard>
      <Text>Completa tu perfil</Text>
      
      <CustomInput
        type="number"
        placeholder="Edad"
        value={age}
        onChange={setAge}
      />
      
      <CustomInput
        placeholder="Género"
        value={gender}
        onChange={setGender}
      />
      
      <CustomInput
        placeholder="Fecha de nacimiento"
        value={birthDate}
        onChange={setBirthDate}
      />
      
      <CustomInput
        type="phone"
        placeholder="Teléfono"
        value={phone}
        onChange={setPhone}
      />
      
      <CustomInput
        placeholder="Dirección"
        value={address}
        onChange={setAddress}
      />
      
      <CustomInput
        placeholder="Tipo de sangre"
        value={bloodType}
        onChange={setBloodType}
      />
      
      <CustomInput
        placeholder="Contacto de emergencia"
        value={emergencyContact}
        onChange={setEmergencyContact}
      />
      
      <Button title="Guardar" onPress={handleSave} />
    </LoginAndRegisterCard>
  );
}