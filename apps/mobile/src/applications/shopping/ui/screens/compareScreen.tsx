import { useRouter } from "expo-router";
import { ScrollView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Polyline } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { useShoppingList } from "../../api/useShoppingList";
import type { ShoppingItem, StoreCostSummary } from "../../domain/entities/shopping";

function cheapestStoreId(item: ShoppingItem, storeIds: string[]): string | null {
  const prices = storeIds
    .map((sid) => ({ sid, p: item.allStorePrices.find((p) => p.storeId === sid) }))
    .filter((x) => x.p !== undefined);
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => (a.p!.estimatedCost <= b.p!.estimatedCost ? a : b)).sid;
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="15 18 9 12 15 6" />
    </Svg>
  );
}

function TrophyIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <Path d="M4 22h16" />
      <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </Svg>
  );
}

export function CompareScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { list, loading } = useShoppingList();

  const storeSummaries: StoreCostSummary[] = [...(list?.storeSummaries ?? [])].sort(
    (a, b) => a.totalCost - b.totalCost
  );
  const storeIds = storeSummaries.map((s) => s.storeId);

  const unchecked = list?.items.filter((i) => !i.isChecked) ?? [];
  const itemsWithPrice = unchecked.filter((item) =>
    item.allStorePrices.some((p) => storeIds.includes(p.storeId))
  );
  const itemsWithoutPrice = unchecked.filter(
    (item) => !item.allStorePrices.some((p) => storeIds.includes(p.storeId))
  );

  const savings =
    storeSummaries.length >= 2
      ? storeSummaries[storeSummaries.length - 1].totalCost - storeSummaries[0].totalCost
      : 0;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 12 }}>
        <Pressable
          onPress={() => router.navigate("/(tabs)/shopping")}
          hitSlop={12}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.5 : 1 })}
        >
          <BackIcon color={colors.text} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: colors.text }}>
          Comparateur de prix
        </Text>
      </View>

      {storeSummaries.length < 2 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Pas assez de données</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Ajoutez des prix pour au moins 2 magasins pour pouvoir comparer.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {savings >= 0.5 && (
            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 14,
                backgroundColor: colors.greenBg,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 16,
                paddingVertical: 14,
              }}
            >
              <TrophyIcon color={colors.green} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.green }}>
                  {storeSummaries[0].storeName} est le moins cher
                </Text>
                <Text style={{ fontSize: 12, color: colors.green, opacity: 0.8, marginTop: 1 }}>
                  Jusqu'à {savings.toFixed(2)} € d'économie sur cette liste
                </Text>
              </View>
            </View>
          )}

          <View style={{ marginHorizontal: 16, marginBottom: 20, flexDirection: "row", gap: 8 }}>
            {storeSummaries.map((store, i) => {
              const isBest = i === 0;
              return (
                <View
                  key={store.storeId}
                  style={{
                    flex: 1,
                    borderRadius: 14,
                    backgroundColor: isBest ? colors.greenBg : colors.bgCard,
                    padding: 14,
                    borderWidth: isBest ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  {isBest && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.green, letterSpacing: 0.5 }}>
                        MOINS CHER
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{ fontSize: 13, fontWeight: "700", color: isBest ? colors.green : colors.text }}
                    numberOfLines={1}
                  >
                    {store.storeName}
                  </Text>
                  <Text
                    style={{ fontSize: 20, fontWeight: "800", color: isBest ? colors.green : colors.text, marginTop: 4 }}
                  >
                    {store.totalCost.toFixed(2)} €
                  </Text>
                  <Text style={{ fontSize: 11, color: isBest ? colors.green : colors.textMuted, opacity: 0.7, marginTop: 2 }}>
                    {store.coveredCount}/{store.totalCount} articles
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
              Détail par article
            </Text>
            <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
              {itemsWithPrice.map((item, i) => {
                const bestSid = cheapestStoreId(item, storeIds);
                const storesWithPrice = storeSummaries.filter((s) =>
                  item.allStorePrices.some((p) => p.storeId === s.storeId)
                );
                return (
                  <View
                    key={item.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: i < itemsWithPrice.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                      <View
                        style={{
                          borderRadius: 6,
                          backgroundColor: colors.accentBg,
                          paddingHorizontal: 7,
                          paddingVertical: 3,
                          marginRight: 8,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                        {item.customName}
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                      {storeSummaries.map((store) => {
                        const priceEntry = item.allStorePrices.find((p) => p.storeId === store.storeId);
                        if (!priceEntry) return null;
                        const isBest = store.storeId === bestSid;
                        return (
                          <View
                            key={store.storeId}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              borderRadius: 10,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              backgroundColor: isBest ? colors.greenBg : colors.bgSurface,
                            }}
                          >
                            {isBest && (
                              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.green }} />
                            )}
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: isBest ? colors.green : colors.textMuted,
                              }}
                            >
                              {store.storeName}
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: isBest ? colors.green : colors.text,
                              }}
                            >
                              {priceEntry.estimatedCost.toFixed(2)} €
                            </Text>
                          </View>
                        );
                      })}
                      {storeSummaries
                        .filter((s) => !item.allStorePrices.some((p) => p.storeId === s.storeId))
                        .map((s) => (
                          <View
                            key={s.storeId}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                              borderRadius: 10,
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              backgroundColor: colors.bgSurface,
                            }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle }}>
                              {s.storeName}
                            </Text>
                            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSubtle }}>—</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {itemsWithoutPrice.length > 0 && (
            <View style={{ marginHorizontal: 16, marginTop: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                Sans prix ({itemsWithoutPrice.length})
              </Text>
              <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
                {itemsWithoutPrice.map((item, i) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: i < itemsWithoutPrice.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        borderRadius: 6,
                        backgroundColor: colors.bgSurface,
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        marginRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.textMuted }} numberOfLines={1}>
                      {item.customName}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
