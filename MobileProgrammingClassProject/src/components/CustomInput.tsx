import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardTypeOptions } from "react-native";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
type Props={
    type?: "text"|"email"|"password"|"number"| "phone";
    placeholder: string;
    value:string;
    onChange:(text:string)=> void

}
export default function CustomInput({type="text",placeholder,value, onChange}: Props){
    const [isSecureText, setIsSecureText]=useState(type==="password" )
    const isPasswordField=type==="password";
    const icon:  typeof MaterialIcons["name"] |undefined=
        type==="email"?"alternate-email":
            type==="password"? "lock":  undefined

    const keyboardType:KeyboardTypeOptions=
        type==="email"?"email-address":
            type==="number" ? "phone-pad":
                "default";

    const getError=()=>{
        if (type ==="email"&& !value.includes("@")) return"Correo Invalido mi lord";
        if(type==="password" && value.length<4) return "Contraseña demasiada corta";
        if(type==="number" &&( value.length !=8 || value.includes("-"))) return "Numero invalido";

    }
    const error=getError();

    return (
        //wrapper
        <View style={styles.wrapper}>
            <View style={[styles.inputContainer, error&& styles.inputError]}>
                <MaterialIcons   name={icon as any }size={25} color="#00000"/>
                <TextInput
                    placeholder ={placeholder}
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                    secureTextEntry={isSecureText}
                    keyboardType={keyboardType}
                />
                { isPasswordField && <TouchableOpacity
                    onPress={
                        ()=>{
                            setIsSecureText(!isSecureText)
                        }
                    }
                >
                    <Ionicons name={isSecureText? "eye":"eye-off"} size={20} />
                </TouchableOpacity>}
            </View>
            {
                error&&
                <Text style={styles.inputError}>{error}</Text>}
        </View>
    );
}
const styles=StyleSheet.create({
    wrapper:{
        marginBottom:10,
    },

    inputContainer:{
        //width:"100%",
        //Distribucion de ccomponentes
        flexDirection:"row",
        alignItems:"center",
        marginTop:10,

        //estilización de contenido
        borderColor: "gray",
        borderWidth:1,
        borderRadius:9,
        backgroundColor:"#e3dbdb",
        paddingHorizontal:10,
    },

    input:{
        width:"80%",
        paddingVertical: 10,
        paddingHorizontal:10,


    },

    inputError:{
        color:"red",
        borderColor:"red"
    }
})