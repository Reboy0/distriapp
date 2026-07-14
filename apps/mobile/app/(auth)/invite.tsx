/**
 * Invitation-only entry screen (docs/CONTRACT.md AUTH-3: "Реєстрація клієнта
 * - виключно за запрошенням. Відкритої реєстрації немає."). The user pastes
 * the invitation code they received via a link from their distributor, plus
 * their name/phone. There is no open sign-up screen anywhere in this app.
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function InviteScreen() {
  const { registerWithInvitation } = useAuth();
  const [invitationCode, setInvitationCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = invitationCode.trim().length > 0 && name.trim().length > 0 && phone.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await registerWithInvitation({ invitationCode: invitationCode.trim(), name: name.trim(), phone: phone.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося зареєструватися. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>DistriApp</Text>
        <Text style={styles.subtitle}>
          Реєстрація можлива лише за запрошенням від вашого дистриб&apos;ютора. Вставте код із посилання,
          яке ви отримали.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Код запрошення</Text>
          <TextInput
            style={styles.input}
            placeholder="Напр., INV-7F3K9Q"
            autoCapitalize="characters"
            value={invitationCode}
            onChangeText={setInvitationCode}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Ім&apos;я / назва магазину</Text>
          <TextInput style={styles.input} placeholder="ФОП Іваненко" value={name} onChangeText={setName} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Телефон</Text>
          <TextInput
            style={styles.input}
            placeholder="+380 67 123 45 67"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Зареєструватися</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>
          Немає коду? Зверніться до вашого дистриб&apos;ютора — він надішле персональне запрошення.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 8, color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#dc2626", marginBottom: 12, fontSize: 13 },
  hint: { marginTop: 20, fontSize: 12, color: "#9ca3af", textAlign: "center" },
});
