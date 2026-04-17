import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import type { CookingSession } from "../../application/types/cookingSession";
import { getSessionForWeek } from "../../application/useCases/getSessionForWeek";
import { consumePendingGeneration } from "../../application/useCases/cookingSessionStore";
import { getIngredientEmoji, getUstensileEmoji } from "../utils/ingredientEmoji";

const NAVY = "#1A1A2E";
const AMBER = "#F59E0B";
const AMBER_DARK = "#D97706";
const GRAY = "#9CA3AF";
const LIGHT = "#F3F4F6";

const ACCENT = "#E8571C";
const PREVIEW_COUNT = 4;

export function BatchCookingQuickScreen() {
  const router = useRouter();
  const [session, setSession] = useState<CookingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [ustensilesExpanded, setUstensilesExpanded] = useState(false);
  const [miseEnPlaceExpanded, setMiseEnPlaceExpanded] = useState(false);
  const [ustensilesChecked, setUstensilesChecked] = useState(false);
  const [miseEnPlaceChecked, setMiseEnPlaceChecked] = useState(false);
  const attemptsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const pending = consumePendingGeneration();
    if (pending) {
      pending
        .then((s) => { if (!cancelled) { setSession(s); setLoading(false); } })
        .catch(() => { if (!cancelled) { setTimedOut(true); setLoading(false); } });
      return () => { cancelled = true; };
    }
    async function poll() {
      const s = await getSessionForWeek();
      if (cancelled) return;
      if (s) { setSession(s); setLoading(false); return; }
      attemptsRef.current += 1;
      if (attemptsRef.current < 15) setTimeout(poll, 2000);
      else { setTimedOut(true); setLoading(false); }
    }
    poll();
    return () => { cancelled = true; };
  }, []);

  function toggleStep(i: number) {
    setCheckedSteps((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: AMBER, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#fff", textAlign: "center" }}>Génération de ton plan…</Text>
      </View>
    );
  }

  if (timedOut || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: NAVY, textAlign: "center" }}>Génération trop longue</Text>
        <Pressable onPress={() => router.dismiss()} style={{ paddingHorizontal: 28, paddingVertical: 14, backgroundColor: AMBER, borderRadius: 100 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalSteps = session.steps.length;
  const doneSteps = checkedSteps.size;
  const timeLabel = session.total_minutes < 60
    ? `${session.total_minutes} min`
    : `${Math.floor(session.total_minutes / 60)}h${session.total_minutes % 60 > 0 ? String(session.total_minutes % 60).padStart(2, "0") : ""}`;

  const totalItems = 2 + totalSteps;
  const doneItems = (ustensilesChecked ? 1 : 0) + (miseEnPlaceChecked ? 1 : 0) + doneSteps;
  const allDone = doneItems === totalItems;
  const progress = totalItems > 0 ? doneItems / totalItems : 0;

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: ACCENT }}>
        <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Animated.View entering={ZoomIn.delay(100).springify()} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(200)} style={{ fontSize: 36, fontWeight: "900", color: "#fff", textAlign: "center", lineHeight: 42, marginBottom: 8 }}>
            Batch cooking{"\n"}terminé !
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(300)} style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 40 }}>
            {session.conservation.length} recette{session.conservation.length > 1 ? "s" : ""} préparée{session.conservation.length > 1 ? "s" : ""} en {timeLabel}
          </Animated.Text>
          <View style={{ width: "100%", gap: 8, marginBottom: 48 }}>
            {session.conservation.map((tip, i) => (
              <Animated.View key={i} entering={FadeInDown.delay(400 + i * 80)} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", flex: 1 }} numberOfLines={1}>{tip.recipe_name}</Text>
              </Animated.View>
            ))}
          </View>
          <Animated.View entering={FadeInUp.delay(400 + session.conservation.length * 80)}>
            <Pressable
              onPress={() => router.dismiss()}
              style={({ pressed }) => ({ backgroundColor: pressed ? "rgba(255,255,255,0.85)" : "#fff", paddingHorizontal: 40, paddingVertical: 18, borderRadius: 100 })}
            >
              <Text style={{ fontSize: 17, fontWeight: "900", color: ACCENT }}>Retour au planning</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable onPress={() => router.dismiss()} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 6L6 18M6 6l12 12" />
            </Svg>
          </Pressable>
          <Text style={{ fontSize: 13, fontWeight: "600", color: GRAY }}>
            {doneItems} / {totalItems} · {timeLabel}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        <Text style={{ fontSize: 28, fontWeight: "900", color: NAVY, lineHeight: 34, marginBottom: 32 }}>
          Voilà ton plan{"\n"}de cuisson !
        </Text>

        {/* Ustensiles */}
        <TimelineItem
          index={0}
          total={totalItems}
          isDone={ustensilesChecked}
          onToggle={() => setUstensilesChecked((v) => !v)}
          recipeLabel={null}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: ustensilesChecked ? GRAY : NAVY, textDecorationLine: ustensilesChecked ? "line-through" : "none", lineHeight: 22 }}>
            Sors tous les ustensiles nécessaires à la préparation.
          </Text>
          {!ustensilesChecked && (
            <View style={{ marginTop: 12, gap: 6 }}>
              {session.ustensiles.slice(0, ustensilesExpanded ? undefined : PREVIEW_COUNT).map((item, i) => {
                const emoji = getUstensileEmoji(item);
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {emoji ? (
                      <Text style={{ fontSize: 20, width: 28 }}>{emoji}</Text>
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: LIGHT, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: GRAY }}>{item.trim().charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 14, color: "#374151" }}>{item}</Text>
                  </View>
                );
              })}
              {session.ustensiles.length > PREVIEW_COUNT && (
                <Pressable onPress={() => setUstensilesExpanded((v) => !v)} style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: AMBER_DARK }}>
                    {ustensilesExpanded ? "Voir moins" : `Voir plus (${session.ustensiles.length - PREVIEW_COUNT})`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </TimelineItem>

        {/* Mise en place */}
        <TimelineItem
          index={1}
          total={totalItems}
          isDone={miseEnPlaceChecked}
          onToggle={() => setMiseEnPlaceChecked((v) => !v)}
          recipeLabel={null}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: miseEnPlaceChecked ? GRAY : NAVY, textDecorationLine: miseEnPlaceChecked ? "line-through" : "none", lineHeight: 22 }}>
            Prépare tous les ingrédients sur le plan de travail !
          </Text>
          {!miseEnPlaceChecked && (
            <View style={{ marginTop: 12, gap: 10 }}>
              {session.mise_en_place.slice(0, miseEnPlaceExpanded ? undefined : PREVIEW_COUNT).map((item, i) => {
                const emoji = getIngredientEmoji(item.ingredient);
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {emoji ? (
                      <Text style={{ fontSize: 20, width: 28 }}>{emoji}</Text>
                    ) : (
                      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: LIGHT, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: GRAY }}>{item.ingredient.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <Text style={{ fontSize: 14, fontWeight: "600", color: NAVY, flex: 1 }}>{item.ingredient}</Text>
                    <Text style={{ fontSize: 13, color: GRAY }}>{item.quantity}</Text>
                  </View>
                );
              })}
              {session.mise_en_place.length > PREVIEW_COUNT && (
                <Pressable onPress={() => setMiseEnPlaceExpanded((v) => !v)} style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: AMBER_DARK }}>
                    {miseEnPlaceExpanded ? "Voir moins" : `Voir plus (${session.mise_en_place.length - PREVIEW_COUNT})`}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </TimelineItem>

        {/* Étapes de cuisson */}
        {session.steps.map((step, i) => {
          const isDone = checkedSteps.has(i);
          const globalIndex = 2 + i;
          return (
            <TimelineItem
              key={i}
              index={globalIndex}
              total={totalItems}
              isDone={isDone}
              onToggle={() => toggleStep(i)}
              recipeLabel={step.recipes_involved.join(" · ")}
            >
              <View style={{ gap: 10 }}>
                {step.description.split("\n\n").map((block, bi) => {
                  const recipeMatch = block.startsWith("[") ? block.match(/^\[([^\]]+)\](.*)$/s) : null;
                  if (recipeMatch) {
                    return (
                      <View key={bi} style={{ gap: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: AMBER_DARK, textTransform: "uppercase", letterSpacing: 0.8 }}>
                          {recipeMatch[1].trim()}
                        </Text>
                        <Text style={{ fontSize: 15, color: isDone ? GRAY : "#374151", lineHeight: 22, textDecorationLine: isDone ? "line-through" : "none" }}>
                          {recipeMatch[2].trim()}
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <Text key={bi} style={{ fontSize: 17, fontWeight: "700", color: isDone ? GRAY : NAVY, lineHeight: 24, textDecorationLine: isDone ? "line-through" : "none" }}>
                      {block.trim()}
                    </Text>
                  );
                })}

                {step.ingredients && step.ingredients.length > 0 && (
                  <View style={{ gap: 6, marginTop: 2 }}>
                    {step.ingredients.map((ing, ii) => {
                      const emoji = getIngredientEmoji(ing.name);
                      return (
                        <View key={ii} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                          {emoji ? (
                            <Text style={{ fontSize: 18, width: 26 }}>{emoji}</Text>
                          ) : (
                            <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: LIGHT, alignItems: "center", justifyContent: "center" }}>
                              <Text style={{ fontSize: 11, fontWeight: "700", color: GRAY }}>{ing.name.charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                          <Text style={{ fontSize: 14, fontWeight: "600", color: isDone ? GRAY : NAVY }}>{ing.name}</Text>
                          <Text style={{ fontSize: 13, color: GRAY }}>{ing.quantity}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {step.duration_minutes != null && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx={12} cy={12} r={10} /><Path d="M12 6v6l4 2" />
                      </Svg>
                      <Text style={{ fontSize: 12, color: GRAY, fontWeight: "600" }}>Minuteur cuisson : {step.duration_minutes} min</Text>
                    </View>
                  )}
                  {step.is_parallel && (
                    <Text style={{ fontSize: 12, color: GRAY, fontWeight: "600" }}>· En parallèle</Text>
                  )}
                </View>
              </View>
            </TimelineItem>
          );
        })}

        {/* Conservation */}
        <View style={{ marginTop: 8, paddingTop: 24, borderTopWidth: 1, borderTopColor: LIGHT }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Conservation</Text>
          {session.conservation.map((tip, i) => (
            <View key={i} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: NAVY, marginBottom: 10 }}>{tip.recipe_name}</Text>
              {tip.fridge_days != null && tip.fridge_days > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Text style={{ fontSize: 18, width: 28 }}>🧊</Text>
                  <Text style={{ fontSize: 14, color: "#374151" }}>{tip.fridge_days} jour{tip.fridge_days > 1 ? "s" : ""} au réfrigérateur</Text>
                </View>
              )}
              {tip.freezer_months != null && tip.freezer_months > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <Text style={{ fontSize: 18, width: 28 }}>❄️</Text>
                  <Text style={{ fontSize: 14, color: "#374151" }}>{tip.freezer_months} mois au congélateur</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Text style={{ fontSize: 18, width: 28 }}>📦</Text>
                <Text style={{ fontSize: 14, color: GRAY }}>{tip.container}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <View style={{ flex: 1, height: 4, backgroundColor: "#F3F4F6", borderRadius: 2 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: allDone ? "#16A34A" : AMBER, width: `${progress * 100}%` }} />
          </View>
          <Text style={{ fontSize: 12, fontWeight: "700", color: allDone ? "#16A34A" : GRAY, minWidth: 52, textAlign: "right" }}>
            {doneItems} / {totalItems}
          </Text>
        </View>
        <Pressable
          onPress={() => allDone && setDone(true)}
          style={({ pressed }) => ({
            borderRadius: 16, paddingVertical: 16, alignItems: "center",
            backgroundColor: allDone ? (pressed ? "#c44010" : ACCENT) : "#F3F4F6",
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: allDone ? "#fff" : "#9CA3AF" }}>
            {allDone ? "Terminer la session 🎉" : `Plus que ${totalItems - doneItems} étape${totalItems - doneItems > 1 ? "s" : ""}`}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function TimelineItem({ index, total, isDone, onToggle, recipeLabel, children }: {
  index: number;
  total: number;
  isDone: boolean;
  onToggle: () => void;
  recipeLabel: string | null;
  children: React.ReactNode;
}) {
  const isLast = index === total - 1;
  return (
    <View style={{ flexDirection: "row", gap: 16, marginBottom: 0 }}>
      <View style={{ alignItems: "center", width: 28 }}>
        <Pressable onPress={onToggle} hitSlop={8}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: isDone ? 0 : 1.5, borderColor: "#D1D5DB", backgroundColor: isDone ? "#16A34A" : "#fff", alignItems: "center", justifyContent: "center" }}>
            {isDone ? (
              <Animated.View entering={ZoomIn.springify()}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 6L9 17l-5-5" />
                </Svg>
              </Animated.View>
            ) : (
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#D1D5DB" }}>{index + 1}</Text>
            )}
          </View>
        </Pressable>
        {!isLast && (
          <View style={{ flex: 1, width: 1, minHeight: 24, borderLeftWidth: 1, borderLeftColor: "#E5E7EB", borderStyle: "dashed", marginTop: 4 }} />
        )}
      </View>

      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 28, paddingTop: 4 }}>
        {recipeLabel && (
          <Text style={{ fontSize: 12, color: GRAY, marginBottom: 4 }} numberOfLines={1}>{recipeLabel}</Text>
        )}
        {children}
      </View>
    </View>
  );
}
