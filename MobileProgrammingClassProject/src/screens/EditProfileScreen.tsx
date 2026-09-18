import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomInput from "../components/CustomInput";
import { Supabase } from "../lib/Supabase";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { validatePhone, validateText, validateGender, validateBloodType, GENDERS, BLOOD_TYPES } from "../utils/validators/profileValidator";
import CardProfile, { useSharedStyles } from "../components/CardProfile";
import { uploadImage, uploadDocument } from "../services/storageService";
import * as DocumentPicker from "expo-document-picker";
import PhotoPicker from "../components/PhotoPicker";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateProfile as updateProfileRedux } from "../store/slices/userProfileSlice";

// Calcula la edad a partir de la fecha de nacimiento (año actual - año nacimiento,
// ajustando -1 si todavía no ha pasado el cumpleaños este año)
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

export default function EditProfileScreen({ navigation }: any) {
  const sharedStyles = useSharedStyles();
  const dispatch = useAppDispatch();

  const { colors } = useCaremapHealth();

  const profile = useAppSelector((state) => state.userProfile.data);

  const [showBloodTypes, setShowBloodTypes] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [gender, setGender] = useState(profile?.gender ?? "");
  const [bloodType, setBloodType] = useState(profile?.blood_type ?? "");
  const [emergency, setEmergency] = useState(profile?.emergency_contact ?? "");
  const [photo, setPhoto] = useState<string | null>(profile?.photo_url ?? null);
  const [birthDate, setBirthDate] = useState<Date | null>(profile?.birth_date ? new Date(profile.birth_date) : null);
  const [document, setDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({ phone: "", address: "", emergency: "", gender: "", bloodType: "" });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setEmail(profile.email ?? "");
      setPhone(profile.phone ?? "");
      setAddress(profile.address ?? "");
      setGender(profile.gender ?? "");
      setBloodType(profile.blood_type ?? "");
      setEmergency(profile.emergency_contact ?? "");
      setPhoto(profile.photo_url ?? null);
      setBirthDate(profile.birth_date ? new Date(profile.birth_date) : null);
    }
  }, [profile]);

  const handleBirthDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setBirthDate(selectedDate);
  };

  const handlePhone = (value: string) => { setPhone(value); setErrors((p) => ({ ...p, phone: validatePhone(value) || "" })); };
  const handleAddress = (value: string) => { setAddress(value); setErrors((p) => ({ ...p, address: validateText(value, "Dirección") || "" })); };
  const handleEmergency = (value: string) => { setEmergency(value); setErrors((p) => ({ ...p, emergency: validateText(value, "Contacto de emergencia") || "" })); };
  const handleGender = (value: string) => { setGender(value); setErrors((p) => ({ ...p, gender: validateGender(value) || "" })); };
  const handleBloodType = (value: string) => { setBloodType(value); setErrors((p) => ({ ...p, bloodType: validateBloodType(value) || "" })); };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) setDocument(result.assets[0]);
  };

  const handleSave = async () => {
    if (!birthDate) {
      return Alert.alert("Error", "Selecciona tu fecha de nacimiento");
    }

    const validations = {
      phone: validatePhone(phone),
      address: validateText(address, "Dirección"),
      emergency: validateText(emergency, "Contacto de emergencia"),
      gender: validateGender(gender),
      bloodType: validateBloodType(bloodType),
    };

    setErrors({ phone: validations.phone || "", address: validations.address || "", emergency: validations.emergency || "", gender: validations.gender || "", bloodType: validations.bloodType || "" });
    if (Object.values(validations).some(Boolean)) return Alert.alert("Error", "Corrige los campos marcados");

    try {
      setLoading(true);
      const { data: { user } } = await Supabase.auth.getUser();
      if (!user) return Alert.alert("Error", "Usuario no autenticado");

      let imageUrl = profile?.photo_url || null;

      if (photo?.startsWith("file")) {
        imageUrl = await uploadImage(user.id, photo);
      }

      let documentUrl: string | null = profile?.birth_certificate_url || null;
      if (document) {
        const result = await uploadDocument(user.id, document);
        documentUrl = result ?? null;
      }

      // La edad ya no la escribe el usuario: se calcula aquí mismo a partir de birthDate
      const age = calculateAge(birthDate);

      dispatch(
        updateProfileRedux({
          first_name: firstName,
          last_name: lastName,
          email,
          age,
          phone,
          address,
          gender,
          blood_type: bloodType,
          emergency_contact: emergency,
          photo_url: imageUrl,
          birth_date: birthDate.toISOString(),
          birth_certificate_url: documentUrl,
          profile_completed: true,
        })
      );

      // Guardamos en la Base de Datos con los nombres de columna de Postgres (snake_case)
      const { error } = await Supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
          age,
          phone,
          address,
          gender,
          blood_type: bloodType,
          emergency_contact: emergency,
          photo_url: imageUrl,
          birth_date: birthDate.toISOString(),
          birth_certificate_url: documentUrl,
          profile_completed: true,
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
          <PhotoPicker value={photo} onChange={setPhoto} variant="profile" />
        </View>

        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Información Personal</Text>
          <CustomInput value={firstName} onChange={setFirstName} placeholder="Nombre" />
          <CustomInput value={lastName} onChange={setLastName} placeholder="Apellido" />
          <CustomInput type="email" value={email} onChange={setEmail} placeholder="Correo" />
        </View>

        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Datos Generales</Text>
          <CustomInput type="number" placeholder="Teléfono" value={phone} onChange={handlePhone} />
          {!!errors.phone && <Text style={sharedStyles.error}>{errors.phone}</Text>}
          <CustomInput placeholder="Dirección" value={address} onChange={handleAddress} />
          {!!errors.address && <Text style={sharedStyles.error}>{errors.address}</Text>}
        </View>

        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Fecha de nacimiento</Text>
          <TouchableOpacity style={[sharedStyles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: colors.textPrimary }}>{birthDate ? birthDate.toLocaleDateString() : "Seleccionar fecha"}</Text>
          </TouchableOpacity>
          {showDatePicker && <DateTimePicker value={birthDate || new Date()} mode="date" onChange={handleBirthDateChange} maximumDate={new Date()} />}

          {birthDate && (
            <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
              Edad: {calculateAge(birthDate)} años
            </Text>
          )}
        </View>

        <View style={sharedStyles.cardSection}>
          <Text style={[sharedStyles.sectionTitle, { color: colors.textPrimary }]}>Datos Médicos</Text>
          <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>Género</Text>
          <View style={sharedStyles.optionWrap}>
            {GENDERS.map((item) => (
              <TouchableOpacity key={item} onPress={() => handleGender(item)} style={[sharedStyles.option, { borderColor: colors.border }, gender === item && { backgroundColor: colors.primary }]}>
                <Text style={[{ color: colors.textPrimary }, gender === item && { color: "#fff", fontWeight: "bold" }]}>{item}</Text>
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
                  <Text style={[{ color: colors.textPrimary }, bloodType === item && { color: colors.primary, fontWeight: "bold" }]}>{item}</Text>
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
              {document?.name ? "Documento seleccionado / existente" : "Seleccionar Certificado"}
            </Text>
          </TouchableOpacity>

          {document && <Text style={{ marginTop: 5, color: colors.textPrimary }}>📄 Nuevo: {document.name}</Text>}
        </View>

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