import {View, StyleSheet, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';


interface ScreenContainerProps {
    children: React.ReactNode;
    scrollable?: boolean;
}

/**
 * Wrapper reutilizable para pantallas.
 * Agrega padding, color de fondo y SafeAreaView.
 */


export default function ScreenContainer({
                                          children,
                                          scrollable = true,
                                        }: ScreenContainerProps) {
  
}