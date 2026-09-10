import { useState } from "react";
import { Alert, Text, View, StyleSheet } from "react-native";

import CustomButton from "../components/CustomButton";
import CustomInput from "../components/CustomInput";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";

import { Supabase } from "../lib/Supabase";

import {
  validateText,
  validateEmail,
  validatePassword,
} from "../utils/validators/profileValidator";

import { useAppDispatch } from "../store/hooks";
import { setProfile } from "../store/slices/userProfileSlice";

import * as WebBrowser from "expo-web-browser";

import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();

  const { colors } = useCaremapHealth();

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

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      return Alert.alert("Campos obligatorios", "Completa todos los campos");
    }

    const emailError = validateEmail(email);

    const validations = {
      firstName: validateText(firstName, "Nombre"),
      lastName: validateText(lastName, "Apellido"),
      email: emailError,
      password: validatePassword(password),
    };

    if (emailError) {
      return Alert.alert("Error", "Correo inválido");
    }

    setErrors({
      firstName: validations.firstName || "",
      lastName: validations.lastName || "",
      email: "",
      password: validations.password || "",
    });

    if (Object.values(validations).some(Boolean)) {
      return Alert.alert("Error", "Corrige los campos");
    }

    const { data, error } = await Supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return Alert.alert("Error", error.message);
    }

    const userId = data.user?.id;

    if (!userId) return;

    const { error: profileError } = await Supabase
      .from("users")
      .insert([
        {
          user_id: userId,
          first_Name: firstName,
          last_Name: lastName,
          email,
          status: "active",
        },
      ]);

    if (profileError) {
      return Alert.alert("Error perfil", profileError.message);
    }

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

    Alert.alert("Éxito", "Usuario registrado correctamente");
    navigation.navigate("EditProfile");
  };

  const handleGoogleRegister = async () => {
    const redirectUrl = "com.misap.caremaphealth://auth/callback";

    const { data, error } = await Supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) return Alert.alert("Error", error.message);

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl
    );

    if (result.type !== "success") return;

    const params = new URLSearchParams(result.url.split("#")[1]);

    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      return Alert.alert("Error", "No se pudo obtener sesión");
    }

    const { data: sessionData, error: sessionError } =
      await Supabase.auth.setSession({
        access_token,
        refresh_token,
      });

    if (sessionError) {
      return Alert.alert("Error", sessionError.message);
    }

    const user = sessionData.user;

    if (!user) return;

    const fullName = user.user_metadata?.full_name || "";
    const first = fullName.split(" ")[0] || "";
    const last = fullName.split(" ")[1] || "";

    const { error: profileError } = await Supabase
      .from("users")
      .upsert([
        {
          user_id: user.id,
          first_Name: first,
          last_Name: last,
          email: user.email,
          status: "active",
        },
      ]);

    if (profileError) {
      return Alert.alert("Error perfil", profileError.message);
    }

    dispatch(
      setProfile({
        user_id: user.id,
        first_Name: first,
        last_Name: last,
        email: user.email || "",
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

      <CustomInput
        type="text"
        placeholder="Nombre *"
        value={firstName}
        onChange={setFirstName}
      />

      {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

      <CustomInput
        type="text"
        placeholder="Apellido *"
        value={lastName}
        onChange={setLastName}
      />

      {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

      <CustomInput
        type="email"
        placeholder="Correo *"
        value={email}
        onChange={setEmail}
      />

      <CustomInput
        type="password"
        placeholder="Contraseña *"
        value={password}
        onChange={setPassword}
      />

      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <View style={styles.buttonContainer}>
        <CustomButton title="Registrarse" onPress={handleRegister} />
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Continuar con Google"
          variant="primary"
          onPress={handleGoogleRegister}
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