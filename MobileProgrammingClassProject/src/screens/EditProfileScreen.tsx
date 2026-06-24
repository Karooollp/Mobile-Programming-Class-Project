import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomInput from "../components/CustomInput";
import { Supabase } from "../lib/Supabase";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts"; // 🌙 Mantenemos tu contexto para los colores limpios

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

// 📦 Lógica de Redux traída de main
import { updateProfile } from "../store/slices/userProfileSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
  uploadImage,
  uploadDocument,
} from "../services/storageService";

import * as DocumentPicker from "expo-document-picker";
import CustomButton from "../components/CustomButton";
import PhotoPicker from "../components/PhotoPicker";

export default function EditProfileScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { colors } = useCaremapHealth(); // 🎨 Tus colores dinámicos listos para brillar
  
  // Redux como única fuente de verdad para los datos
  const profile = useAppSelector((state) => state.userProfile.data);

  const [showBloodTypes, setShowBloodTypes] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textPrimary, marginTop: 10 }}>Cargando perfil...</Text>
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
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  
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
    setBirthDate(profile.birthDate ? new Date(profile.birthDate) : null);
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
    setErrors((p) => ({ ...p, emergency: validateText(value, "Contacto emergencia") || "" }));
  };
  
  const handleGender = (value: string) => {
    setGender(value);
    setErrors((p) => ({ ...p, gender: validateGender(value) || "" }));
  };
  
  const handleBloodType = (value: string) => {
    setBloodType(value);
    setErrors((p) => ({ ...p, bloodType: validateBloodType(value) || "" }));
  };
  
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    
    if (!result.canceled) {
      setDocument(result.assets[0]);
    }
  };
  
  const handleSave = async () => {
    const validations = { 
      age: validateAge(age), 
      phone: validatePhone(phone), 
      address: validateText(address, "Dirección"), 
      emergency: validateText(emergency, "Contacto emergencia"), 
      gender: validateGender(gender), 
      bloodType: validateBloodType(bloodType) 
    };

    setErrors({ 
      age: validations.age || "", 
      phone: validations.phone || "", 
      address: validations.address || "", 
      emergency: validations.emergency || "", 
      gender: validations.gender || "", 
      bloodType: validations.bloodType || "" 
    });
    
    if (Object.values(validations).some(Boolean)) {
      return Alert.alert("Error", "Corrige los campos marcados");
    }
    
    try {
      setLoading(true);
      
      const { data: { user } } = await Supabase.auth.getUser();
      if (!user) return Alert.alert("Error", "Usuario no autenticado");
      
      let imageUrl = profile.photoUrl;
      let documentUrl = profile.birthCertificateUrl;
      
      if (photo?.startsWith("file")) {
        imageUrl = await uploadImage(user.id, photo);
      }
      
      if (document) {
        documentUrl = await uploadDocument(user.id, document);
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
        photoUrl: imageUrl,
        birthCertificateUrl: documentUrl,
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
          photo_url: imageUrl,
          birth_certificate_url: documentUrl,
          birth_date: birthDate?.toISOString(),
        })
        .eq("user_id", user.id);
      
      if (error) return Alert.alert("Error Supabase", error.message);
      
      Alert.alert("Éxito", "Perfil actualizado con éxito 7u7");
      navigation.navigate("Profile");
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CardProfile>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={sharedStyles.cardSection}>
          <PhotoPicker
            value={photo}
            onChange={setPhoto}
            variant="profile"
          />
        </View>
        
        {/* Información Personal */}
        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Información Personal</Text>
          <CustomInput value={firstName} onChange={setFirstName} placeholder="Nombre" />
          <CustomInput value={lastName} onChange={setLastName} placeholder="Apellido" />
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
                <Text style={[{ color: colors.textPrimary }, gender === item && { color: '#fff', fontWeight: 'bold' }]}>{item}</Text>
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
          
          <Text style={[sharedStyles.label, { color: colors.textSecondary, marginTop: 14 }]}>Contacto de Emergencia</Text>
          <CustomInput type="number" placeholder="Contacto de emergencia" value={emergency} onChange={handleEmergency} />
          {!!errors.emergency && <Text style={sharedStyles.error}>{errors.emergency}</Text>}
          
          <Text style={[sharedStyles.label, { color: colors.textSecondary, marginTop: 14 }]}>Certificado médico</Text>
          <TouchableOpacity style={[sharedStyles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={pickDocument}>
            <Text style={{ color: colors.textPrimary }}>
              {document?.name || profile.birthCertificateUrl
                ? "Documento seleccionado / existente"
                : "Seleccionar Certificado"}
            </Text>
          </TouchableOpacity>
          
          {document && (
            <Text style={{ marginTop: 5, color: colors.textPrimary }}>
              📄 Nuevo: {document.name}
            </Text>
          )}
          
          {!document && profile.birthCertificateUrl && (
            <TouchableOpacity onPress={() => profile.birthCertificateUrl && Linking.openURL(profile.birthCertificateUrl)}>
              <Text style={{ color: colors.primary, marginTop: 5, fontWeight: "500" }}>
                📎 Ver documento actual
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* BOTÓN DE GUARDADO CON LOADER */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={[sharedStyles.button, { backgroundColor: colors.primary }]} onPress={handleSave}>
            <Text style={sharedStyles.buttonText}>Guardar Perfil</Text>
          </TouchableOpacity>
        )}
      
      </ScrollView>
    </CardProfile>
  );
}