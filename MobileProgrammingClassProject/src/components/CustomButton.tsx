import {Text, TouchableOpacity, StyleSheet } from "react-native"

type CustomButtonProps = {
    title:string;
    onPress:()=>void;
    //Unión de literales
    //unión
    variant?:"primary"|"secondary"|"tertiary";
}
export default function CustomButton({title, onPress, variant='primary'}: CustomButtonProps) {
    const styles= getStyles(variant);
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText} > {title} </Text>

        </TouchableOpacity>)
}
const getStyles =(variant:"primary"|"secondary"|"tertiary")=>

    StyleSheet.create({
        button: {
            borderRadius: 6,
            backgroundColor: variant=="primary" ? "navy":
                variant=="secondary" ? "gray":
                    "#7edb56",
            padding:12,
            width:'100%',
        },
        buttonText:{
            color: variant==="tertiary"? "#000": "#f8f2f2",
            textAlign: "center",
        }
    })