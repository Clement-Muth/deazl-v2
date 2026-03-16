import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { BottomModal } from "../../../shopping/ui/components/bottomModal";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  localPlan, weekDays, today, onCellPress,
}: {
  localPlan: MealPlanData | null;
  weekDays: Date[];
  today: Date;
  onCellPress: (dayOfWeek: number, mealType: MealType, slot: MealSlotData | null) => void;
}) {
  const { colors } = useAppTheme();
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
                const slot = localPlan ? getSlot(localPlan, dayOfWeek, mealType) : null;
                const hasRecipe = !!slot?.recipeName;
                const isDone = slot?.isDone ?? false;
                const isToday = isSameDay(day, today);
                return (
                  <Pressable
                    key={dayIdx}
                    onPress={() => onCellPress(dayOfWeek, mealType, slot)}
                    style={({ pressed }) => ({
                      width: COL_W - 6, height: ROW_H, marginRight: 6,
                      borderRadius: 14,
                      backgroundColor: hasRecipe
                        ? (isDone ? "#DCFCE7" : bg)
                        : colors.bgCard,
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
  const [localPlan, setLocalPlan] = useState<MealPlanData | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => { if (plan) setLocalPlan(plan); }, [plan]);
  useEffect(() => { getStreak().then(setStreak); }, []);
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

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
  }

  async function handleGenerateShoppingList() {
    setGenerating(true);
    setGenerateResult(null);
    try {
      await generateShoppingListFromPlan();
      setGenerateResult({ ok: true, msg: "Liste de courses générée ✓" });
      setTimeout(() => setGenerateResult(null), 3000);
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
              <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Planning</Text>
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
                onPress={() => { setLocalPlan(null); setCurrentWeekMonday(getMondayOf(today)); }}
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
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() - 7); setLocalPlan(null); setCurrentWeekMonday(d); }, path: "M15 18l-6-6 6-6" },
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() + 7); setLocalPlan(null); setCurrentWeekMonday(d); }, path: "M9 18l6-6-6-6" },
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

        {/* ── Week grid ── */}
        <View style={{ marginTop: 8, marginBottom: 20 }}>
          <WeekGrid
            localPlan={localPlan}
            weekDays={weekDays}
            today={today}
            onCellPress={handleCellPress}
          />
        </View>

        {/* ── Generate shopping list ── */}
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
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
            <Button.Label>{generating ? "Génération…" : "Générer la liste de courses"}</Button.Label>
          </Button>
          {generateResult && (
            <View style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: generateResult.ok ? colors.greenBg : colors.dangerBg }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: generateResult.ok ? colors.green : colors.danger, textAlign: "center" }}>
                {generateResult.msg}
              </Text>
            </View>
          )}
        </View>
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

    </SafeAreaView>
  );
}
