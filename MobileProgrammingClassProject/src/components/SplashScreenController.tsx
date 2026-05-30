import { useAuthContext } from "../contexts/AuthContext";
import * as SplashScreen from "expo-splash-screen";
SplashScreen.preventAutoHideAsync()
export function SplashScreenController() {
    const { isLoading } = useAuthContext()
    if (!isLoading) {
        SplashScreen.hideAsync()
    }
    return null
}