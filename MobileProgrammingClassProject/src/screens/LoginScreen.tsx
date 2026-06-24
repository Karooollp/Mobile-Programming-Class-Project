import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Supabase } from "../lib/Supabase";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import * as WebBrowser from "expo-web-browser";
import { fetchUserProfile } from "../services/profileService";

// ✅ Contexto en lugar de Redux
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

export function LoginScreen({ navigation }: any) {
  const { updateProfile, colors } = useCaremapHealth();

  const [email, setEmail] = useState("");
  const [password, setPasword] = useState("");

  const handleLogin = async () => {
    try {
      const { data, error } = await Supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return Alert.alert("Error", error.message);

      const user = data.user;
      if (!user) return Alert.alert("Error", "No se obtuvo el usuario");

      const profile = await fetchUserProfile(user.id);
      if (!profile) return Alert.alert("Error", "No se pudo cargar el perfil");

      // ✅ Actualiza el contexto en lugar de Redux
      updateProfile(profile);
      navigation.replace("UserTabs");
    } catch (error) {
      console.log(error);
    }
  };

  const handleGoogleLogin = async () => {
    const redirectUrl = "com.misap.caremaphealth://auth/callback";

    const { data, error } = await Supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) return Alert.alert("Error", error.message);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === "success" && result.url) {
      const params = new URLSearchParams(result.url.split("#")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        return Alert.alert("Error", "No se pudo obtener la sesión de Google");
      }

      const { data: sessionData, error: sessionError } = await Supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) return Alert.alert("Error", sessionError.message);

      const user = sessionData.user;
      if (!user) return Alert.alert("Error", "No se obtuvo el usuario");

      const profile = await fetchUserProfile(user.id);
      if (!profile) return Alert.alert("Error", "No se pudo cargar el perfil");

      // ✅ Actualiza el contexto en lugar de Redux
      updateProfile(profile);
      navigation.replace("UserTabs");
    }
  };

  return (
    <LoginAndRegisterCard>
      <CustomInput
        type="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={setEmail}
      />

      <CustomInput
        type="password"
        placeholder="Ingresa tu contraseña"
        value={password}
        onChange={setPasword}
      />

      <View style={{ marginTop: 10, width: "100%", alignItems: "center" }}>
        <CustomButton title="INICIAR SESIÓN" onPress={handleLogin} />
      </View>

      <View style={{ marginTop: 10, width: "100%", alignItems: "center" }}>
        <CustomButton title="CONTINUAR CON GOOGLE" onPress={handleGoogleLogin} />
      </View>

      <View style={{ marginTop: 20, width: "100%", alignItems: "center", gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No tiene cuenta, Cree una ahora
        </Text>
        <CustomButton
          title="Ir a registrarme"
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </LoginAndRegisterCard>
  );
}