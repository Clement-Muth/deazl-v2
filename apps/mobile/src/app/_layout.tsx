import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import type { Session } from "@supabase/supabase-js";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "../lib/supabase";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;
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
  }, [session, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded) return null;
  SplashScreen.hideAsync();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <HeroUINativeProvider>
        <AuthGate>
          <Slot />
        </AuthGate>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
