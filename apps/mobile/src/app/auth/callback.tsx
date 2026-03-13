import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    if (code) supabase.auth.exchangeCodeForSession(code);
  }, [code]);

  return <View style={{ flex: 1 }} />;
}
