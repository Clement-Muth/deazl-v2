import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "../lib/supabase";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

function handleDeepLink(url: string) {
  if (!url.startsWith("deazl://reset-password")) return;
  const hash = url.split("#")[1] ?? "";
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");
  if (type === "recovery" && accessToken && refreshToken) {
    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  }
}

function AuthGate({
  children,
  session,
  pendingRecovery,
  onRecoveryHandled,
}: {
  children: React.ReactNode;
  session: Session | null;
  pendingRecovery: boolean;
  onRecoveryHandled: () => void;
}) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (pendingRecovery) {
      onRecoveryHandled();
      router.replace("/(auth)/reset-password");
      return;
    }
    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    if (!session && !inAuth) {
      router.replace("/(auth)/login");
    } else if (session && inAuth) {
      const onboardingDone = session.user.user_metadata?.onboarding_completed === true;
      router.replace(onboardingDone ? "/(tabs)" : "/(onboarding)/welcome");
    } else if (session && !inAuth && !inOnboarding) {
      const onboardingDone = session.user.user_metadata?.onboarding_completed === true;
      if (!onboardingDone) router.replace("/(onboarding)/welcome");
    }
  }, [session, segments, pendingRecovery]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [pendingRecovery, setPendingRecovery] = useState(false);
  const splashHiddenRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(error ? null : session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setPendingRecovery(true);
      } else {
        setSession(newSession);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded && session !== undefined && !splashHiddenRef.current) {
      splashHiddenRef.current = true;
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, session]);

  if (!fontsLoaded || session === undefined) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <AuthGate session={session} pendingRecovery={pendingRecovery} onRecoveryHandled={() => setPendingRecovery(false)}>
          <Slot />
        </AuthGate>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
