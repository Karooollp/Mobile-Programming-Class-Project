import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import CustomButton from '..//components/CustomButton';
import CustomInput from '..//components/CustomInput';
import { useState } from 'react';
import { Alert } from "react-native";
import { Supabase } from "../lib/Supabase";
import LoginAndRegisterCard from "../components/LoginAndRegisterCard";
import ProfileScreen from "./ProfileScreen";




    export default function RegisterScreen({navigation}: any) {

        //definición de una variabe de estadoen ReacN
      const [firstName, setFirstName] = useState("");
      const [lastName, setLastName] = useState("");
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      

        const handleRegister = async () => {
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
                              user_id: userId, // 👈 obligatorio (relación con auth)
                              
                              first_name: firstName,
                              last_name: lastName,
                              email:email,
                              status: "active",
                            },
                        ]);


                    if (profileError) {
                        Alert.alert("Error perfil", profileError.message);
                        return;
                    }
                }
                navigation.navigate("EditProfile");
                Alert.alert("Éxito", "Usuario registrado correctamente");


            } catch (err) {
                console.log(err);
            }
        };
        return (

            <LoginAndRegisterCard>

                <Text style={{fontSize: 18, fontWeight: "600", marginBottom: 10}}>
                    Primera App Móvil de Misap
                </Text>
                <CustomInput
                    type={'text'}
                    placeholder={'Ingresa tu nombre'}
                    value={firstName}
                    onChange={setFirstName}
                />
              <CustomInput
                type="text"
                placeholder="Ingresa tu apellido"
                value={lastName}
                onChange={setLastName}
              />

                <CustomInput
                    type={'email'}
                    placeholder={'micorreo@@gmail.com'}
                    value={email}
                    onChange={setEmail}
                />

                <CustomInput
                    type={'password'}
                    placeholder={'Ingresa tu contraseña crack'}
                    value={password}
                    onChange={setPassword}
                />

                <View style={{marginTop: 10, width: '100%', alignItems: 'center'}}>
                    <CustomButton
                        title={"Registrarse"}
                        onPress={handleRegister}
                    />
                </View>

            </LoginAndRegisterCard>
        );
    }





