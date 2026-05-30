import {useState} from "react";
import {UserProfile} from "../utils/types/Types";
import {View, Text} from "react-native";


export default function ProfileScreen()
{
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);

    /** Actualizar un campo del perfil */
    const updateField = (field: keyof UserProfile, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    const ageError =
        editing && (profile.age === undefined  || isNaN(Number(profile.age)))
            ? 'La edad debe ser un número válido'
            : '';
    /** Guardar cambios */
    const handleSave = () => {
        if (ageError) return;
        setEditing(false);
        setSaved(true);
    };

    return (
        <View>
            <Text>Perfil</Text>
        </View>
    );
}