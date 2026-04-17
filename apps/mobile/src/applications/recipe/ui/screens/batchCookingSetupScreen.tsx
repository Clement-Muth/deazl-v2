"use client";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../../../shared/theme";

const MIN_MEALS = 2;
const MAX_MEALS = 14;
const MIN_PERSONS = 1;
const MAX_PERSONS = 8;

interface RecipeCountOption {
  count: 1 | 2 | 3;
  label: string;
  subtitle: string;
  cost: string;
  time: string;
}

const OPTIONS: RecipeCountOption[] = [
  { count: 1, label: "1 recette", subtitle: "Rapide et économique", cost: "€", time: "~1h" },
  { count: 2, label: "2 recettes", subtitle: "Un peu de variété", cost: "€€", time: "~1h30" },
  { count: 3, label: "3 recettes", subtitle: "Varié et savoureux", cost: "€€€", time: "~2h" },
];

export function BatchCookingSetupScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [mealCount, setMealCount] = useState(4);
  const [persons, setPersons] = useState(2);
  const [recipeCount, setRecipeCount] = useState<1 | 2 | 3>(2);

  function handleConfirmStep1() {
    setStep(2);
  }

  function handleGenerate() {
    router.push({
      pathname: "/batch-cooking/review",
      params: { mealCount: String(mealCount), persons: String(persons), recipeCount: String(recipeCount) },
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 16, paddingBottom: 8 }}>
          <Pressable
            onPress={() => (step === 2 ? setStep(1) : router.dismiss())}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: colors.bgSurface,
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </Pressable>
          <Text style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: "700", color: colors.text }}>
            Nouveau batch cooking
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Step indicator */}
        <View style={{ flexDirection: "row", gap: 6, marginTop: 8, marginBottom: 40 }}>
          <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.accent }} />
          <View style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: step === 2 ? colors.accent : colors.bgSurface }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {step === 1 ? (
            <Step1
              mealCount={mealCount}
              persons={persons}
              onMealCountChange={setMealCount}
              onPersonsChange={setPersons}
              colors={colors}
            />
          ) : (
            <Step2
              recipeCount={recipeCount}
              mealCount={mealCount}
              persons={persons}
              onSelect={setRecipeCount}
              colors={colors}
            />
          )}
        </ScrollView>

      </View>

      {/* Fixed bottom CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 36, paddingTop: 16, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Pressable
          onPress={step === 1 ? handleConfirmStep1 : handleGenerate}
          style={({ pressed }) => ({
            borderRadius: 16, backgroundColor: pressed ? colors.accentPress : colors.accent,
            paddingVertical: 18, alignItems: "center",
          })}
        >
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
            {step === 1 ? "Continuer" : "Générer mon batch cooking"}
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

function Step1({ mealCount, persons, onMealCountChange, onPersonsChange, colors }: {
  mealCount: number;
  persons: number;
  onMealCountChange: (v: number) => void;
  onPersonsChange: (v: number) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  return (
    <View>
      <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5, marginBottom: 8 }}>
        Combien de repas{"\n"}souhaites-tu ?
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 48 }}>
        Lunch + dîner sur la semaine
      </Text>

      {/* Meal count stepper */}
      <View style={{ alignItems: "center", marginBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
          <Pressable
            onPress={() => onMealCountChange(Math.max(MIN_MEALS, mealCount - 1))}
            style={({ pressed }) => ({
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: colors.bgSurface,
              alignItems: "center", justifyContent: "center",
              opacity: pressed || mealCount <= MIN_MEALS ? 0.5 : 1,
            })}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round">
              <Path d="M5 12h14" />
            </Svg>
          </Pressable>

          <View style={{
            width: 140, height: 140, borderRadius: 24,
            backgroundColor: colors.bgSurface,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 72, fontWeight: "900", color: colors.text, letterSpacing: -2 }}>
              {mealCount}
            </Text>
          </View>

          <Pressable
            onPress={() => onMealCountChange(Math.min(MAX_MEALS, mealCount + 1))}
            style={({ pressed }) => ({
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: colors.bgSurface,
              alignItems: "center", justifyContent: "center",
              opacity: pressed || mealCount >= MAX_MEALS ? 0.5 : 1,
            })}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round">
              <Path d="M12 5v14M5 12h14" />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* Persons pill */}
      <View style={{ alignItems: "center", marginBottom: 48 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.accentBg, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: colors.accentBgBorder }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>
            Pour {persons} personne{persons > 1 ? "s" : ""}
          </Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable onPress={() => onPersonsChange(Math.max(MIN_PERSONS, persons - 1))} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent }}>−</Text>
            </Pressable>
            <Pressable onPress={() => onPersonsChange(Math.min(MAX_PERSONS, persons + 1))} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent }}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center" }}>
        Tu vas préparer {mealCount} repas pour {persons} personne{persons > 1 ? "s" : ""} ({mealCount * persons} portions au total).
      </Text>
    </View>
  );
}

function Step2({ recipeCount, mealCount, persons, onSelect, colors }: {
  recipeCount: 1 | 2 | 3;
  mealCount: number;
  persons: number;
  onSelect: (v: 1 | 2 | 3) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
}) {
  const selected = OPTIONS.find((o) => o.count === recipeCount)!;
  return (
    <View>
      <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5, marginBottom: 8 }}>
        Combien de recettes{"\n"}différentes ?
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginBottom: 32 }}>
        {mealCount} repas · {persons} personne{persons > 1 ? "s" : ""}
      </Text>


      <View style={{ gap: 12, marginBottom: 32 }}>
        {OPTIONS.map((opt) => {
          const isSelected = opt.count === recipeCount;
          return (
            <Pressable
              key={opt.count}
              onPress={() => onSelect(opt.count)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center",
                borderRadius: 16,
                backgroundColor: isSelected ? colors.accentBg : colors.bgSurface,
                borderWidth: isSelected ? 2 : 1,
                borderColor: isSelected ? colors.accent : colors.border,
                paddingHorizontal: 20, paddingVertical: 18,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: isSelected ? colors.accent : colors.text }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{opt.subtitle}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: isSelected ? colors.accent : colors.textSubtle }}>{opt.cost}</Text>
                <Text style={{ fontSize: 12, color: colors.textSubtle }}>{opt.time}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center" }}>
        ⏱ Temps de cuisine estimé : {selected.time}
      </Text>
    </View>
  );
}
