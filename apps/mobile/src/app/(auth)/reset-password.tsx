import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changePassword } from "../../applications/user/application/useCases/changePassword";
import { mapAuthError, validatePassword } from "../../applications/user/ui/components/auth/authHelpers";
import { AuthInput } from "../../applications/user/ui/components/auth/authInput";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const err = validatePassword(password);
    if (err) { setPasswordError(err); return; }
    setPasswordError(null);
    setLoading(true);
    setError(null);
    const result = await changePassword(password);
    setLoading(false);
    if (result.error) setError(mapAuthError(result.error));
    else router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">

          <View style={{ marginTop: 64, marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#1C1917", letterSpacing: -1, lineHeight: 34 }}>
              Nouveau mot de passe
            </Text>
            <Text style={{ fontSize: 14, color: "#78716C", marginTop: 8 }}>
              Choisis un mot de passe d'au moins 8 caractères.
            </Text>
          </View>

          <AuthInput
            label="Nouveau mot de passe"
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(null); }}
            placeholder="••••••••"
            isPassword
            autoComplete="new-password"
            errorMessage={passwordError ?? undefined}
          />

          {error && (
            <Text style={{ fontSize: 13, color: "#DC2626", marginTop: 8 }}>{error}</Text>
          )}

          <Button
            variant="primary"
            isDisabled={loading}
            onPress={handleSubmit}
            className="w-full mt-5 rounded-2xl"
          >
            <Button.Label>{loading ? "Mise à jour…" : "Mettre à jour"}</Button.Label>
          </Button>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
