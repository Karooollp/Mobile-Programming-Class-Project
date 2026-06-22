import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {LoginScreen} from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ProfileScreen from "../screens/ProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import { View, Text } from "react-native"; 
import TabNavigator from "./TabNavigator";

function MainTabsPlaceholder() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0284C7", textAlign: "center", padding: 20 }}>
        ¡Holi! Aquí estará el Chatbot Inteligente y las Tabs principales o(≧▽≦)o
      </Text>
      <Text style={{ fontSize: 14, color: "#64748B", marginTop: 10 }}>
        [ El sistema está funcionando correctamente ]
      </Text>
    </View>
  );
}

export type RootStackParamList={
    Login:undefined,
    Home:{email:string},
    UserTabs:undefined,
    Register: undefined;
    Profile: undefined;
    EditProfile: undefined;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function StackNavigator (){
    return (
        <Stack.Navigator initialRouteName="Login" screenOptions={{headerShown: false}}>
            <Stack.Screen name="Login" component={LoginScreen}/>
            <Stack.Screen name="Register" component={RegisterScreen}/>
            <Stack.Screen name="UserTabs" component={TabNavigator} options={{ headerShown: false }}/>
            <Stack.Screen name="Profile" component={ProfileScreen}/>
            <Stack.Screen name="EditProfile" component={EditProfileScreen}/>
        </Stack.Navigator>
    );
}