import React, {useEffect, useState} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

import CustomInput from "../components/CustomInput";
import { Supabase } from "../lib/Supabase";

import {
  validateAge,
  validatePhone,
  validateText,
  validateGender,
  validateBloodType,
  GENDERS,
  BLOOD_TYPES,
} from "../utils/validators/profileValidator";

import CardProfile, { sharedStyles } from "../components/CardProfile";

import { updateProfile } from "../store/slices/userProfileSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";




export default function EditProfileScreen({navigation}:any) {
  
  const dispatch = useAppDispatch();
  
  // 🔥 Redux source of truth
  const profile = useAppSelector((state) => state.userProfile.data);

  
  const [showBloodTypes, setShowBloodTypes] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }
  
  const [firstName, setFirstName] = useState(profile.first_Name ?? "");
  const [lastName, setLastName] = useState(profile.last_Name ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  
  const [age, setAge] = useState(profile.age?.toString() ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [gender, setGender] = useState(profile.gender ?? "");
  const [bloodType, setBloodType] = useState(profile.bloodType ?? "");
  const [emergency, setEmergency] = useState(profile.emergencyContact ?? "");
  const [photo, setPhoto] = useState(profile.photoUrl ?? null);
  const [birthDate, setBirthDate] = useState<Date | null>(
    profile.birthDate ? new Date(profile.birthDate) : null
  );
  
  useEffect(() => {
    if (!profile) return;
    
    setFirstName(profile.first_Name ?? "");
    setLastName(profile.last_Name ?? "");
    setEmail(profile.email ?? "");
    
    setAge(profile.age?.toString() ?? "");
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setGender(profile.gender ?? "");
    setBloodType(profile.bloodType ?? "");
    setEmergency(profile.emergencyContact ?? "");
    setPhoto(profile.photoUrl ?? null);
    
    setBirthDate(
      profile.birthDate ? new Date(profile.birthDate) : null
    );
  }, [profile]);
  
  
  
  
  const [errors, setErrors] = useState({
    age: "",
    phone: "",
    address: "",
    emergency: "",
    gender: "",
    bloodType: "",
  });
  
  const handleBirthDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };
  
  const handleAge = (value: string) => {
    setAge(value);
    setErrors((p) => ({ ...p, age: validateAge(value) || "" }));
  };
  
  const handlePhone = (value: string) => {
    setPhone(value);
    setErrors((p) => ({ ...p, phone: validatePhone(value) || "" }));
  };
  
  const handleAddress = (value: string) => {
    setAddress(value);
    setErrors((p) => ({ ...p, address: validateText(value, "Dirección") || "" }));
  };
  
  const handleEmergency = (value: string) => {
    setEmergency(value);
    setErrors((p) => ({
      ...p,
      emergency: validateText(value, "Contacto emergencia") || "",
    }));
  };
  
  const handleGender = (value: string) => {
    setGender(value);
    setErrors((p) => ({ ...p, gender: validateGender(value) || "" }));
  };
  
  const handleBloodType = (value: string) => {
    setBloodType(value);
    setErrors((p) => ({ ...p, bloodType: validateBloodType(value) || "" }));
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };
  
  const handleSave = async () => {
    const validations = {
      age: validateAge(age),
      phone: validatePhone(phone),
      address: validateText(address, "Dirección"),
      emergency: validateText(emergency, "Contacto emergencia"),
      gender: validateGender(gender),
      bloodType: validateBloodType(bloodType),
    };
    
    setErrors({
      age: validations.age || "",
      phone: validations.phone || "",
      address: validations.address || "",
      emergency: validations.emergency || "",
      gender: validations.gender || "",
      bloodType: validations.bloodType || "",
    });
    
    const hasErrors = Object.values(validations).some(Boolean);
    
    if (hasErrors) {
      return Alert.alert("Error", "Corrige los campos marcados");
    }
    
    try {
      const {
        data: { user },
      } = await Supabase.auth.getUser();
      
      if (!user) {
        return Alert.alert("Error", "Usuario no autenticado");
      }
      
      const updatedProfile = {
        ...profile,
        first_Name: firstName,
        last_Name: lastName,
        email,
        
        age: Number(age),
        phone,
        address,
        gender,
        bloodType,
        emergencyContact: emergency,
        photoUrl: photo,
        birthDate: birthDate ? birthDate.toISOString() : null,
        
        profileCompleted: true,
      };
      
      dispatch(updateProfile(updatedProfile));
      
      const { error } = await Supabase
        .from("users")
        .update({
          age: Number(age),
          phone,
          address,
          gender,
          blood_type: bloodType,
          emergency_contact: emergency,
          photo_url: photo,
          birth_date: birthDate?.toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) {
        return Alert.alert("Error Supabase", error.message);
      }
      
      Alert.alert("Éxito", "Perfil actualizado");
      navigation.navigate("Profile");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };
  
  return (
    <CardProfile>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* FOTO */}
        <View style={sharedStyles.cardSection}>
          <TouchableOpacity
            style={sharedStyles.photoContainer}
            onPress={pickImage}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={sharedStyles.photo} />
            ) : (
              <View style={sharedStyles.emptyPhoto}>
                <Text style={sharedStyles.photoText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* ===== SECCIÓN 1 ===== */}
        <View style={sharedStyles.cardSection}>
          <Text style={sharedStyles.sectionTitle}>Información Personal</Text>
          
          <CustomInput value={firstName} onChange={setFirstName} placeholder="Nombre" />
          <CustomInput value={lastName} onChange={setLastName} placeholder="Apellido" />
          <CustomInput type="email" value={email} onChange={setEmail} placeholder="Correo" />
        </View>
        
        {/* ===== SECCIÓN 2 ===== */}
        <View style={sharedStyles.cardSection}>
          <Text style={sharedStyles.sectionTitle}>Datos Generales</Text>
          
          <CustomInput type="number" placeholder="Edad" value={age} onChange={handleAge} />
          {!!errors.age && <Text style={sharedStyles.error}>{errors.age}</Text>}
          
          <CustomInput type="number" placeholder="Teléfono" value={phone} onChange={handlePhone} />
          {!!errors.phone && <Text style={sharedStyles.error}>{errors.phone}</Text>}
          
          <CustomInput placeholder="Dirección" value={address} onChange={handleAddress} />
          {!!errors.address && <Text style={sharedStyles.error}>{errors.address}</Text>}
        </View>
        
        {/* ===== FECHA ===== */}
        <View style={sharedStyles.cardSection}>
          <Text style={sharedStyles.sectionTitle}>Fecha de nacimiento</Text>
          
          <TouchableOpacity
            style={sharedStyles.inputBox}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>
              {birthDate ? birthDate.toLocaleDateString() : "Seleccionar fecha"}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={birthDate || new Date()}
              mode="date"
              onChange={handleBirthDateChange}
            />
          )}
        </View>
        
        {/* ===== SECCIÓN 3 ===== */}
        <View style={sharedStyles.cardSection}>
          <Text style={sharedStyles.sectionTitle}>Datos Médicos</Text>
          
          <Text style={sharedStyles.label}>Género</Text>
          
          <View style={sharedStyles.optionWrap}>
            {GENDERS.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => handleGender(item)}
                style={[
                  sharedStyles.option,
                  gender === item && sharedStyles.optionActive,
                ]}
              >
                <Text
                  style={[
                    sharedStyles.optionText,
                    gender === item && sharedStyles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {!!errors.gender && (
            <Text style={sharedStyles.error}>{errors.gender}</Text>
          )}
          
          <Text style={sharedStyles.label}>Tipo de Sangre</Text>
          
          <TouchableOpacity
            style={sharedStyles.dropdownButton}
            onPress={() => setShowBloodTypes(!showBloodTypes)}
          >
            <Text style={sharedStyles.dropdownText}>
              {bloodType || "Selecciona tipo de sangre"}
            </Text>
            <Text style={sharedStyles.arrow}>{showBloodTypes ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          
          {showBloodTypes && (
            <View style={sharedStyles.dropdownList}>
              {BLOOD_TYPES.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    sharedStyles.dropdownItem,
                    index !== BLOOD_TYPES.length - 1 &&
                    sharedStyles.dropdownItemBorder,
                  ]}
                  onPress={() => {
                    handleBloodType(item);
                    setShowBloodTypes(false);
                  }}
                >
                  <Text
                    style={[
                      sharedStyles.dropdownItemText,
                      bloodType === item && sharedStyles.selectedDropdownText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <CustomInput
            type="number"
            placeholder="Contacto de emergencia"
            value={emergency}
            onChange={handleEmergency}
          />
          
          {!!errors.emergency && (
            <Text style={sharedStyles.error}>{errors.emergency}</Text>
          )}
        </View>
        
        {/* BOTÓN */}
        <TouchableOpacity
          style={sharedStyles.button}
          onPress={handleSave}
        >
          <Text style={sharedStyles.buttonText}>Guardar Perfil</Text>
        </TouchableOpacity>
      
      </ScrollView>
    </CardProfile>
 
  );
}