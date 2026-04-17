import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { BottomModal } from "../../../shopping/ui/components/bottomModal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchRecipesByIds } from "../../../recipe/infrastructure/supabaseRecipeRepository";
import { setPendingEditSuggestions } from "../../../recipe/application/useCases/batchCookingSwapStore";
import { getSessionForWeek } from "../../../recipe/application/useCases/getSessionForWeek";
import { getPreviousSessions, type PreviousSession } from "../../../recipe/application/useCases/getPreviousSessions";
import { CostCard } from "../../../recipe/ui/components/batchCookingCostCard";
import { checkAndUnlockBadges } from "../../../user/application/useCases/checkAndUnlockBadges";
import { setPendingBadges } from "../../../user/application/useCases/pendingBadgeStore";
import { getBadgeStats } from "../../../user/application/useCases/getBadgeStats";
import {
  Animated,
  ActivityIndicator,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { supabase } from "../../../../lib/supabase";
import { usePlanning } from "../../api/usePlanning";
import { clearMealSlot } from "../../application/useCases/clearMealSlot";
import { generateShoppingListFromPlan } from "../../application/useCases/generateShoppingListFromPlan";
import { getStreak } from "../../application/useCases/getStreak";
import { toggleMealDone } from "../../application/useCases/toggleMealDone";
import type { MealPlanData, MealSlotData, MealType } from "../../domain/entities/planning";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
};
const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

const MEAL_COLORS: Record<MealType, { icon: string; bg: string }> = {
  breakfast: { icon: "#D97706", bg: "#FEF3C7" },
  lunch:     { icon: "#E8571C", bg: "#FFF7ED" },
  dinner:    { icon: "#7C3AED", bg: "#EDE9FE" },
};

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function getSlot(plan: MealPlanData, dayOfWeek: number, mealType: MealType): MealSlotData {
  return plan.slots.find((s) => s.dayOfWeek === dayOfWeek && s.mealType === mealType) ?? {
    slotId: null, dayOfWeek, mealType, recipeId: null, recipeName: null, servings: 4, isDone: false,
  };
}

function SunIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={4} />
      <Line x1={12} y1={2} x2={12} y2={4} />
      <Line x1={12} y1={20} x2={12} y2={22} />
      <Line x1={4.93} y1={4.93} x2={6.34} y2={6.34} />
      <Line x1={17.66} y1={17.66} x2={19.07} y2={19.07} />
      <Line x1={2} y1={12} x2={4} y2={12} />
      <Line x1={20} y1={12} x2={22} y2={12} />
      <Line x1={4.93} y1={19.07} x2={6.34} y2={17.66} />
      <Line x1={17.66} y1={6.34} x2={19.07} y2={4.93} />
    </Svg>
  );
}

function ForkIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <Path d="M7 2v20" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </Svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  );
}

function MealIcon({ mealType, color }: { mealType: MealType; color: string }) {
  if (mealType === "breakfast") return <SunIcon color={color} />;
  if (mealType === "lunch") return <ForkIcon color={color} />;
  return <MoonIcon color={color} />;
}

const COL_W = 90;
const ROW_H = 80;
const LABEL_W = 48;

interface SlotActionState { dayOfWeek: number; mealType: MealType; recipeId: string; recipeName: string; }

function WeekGrid({
  localPlan, weekDays, today, onCellPress, gridLoading,
}: {
  localPlan: MealPlanData | null;
  weekDays: Date[];
  today: Date;
  onCellPress: (dayOfWeek: number, mealType: MealType, slot: MealSlotData | null) => void;
  gridLoading: boolean;
}) {
  const { colors } = useAppTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!gridLoading) { shimmer.setValue(0); return; }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [gridLoading]);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4 }}>
      <View>
        <View style={{ flexDirection: "row", marginLeft: LABEL_W, marginBottom: 6 }}>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <View key={i} style={{ width: COL_W, alignItems: "center", gap: 2 }}>
                <Text style={{ fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2, color: isToday ? colors.accent : colors.textSubtle }}>
                  {DAY_LETTERS[i]}
                </Text>
                <Text style={{ fontSize: 17, fontWeight: "900", color: isToday ? colors.accent : colors.text }}>
                  {day.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        {MEAL_TYPES.map((mealType, rowIdx) => {
          const { icon, bg } = MEAL_COLORS[mealType];
          const shortLabel = mealType === "breakfast" ? "Matin" : mealType === "lunch" ? "Midi" : "Soir";
          return (
            <View key={mealType} style={{ flexDirection: "row", marginBottom: rowIdx < 2 ? 6 : 0 }}>
              <View style={{ width: LABEL_W, justifyContent: "center", alignItems: "flex-start", paddingRight: 6, gap: 3 }}>
                <MealIcon mealType={mealType} color={icon} />
                <Text style={{ fontSize: 9, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  {shortLabel}
                </Text>
              </View>
              {weekDays.map((day, dayIdx) => {
                const dayOfWeek = dayIdx + 1;
                const slot = (!gridLoading && localPlan) ? getSlot(localPlan, dayOfWeek, mealType) : null;
                const hasRecipe = !!slot?.recipeName;
                const isDone = slot?.isDone ?? false;
                const isToday = isSameDay(day, today);
                if (gridLoading) {
                  return (
                    <Animated.View
                      key={dayIdx}
                      style={{
                        width: COL_W - 6, height: ROW_H, marginRight: 6,
                        borderRadius: 14,
                        backgroundColor: colors.bgSurface,
                        opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] }),
                        alignItems: "center", justifyContent: "center", gap: 6, padding: 10,
                      }}
                    >
                      <View style={{ width: "80%", height: 7, borderRadius: 4, backgroundColor: colors.border }} />
                      <View style={{ width: "55%", height: 7, borderRadius: 4, backgroundColor: colors.border }} />
                    </Animated.View>
                  );
                }
                return (
                  <Pressable
                    key={dayIdx}
                    onPress={() => onCellPress(dayOfWeek, mealType, slot)}
                    style={({ pressed }) => ({
                      width: COL_W - 6, height: ROW_H, marginRight: 6,
                      borderRadius: 14,
                      backgroundColor: hasRecipe ? (isDone ? "#DCFCE7" : bg) : colors.bgCard,
                      borderWidth: isToday && !hasRecipe ? 1.5 : 0,
                      borderColor: colors.accent + "50",
                      alignItems: "center", justifyContent: "center",
                      padding: 6,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    {hasRecipe ? (
                      <>
                        {isDone && (
                          <View style={{ position: "absolute", top: 6, right: 6 }}>
                            <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M20 6 9 17l-5-5" />
                            </Svg>
                          </View>
                        )}
                        <Text numberOfLines={3} style={{ fontSize: 11, fontWeight: "700", color: isDone ? "#16A34A" : icon, textAlign: "center", lineHeight: 15 }}>
                          {slot!.recipeName}
                        </Text>
                      </>
                    ) : (
                      <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={isToday ? colors.accent + "80" : colors.border} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 5v14M5 12h14" />
                      </Svg>
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function PlanningScreen() {
  const { colors } = useAppTheme();
  const today = useMemo(() => new Date(), []);
  const router = useRouter();
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMondayOf(today));
  const { plan, loading, reload } = usePlanning(currentWeekMonday);
  const [slotAction, setSlotAction] = useState<SlotActionState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [modifying, setModifying] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [modePickerOpen, setModePickerOpen] = useState(false);
  const [slotRecipeImages, setSlotRecipeImages] = useState<Record<string, string | null>>({});
  const [localPlan, setLocalPlan] = useState<MealPlanData | null>(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [previousSessions, setPreviousSessions] = useState<PreviousSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PreviousSession | null>(null);
  const [sessionCostOpen, setSessionCostOpen] = useState(false);
  const [monthlyProgress, setMonthlyProgress] = useState<{ done: number; goal: number }>({ done: 0, goal: 4 });

  useEffect(() => { if (plan !== undefined) { setLocalPlan(plan); setGridLoading(false); } }, [plan]);
  useEffect(() => { getStreak().then(setStreak); }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));
  useFocusEffect(useCallback(() => {
    getSessionForWeek().then((s) => setHasSession(s !== null));
    getPreviousSessions(5).then(setPreviousSessions);
    getBadgeStats().then((stats) => {
      setMonthlyProgress({ done: stats.sessionsThisMonth, goal: stats.monthlyGoal });
    });
    checkAndUnlockBadges().then((newBadges) => {
      if (newBadges.length > 0) {
        setPendingBadges(newBadges);
        router.push("/badge-unlock" as never);
      }
    }).catch(() => null);
  }, []));

  useEffect(() => {
    if (!localPlan) return;
    const channel = supabase
      .channel(`meal_slots_mobile:${localPlan.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_slots", filter: `meal_plan_id=eq.${localPlan.id}` },
        () => { reload(); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [localPlan?.id]);

  const weekDays = useMemo(() => getWeekDays(currentWeekMonday), [currentWeekMonday]);
  const isCurrentWeek = isSameDay(currentWeekMonday, getMondayOf(today));

  const uniqueSlotRecipes = useMemo(() => {
    if (!localPlan) return [];
    const seen = new Set<string>();
    const result: { id: string; name: string; portions: number }[] = [];
    for (const slot of localPlan.slots) {
      if (slot.recipeId && slot.recipeName && !seen.has(slot.recipeId)) {
        seen.add(slot.recipeId);
        const portions = localPlan.slots.filter((s) => s.recipeId === slot.recipeId).length;
        result.push({ id: slot.recipeId, name: slot.recipeName, portions });
      }
    }
    return result;
  }, [localPlan]);

  useEffect(() => {
    if (uniqueSlotRecipes.length === 0) return;
    fetchRecipesByIds(uniqueSlotRecipes.map((r) => r.id)).then((recipes) => {
      setSlotRecipeImages(Object.fromEntries(recipes.map((r) => [r.id, r.imageUrl ?? null])));
    });
  }, [uniqueSlotRecipes.map((r) => r.id).join(",")]);


  const weekCoverage = useMemo(() => {
    if (!localPlan) return { filled: 0, total: 21 };
    const slots = weekDays.flatMap((_, i) => MEAL_TYPES.map((mt) => !!getSlot(localPlan, i + 1, mt).recipeName));
    return { filled: slots.filter(Boolean).length, total: slots.length };
  }, [localPlan, weekDays]);

  function handleCellPress(dayOfWeek: number, mealType: MealType, slot: MealSlotData | null) {
    if (slot?.recipeId && slot.recipeName) {
      setSlotAction({ dayOfWeek, mealType, recipeId: slot.recipeId, recipeName: slot.recipeName });
    } else if (localPlan) {
      router.push({ pathname: "/planning/pick-recipe", params: {
        dayOfWeek: String(dayOfWeek),
        mealType,
        mealPlanId: localPlan.id,
        dateStr: weekDays[dayOfWeek - 1].toISOString(),
      } } as never);
    }
  }

  async function handleToggleDone(slot: MealSlotData) {
    if (!slot.slotId) return;
    const next = !slot.isDone;
    setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((s) =>
      s.slotId === slot.slotId ? { ...s, isDone: next } : s
    )} : prev);
    await toggleMealDone(slot.slotId, next);
    getStreak().then(setStreak);
    checkAndUnlockBadges().then((newBadges) => {
      if (newBadges.length > 0) {
        setPendingBadges(newBadges);
        router.push("/badge-unlock" as never);
      }
    }).catch(() => null);
  }

  async function handleModify() {
    if (modifying || uniqueSlotRecipes.length === 0) return;
    setModifying(true);
    const recipes = await fetchRecipesByIds(uniqueSlotRecipes.map((r) => r.id));
    const suggestions = uniqueSlotRecipes.map((r) => {
      const recipe = recipes.find((rec) => rec.id === r.id);
      if (!recipe) return null;
      return { recipe, portions: r.portions };
    }).filter(Boolean) as { recipe: import("../../../recipe/domain/entities/recipe").Recipe; portions: number }[];
    setPendingEditSuggestions(suggestions);
    setModifying(false);
    router.push({
      pathname: "/batch-cooking/review",
      params: {
        mealCount: String(weekCoverage.filled),
        persons: String(localPlan?.slots.find((s) => s.recipeId)?.servings ?? 2),
        recipeCount: String(Math.min(3, uniqueSlotRecipes.length) as 1 | 2 | 3),
      },
    });
  }

  async function handleGenerateShoppingList() {
    setGenerating(true);
    setGenerateResult(null);
    try {
      await generateShoppingListFromPlan();
      router.navigate("/(tabs)/shopping" as never);
    } catch (err) {
      setGenerateResult({ ok: false, msg: err instanceof Error ? err.message : "Une erreur est survenue." });
      setTimeout(() => setGenerateResult(null), 4000);
    } finally { setGenerating(false); }
  }

  if (loading && !localPlan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8571C" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Accueil</Text>
              {streak > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF3C7", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth={1}>
                    <Path d="M12 2c0 0-5 5.5-5 10a5 5 0 0 0 10 0C17 7.5 12 2 12 2zm0 13a2 2 0 0 1-2-2c0-2 2-4.5 2-4.5s2 2.5 2 4.5a2 2 0 0 1-2 2z" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#D97706" }}>{streak}j</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{formatWeekRange(currentWeekMonday)}</Text>
            {weekCoverage.filled > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                <View style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: colors.bgSurface }}>
                  <View style={{
                    height: 4, borderRadius: 99, backgroundColor: colors.accent,
                    width: `${(weekCoverage.filled / weekCoverage.total) * 100}%`,
                  }} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle }}>
                  {weekCoverage.filled}/{weekCoverage.total}
                </Text>
              </View>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center" }}>
            {!isSameDay(currentWeekMonday, getMondayOf(today)) && (
              <Pressable
                onPress={() => { setGridLoading(true); setCurrentWeekMonday(getMondayOf(today)); }}
                style={({ pressed }) => ({
                  height: 34, paddingHorizontal: 12, borderRadius: 10,
                  backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accentBgBorder,
                  alignItems: "center", justifyContent: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>Aujourd'hui</Text>
              </Pressable>
            )}
            {[
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() - 7); setGridLoading(true); setCurrentWeekMonday(d); }, path: "M15 18l-6-6 6-6" },
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() + 7); setGridLoading(true); setCurrentWeekMonday(d); }, path: "M9 18l6-6-6-6" },
            ].map(({ onPress, path }, idx) => (
              <Pressable key={idx} onPress={onPress} style={({ pressed }) => ({
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center",
                shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
                opacity: pressed ? 0.7 : 1,
              })}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d={path} />
                </Svg>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Batch cooking hero card ── */}
        {isCurrentWeek && loading ? (
          <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 22, backgroundColor: colors.bgCard, padding: 24, height: 172, overflow: "hidden", gap: 12 }}>
            <View style={{ width: "40%", height: 10, borderRadius: 5, backgroundColor: colors.bgSurface }} />
            <View style={{ width: "78%", height: 18, borderRadius: 5, backgroundColor: colors.bgSurface }} />
            <View style={{ width: "55%", height: 14, borderRadius: 5, backgroundColor: colors.bgSurface }} />
            <View style={{ width: 120, height: 38, borderRadius: 12, backgroundColor: colors.bgSurface, marginTop: 4 }} />
          </View>
        ) : isCurrentWeek && weekCoverage.filled === 0 ? (
          <Pressable
            onPress={() => router.push("/batch-cooking/setup")}
            style={({ pressed }) => ({
              marginHorizontal: 16, marginTop: 16, borderRadius: 22,
              backgroundColor: colors.accent,
              padding: 24,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
              BATCH COOKING
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5, lineHeight: 30, marginBottom: 10 }}>
              Prépare ta semaine{"\n"}en une session
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 19, marginBottom: 22 }}>
              Cuisine une fois, mange toute la semaine.
            </Text>
            <View style={{ alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.accent }}>Démarrer →</Text>
            </View>
          </Pressable>
        ) : isCurrentWeek ? (
          <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 22, backgroundColor: colors.accentBg, borderWidth: 1.5, borderColor: colors.accentBgBorder, overflow: "hidden" }}>
            <View style={{ padding: 22, paddingBottom: 18 }}>
              <View style={{ flexDirection: "row", marginBottom: 16 }}>
                {uniqueSlotRecipes.slice(0, 3).map((r, i) => {
                  const img = slotRecipeImages[r.id];
                  return (
                    <View
                      key={r.id}
                      style={{
                        width: 46, height: 46, borderRadius: 23,
                        backgroundColor: colors.accentBgBorder,
                        borderWidth: 2.5, borderColor: colors.accentBg,
                        marginLeft: i > 0 ? -14 : 0,
                        alignItems: "center", justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {img ? (
                        <Image source={{ uri: img }} style={{ width: 46, height: 46, borderRadius: 23 }} resizeMode="cover" />
                      ) : (
                        <Text style={{ fontSize: 17, fontWeight: "900", color: colors.accent }}>
                          {r.name.trim().charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, letterSpacing: -0.5, lineHeight: 28, marginBottom: 6 }}>
                Ton batch cooking est prêt !
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }} numberOfLines={2}>
                {weekCoverage.filled} repas · {uniqueSlotRecipes.slice(0, 2).map((r) => r.name).join(", ")}{uniqueSlotRecipes.length > 2 ? ` et ${uniqueSlotRecipes.length - 2} autre${uniqueSlotRecipes.length - 2 > 1 ? "s" : ""}` : ""}
              </Text>
            </View>
            <Pressable
              onPress={() => setModePickerOpen(true)}
              style={({ pressed }) => ({
                marginHorizontal: 16, marginBottom: 10, backgroundColor: colors.accent, borderRadius: 14,
                paddingVertical: 14, paddingHorizontal: 16,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </Svg>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
                Je passe aux fourneaux
              </Text>
            </Pressable>
            <Pressable
              onPress={handleModify}
              disabled={modifying}
              style={({ pressed }) => ({
                marginHorizontal: 16, marginBottom: 20, backgroundColor: colors.bgCard,
                borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
                paddingVertical: 14, paddingHorizontal: 16,
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                opacity: pressed || modifying ? 0.8 : 1,
              })}
            >
              {modifying ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Svg>
              )}
              <Text style={{ fontSize: 14, fontWeight: "800", color: colors.accent }}>
                Modifier le batch cooking
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── Objectif du mois ── */}
        <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: colors.bgCard, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
              Objectif du mois
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {Array.from({ length: monthlyProgress.goal }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: i < monthlyProgress.done ? colors.accent : colors.bgSurface,
                    borderWidth: i < monthlyProgress.done ? 0 : 1.5,
                    borderColor: colors.border,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {i < monthlyProgress.done && (
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6L9 17l-5-5" />
                    </Svg>
                  )}
                </View>
              ))}
            </View>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: monthlyProgress.done >= monthlyProgress.goal ? colors.accent : colors.text }}>
            {monthlyProgress.done}<Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSubtle }}>/{monthlyProgress.goal}</Text>
          </Text>
        </View>

        {/* ── Week grid ── */}
        <View style={{ marginTop: 8, marginBottom: 8 }}>
          <WeekGrid
            localPlan={localPlan}
            weekDays={weekDays}
            today={today}
            onCellPress={handleCellPress}
            gridLoading={gridLoading}
          />
        </View>

        {/* ── Generate shopping list ── */}
        {weekCoverage.filled > 0 && (
          <View style={{ paddingHorizontal: 16, marginTop: 8, gap: 8 }}>
            <Button
              variant="primary"
              className="w-full rounded-2xl"
              onPress={handleGenerateShoppingList}
              isDisabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <Line x1={3} y1={6} x2={21} y2={6} />
                  <Path d="M16 10a4 4 0 0 1-8 0" />
                </Svg>
              )}
              <Button.Label>{generating ? "Génération…" : "Générer ma liste de courses"}</Button.Label>
            </Button>
            {generateResult && (
              <View style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.dangerBg }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.danger, textAlign: "center" }}>
                  {generateResult.msg}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Précédentes préparations ── */}
        {previousSessions.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Précédentes préparations
              </Text>
              <Pressable onPress={() => router.push("/batch-cooking/history" as never)}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Tout voir</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingRight: 16 }}>
              {previousSessions.map((session) => {
                const recipesLabel = session.recipeNames.join(", ");
                const dateLabel = "Session du " + new Date(session.weekStart + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => setSelectedSession(session)}
                    style={({ pressed }) => ({
                      width: 200, backgroundColor: colors.bgCard, borderRadius: 18, padding: 16,
                      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
                      opacity: pressed ? 0.75 : 1,
                    })}
                  >
                    <View style={{ flexDirection: "row", marginBottom: 12 }}>
                      {session.recipeImages.slice(0, 3).map((img, i) => (
                        <View
                          key={i}
                          style={{
                            width: 38, height: 38, borderRadius: 19,
                            backgroundColor: "#FCDCC8",
                            borderWidth: 2, borderColor: colors.bgCard,
                            marginLeft: i > 0 ? -12 : 0,
                            alignItems: "center", justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {img ? (
                            <Image source={{ uri: img }} style={{ width: 38, height: 38 }} resizeMode="cover" />
                          ) : (
                            <Text style={{ fontSize: 14, fontWeight: "900", color: colors.accent }}>
                              {(session.recipeNames[i] ?? "?").trim().charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
                      {dateLabel}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSubtle, lineHeight: 17 }} numberOfLines={2}>
                      {recipesLabel}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => router.push("/batch-cooking/history" as never)}
                style={({ pressed }) => ({
                  width: 120, backgroundColor: colors.bgCard, borderRadius: 18, padding: 16,
                  alignItems: "center", justifyContent: "center", gap: 8,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSubtle, textAlign: "center" }}>
                  Voir{"\n"}l'historique
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Slot action sheet (when slot is filled) ── */}
      <BottomModal isOpen={slotAction !== null} onClose={() => setSlotAction(null)} height="auto">
        <View style={{ paddingBottom: 8 }}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1 }}>
              {slotAction ? MEAL_LABELS[slotAction.mealType] : ""}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 2 }} numberOfLines={1}>
              {slotAction?.recipeName}
            </Text>
          </View>
          <View style={{ gap: 8 }}>
            <Pressable
              onPress={() => { if (slotAction) { setSlotAction(null); router.push(`/recipe/${slotAction.recipeId}` as never); } }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
                backgroundColor: colors.accentBg,
                paddingHorizontal: 16, paddingVertical: 14,
                borderWidth: 1.5, borderColor: colors.accentBgBorder,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle cx={12} cy={12} r={3} />
                </Svg>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>Voir la recette</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!slotAction || !localPlan) return;
                const s = slotAction;
                setSlotAction(null);
                router.push({ pathname: "/planning/pick-recipe", params: {
                  dayOfWeek: String(s.dayOfWeek),
                  mealType: s.mealType,
                  mealPlanId: localPlan.id,
                  dateStr: weekDays[s.dayOfWeek - 1].toISOString(),
                } } as never);
              }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
                backgroundColor: colors.bgSurface,
                paddingHorizontal: 16, paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Svg>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Changer la recette</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                if (!slotAction) return;
                const slot = localPlan?.slots.find((s) => s.dayOfWeek === slotAction.dayOfWeek && s.mealType === slotAction.mealType);
                if (!slot?.slotId) { setSlotAction(null); return; }
                const { dayOfWeek, mealType } = slotAction;
                const slotId = slot.slotId;
                setSlotAction(null);
                setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((s) =>
                  s.dayOfWeek === dayOfWeek && s.mealType === mealType
                    ? { ...s, slotId: null, recipeId: null, recipeName: null } : s
                )} : prev);
                try { await clearMealSlot(slotId); } catch { reload(); }
              }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
                backgroundColor: colors.dangerBg,
                paddingHorizontal: 16, paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#FECDD3", alignItems: "center", justifyContent: "center" }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 6h18" /><Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </Svg>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#E11D48" }}>Vider le créneau</Text>
            </Pressable>
          </View>
        </View>
      </BottomModal>

      <BottomModal isOpen={modePickerOpen} onClose={() => setModePickerOpen(false)} height="auto">
        <View style={{ paddingBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 6 }}>
            Comment veux-tu cuisiner ?
          </Text>
          <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>
            Choisis ton mode pour cette session
          </Text>

          <Pressable
            onPress={() => {
              setModePickerOpen(false);
              if (hasSession) router.push("/batch-cooking/session" as never);
            }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: pressed ? colors.accentBg : colors.bgSurface,
              borderRadius: 16, padding: 16, marginBottom: 10,
              opacity: hasSession ? 1 : 0.45,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accent + "18", alignItems: "center", justifyContent: "center" }}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2L2 7l10 5 10-5-10-5z" />
                <Path d="M2 17l10 5 10-5" />
                <Path d="M2 12l10 5 10-5" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 3 }}>Mode guidé</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>
                {hasSession ? "Étapes fusionnées et optimisées par l'IA" : "Génération en cours…"}
              </Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </Pressable>

          <Pressable
            onPress={() => {
              setModePickerOpen(false);
              router.push("/batch-cooking/quick" as never);
            }}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: pressed ? colors.accentBg : colors.bgSurface,
              borderRadius: 16, padding: 16,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#F59E0B18", alignItems: "center", justifyContent: "center" }}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 3 }}>Mode rapide</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, lineHeight: 18 }}>Toutes les recettes à plat, étapes checkables</Text>
            </View>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 18l6-6-6-6" />
            </Svg>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={selectedSession !== null} onClose={() => { setSelectedSession(null); setSessionCostOpen(false); }} height="auto">
        {selectedSession && (
          <View style={{ paddingBottom: 8 }}>
            <Text style={{ fontSize: 17, fontWeight: "900", color: colors.text, marginBottom: 4 }}>
              {"Session du " + new Date(selectedSession.weekStart + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
              {selectedSession.recipeIds.length} recette{selectedSession.recipeIds.length > 1 ? "s" : ""}
            </Text>
            <View>
              {selectedSession.recipeIds.map((id, i) => (
                <Pressable
                  key={id}
                  onPress={() => {
                    setSelectedSession(null);
                    setSessionCostOpen(false);
                    router.push({ pathname: "/batch-cooking/recipe-view", params: { id } } as never);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingVertical: 12,
                    borderTopWidth: i > 0 ? 1 : 0,
                    borderTopColor: colors.bgSurface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: "#FCDCC8", overflow: "hidden",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {selectedSession.recipeImages[i] ? (
                      <Image source={{ uri: selectedSession.recipeImages[i]! }} style={{ width: 44, height: 44 }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: "900", color: colors.accent }}>
                        {(selectedSession.recipeNames[i] ?? "?").trim().charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}>
                    {selectedSession.recipeNames[i] ?? "Recette inconnue"}
                  </Text>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setSessionCostOpen((v) => !v)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingVertical: 13, marginTop: 8,
                backgroundColor: pressed ? colors.bgSurface : colors.accentBg,
                borderRadius: 14, paddingHorizontal: 14,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </Svg>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>Estimation du coût</Text>
              </View>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                {sessionCostOpen ? <Path d="M18 15l-6-6-6 6" /> : <Path d="M6 9l6 6 6-6" />}
              </Svg>
            </Pressable>
            {sessionCostOpen && (
              <View style={{ marginTop: 8, borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
                <CostCard session={selectedSession} colors={colors} />
              </View>
            )}
          </View>
        )}
      </BottomModal>

    </SafeAreaView>
  );
}
