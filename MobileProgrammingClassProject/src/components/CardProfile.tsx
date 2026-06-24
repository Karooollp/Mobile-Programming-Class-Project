import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useCaremapHealth } from "../contexts/CaremapHealthContexts";

type Props = {
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export default function CardBase({ children, footer }: Props) {
  const { colors } = useCaremapHealth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {children}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </ScrollView>
    </View>
  );
}

// ✅ Hook para estilos dinámicos — úsalo en las pantallas
export function useSharedStyles() {
  const { colors } = useCaremapHealth();

  return StyleSheet.create({
    title: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 20 },
    label: { fontSize: 15, fontWeight: "600", marginTop: 15, marginBottom: 10, color: colors.textPrimary },
    inputBox: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12 },
    error: { color: "#DC2626", fontSize: 12, marginTop: 4 },
    photoContainer: { alignItems: "center", marginBottom: 18, padding: 16, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    photo: { width: 115, height: 115, borderRadius: 60 },
    emptyPhoto: { width: 115, height: 115, borderRadius: 60, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primary, borderStyle: "dashed" },
    photoText: { color: colors.primary, fontWeight: "600" },
    button: { marginTop: 25, backgroundColor: colors.primary, padding: 15, borderRadius: 16, alignItems: "center" },
    buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
    infoBox: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10 },
    infoLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
    infoValue: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
    optionContainer: { gap: 10, marginBottom: 10 },
    option: { flex: 1, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center" },
    selectedOption: { borderColor: colors.primary, backgroundColor: colors.surface },
    optionText: { fontSize: 14, color: colors.textPrimary, textAlign: "center" },
    optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    selectedText: { color: colors.primary, fontWeight: "700" },
    dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
    dropdownText: { color: colors.textPrimary },
    arrow: { fontSize: 14, color: colors.textSecondary },
    dropdownList: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginTop: 6, backgroundColor: colors.surface, overflow: "hidden" },
    dropdownItem: { padding: 14, backgroundColor: colors.surface },
    dropdownItemText: { color: colors.textPrimary, fontSize: 15 },
    dateButton: { borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
    selectedDropdownText: { color: colors.primary, fontWeight: "700" },
    dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    header: { alignItems: "center", marginBottom: 25 },
    avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
    avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    avatarText: { color: colors.primary, fontWeight: "600" },
    name: { fontSize: 22, fontWeight: "800", color: colors.textPrimary },
    email: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
    section: { marginTop: 22, marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.primary, marginBottom: 14, letterSpacing: 0.3 },
    cardSection: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    dateBox: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    dateText: { fontWeight: "500", color: colors.textPrimary },
    optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionTextActive: { color: "#FFF", fontWeight: "700" },
    fieldCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, marginBottom: 10 },
    fieldLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    fieldValue: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  });
}

// ✅ Se mantiene para no romper imports existentes — pero los colores son fijos
// Reemplaza sharedStyles por useSharedStyles() en cada pantalla
export const sharedStyles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 20 },
  label: { fontSize: 15, fontWeight: "600", marginTop: 15, marginBottom: 10, color: "#111827" },
  inputBox: { borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", borderRadius: 14, padding: 14, marginBottom: 12 },
  error: { color: "#DC2626", fontSize: 12, marginTop: 4 },
  photoContainer: { alignItems: "center", marginBottom: 18, padding: 16, backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  photo: { width: 115, height: 115, borderRadius: 60 },
  emptyPhoto: { width: 115, height: 115, borderRadius: 60, backgroundColor: "#EFF6FF", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#2563EB", borderStyle: "dashed" },
  photoText: { color: "#2563EB", fontWeight: "600" },
  button: { marginTop: 25, backgroundColor: "#2563EB", padding: 15, borderRadius: 16, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  infoBox: { backgroundColor: "#F9FAFB", borderRadius: 16, padding: 14, marginBottom: 10 },
  infoLabel: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  infoValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
  optionContainer: { gap: 10, marginBottom: 10 },
  option: { flex: 1, borderWidth: 1.5, borderColor: "#D1D5DB", paddingVertical: 12, borderRadius: 14, backgroundColor: "#FFF", alignItems: "center" },
  selectedOption: { borderColor: "#2563EB", backgroundColor: "#EFF6FF" },
  optionText: { fontSize: 14, color: "#111827", textAlign: "center" },
  optionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectedText: { color: "#2563EB", fontWeight: "700" },
  dropdownButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", padding: 14, borderRadius: 16, backgroundColor: "#FFF" },
  dropdownText: { color: "#111827" },
  arrow: { fontSize: 14, color: "#6B7280" },
  dropdownList: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, marginTop: 6, backgroundColor: "#FFF", overflow: "hidden" },
  dropdownItem: { padding: 14, backgroundColor: "#FFF" },
  dropdownItemText: { color: "#111827", fontSize: 15 },
  dateButton: { borderWidth: 1, borderColor: "#E5E7EB", padding: 14, borderRadius: 16, backgroundColor: "#FFF" },
  selectedDropdownText: { color: "#2563EB", fontWeight: "700" },
  dropdownItemBorder: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  header: { alignItems: "center", marginBottom: 25 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#E0E7FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { color: "#4F46E5", fontWeight: "600" },
  name: { fontSize: 22, fontWeight: "800", color: "#111827" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  section: { marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#4F46E5", marginBottom: 14, letterSpacing: 0.3 },
  cardSection: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },
  dateBox: { padding: 14, borderRadius: 12, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E5E7EB" },
  dateText: { fontWeight: "500", color: "#111827" },
  optionActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  optionTextActive: { color: "#FFF", fontWeight: "700" },
  fieldCard: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 12, marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  fieldValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: { borderRadius: 28, padding: 22, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  footer: { marginTop: 20 },
});