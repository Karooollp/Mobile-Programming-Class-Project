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

WebBrowser.maybeCompleteAuthSession();

// Misma idea que en LoginScreen: buscar los tokens tanto en "#" como en "?"
const extractAuthParams = (url: string) => {
  const fragment = url.split("#")[1];
  const query = url.split("?")[1];
  const params = new URLSearchParams(fragment || query || "");

  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
  };
};

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const { colors } = useCaremapHealth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    const { data, error } = await Supabase.auth.signUp({ email, password });

    if (error) {
      setIsSubmitting(false);
      return Alert.alert("Error", error.message);
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setIsSubmitting(false);
      return Alert.alert(
        "Correo ya registrado",
        "Ya existe una cuenta con ese correo. Intenta iniciar sesión."
      );
    }

    const userId = data.user?.id;

    if (!userId) {
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setIsSubmitting(false);
      Alert.alert(
        "Revisa tu correo",
        "Te enviamos un enlace de confirmación. Confírmalo y luego inicia sesión para completar tu perfil."
      );
      return navigation.navigate("Login");
    }

    const { error: profileError } = await Supabase.from("users").insert([
      {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        status: "active",
      },
    ]);

    setIsSubmitting(false);

    if (profileError) {
      return Alert.alert("Error perfil", profileError.message);
    }

    dispatch(
      setProfile({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        email,
        status: "active",
        profile_completed: false,
      })
    );

    Alert.alert("Éxito", "Usuario registrado correctamente");
    navigation.navigate("EditProfile");
  };

  const handleGoogleRegister = async () => {
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
      return Alert.alert("Error", "No se pudo obtener sesión");
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
      return;
    }

    const fullName = user.user_metadata?.full_name || "";
    const first = fullName.split(" ")[0] || "";
    const last = fullName.split(" ")[1] || "";

    const { error: profileError } = await Supabase.from("users").upsert([
      {
        user_id: user.id,
        first_name: first,
        last_name: last,
        email: user.email,
        status: "active",
      },
    ]);

    setIsSubmitting(false);

    if (profileError) {
      return Alert.alert("Error perfil", profileError.message);
    }

    dispatch(
      setProfile({
        user_id: user.id,
        first_name: first,
        last_name: last,
        email: user.email || "",
        status: "active",
        profile_completed: false,
      })
    );

    Alert.alert("Éxito", "Usuario registrado correctamente");
    navigation.navigate("EditProfile");
  };

  return (
    <LoginAndRegisterCard>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>🩺</Text>
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Crea tu cuenta
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Únete a CareMap Health en segundos
        </Text>
      </View>

      <View style={styles.form}>
        <CustomInput
          type="text"
          placeholder="Nombre *"
          value={firstName}
          onChange={setFirstName}
        />
        {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}

        <CustomInput
          type="text"
          placeholder="Apellido *"
          value={lastName}
          onChange={setLastName}
        />
        {errors.lastName ? <Text style={styles.error}>{errors.lastName}</Text> : null}

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
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

        <View style={styles.buttonSpacing}>
          <CustomButton
            title={isSubmitting ? "Registrando..." : "Registrarse"}
            onPress={handleRegister}
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
          onPress={handleGoogleRegister}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
          ¿Ya tienes cuenta? Inicia sesión
        </Text>
        <CustomButton
          title="Ir a iniciar sesión"
          variant="secondary"
          onPress={() => navigation.navigate("Login")}
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
  error: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: -6,
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