import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {LoginScreen} from "../screens/LoginScreen";

//1. definir un stack y declarar tipado


export type RootStackParamList={
    Login:undefined,
    Home:{email:string},
    UserTabs:undefined,
}
//Crear el stack navigator el cual va a manejar la navegación
const Stack =createNativeStackNavigator <RootStackParamList>();
//Utilizar el stack
export default function StackNavigator (){
    return(
        <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown: true}}>
            <Stack.Screen name="Login"component={LoginScreen}/>

        </Stack.Navigator>
    )
}