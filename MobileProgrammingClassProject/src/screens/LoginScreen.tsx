import { View, Text, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { Supabase } from "../lib/Supabase";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import { useAppDispatch } from "../store/hooks";
import { setUser } from "../store/slices/AuthSlices";
import { setProfile } from "../store/slices/userProfileSlice";
import { fetchUserProfile } from "../services/profileService";
import * as WebBrowser from "expo-web-browser";

import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

WebBrowser.maybeCompleteAuthSession();

// Supabase a veces manda los tokens después de "#" y a veces después de "?".
// Esta función revisa los dos lugares posibles, como buscar las llaves
// primero en el bolsillo derecho y si no están, en el izquierdo.
const extractAuthParams = (url: string) => {
  const fragment = url.split("#")[1];
  const query = url.split("?")[1];
  const params = new URLSearchParams(fragment || query || "");

  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
  };
};

export function LoginScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { colors } = useCaremapHealth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectAfterLogin = (roleName: string | null | undefined) => {
    if (roleName?.toLowerCase() === "doctor") {
      navigation.replace("DoctorTabs");
    } else {
      navigation.replace("UserTabs");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Campos obligatorios", "Ingresa tu correo y contraseña");
    }

    setIsSubmitting(true);

    const { data, error } = await Supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsSubmitting(false);
      return Alert.alert("Error", error.message);
    }

    const user = data.user;

    if (!user) {
      setIsSubmitting(false);
      return Alert.alert("Error", "No se obtuvo el usuario");
    }

    dispatch(setUser(user));

    const profile = await fetchUserProfile(user.id);

    setIsSubmitting(false);

    if (!profile) {
      return Alert.alert("Error", "No se pudo cargar el perfil");
    }

    dispatch(setProfile(profile));
    redirectAfterLogin(profile.role_name);
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);

    const redirectUrl = "com.misap.caremaphealth://auth/callback";

    const { data, error } = await Supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      setIsSubmitting(false);
      return Alert.alert("Error", error.message);
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl,
      { preferEphemeralSession: true }
    );

    if (result.type !== "success") {
      setIsSubmitting(false);
      return;
    }

    const { access_token, refresh_token } = extractAuthParams(result.url);

    if (!access_token || !refresh_token) {
      setIsSubmitting(false);
      return Alert.alert("Error", "No se pudo obtener la sesión de Google");
    }

    const { data: sessionData, error: sessionError } =
      await Supabase.auth.setSession({ access_token, refresh_token });

    if (sessionError) {
      setIsSubmitting(false);
      return Alert.alert("Error", sessionError.message);
    }

    const user = sessionData.user;

    if (!user) {
      setIsSubmitting(false);
      return Alert.alert("Error", "No se obtuvo el usuario");
    }

    dispatch(setUser(user));

    const profile = await fetchUserProfile(user.id);

    setIsSubmitting(false);

    if (!profile) {
      return Alert.alert("Error", "No se pudo cargar el perfil");
    }

    dispatch(setProfile(profile));
    redirectAfterLogin(profile.role_name);
  };

  return (
    <LoginAndRegisterCard>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>🩺</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Bienvenido de nuevo
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Inicia sesión para seguir cuidando tu salud
        </Text>
      </View>

      <View style={styles.form}>
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
          onChange={setPassword}
        />

        <View style={styles.buttonSpacing}>
          <CustomButton
            title={isSubmitting ? "Ingresando..." : "Iniciar sesión"}
            onPress={handleLogin}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            o continúa con
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        <CustomButton
          title="Continuar con Google"
          variant="secondary"
          onPress={handleGoogleLogin}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ¿No tienes cuenta? Créala ahora
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

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: 12,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
  },
  footer: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  footerText: {
    fontSize: 13,
  },
});