import { View, StyleSheet, Text } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { useState } from "react";
import { Supabase } from "../lib/Supabase";
import { Alert } from "react-native";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

export function LoginScreen({ navigation }: any) {
  const { colors } = useCaremapHealth();
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

      console.log("Usuario logueado:", data.user);
      navigation.navigate("UserTabs");
    } catch (error) {
      console.log(error);
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