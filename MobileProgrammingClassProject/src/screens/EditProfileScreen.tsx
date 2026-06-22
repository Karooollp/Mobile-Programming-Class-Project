import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomInput from "../components/CustomInput";
import { Supabase } from "../lib/Supabase";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { validateAge, validatePhone, validateText, validateGender, validateBloodType, GENDERS, BLOOD_TYPES } from "../utils/validators/profileValidator";
import CardProfile, { sharedStyles } from "../components/CardProfile";

export default function EditProfileScreen({ navigation }: any) {
  const { profile, updateProfile, colors } = useCaremapHealth(); // 🌙 Usamos colors
  const [showBloodTypes, setShowBloodTypes] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [firstName, setFirst_Name] = useState(profile.first_Name ?? "");
  const [lastName, setLast_Name] = useState(profile.last_Name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [age, setAge] = useState(profile.age?.toString() ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [bloodType, setBloodType] = useState(profile.bloodType ?? "");
  const [emergency, setEmergency] = useState(profile.emergencyContact ?? "");
  const [photo, setPhoto] = useState(profile.photoUrl ?? null);
  const [birthDate, setBirthDate] = useState<Date | null>(profile.birthDate ? new Date(profile.birthDate) : null);
  
  const [errors, setErrors] = useState({ age: "", phone: "", address: "", emergency: "", gender: "", bloodType: "" });
  
  const handleBirthDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };
  
  // Handlers omitidos por brevedad (mantienen tu lógica intacta)...
  const handleAge = (v: string) => { setAge(v); setErrors(p => ({ ...p, age: validateAge(v) || "" })); };
  const handlePhone = (v: string) => { setPhone(v); setErrors(p => ({ ...p, phone: validatePhone(v) || "" })); };
  const handleAddress = (v: string) => { setAddress(v); setErrors(p => ({ ...p, address: validateText(v, "Dirección") || "" })); };
  const handleEmergency = (v: string) => { setEmergency(v); setErrors(p => ({ ...p, emergency: validateText(v, "Contacto emergencia") || "" })); };
  const handleGender = (v: string) => { setGender(v); setErrors(p => ({ ...p, gender: validateGender(v) || "" })); };
  const handleBloodType = (v: string) => { setBloodType(v); setErrors(p => ({ ...p, bloodType: validateBloodType(v) || "" })); };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };
  
  const handleSave = async () => {
    const validations = { age: validateAge(age), phone: validatePhone(phone), address: validateText(address, "Dirección"), emergency: validateText(emergency, "Contacto emergencia"), gender: validateGender(gender), bloodType: validateBloodType(bloodType) };
    setErrors({ age: validations.age || "", phone: validations.phone || "", address: validations.address || "", emergency: validations.emergency || "", gender: validations.gender || "", bloodType: validations.bloodType || "" });
    
    if (Object.values(validations).some(Boolean)) return Alert.alert("Error", "Corrige los campos marcados");
    
    try {
      const { data: { user } } = await Supabase.auth.getUser();
      if (!user) return Alert.alert("Error", "Usuario no autenticado");
      
      const updatedProfile = { ...profile, age: Number(age), phone, address, gender, bloodType, emergencyContact: emergency, photoUrl: photo, birthDate: birthDate ? birthDate.toISOString() : null, profileCompleted: true };
      updateProfile(updatedProfile);
      
      const { error } = await Supabase.from("users").update({ age: Number(age), phone, address, gender, blood_type: bloodType, emergency_contact: emergency, photo_url: photo, birth_date: birthDate?.toISOString() }).eq("user_id", user.id);
      if (error) return Alert.alert("Error Supabase", error.message);
      
      Alert.alert("Éxito", "Perfil actualizado");
      navigation.navigate("Profile");
    } catch (e) { Alert.alert("Error", "Ocurrió un error inesperado"); }
  };
  
  return (
    <CardProfile>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={sharedStyles.cardSection}>
          <TouchableOpacity style={sharedStyles.photoContainer} onPress={pickImage}>
            {photo ? <Image source={{ uri: photo }} style={sharedStyles.photo} /> : (
              <View style={[sharedStyles.emptyPhoto, { backgroundColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary }}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Información Personal */}
        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Información Personal</Text>
          <CustomInput value={firstName} onChange={setFirst_Name} placeholder="Nombre" />
          <CustomInput value={lastName} onChange={setLast_Name} placeholder="Apellido" />
          <CustomInput type="email" value={email} onChange={setEmail} placeholder="Correo" />
        </View>
        
        {/* Datos Generales */}
        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Datos Generales</Text>
          <CustomInput type="number" placeholder="Edad" value={age} onChange={handleAge} />
          {!!errors.age && <Text style={sharedStyles.error}>{errors.age}</Text>}
          <CustomInput type="number" placeholder="Teléfono" value={phone} onChange={handlePhone} />
          {!!errors.phone && <Text style={sharedStyles.error}>{errors.phone}</Text>}
          <CustomInput placeholder="Dirección" value={address} onChange={handleAddress} />
          {!!errors.address && <Text style={sharedStyles.error}>{errors.address}</Text>}
        </View>
        
        {/* Nacimiento */}
        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Fecha de nacimiento</Text>
          <TouchableOpacity style={[sharedStyles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: colors.textPrimary }}>{birthDate ? birthDate.toLocaleDateString() : "Seleccionar fecha"}</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={birthDate || new Date()} mode="date" onChange={handleBirthDateChange} />}
        </View>
        
        {/* Datos Médicos */}
        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Datos Médicos</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Género</Text>
          <View style={sharedStyles.optionWrap}>
            {GENDERS.map((item) => (
              <TouchableOpacity key={item} onPress={() => handleGender(item)} style={[sharedStyles.option, { borderColor: colors.border }, gender === item && { backgroundColor: colors.primary }]}>
                <Text style={[ { color: colors.textPrimary }, gender === item && { color: '#fff', fontWeight: 'bold' }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>Tipo de Sangre</Text>
          <TouchableOpacity style={[sharedStyles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setShowBloodTypes(!showBloodTypes)}>
            <Text style={{ color: colors.textPrimary }}>{bloodType || "Selecciona tipo de sangre"}</Text>
            <Text style={{ color: colors.textSecondary }}>{showBloodTypes ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          
          {showBloodTypes && (
            <View style={[sharedStyles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {BLOOD_TYPES.map((item) => (
                <TouchableOpacity key={item} style={[sharedStyles.dropdownItem, { borderBottomColor: colors.border }]} onPress={() => { handleBloodType(item); setShowBloodTypes(false); }}>
                  <Text style={[{ color: colors.textPrimary }, bloodType === item && { color: colors.primary, fontWeight: 'bold' }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <CustomInput type="number" placeholder="Contacto de emergencia" value={emergency} onChange={handleEmergency} />
          {!!errors.emergency && <Text style={sharedStyles.error}>{errors.emergency}</Text>}
        </View>
        
        <TouchableOpacity style={[sharedStyles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
          <Text style={sharedStyles.buttonText}>Guardar Perfil</Text>
        </TouchableOpacity>
      </ScrollView>
    </CardProfile>
  );
}