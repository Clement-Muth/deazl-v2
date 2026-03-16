import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { BottomSheet, Button, Card, SearchField, Separator } from "heroui-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { supabase } from "../../../../lib/supabase";
import { usePlanning } from "../../api/usePlanning";
import { clearMealSlot } from "../../application/useCases/clearMealSlot";
import { generateShoppingListFromPlan } from "../../application/useCases/generateShoppingListFromPlan";
import { setMealSlot } from "../../application/useCases/setMealSlot";
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

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function getSlot(plan: MealPlanData, dayOfWeek: number, mealType: MealType): MealSlotData {
  return plan.slots.find((s) => s.dayOfWeek === dayOfWeek && s.mealType === mealType) ?? {
    slotId: null, dayOfWeek, mealType, recipeId: null, recipeName: null, servings: 4,
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

interface PickerState { dayOfWeek: number; mealType: MealType; }
interface SlotActionState { dayOfWeek: number; mealType: MealType; recipeId: string; recipeName: string; }
interface SimpleRecipe { id: string; name: string; }

export function PlanningScreen() {
  const { colors } = useAppTheme();
  const today = useMemo(() => new Date(), []);
  const router = useRouter();
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMondayOf(today));
  const { plan, loading, reload } = usePlanning(currentWeekMonday);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const days = getWeekDays(getMondayOf(today));
    const idx = days.findIndex((d) => isSameDay(d, today));
    return idx >= 0 ? idx : 0;
  });
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [slotAction, setSlotAction] = useState<SlotActionState | null>(null);
  const [allRecipes, setAllRecipes] = useState<SimpleRecipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [localPlan, setLocalPlan] = useState<MealPlanData | null>(null);

  useEffect(() => { if (plan) setLocalPlan(plan); }, [plan]);

  useEffect(() => {
    if (!localPlan) return;
    const channel = supabase
      .channel(`meal_slots_mobile:${localPlan.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_slots", filter: `meal_plan_id=eq.${localPlan.id}` },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const s = payload.new as { id: string; day_of_week: number; meal_type: string; recipe_id: string | null; servings: number };
            const name = allRecipes.find((r) => r.id === s.recipe_id)?.name ?? null;
            setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((slot) =>
              slot.dayOfWeek === s.day_of_week && slot.mealType === (s.meal_type as MealType)
                ? { ...slot, slotId: s.id, recipeId: s.recipe_id, recipeName: name, servings: s.servings }
                : slot
            )} : prev);
          } else if (payload.eventType === "DELETE") {
            const s = payload.old as { day_of_week: number; meal_type: string };
            setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((slot) =>
              slot.dayOfWeek === s.day_of_week && slot.mealType === (s.meal_type as MealType)
                ? { ...slot, slotId: null, recipeId: null, recipeName: null }
                : slot
            )} : prev);
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [localPlan?.id, allRecipes]);

  useEffect(() => {
    if (!pickerState) return;
    setRecipesLoading(true);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setRecipesLoading(false); return; }
      supabase.from("recipes").select("id, name").eq("user_id", user.id).order("name")
        .then(({ data }) => { setAllRecipes((data ?? []) as SimpleRecipe[]); setRecipesLoading(false); });
    });
  }, [pickerState]);

  const weekDays = useMemo(() => getWeekDays(currentWeekMonday), [currentWeekMonday]);
  const todayDayIndex = useMemo(() => weekDays.findIndex((d) => isSameDay(d, today)), [weekDays, today]);
  const selectedDayOfWeek = selectedDayIndex + 1;
  const selectedDate = weekDays[selectedDayIndex];
  const isSelectedToday = isSameDay(selectedDate, today);

  const mealFilled = useMemo(() => {
    if (!localPlan) return Array(7).fill([false, false, false]);
    return weekDays.map((_, i) =>
      MEAL_TYPES.map((mt) => !!getSlot(localPlan, i + 1, mt).recipeName)
    );
  }, [localPlan, weekDays]);

  const weekCoverage = useMemo(() => {
    const flat = (mealFilled as boolean[][]).flat();
    return { filled: flat.filter(Boolean).length, total: flat.length };
  }, [mealFilled]);

  const filteredRecipes = useMemo(() => {
    if (!recipeSearch.trim()) return allRecipes;
    const q = normalize(recipeSearch);
    return allRecipes.filter((r) => normalize(r.name).includes(q));
  }, [allRecipes, recipeSearch]);

  const activeSlot = pickerState && localPlan
    ? getSlot(localPlan, pickerState.dayOfWeek, pickerState.mealType)
    : null;

  async function fillSlot(dayOfWeek: number, mealType: MealType, recipeId: string) {
    if (!localPlan) return;
    const recipeName = allRecipes.find((r) => r.id === recipeId)?.name ?? null;
    setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((s) =>
      s.dayOfWeek === dayOfWeek && s.mealType === mealType ? { ...s, recipeId, recipeName } : s
    )} : prev);
    try {
      const { slotId } = await setMealSlot(localPlan.id, dayOfWeek, mealType, recipeId);
      setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((s) =>
        s.dayOfWeek === dayOfWeek && s.mealType === mealType ? { ...s, slotId } : s
      )} : prev);
    } catch { reload(); }
  }

  async function handleClearSlot() {
    if (!pickerState || !activeSlot?.slotId) { setPickerState(null); return; }
    const { dayOfWeek, mealType } = pickerState;
    const slotId = activeSlot.slotId;
    setPickerState(null);
    setLocalPlan((prev) => prev ? { ...prev, slots: prev.slots.map((s) =>
      s.dayOfWeek === dayOfWeek && s.mealType === mealType
        ? { ...s, slotId: null, recipeId: null, recipeName: null } : s
    )} : prev);
    try { await clearMealSlot(slotId); } catch { reload(); }
  }

  async function handleSelectRecipe(recipeId: string) {
    if (!pickerState) return;
    const { dayOfWeek, mealType } = pickerState;
    setPickerState(null);
    setRecipeSearch("");
    await fillSlot(dayOfWeek, mealType, recipeId);
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
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Planning</Text>
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
          <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
            {[
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() - 7); setCurrentWeekMonday(d); setSelectedDayIndex(0); }, path: "M15 18l-6-6 6-6" },
              { onPress: () => { const d = new Date(currentWeekMonday); d.setDate(d.getDate() + 7); setCurrentWeekMonday(d); setSelectedDayIndex(0); }, path: "M9 18l6-6-6-6" },
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

        {/* ── Day strip ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 4 }}
        >
          {weekDays.map((day, i) => {
            const isSelected = i === selectedDayIndex;
            const isToday = isSameDay(day, today);
            const meals = mealFilled[i] as boolean[];

            return (
              <Pressable
                key={i}
                onPress={() => setSelectedDayIndex(i)}
                style={({ pressed }) => ({
                  width: 44, borderRadius: 16, paddingVertical: 10,
                  alignItems: "center", gap: 4,
                  backgroundColor: isSelected ? colors.bgCard : "transparent",
                  shadowColor: isSelected ? "#1C1917" : "transparent",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.08 : 0,
                  shadowRadius: isSelected ? 8 : 0,
                  elevation: isSelected ? 3 : 0,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{
                  fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1,
                  color: isSelected ? colors.accent : colors.textSubtle,
                }}>
                  {DAY_LETTERS[i]}
                </Text>
                <Text style={{
                  fontSize: isSelected ? 22 : 17, fontWeight: "900", lineHeight: isSelected ? 28 : 22,
                  color: isSelected ? colors.accent : isToday ? colors.accent : colors.text,
                }}>
                  {day.getDate()}
                </Text>
                <View style={{ flexDirection: "row", gap: 3 }}>
                  {meals.map((filled, j) => (
                    <View key={j} style={{
                      width: 5, height: 5, borderRadius: 3,
                      backgroundColor: filled
                        ? (isSelected ? colors.accent : "#E8571C60")
                        : (isSelected ? colors.border : "#D6D3D0"),
                    }} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Selected day label ── */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.3 }}>
              {selectedDate.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
            <Text style={{ fontSize: 13, color: isSelectedToday ? colors.accent : colors.textMuted, marginTop: 1, fontWeight: "500" }}>
              {selectedDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            </Text>
          </View>
          {!isSelectedToday && todayDayIndex >= 0 && (
            <Pressable
              onPress={() => setSelectedDayIndex(todayDayIndex)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 5,
                borderRadius: 99, backgroundColor: colors.accent,
                paddingHorizontal: 12, paddingVertical: 7,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                <Line x1={16} y1={2} x2={16} y2={6} />
                <Line x1={8} y1={2} x2={8} y2={6} />
                <Line x1={3} y1={10} x2={21} y2={10} />
              </Svg>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Aujourd'hui</Text>
            </Pressable>
          )}
        </View>

        {/* ── Meal slots card ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Card>
            {MEAL_TYPES.map((mealType, i) => {
              const slot = localPlan ? getSlot(localPlan, selectedDayOfWeek, mealType) : null;
              const hasRecipe = !!slot?.recipeName;
              const { icon, bg } = MEAL_COLORS[mealType];

              return (
                <View key={mealType}>
                  {i > 0 && <Separator />}
                  <Pressable
                    onPress={() => {
                      if (slot?.recipeId && slot.recipeName) {
                        setSlotAction({ dayOfWeek: selectedDayOfWeek, mealType, recipeId: slot.recipeId, recipeName: slot.recipeName });
                      } else {
                        setPickerState({ dayOfWeek: selectedDayOfWeek, mealType });
                      }
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 12,
                      paddingHorizontal: 16, paddingVertical: 14,
                      backgroundColor: pressed ? colors.bgSubtle : "transparent",
                    })}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 12,
                      backgroundColor: hasRecipe ? bg : colors.bgSurface,
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <MealIcon mealType={mealType} color={hasRecipe ? icon : "#C2BDB8"} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                        {MEAL_LABELS[mealType]}
                      </Text>
                      {hasRecipe ? (
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                          {slot!.recipeName}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 13, color: "#C2BDB8" }}>Ajouter une recette</Text>
                      )}
                    </View>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: hasRecipe ? icon : colors.border,
                    }} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
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
      <BottomSheet isOpen={slotAction !== null} onOpenChange={(open) => { if (!open) setSlotAction(null); }}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["32%"]}>
            <View style={{ paddingBottom: 24 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1 }}>
                    {slotAction ? MEAL_LABELS[slotAction.mealType] : ""}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 2 }} numberOfLines={1}>
                    {slotAction?.recipeName}
                  </Text>
                </View>
                <BottomSheet.Close />
              </View>
              <View style={{ gap: 8 }}>
                <Pressable
                  onPress={() => { if (slotAction) { setSlotAction(null); router.push(`/recipe/${slotAction.recipeId}` as never); } }}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
                    backgroundColor: colors.accentBg,
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderWidth: 1.5, borderColor: colors.accentBgBorder,
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
                  onPress={() => { if (slotAction) { const s = slotAction; setSlotAction(null); setPickerState({ dayOfWeek: s.dayOfWeek, mealType: s.mealType }); } }}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14,
                    backgroundColor: colors.bgSurface,
                    paddingHorizontal: 16, paddingVertical: 14,
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
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* ── Recipe picker BottomSheet ── */}
      <BottomSheet
        isOpen={pickerState !== null}
        onOpenChange={(open) => { if (!open) { setPickerState(null); setRecipeSearch(""); } }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["70%"]}>
            <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, marginBottom: 4 }}>
              <View>
                {pickerState && (
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1 }}>
                    {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
                  </Text>
                )}
                <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginTop: 2 }}>
                  {pickerState ? MEAL_LABELS[pickerState.mealType] : ""}
                </Text>
              </View>
              <BottomSheet.Close />
            </View>
            <SearchField value={recipeSearch} onChange={setRecipeSearch}>
              <SearchField.Group className="rounded-2xl">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Rechercher une recette…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {activeSlot?.recipeId && (
                <>
                  <Pressable
                    onPress={handleClearSlot}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 10,
                      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                      backgroundColor: colors.dangerBg, marginBottom: 4,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: "#FECDD3", alignItems: "center", justifyContent: "center" }}>
                      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M3 6h18" /><Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </Svg>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#E11D48" }}>Retirer la recette</Text>
                  </Pressable>
                  <View style={{ marginVertical: 8, height: 1, backgroundColor: colors.bgSurface }} />
                </>
              )}

              {recipesLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <ActivityIndicator color="#E8571C" />
                </View>
              ) : filteredRecipes.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Text style={{ fontSize: 14, color: colors.textSubtle }}>
                    {recipeSearch ? "Aucune recette trouvée" : "Aucune recette"}
                  </Text>
                </View>
              ) : (
                filteredRecipes.map((recipe) => {
                  const isActive = activeSlot?.recipeId === recipe.id;
                  return (
                    <Pressable
                      key={recipe.id}
                      onPress={() => handleSelectRecipe(recipe.id)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 12,
                        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
                        backgroundColor: isActive ? colors.accentBg : pressed ? colors.bgSubtle : "transparent",
                        marginBottom: 2,
                      })}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 12,
                        backgroundColor: isActive ? colors.accent : colors.bgSurface,
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Text style={{ fontSize: 14, fontWeight: "900", color: isActive ? "#fff" : colors.textSubtle }}>
                          {recipe.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text numberOfLines={1} style={{
                        flex: 1, fontSize: 14,
                        fontWeight: isActive ? "700" : "500",
                        color: isActive ? colors.accent : colors.text,
                      }}>
                        {recipe.name}
                      </Text>
                      {isActive && (
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M20 6 9 17l-5-5" />
                        </Svg>
                      )}
                    </Pressable>
                  );
                })
              )}
            </BottomSheetScrollView>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </SafeAreaView>
  );
}
