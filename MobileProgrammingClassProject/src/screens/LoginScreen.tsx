import {View, StyleSheet, Text} from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { useState } from "react";
import { Supabase } from "../lib/Supabase";
import { Alert } from "react-native";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import {useAppDispatch} from "../store/hooks";
import {setUser} from "../store/slices/AuthSlices";
import { setProfile } from "../store/slices/userProfileSlice";
import { fetchUserProfile } from "../services/profileService";

export function LoginScreen({navigation}: any) {
  
  const dispatch = useAppDispatch();
   
    const [email, setEmail] = useState('');
    const [password, setPasword] = useState('');
    //Se llamo una variable loca proveniente de AuthContextType el cual esta tipado en Auth
  
  const handleLogin = async () => {
    const { data, error } = await Supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    const user = data.user;
    dispatch(setUser(user));
    
    // SIEMPRE RECARGAR PERFIL COMPLETO
    const profile = await fetchUserProfile(user.id);
    if (!profile) {
      Alert.alert("Error", "No se pudo cargar el perfil");
      return;
    }
    
    dispatch(setProfile(profile));
    
    navigation.replace("UserTabs");
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
                <Text>No tiene cuenta, Cree una ahora</Text>
                <CustomButton
                    title={"Ir a registrarme"}
                    variant="secondary"
                    onPress={() => navigation.navigate("Register")}
                />
            </View>
        </LoginAndRegisterCard>
    );
}