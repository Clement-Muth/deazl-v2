import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPasswordReset } from "../../applications/user/application/useCases/requestPasswordReset";
import { validateEmail } from "../../applications/user/ui/components/auth/authHelpers";
import { AuthInput } from "../../applications/user/ui/components/auth/authInput";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    setLoading(true);
    setError(null);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if (result.error) setError(result.error);
    else setSent(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">

          <View style={{ marginTop: 64, marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "#1C1917", letterSpacing: -1, lineHeight: 34 }}>
              Mot de passe oublié
            </Text>
            <Text style={{ fontSize: 14, color: "#78716C", marginTop: 8 }}>
              Saisis ton email pour recevoir un lien de réinitialisation.
            </Text>
          </View>

          {sent ? (
            <View style={{ backgroundColor: "#F0FDF4", borderRadius: 12, padding: 16, gap: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#15803D" }}>Email envoyé !</Text>
              <Text style={{ fontSize: 13, color: "#166534", lineHeight: 20 }}>
                Vérifie ta boîte mail et clique sur le lien pour réinitialiser ton mot de passe.
              </Text>
            </View>
          ) : (
            <>
              <AuthInput
                label="Email"
                value={email}
                onChangeText={(v) => { setEmail(v); setEmailError(null); }}
                placeholder="marie@exemple.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                errorMessage={emailError ?? undefined}
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
                <Button.Label>{loading ? "Envoi…" : "Envoyer le lien"}</Button.Label>
              </Button>
            </>
          )}

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, marginBottom: 32, gap: 4 }}>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#E8571C" }}>Retour à la connexion</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
