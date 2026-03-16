import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path } from "react-native-svg";
import { addUserStore } from "../../applications/user/application/useCases/addUserStore";
import { completeOnboarding } from "../../applications/user/application/useCases/completeOnboarding";
import { removeUserStore } from "../../applications/user/application/useCases/removeUserStore";
import { searchStores } from "../../applications/user/application/useCases/searchStores";
import type { StoreResult } from "../../applications/user/application/useCases/searchStores";
import { getUserStores } from "../../applications/shopping/application/useCases/getUserStores";
import type { UserStore } from "../../applications/shopping/application/useCases/getUserStores";
import { useAppTheme } from "../../shared/theme";

export default function StoresPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StoreResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserStore[]>([]);
  const [saving, setSaving] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { colors } = useAppTheme();

  function handleQueryChange(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchStores(q);
      setResults(res.filter((r) => !selected.some((s) => s.id === r.id)));
      setSearching(false);
    }, 300);
  }

  async function handleAdd(store: StoreResult) {
    await addUserStore(store.id);
    setSelected((prev) => [...prev, { id: store.id, name: store.name, brand: store.brand, city: store.city }]);
    setResults((prev) => prev.filter((r) => r.id !== store.id));
    setQuery("");
  }

  async function handleRemove(storeId: string) {
    await removeUserStore(storeId);
    setSelected((prev) => prev.filter((s) => s.id !== storeId));
  }

  async function handleFinish() {
    setSaving(true);
    await completeOnboarding();
    setSaving(false);
    router.replace("/(tabs)" as never);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 40 }}>
          <View style={{ height: 3, flex: 1, borderRadius: 99, backgroundColor: colors.accent }} />
          <View style={{ height: 3, flex: 1, borderRadius: 99, backgroundColor: colors.accent }} />
          <View style={{ height: 3, flex: 1, borderRadius: 99, backgroundColor: colors.border }} />
        </View>

        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.3, marginBottom: 8 }}>
          Vos magasins
        </Text>
        <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24, lineHeight: 20 }}>
          Ajoutez vos magasins habituels pour comparer les prix et estimer le coût de vos courses.
        </Text>

        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Rechercher un magasin…"
          placeholderTextColor={colors.textSubtle}
          style={{ borderRadius: 16, backgroundColor: colors.bgCard, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border, marginBottom: 12 }}
        />

        {searching && <ActivityIndicator color="#E8571C" style={{ marginBottom: 12 }} />}

        {results.length > 0 && (
          <View style={{ borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 16 }}>
            {results.slice(0, 5).map((s, i) => (
              <View key={s.id}>
                <Pressable
                  onPress={() => handleAdd(s)}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} ${s.name}` : s.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.city}{s.address ? ` · ${s.address}` : ""}</Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 99, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center" }}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1={12} y1={5} x2={12} y2={19} />
                      <Line x1={5} y1={12} x2={19} y2={12} />
                    </Svg>
                  </View>
                </Pressable>
                {i < Math.min(results.length, 5) - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface, marginHorizontal: 14 }} />}
              </View>
            ))}
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
          {selected.length === 0 && !query && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center" }}>
                Aucun magasin sélectionné.{"\n"}Vous pouvez en ajouter plus tard.
              </Text>
            </View>
          )}
          {selected.map((s) => (
            <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, backgroundColor: colors.bgCard, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.accentBg, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <Line x1={3} y1={6} x2={21} y2={6} />
                  <Path d="M16 10a4 4 0 0 1-8 0" />
                </Svg>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} ${s.name}` : s.name}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.city}</Text>
              </View>
              <Pressable onPress={() => handleRemove(s.id)} hitSlop={12} style={{ padding: 4 }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={18} y1={6} x2={6} y2={18} />
                  <Line x1={6} y1={6} x2={18} y2={18} />
                </Svg>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <Button variant="primary" className="w-full rounded-2xl" onPress={handleFinish} isDisabled={saving}>
          <Button.Label>{saving ? "Finalisation…" : selected.length > 0 ? "Terminer" : "Passer"}</Button.Label>
        </Button>
      </View>
    </SafeAreaView>
  );
}
