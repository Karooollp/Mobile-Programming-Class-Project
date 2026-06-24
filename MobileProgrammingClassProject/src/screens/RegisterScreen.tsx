import { useState } from "react";
import { Alert, Text, View, StyleSheet } from "react-native";
import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import { Supabase } from "../lib/Supabase";
<<<<<<< HEAD
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";
import { validateText, validateEmail, validatePassword } from "../utils/validators/profileValidator";

export default function RegisterScreen({ navigation }: any) {
  const { updateProfile, colors } = useCaremapHealth();
=======

import {
  validateText,
  validateEmail,
  validatePassword,
} from "../utils/validators/profileValidator";
import {useAppDispatch} from "../store/hooks";
import { setProfile } from "../store/slices/userProfileSlice";
import * as WebBrowser from "expo-web-browser";

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();

>>>>>>> 500988452e3295387db84be8df0c74797b5e2906
  
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
    setErrors((prev) => ({ ...prev, firstName: validateText(value, "Nombre") || "" }));
  };
  
  const handleLastName = (value: string) => {
    setLastName(value);
    setErrors((prev) => ({ ...prev, lastName: validateText(value, "Apellido") || "" }));
  };
  
  const handleEmail = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: "" }));
  };
  
  const handlePassword = (value: string) => {
    setPassword(value);
    setErrors((prev) => ({ ...prev, password: validatePassword(value) || "" }));
  };
  
  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      return Alert.alert("Campos Obligatorios", "Por favor, llena todos los campos.");
    }

    const emailValidationError = validateEmail(email);
    const validations = {
      firstName: validateText(firstName, "Nombre"),
      lastName: validateText(lastName, "Apellido"),
      email: emailValidationError,
      password: validatePassword(password),
    };
    
    if (!email.includes("@") || emailValidationError) {
      return Alert.alert("Error de Correo", "El correo electrónico es inválido.");
    }
    
    setErrors({
      firstName: validations.firstName || "",
      lastName: validations.lastName || "",
      email: "", 
      password: validations.password || "",
    });
    
    const hasErrors = Object.values(validations).some(Boolean);
    if (hasErrors) return Alert.alert("Error", "Corrige los campos marcados");
    
    try {
<<<<<<< HEAD
      const { data, error } = await Supabase.auth.signUp({ email, password });
      if (error) return Alert.alert("Error", error.message);
      
=======
      const { data, error } = await Supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
>>>>>>> 500988452e3295387db84be8df0c74797b5e2906
      const userId = data.user?.id;
      if (userId) {
        const { error: profileError } = await Supabase
          .from("users")
          .insert([{ user_id: userId, first_name: firstName, last_name: lastName, email: email, status: "active" }]);
        
<<<<<<< HEAD
        if (profileError) return Alert.alert("Error perfil", profileError.message);
        
        updateProfile({ user_id: userId, first_Name: firstName, last_Name: lastName, email, status: "active", profileCompleted: false });
=======
        if (profileError) {
          Alert.alert("Error perfil", profileError.message);
          return;
        }
        // REDUX (REEMPLAZA EL CONTEXT)
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
>>>>>>> 500988452e3295387db84be8df0c74797b5e2906
      }
      
      Alert.alert("Éxito", "Usuario registrado correctamente");
      navigation.navigate("EditProfile");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Ocurrió un error inesperado");
    }
  };
  
  
  const handleGoogleRegister = async () => {
    const redirectUrl = "com.misap.caremaphealth://auth/callback";
    
    const { data, error } = await Supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    
    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );
    
    if (result.type !== "success") return;
    
    const params = new URLSearchParams(result.url.split("#")[1]);
    
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    
    if (!access_token || !refresh_token) {
      Alert.alert("Error", "No se pudo obtener la sesión");
      return;
    }
    
    const { data: sessionData, error: sessionError } =
      await Supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    
    if (sessionError) {
      Alert.alert("Error", sessionError.message);
      return;
    }
    
    const user = sessionData.user;
    
    if (!user) {
      Alert.alert("Error", "No se obtuvo el usuario");
      return;
    }
    
    // EXTRAER DATOS DE GOOGLE
    const fullName = user.user_metadata?.full_name || "";
    const firstName = fullName.split(" ")[0] || "";
    const lastName = fullName.split(" ")[1] || "";
    const email = user.email || "";
    
    // 🗄️ GUARDAR EN BD (igual que register normal)
    const { error: profileError } = await Supabase
      .from("users")
      .upsert([
        {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          status: "active",
        },
      ]);
    
    if (profileError) {
      Alert.alert("Error perfil", profileError.message);
      return;
    }
    
    // REDUX PROFILE (MISMO FLUJO QUE REGISTER NORMAL)
    dispatch(
      setProfile({
        user_id: user.id,
        first_Name: firstName,
        last_Name: lastName,
        email,
        status: "active",
        profileCompleted: false,
      })
    );
    
    Alert.alert("Éxito", "Usuario registrado correctamente");
    
    navigation.navigate("EditProfile");
  };
  
  return (
    <LoginAndRegisterCard>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Primera App Móvil de Misap
      </Text>
      
      <CustomInput type="text" placeholder="Ingresa tu nombre *" value={firstName} onChange={handleFirstName} />
      {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}
      
      <CustomInput type="text" placeholder="Ingresa tu apellido *" value={lastName} onChange={handleLastName} />
      {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}
      
      <CustomInput type="email" placeholder="correo@gmail.com *" value={email} onChange={handleEmail} />
      
      <CustomInput type="password" placeholder="Ingresa tu contraseña *" value={password} onChange={handlePassword} />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}
      
      <View style={styles.buttonContainer}>
        <CustomButton title="Registrarse" onPress={handleRegister} />
      </View>
<<<<<<< HEAD
=======
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title={"Continuar con Google"}
          variant="primary"
          onPress={handleGoogleRegister}
        />
      </View>
      
>>>>>>> 500988452e3295387db84be8df0c74797b5e2906
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