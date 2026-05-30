import { View, StyleSheet, ViewStyle } from "react-native";

type Props = {
    children: React.ReactNode;
    buttonContainerStyle?: ViewStyle;
};

export default function LoginAndRegisterCard({ children }: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#B8F2E6',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

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
});