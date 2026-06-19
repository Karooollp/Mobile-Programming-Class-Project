import { useState } from "react";
import {
  Alert,
  Text,
  View,
  StyleSheet,
} from "react-native";

import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";

import { Supabase } from "../lib/Supabase";

import {
  validateText,
  validateEmail,
  validatePassword,
} from "../utils/validators/profileValidator";
import {useAppDispatch} from "../store/hooks";
import { setProfile } from "../store/slices/userProfileSlice";



export default function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();

  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  
  const handleFirstName = (value: string) => {
    setFirstName(value);
    setErrors((prev) => ({
      ...prev,
      firstName: validateText(value, "Nombre") || "",
    }));
  };
  
  const handleLastName = (value: string) => {
    setLastName(value);
    setErrors((prev) => ({
      ...prev,
      lastName: validateText(value, "Apellido") || "",
    }));
  };
  
  // Al escribir el correo, limpiamos su error visual y no se valida
  const handleEmail = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email: "",
    }));
  };
  
  const handlePassword = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(value) || "",
    }));
  };
  
  const handleRegister = async () => {
    
    // Se valida que ningun campo obligatorio se encuentre vacio
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      return Alert.alert(
        "Campos Obligatorios",
        "Por favor, llena todos los campos marcados con (*). La foto es opcional."
      );
    }

    // Ejecutamos todas las validaciones al presionar el botón
    const emailValidationError = validateEmail(email);
    const validations = {
      firstName: validateText(firstName, "Nombre"),
      lastName: validateText(lastName, "Apellido"),
      email: emailValidationError,
      password: validatePassword(password),
    };
    
    // Si el correo está incompleto o no cumple con el formato tiramos el popup
    if (!email.includes("@") || emailValidationError) {
      return Alert.alert(
        "Error de Correo",
        "El correo electrónico no está completo o es inválido."
      );
    }
    
    // Para los demás campos, se marcan en la pantalla de forma normal
    setErrors({
      firstName: validations.firstName || "",
      lastName: validations.lastName || "",
      email: "", // No pintamos error de texto aquí porque ya saltó el popup
      password: validations.password || "",
    });
    
    const hasErrors = Object.values(validations).some(Boolean);
    
    if (hasErrors) {
      return Alert.alert(
        "Error",
        "Corrige los campos marcados"
      );
    }
    
    try {
      const { data, error } = await Supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      
      const userId = data.user?.id;
      
      if (userId) {
        const { error: profileError } = await Supabase
          .from("users")
          .insert([
            {
              user_id: userId,
              first_name: firstName,
              last_name: lastName,
              email: email,
              status: "active",
            },
          ]);
        
        if (profileError) {
          Alert.alert("Error perfil", profileError.message);
          return;
        }
        
        // 🔥 AQUÍ VA REDUX (REEMPLAZA EL CONTEXT)
        dispatch(
          setProfile({
            user_id: userId,
            first_Name: firstName,
            last_Name: lastName,
            email,
            status: "active",
            profileCompleted: false,
          })
        );
      }
      
      Alert.alert(
        "Éxito",
        "Usuario registrado correctamente"
      );
      
      navigation.navigate("EditProfile");
      
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };
  
  return (
    <LoginAndRegisterCard>
      
      <Text style={styles.title}>
        Primera App Móvil de Misap
      </Text>
      
      <CustomInput
        type="text"
        placeholder="Ingresa tu nombre *"
        value={firstName}
        onChange={handleFirstName}
      />
      
      {errors.firstName ? (
        <Text style={styles.error}>
          {errors.firstName}
        </Text>
      ) : null}
      
      <CustomInput
        type="text"
        placeholder="Ingresa tu apellido *"
        value={lastName}
        onChange={handleLastName}
      />
      
      {errors.lastName ? (
        <Text style={styles.error}>
          {errors.lastName}
        </Text>
      ) : null}
      
      <CustomInput
        type="email"
        placeholder="correo@gmail.com *"
        value={email}
        onChange={handleEmail}
      />
      
      {/* El error visual del email se quitó de aquí para que nunca ensucie el diseño abajo del input */}
      
      <CustomInput
        type="password"
        placeholder="Ingresa tu contraseña *"
        value={password}
        onChange={handlePassword}
      />
      
      {errors.password ? (
        <Text style={styles.error}>
          {errors.password}
        </Text>
      ) : null}
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Registrarse"
          onPress={handleRegister}
        />
      </View>
    
    </LoginAndRegisterCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 6,
    marginLeft: 4,
  },
  buttonContainer: {
    marginTop: 12,
    width: "100%",
    alignItems: "center",
  },
});