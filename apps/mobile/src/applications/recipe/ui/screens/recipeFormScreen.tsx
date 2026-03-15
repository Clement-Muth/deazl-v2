import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline } from "react-native-svg";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { createRecipe } from "../../application/useCases/createRecipe";
import type { RecipeIngredientInput } from "../../application/useCases/createRecipe";
import { importRecipeFromUrl } from "../../application/useCases/importRecipeFromUrl";
import { updateRecipe } from "../../application/useCases/updateRecipe";
import type { Recipe } from "../../domain/entities/recipe";

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Végétarien" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Sans gluten" },
  { key: "lactose_free", label: "Sans lait" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Casher" },
  { key: "no_pork", label: "Sans porc" },
  { key: "no_seafood", label: "Sans fruits de mer" },
];

const COMMON_UNITS = ["pièce", "g", "kg", "ml", "cl", "L", "càs", "càc", "tasse", "pincée", "tranche"];

const STEPS_LABELS = ["Informations", "Ingrédients", "Préparation"];
const TOTAL_STEPS = 3;

interface Props {
  existingRecipe?: Recipe;
  onSuccess: (id: string) => void;
  onBack: () => void;
}

export function RecipeFormScreen({ existingRecipe, onSuccess, onBack }: Props) {
  const [step, setStep] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  const [name, setName] = useState(existingRecipe?.name ?? "");
  const [description, setDescription] = useState(existingRecipe?.description ?? "");
  const [servings, setServings] = useState(String(existingRecipe?.servings ?? 4));
  const [prepTime, setPrepTime] = useState(existingRecipe?.prepTimeMinutes ? String(existingRecipe.prepTimeMinutes) : "");
  const [cookTime, setCookTime] = useState(existingRecipe?.cookTimeMinutes ? String(existingRecipe.cookTimeMinutes) : "");
  const [dietaryTags, setDietaryTags] = useState<string[]>(existingRecipe?.dietaryTags ?? []);
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>(
    existingRecipe?.ingredients.map((i) => ({ name: i.customName ?? "", quantity: i.quantity, unit: i.unit })) ?? [{ name: "", quantity: 1, unit: "pièce" }]
  );
  const [steps, setSteps] = useState<string[]>(
    existingRecipe?.steps.map((s) => s.description) ?? [""]
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSheet, setImportSheet] = useState(false);
  const [unitSheet, setUnitSheet] = useState<number | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setError(null);
  }, [step]);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    const result = await importRecipeFromUrl(importUrl.trim());
    setImporting(false);
    if ("error" in result) { setError(result.error); return; }
    const r = result.data;
    setName(r.name);
    setDescription(r.description ?? "");
    setServings(String(r.servings));
    setPrepTime(r.prepTimeMinutes ? String(r.prepTimeMinutes) : "");
    setCookTime(r.cookTimeMinutes ? String(r.cookTimeMinutes) : "");
    if (r.ingredients.length > 0) setIngredients(r.ingredients);
    if (r.steps.length > 0) setSteps(r.steps);
    setImportSheet(false);
    setImportUrl("");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const input = {
      name,
      description: description || null,
      servings: parseInt(servings) || 4,
      prepTimeMinutes: prepTime ? parseInt(prepTime) : null,
      cookTimeMinutes: cookTime ? parseInt(cookTime) : null,
      dietaryTags,
      ingredients: ingredients.filter((i) => i.name.trim()),
      steps: steps.filter((s) => s.trim()),
    };
    if (existingRecipe) {
      const err = await updateRecipe(existingRecipe.id, input);
      setSubmitting(false);
      if (err) { setError(err.error); return; }
      onSuccess(existingRecipe.id);
    } else {
      const result = await createRecipe(input);
      setSubmitting(false);
      if (typeof result === "object") { setError(result.error); return; }
      onSuccess(result);
    }
  }

  function goNext() {
    if (step === 1 && !name.trim()) { setError("Le nom est requis"); return; }
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 1) { onBack(); return; }
    setStep((s) => s - 1);
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: "", quantity: 1, unit: "pièce" }]);
  }

  function removeIngredient(i: number) {
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateIngredient(i: number, field: keyof RecipeIngredientInput, value: string | number) {
    setIngredients((prev) => prev.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing));
  }

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function removeStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  const isLastStep = step === TOTAL_STEPS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Pressable onPress={goBack} style={{ padding: 4, marginRight: 8 }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="15 18 9 12 15 6" />
              </Svg>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C99", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 1 }}>
                {existingRecipe ? "Modifier" : "Nouvelle recette"} · {step}/{TOTAL_STEPS}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#1C1917", letterSpacing: -0.3 }}>
                {STEPS_LABELS[step - 1]}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {step === 1 && !existingRecipe && (
                <Pressable
                  onPress={() => setImportSheet(true)}
                  style={{ borderRadius: 12, backgroundColor: "#F5F3EF", paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#78716C" }}>Import URL</Text>
                </Pressable>
              )}
              {isLastStep ? (
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={{ borderRadius: 12, backgroundColor: "#E8571C", paddingHorizontal: 16, paddingVertical: 8, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{existingRecipe ? "Enregistrer" : "Créer"}</Text>
                  }
                </Pressable>
              ) : (
                <Pressable
                  onPress={goNext}
                  style={{ borderRadius: 12, backgroundColor: "#1C1917", paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Suivant</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View
                key={i}
                style={{
                  flex: 1, height: 3, borderRadius: 99,
                  backgroundColor: i < step ? "#E8571C" : "#E7E5E4",
                }}
              />
            ))}
          </View>
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={{ borderRadius: 12, backgroundColor: "#FEE2E2", padding: 12 }}>
              <Text style={{ fontSize: 13, color: "#DC2626", fontWeight: "600" }}>{error}</Text>
            </View>
          )}

          {step === 1 && (
            <>
              <Field label="Nom *">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Poulet rôti aux herbes"
                  placeholderTextColor="#A8A29E"
                  style={inputStyle}
                />
              </Field>
              <Field label="Description">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Une brève description…"
                  placeholderTextColor="#A8A29E"
                  multiline
                  numberOfLines={3}
                  style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
                />
              </Field>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Field label="Personnes" style={{ flex: 1 }}>
                  <TextInput value={servings} onChangeText={setServings} keyboardType="number-pad" style={inputStyle} />
                </Field>
                <Field label="Prép. (min)" style={{ flex: 1 }}>
                  <TextInput value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" placeholder="0" placeholderTextColor="#A8A29E" style={inputStyle} />
                </Field>
                <Field label="Cuisson (min)" style={{ flex: 1 }}>
                  <TextInput value={cookTime} onChangeText={setCookTime} keyboardType="number-pad" placeholder="0" placeholderTextColor="#A8A29E" style={inputStyle} />
                </Field>
              </View>
              <Field label="Régime alimentaire">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {DIETARY_OPTIONS.map((opt) => {
                    const active = dietaryTags.includes(opt.key);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setDietaryTags((prev) => prev.includes(opt.key) ? prev.filter((k) => k !== opt.key) : [...prev, opt.key])}
                        style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: active ? "#E8571C" : "#F5F3EF" }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : "#78716C" }}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              {ingredients.map((ing, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TextInput
                    value={String(ing.quantity)}
                    onChangeText={(v) => updateIngredient(i, "quantity", parseFloat(v) || 1)}
                    keyboardType="decimal-pad"
                    style={[inputStyle, { width: 52, textAlign: "center" }]}
                  />
                  <Pressable onPress={() => setUnitSheet(i)} style={[inputStyle, { width: 72, alignItems: "center", justifyContent: "center" }]}>
                    <Text style={{ fontSize: 13, color: "#1C1917", fontWeight: "600" }}>{ing.unit}</Text>
                  </Pressable>
                  <TextInput
                    value={ing.name}
                    onChangeText={(v) => updateIngredient(i, "name", v)}
                    placeholder="Ingrédient"
                    placeholderTextColor="#A8A29E"
                    style={[inputStyle, { flex: 1 }]}
                  />
                  <Pressable onPress={() => removeIngredient(i)} style={{ padding: 4 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1={18} y1={6} x2={6} y2={18} />
                      <Line x1={6} y1={6} x2={18} y2={18} />
                    </Svg>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addIngredient} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={12} y1={5} x2={12} y2={19} />
                  <Line x1={5} y1={12} x2={19} y2={12} />
                </Svg>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#E8571C" }}>Ajouter un ingrédient</Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              {steps.map((s, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                  <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center", marginTop: 11, flexShrink: 0 }}>
                    <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff" }}>{i + 1}</Text>
                  </View>
                  <TextInput
                    value={s}
                    onChangeText={(v) => setSteps((prev) => prev.map((st, idx) => idx === i ? v : st))}
                    placeholder={`Étape ${i + 1}…`}
                    placeholderTextColor="#A8A29E"
                    multiline
                    style={[inputStyle, { flex: 1, minHeight: 72, textAlignVertical: "top" }]}
                  />
                  <Pressable onPress={() => removeStep(i)} style={{ padding: 4, marginTop: 11 }}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1={18} y1={6} x2={6} y2={18} />
                      <Line x1={6} y1={6} x2={18} y2={18} />
                    </Svg>
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addStep} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={12} y1={5} x2={12} y2={19} />
                  <Line x1={5} y1={12} x2={19} y2={12} />
                </Svg>
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#E8571C" }}>Ajouter une étape</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import URL sheet */}
      <BottomModal isOpen={importSheet} onClose={() => setImportSheet(false)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Importer depuis une URL</Text>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <TextInput
            value={importUrl}
            onChangeText={setImportUrl}
            placeholder="https://www.marmiton.org/…"
            placeholderTextColor="#A8A29E"
            autoCapitalize="none"
            keyboardType="url"
            style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }}
          />
          {importing && <ActivityIndicator color="#E8571C" />}
          {error && <Text style={{ fontSize: 12, color: "#DC2626" }}>{error}</Text>}
          <Pressable
            onPress={handleImport}
            disabled={importing || !importUrl.trim()}
            style={{ borderRadius: 16, backgroundColor: "#E8571C", paddingVertical: 14, alignItems: "center", opacity: (importing || !importUrl.trim()) ? 0.6 : 1 }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{importing ? "Importation…" : "Importer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      {/* Unit picker sheet */}
      <BottomModal isOpen={unitSheet !== null} onClose={() => setUnitSheet(null)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Choisir une unité</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 }}>
          {COMMON_UNITS.map((u) => (
            <Pressable
              key={u}
              onPress={() => { if (unitSheet !== null) updateIngredient(unitSheet, "unit", u); setUnitSheet(null); }}
              style={{
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                backgroundColor: unitSheet !== null && ingredients[unitSheet]?.unit === u ? "#E8571C" : "#F5F3EF",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: unitSheet !== null && ingredients[unitSheet]?.unit === u ? "#fff" : "#1C1917" }}>{u}</Text>
            </Pressable>
          ))}
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = {
  borderRadius: 12,
  backgroundColor: "#fff",
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 14,
  color: "#1C1917" as const,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
};
