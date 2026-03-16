import { Button, Separator } from "heroui-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { resendConfirmationEmail } from "../../../application/useCases/resendConfirmationEmail";
import { signInWithGoogle } from "../../../application/useCases/signInWithGoogle";
import { signUp } from "../../../application/useCases/signUp";
import { useAppTheme } from "../../../../../shared/theme";
import { mapAuthError, validateEmail, validatePassword } from "./authHelpers";
import { AuthInput } from "./authInput";

export function RegisterForm() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleRegister() {
    let valid = true;
    if (!displayName.trim()) { setNameError("Le prénom est requis"); valid = false; } else setNameError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) valid = false;
    if (!valid) return;
    setLoading(true);
    const result = await signUp(email, password, displayName.trim());
    setLoading(false);
    if (result.error) setPasswordError(mapAuthError(result.error));
    else setEmailSent(true);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    setGoogleLoading(false);
    if (result.error) setPasswordError(result.error);
  }

  async function handleResend() {
    setResendLoading(true);
    await resendConfirmationEmail(email);
    setResendLoading(false);
  }

  if (emailSent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}>
          <View style={{ marginTop: 64, marginBottom: 40 }}>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, letterSpacing: -1, lineHeight: 34 }}>
              Vérifie ta boîte mail
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, lineHeight: 22 }}>
              Un email de confirmation a été envoyé à{" "}
              <Text style={{ fontWeight: "600", color: colors.text }}>{email}</Text>.
              Clique sur le lien pour activer ton compte.
            </Text>
          </View>

          <Button
            variant="outline"
            isDisabled={resendLoading}
            onPress={handleResend}
            className="w-full rounded-2xl"
          >
            <Button.Label>{resendLoading ? "Envoi…" : "Renvoyer l'email"}</Button.Label>
          </Button>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 4 }}>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.accent }}>Retour à la connexion</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }} keyboardShouldPersistTaps="handled">

          <View style={{ marginTop: 64, marginBottom: 40 }}>
            <Text style={{ fontSize: 46, fontWeight: "900", color: colors.text, letterSpacing: -3, lineHeight: 50 }}>
              Deazl<Text style={{ color: colors.accent }}>.</Text>
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
              Smart meal planning & grocery management
            </Text>
          </View>

          <View style={{ gap: 16 }}>
            <AuthInput
              label="Prénom"
              value={displayName}
              onChangeText={(v) => { setDisplayName(v); setNameError(null); }}
              placeholder="Marie"
              autoCapitalize="words"
              autoComplete="given-name"
              errorMessage={nameError ?? undefined}
            />
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
            <AuthInput
              label="Mot de passe"
              value={password}
              onChangeText={(v) => { setPassword(v); setPasswordError(null); }}
              placeholder="••••••••"
              isPassword
              autoComplete="new-password"
              errorMessage={passwordError ?? undefined}
            />
          </View>

          <Button
            variant="primary"
            isDisabled={loading || googleLoading}
            onPress={handleRegister}
            className="w-full mt-5 rounded-2xl"
          >
            <Button.Label>{loading ? "Chargement…" : "Créer un compte"}</Button.Label>
          </Button>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 8 }}>
            <Separator className="flex-1" />
            <Text style={{ fontSize: 12, color: colors.textMuted }}>ou</Text>
            <Separator className="flex-1" />
          </View>

          <Button variant="outline" isDisabled={loading || googleLoading} onPress={handleGoogle} className="w-full rounded-2xl">
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </Svg>
            <Button.Label>{googleLoading ? "Connexion…" : "Continuer avec Google"}</Button.Label>
          </Button>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, marginBottom: 32, gap: 4 }}>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>Déjà un compte ?</Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.accent }}>Se connecter</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
