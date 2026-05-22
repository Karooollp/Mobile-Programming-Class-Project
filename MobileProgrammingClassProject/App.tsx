import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import StackNavigator from "./src/navigation/StackNavigator";
import {navigationRef} from "./src/navigation/NavigationService";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  return (

      <NavigationContainer ref={navigationRef}>
          <StackNavigator/>
      </NavigationContainer>
  )
};
