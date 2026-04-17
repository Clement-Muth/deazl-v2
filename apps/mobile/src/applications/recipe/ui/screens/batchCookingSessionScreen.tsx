import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import Animated, { useAnimatedStyle, withTiming, FadeInDown, FadeInUp, SlideInRight, SlideInLeft, ZoomIn } from "react-native-reanimated";
import type { CookingSession, CookingStep, ConservationTip, MiseEnPlaceItem } from "../../application/types/cookingSession";
import { getSessionForWeek } from "../../application/useCases/getSessionForWeek";
import { consumePendingGeneration } from "../../application/useCases/cookingSessionStore";
import { getIngredientEmoji } from "../utils/ingredientEmoji";

const ACCENT = "#E8571C";
const BG = "#FFFFFF";
const SURFACE = "#FFF7F2";
const BORDER = "#F0E6DE";
const TEXT = "#1C1008";
const TEXT_MUTED = "#9B8070";
const TEXT_SUBTLE = "#C4B4A8";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_COLS = 3;
const GRID_GAP = 10;
const GRID_PADDING = 24;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const CATEGORY_COLORS = ["#E8571C", "#16A34A", "#0284C7", "#7C3AED", "#0D9488", "#CA8A04"];
function categoryColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return CATEGORY_COLORS[Math.abs(h) % CATEGORY_COLORS.length];
}

type Phase = 1 | 2 | 3 | 4 | 5;

export function BatchCookingSessionScreen() {
  const router = useRouter();

  const [session, setSession] = useState<CookingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const [phase, setPhase] = useState<Phase>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedUstensiles, setCheckedUstensiles] = useState<Set<number>>(new Set());
  const [checkedMiseEnPlace, setCheckedMiseEnPlace] = useState<Set<number>>(new Set());
  const attemptsRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const pending = consumePendingGeneration();
    if (pending) {
      pending
        .then((s) => { if (!cancelled) { setSession(s); setLoading(false); } })
        .catch(() => {
          if (!cancelled) { setTimedOut(true); setLoading(false); }
        });
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

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 32 }}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT, textAlign: "center" }}>
          Génération de ton plan de cuisson…
        </Text>
        <Text style={{ fontSize: 14, color: TEXT_MUTED, textAlign: "center" }}>
          L'IA optimise les étapes de tes recettes
        </Text>
      </View>
    );
  }

  if (timedOut || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
        <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={TEXT_SUBTLE} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={10} />
          <Path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <Path d="M9 9h.01M15 9h.01" />
        </Svg>
        <Text style={{ fontSize: 18, fontWeight: "800", color: TEXT, textAlign: "center" }}>Génération trop longue</Text>
        <Text style={{ fontSize: 14, color: TEXT_MUTED, textAlign: "center" }}>Réessaie dans quelques instants.</Text>
        <Pressable onPress={() => router.dismiss()} style={{ marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, backgroundColor: ACCENT, borderRadius: 100 }}>
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const entering = direction === "forward" ? SlideInRight.springify() : SlideInLeft.springify();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {phase === 1 && (
        <Animated.View key="phase-1" entering={entering} style={{ flex: 1 }}>
          <Phase1Ustensiles
            ustensiles={session.ustensiles}
            checked={checkedUstensiles}
            onToggle={(i) => setCheckedUstensiles((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
            onNext={() => { setDirection("forward"); setPhase(2); }}
            onClose={() => router.dismiss()}
          />
        </Animated.View>
      )}
      {phase === 2 && (
        <Animated.View key="phase-2" entering={entering} style={{ flex: 1 }}>
          <Phase2MiseEnPlace
            items={session.mise_en_place}
            checked={checkedMiseEnPlace}
            onToggle={(i) => setCheckedMiseEnPlace((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
            onNext={() => { setDirection("forward"); setPhase(3); }}
            onBack={() => { setDirection("back"); setPhase(1); }}
            onClose={() => router.dismiss()}
          />
        </Animated.View>
      )}
      {phase === 3 && (
        <Animated.View key="phase-3" entering={entering} style={{ flex: 1 }}>
          <Phase3Steps
            steps={session.steps}
            stepIndex={stepIndex}
            totalMinutes={session.total_minutes}
            onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
            onNext={() => {
              if (stepIndex < session.steps.length - 1) setStepIndex((i) => i + 1);
              else { setDirection("forward"); setPhase(4); }
            }}
            onClose={() => router.dismiss()}
          />
        </Animated.View>
      )}
      {phase === 4 && (
        <Animated.View key="phase-4" entering={entering} style={{ flex: 1 }}>
          <Phase4Conservation
            conservation={session.conservation}
            onDone={() => { setDirection("forward"); setPhase(5); }}
            onBack={() => { setDirection("back"); setPhase(3); }}
          />
        </Animated.View>
      )}
      {phase === 5 && (
        <Animated.View key="phase-5" entering={entering} style={{ flex: 1 }}>
          <Phase5Done
            recipeCount={session.conservation.length}
            recipeNames={session.conservation.map((c) => c.recipe_name)}
            totalMinutes={session.total_minutes}
            onDone={() => router.dismiss()}
          />
        </Animated.View>
      )}
    </View>
  );
}

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: SURFACE,
        borderWidth: 1, borderColor: BORDER,
        alignItems: "center", justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6L6 18M6 6l12 12" />
      </Svg>
    </Pressable>
  );
}

function NavButton({ label, onPress, variant }: { label: string; onPress: () => void; variant: "back" | "next" }) {
  if (variant === "back") {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: SURFACE,
          borderWidth: 1, borderColor: BORDER,
          alignItems: "center", justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TEXT_MUTED} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 32, paddingVertical: 16, borderRadius: 100,
        backgroundColor: pressed ? "#c44010" : ACCENT,
        flexDirection: "row", alignItems: "center", gap: 6,
      })}
    >
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{label}</Text>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </Pressable>
  );
}

function PhaseHeader({ step, label, onClose }: { step: string; label: string; onClose?: () => void }) {
  return (
    <SafeAreaView edges={["top"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 11, fontWeight: "700", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5 }}>{step}</Text>
          <Text style={{ fontSize: 28, fontWeight: "900", color: TEXT, marginTop: 4, letterSpacing: -0.5 }}>{label}</Text>
        </View>
        {onClose && <CloseButton onPress={onClose} />}
      </View>
    </SafeAreaView>
  );
}

function CheckCircle({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={{
        width: 26, height: 26, borderRadius: 13,
        borderWidth: checked ? 0 : 2, borderColor: BORDER,
        backgroundColor: checked ? ACCENT : "transparent",
        alignItems: "center", justifyContent: "center",
      }}>
        {checked && (
          <Animated.View entering={ZoomIn.springify()}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

function Phase1Ustensiles({ ustensiles, checked, onToggle, onNext, onClose }: {
  ustensiles: string[];
  checked: Set<number>;
  onToggle: (i: number) => void;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <PhaseHeader step="Étape 1 / 4" label="Matériel" onClose={onClose} />
      <Text style={{ fontSize: 14, color: TEXT_MUTED, paddingHorizontal: 20, marginBottom: 8, marginTop: 2 }}>
        Rassemble tout ça avant de commencer
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {ustensiles.map((item, i) => {
          const isChecked = checked.has(i);
          return (
            <Pressable
              key={i}
              onPress={() => onToggle(i)}
              style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: BORDER }}
            >
              <CheckCircle checked={isChecked} onToggle={() => onToggle(i)} />
              <Text style={{ fontSize: 16, color: isChecked ? TEXT_SUBTLE : TEXT, textDecorationLine: isChecked ? "line-through" : "none", flex: 1, fontWeight: "500" }}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: "row", justifyContent: "flex-end" }}>
        <NavButton label="Suivant" onPress={onNext} variant="next" />
      </View>
    </View>
  );
}

function Phase2MiseEnPlace({ items, checked, onToggle, onNext, onBack, onClose }: {
  items: MiseEnPlaceItem[];
  checked: Set<number>;
  onToggle: (i: number) => void;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const byRecipe = items.reduce<Record<string, { item: MiseEnPlaceItem; index: number }[]>>((acc, item, i) => {
    const key = item.recipe_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ item, index: i });
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <PhaseHeader step="Étape 2 / 4" label="Mise en place" onClose={onClose} />
      <Text style={{ fontSize: 14, color: TEXT_MUTED, paddingHorizontal: 20, marginBottom: 8, marginTop: 2 }}>
        Tout ça avant d'allumer le feu
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {Object.entries(byRecipe).map(([recipeName, entries]) => (
          <View key={recipeName} style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <View style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: ACCENT }} />
              <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.2 }}>
                {recipeName}
              </Text>
            </View>
            {entries.map(({ item, index }) => {
              const isChecked = checked.has(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => onToggle(index)}
                  style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER }}
                >
                  <CheckCircle checked={isChecked} onToggle={() => onToggle(index)} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: isChecked ? TEXT_SUBTLE : TEXT, textDecorationLine: isChecked ? "line-through" : "none" }}>
                      {item.quantity} {item.ingredient}
                    </Text>
                    {item.preparation && !isChecked && (
                      <Text style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 3 }}>{item.preparation}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <NavButton label="" onPress={onBack} variant="back" />
        <NavButton label="Cuisiner" onPress={onNext} variant="next" />
      </View>
    </View>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(active ? ACCENT : BORDER, { duration: 300 }),
  }));
  return <Animated.View style={[{ flex: 1, height: 3, borderRadius: 2 }, animatedStyle]} />;
}

function Phase3Steps({ steps, stepIndex, totalMinutes, onPrev, onNext, onClose }: {
  steps: CookingStep[];
  stepIndex: number;
  totalMinutes: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const step = steps[stepIndex];
  if (!step) return null;
  const isLast = stepIndex === steps.length - 1;

  const timeLabel = totalMinutes < 60
    ? `${totalMinutes} min`
    : `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? String(totalMinutes % 60).padStart(2, "0") : ""}`;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "700", color: ACCENT, textTransform: "uppercase", letterSpacing: 1.5 }}>
              Étape {stepIndex + 1} / {steps.length}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "600", color: TEXT_MUTED, marginTop: 2 }}>
              {timeLabel} au total
            </Text>
          </View>
          <CloseButton onPress={onClose} />
        </View>

        <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 20, marginTop: 16 }}>
          {steps.map((_, i) => (
            <ProgressSegment key={i} active={i <= stepIndex} />
          ))}
        </View>

        {step.recipes_involved.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {step.recipes_involved.map((r) => (
              <View key={r} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: SURFACE, borderRadius: 100, borderWidth: 1, borderColor: BORDER }}>
                <Text style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: "600" }} numberOfLines={1}>{r}</Text>
              </View>
            ))}
          </View>
        )}
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View key={stepIndex} entering={FadeInDown.duration(250)}>
          <View style={{ marginBottom: 24, gap: 10 }}>
            {step.description.split("\n\n").map((block, bi) => {
              const isRecipeBlock = block.startsWith("[");
              const recipeMatch = isRecipeBlock ? block.match(/^\[([^\]]+)\](.*)$/s) : null;
              if (recipeMatch) {
                return (
                  <View key={bi} style={{ backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderLeftWidth: 3, borderLeftColor: ACCENT }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: ACCENT, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                      {recipeMatch[1].trim()}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "500", color: TEXT, lineHeight: 24 }}>
                      {recipeMatch[2].trim()}
                    </Text>
                  </View>
                );
              }
              return (
                <Text key={bi} style={{ fontSize: 22, fontWeight: "900", color: TEXT, lineHeight: 30, letterSpacing: -0.3 }}>
                  {block.trim()}
                </Text>
              );
            })}
          </View>

          {step.ingredients && step.ingredients.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: TEXT_SUBTLE, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
                Ingrédients pour cette étape
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
                {step.ingredients.map((ing, i) => {
                  const emoji = getIngredientEmoji(ing.name);
                  const color = categoryColor(ing.name);
                  return (
                    <View
                      key={i}
                      style={{ width: CARD_WIDTH, backgroundColor: SURFACE, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, alignItems: "center", gap: 6, borderWidth: 1, borderColor: BORDER }}
                    >
                      {emoji ? (
                        <Text style={{ fontSize: 28 }}>{emoji}</Text>
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 15, fontWeight: "800", color }}>{ing.name.trim().charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                      <Text style={{ fontSize: 11, fontWeight: "600", color: TEXT_MUTED, textAlign: "center", lineHeight: 15 }} numberOfLines={2}>
                        {ing.name}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: ACCENT }} numberOfLines={1}>
                        {ing.quantity}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {step.duration_minutes != null && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: SURFACE, borderRadius: 100, borderWidth: 1, borderColor: ACCENT + "40" }}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10} />
                  <Path d="M12 6v6l4 2" />
                </Svg>
                <Text style={{ fontSize: 13, color: ACCENT, fontWeight: "700" }}>
                  {step.duration_minutes} min
                </Text>
              </View>
            )}
            {step.temperature && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FFF5F5", borderRadius: 100, borderWidth: 1, borderColor: "#FECACA" }}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </Svg>
                <Text style={{ fontSize: 13, color: "#EF4444", fontWeight: "700" }}>{step.temperature}</Text>
              </View>
            )}
            {step.is_parallel && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FFFBEB", borderRadius: 100, borderWidth: 1, borderColor: "#FDE68A" }}>
                <Text style={{ fontSize: 13, color: "#D97706", fontWeight: "700" }}>En parallèle</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: "row", justifyContent: stepIndex > 0 ? "space-between" : "flex-end", alignItems: "center" }}>
        {stepIndex > 0 && <NavButton label="" onPress={onPrev} variant="back" />}
        <NavButton label={isLast ? "Terminé ✓" : "Suivant"} onPress={onNext} variant="next" />
      </View>
    </View>
  );
}

function Phase4Conservation({ conservation, onDone, onBack }: {
  conservation: ConservationTip[];
  onDone: () => void;
  onBack: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <PhaseHeader step="Étape 4 / 4" label="Conservation" />
      <Text style={{ fontSize: 14, color: TEXT_MUTED, paddingHorizontal: 20, marginBottom: 8, marginTop: 2 }}>
        Mets-les au frais dès qu'ils refroidissent
      </Text>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {conservation.map((tip, i) => (
          <View key={i} style={{ backgroundColor: SURFACE, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: TEXT, marginBottom: 16 }}>{tip.recipe_name}</Text>
            <View style={{ gap: 12 }}>
              {tip.fridge_days != null && tip.fridge_days > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(14,165,233,0.10)", alignItems: "center", justifyContent: "center" }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Rect x={3} y={3} width={18} height={18} rx={2} />
                      <Path d="M3 9h18" />
                      <Path d="M9 21V9" />
                    </Svg>
                  </View>
                  <Text style={{ fontSize: 15, color: TEXT, flex: 1, fontWeight: "500" }}>
                    {tip.fridge_days} jour{tip.fridge_days > 1 ? "s" : ""} au réfrigérateur
                  </Text>
                </View>
              )}
              {tip.freezer_months != null && tip.freezer_months > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(99,102,241,0.10)", alignItems: "center", justifyContent: "center" }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" />
                    </Svg>
                  </View>
                  <Text style={{ fontSize: 15, color: TEXT, flex: 1, fontWeight: "500" }}>
                    {tip.freezer_months} mois au congélateur
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(232,87,28,0.10)", alignItems: "center", justifyContent: "center" }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </Svg>
                </View>
                <Text style={{ fontSize: 15, color: TEXT, flex: 1, fontWeight: "500" }}>{tip.container}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 36, paddingTop: 16, backgroundColor: BG, borderTopWidth: 1, borderTopColor: BORDER, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <NavButton label="" onPress={onBack} variant="back" />
        <NavButton label="Terminé !" onPress={onDone} variant="next" />
      </View>
    </View>
  );
}

function Phase5Done({ recipeCount, recipeNames, totalMinutes, onDone }: {
  recipeCount: number;
  recipeNames: string[];
  totalMinutes: number;
  onDone: () => void;
}) {
  const timeLabel = totalMinutes < 60
    ? `${totalMinutes} min`
    : `${Math.floor(totalMinutes / 60)}h${totalMinutes % 60 > 0 ? String(totalMinutes % 60).padStart(2, "0") : ""}`;

  return (
    <View style={{ flex: 1, backgroundColor: ACCENT }}>
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 0 }}>
        <Animated.View entering={ZoomIn.delay(100).springify()} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 6L9 17l-5-5" />
          </Svg>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(200)} style={{ fontSize: 36, fontWeight: "900", color: "#fff", textAlign: "center", lineHeight: 42, marginBottom: 8 }}>
          Batch cooking{"\n"}terminé !
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300)} style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", textAlign: "center", marginBottom: 40 }}>
          {recipeCount} recette{recipeCount > 1 ? "s" : ""} préparée{recipeCount > 1 ? "s" : ""} en {timeLabel}
        </Animated.Text>

        <View style={{ width: "100%", gap: 10, marginBottom: 48 }}>
          {recipeNames.map((name, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(400 + i * 80)} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff", flex: 1 }} numberOfLines={1}>{name}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(400 + recipeNames.length * 80 + 100)}>
          <Pressable
            onPress={onDone}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "rgba(255,255,255,0.85)" : "#fff",
              paddingHorizontal: 40, paddingVertical: 18, borderRadius: 100,
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "900", color: ACCENT }}>Retour au planning</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
