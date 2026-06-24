import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Supabase } from "../lib/Supabase";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import * as WebBrowser from "expo-web-browser";

// 📦 Redux
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setUser } from "../store/slices/AuthSlices";
import { setProfile } from "../store/slices/userProfileSlice";
import { fetchUserProfile } from "../services/profileService";

export function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  
  // 🎨 Obtenemos los colores usando Redux de forma segura
  const theme = useAppSelector((state: any) => state.theme || state.userProfile?.theme);
  const colors = theme?.colors || { textSecondary: "#64748B" };

  const [email, setEmail] = useState('');
  const [password, setPasword] = useState('');

  const handleLogin = async () => {
    try {
      const { data, error } = await Supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      const user = data.user;
      if (!user) {
        Alert.alert("Error", "No se obtuvo el usuario");
        return;
      }

      dispatch(setUser(user));

      // SIEMPRE RECARGAR PERFIL COMPLETO
      const profile = await fetchUserProfile(user.id);
      if (!profile) {
        Alert.alert("Error", "No se pudo cargar el perfil");
        return;
      }

      dispatch(setProfile(profile));
      navigation.replace("UserTabs");
    } catch (error) {
      console.log(error);
    }
  };

  const handleGoogleLogin = async () => {
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

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === "success" && result.url) {
      const params = new URLSearchParams(result.url.split("#")[1]);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (access_token && refresh_token) {
        const { data: sessionData, error: sessionError } = await Supabase.auth.setSession({
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

        dispatch(setUser(user));

        const profile = await fetchUserProfile(user.id);
        if (!profile) {
          Alert.alert("Error", "No se pudo cargar el perfil");
          return;
        }

        dispatch(setProfile(profile));
        navigation.replace("UserTabs");
      } else {
        Alert.alert("Error", "No se pudo obtener la sesión de Google");
      }
    }
  };

  return (
    <LoginAndRegisterCard>
      <CustomInput
        type="email"
        placeholder={"Ingresa tu correo"}
        value={email}
        onChange={setEmail}
      />

      <CustomInput
        type={"password"}
        placeholder={"Ingresaa tu contraseña"}
        value={password}
        onChange={setPasword}
      />

      <View style={{ marginTop: 10, width: '100%', alignItems: 'center' }}>
        <CustomButton title={"INICIAR SESIÓN"} onPress={handleLogin} />
      </View>

      <View style={{ marginTop: 10, width: '100%', alignItems: 'center' }}>
        <CustomButton title={"CONTINUAR CON GOOGLE"} onPress={handleGoogleLogin} />
      </View>

      <View style={{ marginTop: 20, width: '100%', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          No tiene cuenta, Cree una ahora
        </Text>
        <CustomButton
          title={"Ir a registrarme"}
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
        />
      </View>
    </LoginAndRegisterCard>
  );
}