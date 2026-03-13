import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import type { Session } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { HeroUINativeProvider } from "heroui-native";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { registerPushToken } from "../applications/user/application/useCases/registerPushToken";
import { supabase } from "../lib/supabase";
import "../../global.css";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(session);
        if (session) registerPushTokenIfPermitted();
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      if (session) registerPushTokenIfPermitted();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function registerPushTokenIfPermitted() {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const token = await Notifications.getExpoPushTokenAsync();
    registerPushToken(token.data);
  }

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
      <HeroUINativeProvider config={{ devInfo: { stylingPrinciples: false } }}>
        <AuthGate>
          <Slot />
        </AuthGate>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
