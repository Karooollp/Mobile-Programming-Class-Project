import { View, StyleSheet } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import { useState } from "react";


export function LoginScreen({navigation}: any) {
    const [email, setEmail] = useState('mjsalinas@unitec.edu');
    const [password, setPasword] = useState('');
    //Se llamo una variable loca proveniente de AuthContextType el cual esta tipado en Auth
    const [psw, setPsw] = useState('');

    const handleLogin = () => {
        try {
            navigation.navigate("",{email})
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
          <CustomInput  placeholder={"Ingresa tu correo"} value={email} onChange={setEmail} />
          <CustomInput type={"password"} placeholder={"Ingresaa tu contraseña"} value={password} onChange={setPasword}/>
            <View style={styles.buttonContainer}>
              <CustomButton title={"INICIAR SESIÓN"} onPress={ handleLogin  }/></View>
            </View>
        </View>
    );

}
const styles = StyleSheet.create({

    // Fondo general verde menta
    container: {
        flex: 1,
        backgroundColor: '#B8F2E6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    // Tarjeta login
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,

        elevation: 5,
    },
    buttonContainer: {
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
});