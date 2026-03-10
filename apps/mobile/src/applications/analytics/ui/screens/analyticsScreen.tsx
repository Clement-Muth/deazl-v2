import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { getAnalytics } from "../../application/useCases/getAnalytics";
import type { Analytics } from "../../application/useCases/getAnalytics";

const NUTRI_COLOR: Record<string, string> = { A: "#1a7d3e", B: "#5eb83f", C: "#f5c400", D: "#e07d20", E: "#d73b2e" };
const DIETARY_LABELS: Record<string, string> = { vegetarian: "Végé", vegan: "Vegan", gluten_free: "SG", halal: "Halal" };

function StatCard({ label, value, sub, color = "#1C1917" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={{ flex: 1, borderRadius: 16, backgroundColor: "#fff", padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 28, fontWeight: "900", color, letterSpacing: -0.5 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 11, color: "#78716C", marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

function CoverageArc({ filled, total }: { filled: number; total: number }) {
  const pct = total > 0 ? filled / total : 0;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const progress = arcLen * pct;
  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={r} fill="none" stroke="#F5F3EF" strokeWidth={10} strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round" transform="rotate(135, 50, 50)" />
      <Circle cx={50} cy={50} r={r} fill="none" stroke="#E8571C" strokeWidth={10} strokeDasharray={`${progress} ${circ - progress}`} strokeLinecap="round" transform="rotate(135, 50, 50)" />
    </Svg>
  );
}

export function AnalyticsScreen() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color="#E8571C" size="large" />
    </SafeAreaView>
  );

  const d = data!;
  const pct = d.thisWeek.totalSlots > 0 ? Math.round((d.thisWeek.filledSlots / d.thisWeek.totalSlots) * 100) : 0;
  const budgetDiff = d.weeklyBudget - d.lastWeekBudget;
  const totalNutri = Object.values(d.nutriscoreDistribution).reduce((a, b) => a + b, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}>

        <Text style={{ fontSize: 26, fontWeight: "900", color: "#1C1917", letterSpacing: -0.4 }}>Statistiques</Text>

        <View style={{ borderRadius: 20, backgroundColor: "#fff", padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 }}>Cette semaine</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <View style={{ alignItems: "center", justifyContent: "center", width: 100, height: 100 }}>
              <CoverageArc filled={d.thisWeek.filledSlots} total={d.thisWeek.totalSlots} />
              <View style={{ position: "absolute", alignItems: "center" }}>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917" }}>{pct}%</Text>
                <Text style={{ fontSize: 9, color: "#78716C", fontWeight: "600" }}>rempli</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: "#78716C" }}>🌅 Petits-déj.</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>{d.thisWeek.breakfastCount}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: "#78716C" }}>☀️ Déjeuners</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>{d.thisWeek.lunchCount}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 13, color: "#78716C" }}>🌙 Dîners</Text>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>{d.thisWeek.dinnerCount}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatCard label="Recettes" value={String(d.allTime.totalRecipes)} sub="créées au total" />
          <StatCard label="Repas planifiés" value={String(d.allTime.totalMealsPlanned)} sub="au total" />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatCard
            label="Budget sem."
            value={d.weeklyBudget > 0 ? `${d.weeklyBudget.toFixed(2)} €` : "—"}
            sub={d.lastWeekBudget > 0 ? `sem. préc.: ${d.lastWeekBudget.toFixed(2)} €` : undefined}
            color={d.weeklyBudget > 0 && budgetDiff > 0.5 ? "#DC2626" : d.weeklyBudget > 0 && budgetDiff < -0.5 ? "#16A34A" : "#1C1917"}
          />
          <StatCard
            label="Contributions prix"
            value={String(d.priceContributionCount)}
            sub="rapportées"
          />
        </View>

        {totalNutri > 0 && (
          <View style={{ borderRadius: 20, backgroundColor: "#fff", padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Nutri-Score · cette semaine</Text>
            {(["A", "B", "C", "D", "E"] as const).map((grade) => {
              const count = d.nutriscoreDistribution[grade];
              const width = totalNutri > 0 ? (count / totalNutri) * 100 : 0;
              return (
                <View key={grade} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 28, height: 20, borderRadius: 6, backgroundColor: NUTRI_COLOR[grade], alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff" }}>{grade}</Text>
                  </View>
                  <View style={{ flex: 1, height: 8, borderRadius: 99, backgroundColor: "#F5F3EF", overflow: "hidden" }}>
                    <View style={{ width: `${width}%`, height: "100%", borderRadius: 99, backgroundColor: NUTRI_COLOR[grade] }} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#78716C", minWidth: 20, textAlign: "right" }}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {d.topRecipes.length > 0 && (
          <View style={{ borderRadius: 20, backgroundColor: "#fff", padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, gap: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Top recettes</Text>
            {d.topRecipes.map((r, i) => (
              <View key={r.recipeId} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#E7E5E4", minWidth: 20 }}>{i + 1}</Text>
                {r.imageUrl ? (
                  <Image source={{ uri: r.imageUrl }} style={{ width: 40, height: 40, borderRadius: 10 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18 }}>🍽️</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }} numberOfLines={1}>{r.recipeName}</Text>
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
                    {r.dietaryTags.slice(0, 3).map((tag) => (
                      <View key={tag} style={{ borderRadius: 99, backgroundColor: "#E8571C1a", paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: "700", color: "#E8571C" }}>{DIETARY_LABELS[tag] ?? tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ borderRadius: 99, backgroundColor: "#F5F3EF", paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#78716C" }}>×{r.count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
