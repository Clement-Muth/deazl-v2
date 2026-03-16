import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { BottomModal } from "../../../shopping/ui/components/bottomModal";
import { createRecipe } from "../../application/useCases/createRecipe";
import type { RecipeIngredientInput, RecipeStepInput } from "../../application/useCases/createRecipe";
import { importRecipeFromUrl } from "../../application/useCases/importRecipeFromUrl";
import { updateRecipe } from "../../application/useCases/updateRecipe";
import { uploadRecipeImage } from "../../application/useCases/uploadRecipeImage";
import type { Recipe, RecipeIngredient, RecipeStep } from "../../domain/entities/recipe";

let _nextId = 0;
function newId() { return _nextId++; }

type FormItem =
  | { id: number; type: "ingredient"; name: string; quantity: string; unit: string }
  | { id: number; type: "section"; name: string };

type StepFormItem =
  | { id: number; type: "step"; description: string }
  | { id: number; type: "section"; name: string };

function buildFormItems(ingredients: RecipeIngredient[]): FormItem[] {
  const items: FormItem[] = [];
  let lastSection: string | null | undefined = undefined;
  for (const ing of ingredients) {
    if (ing.section !== lastSection) {
      if (ing.section !== null) items.push({ id: newId(), type: "section", name: ing.section });
      lastSection = ing.section;
    }
    items.push({ id: newId(), type: "ingredient", name: ing.customName ?? "", quantity: String(ing.quantity), unit: ing.unit });
  }
  return items.length > 0 ? items : [{ id: newId(), type: "ingredient", name: "", quantity: "1", unit: "pièce" }];
}

function buildIngredientInputs(items: FormItem[]): RecipeIngredientInput[] {
  let currentSection: string | null = null;
  const result: RecipeIngredientInput[] = [];
  for (const item of items) {
    if (item.type === "section") {
      currentSection = item.name.trim() || null;
    } else if (item.name.trim().length > 0) {
      result.push({ name: item.name, quantity: parseFloat(item.quantity) || 0, unit: item.unit, section: currentSection });
    }
  }
  return result;
}

function buildStepFormItems(steps: RecipeStep[]): StepFormItem[] {
  const items: StepFormItem[] = [];
  let lastSection: string | null | undefined = undefined;
  for (const step of steps) {
    if (step.section !== lastSection) {
      if (step.section !== null) items.push({ id: newId(), type: "section", name: step.section });
      lastSection = step.section;
    }
    items.push({ id: newId(), type: "step", description: step.description });
  }
  return items.length > 0 ? items : [{ id: newId(), type: "step", description: "" }];
}

function buildStepInputs(items: StepFormItem[]): RecipeStepInput[] {
  let currentSection: string | null = null;
  const result: RecipeStepInput[] = [];
  for (const item of items) {
    if (item.type === "section") {
      currentSection = item.name.trim() || null;
    } else if (item.description.trim().length > 0) {
      result.push({ description: item.description, section: currentSection });
    }
  }
  return result;
}

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

const COMMON_UNITS = ["g", "kg", "ml", "cl", "L", "càs", "càc", "tasse", "pincée", "tranche", "pièce"];

const STEPS_LABELS = ["Informations", "Ingrédients", "Préparation", "Détails"];
const TOTAL_STEPS = 4;

interface Props {
  existingRecipe?: Recipe;
  onSuccess: (id: string) => void;
  onBack: () => void;
}

export function RecipeFormScreen({ existingRecipe, onSuccess, onBack }: Props) {
  const { colors } = useAppTheme();
  const inputStyle = {
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text as string,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  };

  const [step, setStep] = useState(1);

  const [name, setName] = useState(existingRecipe?.name ?? "");
  const [description, setDescription] = useState(existingRecipe?.description ?? "");
  const [servings, setServings] = useState(existingRecipe?.servings ?? 4);
  const [prepTime, setPrepTime] = useState(existingRecipe?.prepTimeMinutes ? String(existingRecipe.prepTimeMinutes) : "");
  const [cookTime, setCookTime] = useState(existingRecipe?.cookTimeMinutes ? String(existingRecipe.cookTimeMinutes) : "");
  const [dietaryTags, setDietaryTags] = useState<string[]>(existingRecipe?.dietaryTags ?? []);
  const [isPublic, setIsPublic] = useState(existingRecipe?.isPublic ?? false);
  const [ingredients, setIngredients] = useState<FormItem[]>(
    () => existingRecipe ? buildFormItems(existingRecipe.ingredients) : [{ id: newId(), type: "ingredient", name: "", quantity: "1", unit: "pièce" }]
  );
  const [steps, setSteps] = useState<StepFormItem[]>(
    () => existingRecipe ? buildStepFormItems(existingRecipe.steps) : [{ id: newId(), type: "step", description: "" }]
  );

  const [imageUri, setImageUri] = useState<string | null>(existingRecipe?.imageUrl ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(existingRecipe?.imageUrl ?? null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSheet, setImportSheet] = useState(false);
  const [unitSheetId, setUnitSheetId] = useState<number | null>(null);
  const [customUnit, setCustomUnit] = useState("");

  useEffect(() => {
    setError(null);
  }, [step]);

  async function handleImport() {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    const result = await importRecipeFromUrl(importUrl.trim());
    setImporting(false);
    if ("error" in result) { setImportError(result.error); return; }
    const r = result.data;
    setName(r.name);
    setDescription(r.description ?? "");
    setServings(r.servings);
    setPrepTime(r.prepTimeMinutes ? String(r.prepTimeMinutes) : "");
    setCookTime(r.cookTimeMinutes ? String(r.cookTimeMinutes) : "");
    if (r.ingredients.length > 0) setIngredients(r.ingredients.map((i) => ({ id: newId(), type: "ingredient" as const, name: i.name, quantity: String(i.quantity), unit: i.unit })));
    if (r.steps.length > 0) setSteps(r.steps.map((s) => ({ id: newId(), type: "step" as const, description: s })));
    setImportSheet(false);
    setImportUrl("");
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0].base64) return;
    const asset = result.assets[0];
    setImageUri(asset.uri);
    setUploadingImage(true);
    const uploaded = await uploadRecipeImage(asset.base64!, asset.mimeType ?? "image/jpeg");
    setUploadingImage(false);
    if (typeof uploaded === "object") { setError(uploaded.error); return; }
    setImageUrl(uploaded);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const input = {
      name,
      description: description || null,
      servings,
      prepTimeMinutes: prepTime ? parseInt(prepTime) : null,
      cookTimeMinutes: cookTime ? parseInt(cookTime) : null,
      dietaryTags,
      imageUrl,
      isPublic,
      ingredients: buildIngredientInputs(ingredients),
      steps: buildStepInputs(steps),
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
    if (step > 1) { setStep((s) => s - 1); return; }
    const hasData = !existingRecipe && (
      name.trim() !== "" ||
      description.trim() !== "" ||
      ingredients.some((i) => i.type === "ingredient" && i.name.trim() !== "")
    );
    if (hasData) {
      Alert.alert(
        "Abandonner ?",
        "Les informations saisies seront perdues.",
        [
          { text: "Continuer", style: "cancel" },
          { text: "Abandonner", style: "destructive", onPress: onBack },
        ]
      );
      return;
    }
    onBack();
  }

  function pickUnit(id: number, unit: string) {
    setIngredients((prev) => prev.map((item) => item.id === id && item.type === "ingredient" ? { ...item, unit } : item));
    setUnitSheetId(null);
    setCustomUnit("");
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { id: newId(), type: "ingredient", name: "", quantity: "1", unit: "pièce" }]);
  }

  function insertIngredientAt(index: number) {
    setIngredients((prev) => {
      const next = [...prev];
      next.splice(index, 0, { id: newId(), type: "ingredient", name: "", quantity: "1", unit: "pièce" });
      return next;
    });
  }

  function addSection() {
    setIngredients((prev) => [...prev, { id: newId(), type: "section", name: "" }]);
  }

  function removeItemById(id: number) {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  }

  function updateIngredientById(id: number, field: "name" | "quantity" | "unit", value: string) {
    setIngredients((prev) => prev.map((item) => item.id === id && item.type === "ingredient" ? { ...item, [field]: value } : item));
  }

  function updateSectionNameById(id: number, value: string) {
    setIngredients((prev) => prev.map((item) => item.id === id && item.type === "section" ? { ...item, name: value } : item));
  }

  function addStep() {
    setSteps((prev) => [...prev, { id: newId(), type: "step", description: "" }]);
  }

  function insertStepAt(index: number) {
    setSteps((prev) => {
      const next = [...prev];
      next.splice(index, 0, { id: newId(), type: "step", description: "" });
      return next;
    });
  }

  function addStepSection() {
    setSteps((prev) => [...prev, { id: newId(), type: "section", name: "" }]);
  }

  function removeStepItemById(id: number) {
    setSteps((prev) => prev.filter((item) => item.id !== id));
  }

  function updateStepDescriptionById(id: number, value: string) {
    setSteps((prev) => prev.map((item) => item.id === id && item.type === "step" ? { ...item, description: value } : item));
  }

  function updateStepSectionNameById(id: number, value: string) {
    setSteps((prev) => prev.map((item) => item.id === id && item.type === "section" ? { ...item, name: value } : item));
  }

  const activeIngredient = unitSheetId !== null ? ingredients.find((i) => i.id === unitSheetId) : null;
  const currentUnit = activeIngredient?.type === "ingredient" ? activeIngredient.unit : null;

  const isLastStep = step === TOTAL_STEPS;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}>

        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <Pressable onPress={goBack} style={{ padding: 4, marginRight: 8 }}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="15 18 9 12 15 6" />
              </Svg>
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {existingRecipe ? "Modifier" : "Nouvelle recette"} · {step}/{TOTAL_STEPS}
                </Text>
                {step === TOTAL_STEPS && (
                  <View style={{ borderRadius: 99, backgroundColor: colors.bgSurface, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>optionnel</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.3 }}>
                {STEPS_LABELS[step - 1]}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {step === 1 && !existingRecipe && (
                <Pressable
                  onPress={() => setImportSheet(true)}
                  style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 12, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>Import URL</Text>
                </Pressable>
              )}
              {isLastStep ? (
                <Pressable
                  onPress={handleSubmit}
                  disabled={submitting}
                  style={{ borderRadius: 12, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8, opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{existingRecipe ? "Enregistrer" : "Créer"}</Text>
                  }
                </Pressable>
              ) : (
                <Pressable
                  onPress={goNext}
                  style={{ borderRadius: 12, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Suivant</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <Pressable
                key={i}
                onPress={() => { if (i + 1 < step) setStep(i + 1); }}
                style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: i < step ? colors.accent : colors.border }}
              />
            ))}
          </View>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={{ borderRadius: 12, backgroundColor: colors.dangerBg, padding: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: colors.danger, fontWeight: "600" }}>{error}</Text>
            </View>
          )}

          {/* Step 1 — Informations essentielles */}
          {step === 1 && (
            <View style={{ gap: 20 }}>
              <Pressable
                onPress={pickImage}
                style={{ height: 180, borderRadius: 16, overflow: "hidden", backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
              >
                {imageUri ? (
                  <>
                    <Image source={{ uri: imageUri }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} resizeMode="cover" />
                    {uploadingImage && (
                      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
                        <ActivityIndicator color="#fff" size="large" />
                      </View>
                    )}
                    {!uploadingImage && (
                      <View style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 99, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <Circle cx={12} cy={13} r={4} />
                        </Svg>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 99, backgroundColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <Circle cx={12} cy={13} r={4} />
                      </Svg>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSubtle }}>Ajouter une photo</Text>
                  </View>
                )}
              </Pressable>

              <Field label="Nom *">
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Poulet rôti aux herbes"
                  placeholderTextColor={colors.textSubtle}
                  style={inputStyle}
                />
              </Field>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Field label="Personnes" style={{ flex: 1 }}>
                  <View style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: colors.bgCard, borderRadius: 12,
                    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                  }}>
                    <Pressable onPress={() => setServings((s) => Math.max(1, s - 1))} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: servings <= 1 ? colors.textSubtle : colors.text }}>−</Text>
                    </Pressable>
                    <Text style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: "700", color: colors.text }}>{servings}</Text>
                    <Pressable onPress={() => setServings((s) => Math.min(99, s + 1))} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>+</Text>
                    </Pressable>
                  </View>
                </Field>
                <Field label="Prép. (min)" style={{ flex: 1 }}>
                  <TextInput value={prepTime} onChangeText={setPrepTime} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textSubtle} style={inputStyle} />
                </Field>
                <Field label="Cuisson (min)" style={{ flex: 1 }}>
                  <TextInput value={cookTime} onChangeText={setCookTime} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textSubtle} style={inputStyle} />
                </Field>
              </View>
            </View>
          )}

          {/* Step 2 — Ingrédients */}
          {step === 2 && (
            <View style={{ gap: 8 }}>
              {ingredients.flatMap((item, i) => {
                const nextItem = ingredients[i + 1];
                const showInlineAdd =
                  (item.type === "section" && (!nextItem || nextItem.type === "section")) ||
                  (item.type === "ingredient" && nextItem?.type === "section");

                const renderedItem = item.type === "section" ? (
                  <View key={item.id} style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: colors.bgSurface,
                    borderRadius: 12,
                    paddingHorizontal: 12, paddingVertical: 11,
                  }}>
                    <TextInput
                      value={item.name}
                      onChangeText={(v) => updateSectionNameById(item.id, v)}
                      placeholder="Nom de la section"
                      placeholderTextColor={colors.textSubtle}
                      style={{ flex: 1, fontSize: 13, fontWeight: "700", color: colors.text }}
                    />
                    <Pressable onPress={() => removeItemById(item.id)} style={{ padding: 4 }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Line x1={18} y1={6} x2={6} y2={18} />
                        <Line x1={6} y1={6} x2={18} y2={18} />
                      </Svg>
                    </Pressable>
                  </View>
                ) : (
                  <View key={item.id} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TextInput
                      value={item.quantity}
                      onChangeText={(v) => updateIngredientById(item.id, "quantity", v)}
                      keyboardType="decimal-pad"
                      style={[inputStyle, { width: 60, textAlign: "center" }]}
                    />
                    <Pressable
                      onPress={() => setUnitSheetId(item.id)}
                      style={[inputStyle, { width: 82, flexDirection: "row", alignItems: "center", gap: 2 }]}
                    >
                      <Text style={{ fontSize: 13, color: item.unit ? colors.text : colors.textSubtle, fontWeight: "600", flex: 1 }} numberOfLines={1}>
                        {item.unit || "unité"}
                      </Text>
                      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Polyline points="6 9 12 15 18 9" />
                      </Svg>
                    </Pressable>
                    <TextInput
                      value={item.name}
                      onChangeText={(v) => updateIngredientById(item.id, "name", v)}
                      placeholder="Ingrédient"
                      placeholderTextColor={colors.textSubtle}
                      style={[inputStyle, { flex: 1 }]}
                    />
                    <Pressable onPress={() => removeItemById(item.id)} style={{ padding: 4 }}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Line x1={18} y1={6} x2={6} y2={18} />
                        <Line x1={6} y1={6} x2={18} y2={18} />
                      </Svg>
                    </Pressable>
                  </View>
                );

                if (!showInlineAdd) return [renderedItem];
                return [
                  renderedItem,
                  <Pressable key={`add-${item.id}`} onPress={() => insertIngredientAt(i + 1)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2, paddingLeft: 4 }}>
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1={12} y1={5} x2={12} y2={19} />
                      <Line x1={5} y1={12} x2={19} y2={12} />
                    </Svg>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle }}>Ajouter un ingrédient</Text>
                  </Pressable>,
                ];
              })}
              <View style={{ flexDirection: "row", gap: 16, paddingVertical: 8 }}>
                <Pressable onPress={addIngredient} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={12} y1={5} x2={12} y2={19} />
                    <Line x1={5} y1={12} x2={19} y2={12} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Ingrédient</Text>
                </Pressable>
                <Pressable onPress={addSection} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={3} y1={7} x2={21} y2={7} />
                    <Line x1={3} y1={12} x2={21} y2={12} />
                    <Line x1={3} y1={17} x2={21} y2={17} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted }}>Section</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 3 — Préparation */}
          {step === 3 && (
            <View style={{ gap: 8 }}>
              {(() => {
                let stepNumber = 0;
                return steps.flatMap((item, i) => {
                  const nextItem = steps[i + 1];
                  const showInlineAdd =
                    (item.type === "section" && (!nextItem || nextItem.type === "section")) ||
                    (item.type === "step" && nextItem?.type === "section");

                  let renderedItem: React.ReactElement;
                  if (item.type === "section") {
                    renderedItem = (
                      <View key={item.id} style={{
                        flexDirection: "row", alignItems: "center", gap: 10,
                        backgroundColor: colors.bgSurface,
                        borderRadius: 12,
                        paddingHorizontal: 12, paddingVertical: 11,
                      }}>
                        <TextInput
                          value={item.name}
                          onChangeText={(v) => updateStepSectionNameById(item.id, v)}
                          placeholder="Nom de la section"
                          placeholderTextColor={colors.textSubtle}
                          style={{ flex: 1, fontSize: 13, fontWeight: "700", color: colors.text }}
                        />
                        <Pressable onPress={() => removeStepItemById(item.id)} style={{ padding: 4 }}>
                          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Line x1={18} y1={6} x2={6} y2={18} />
                            <Line x1={6} y1={6} x2={18} y2={18} />
                          </Svg>
                        </Pressable>
                      </View>
                    );
                  } else {
                    stepNumber += 1;
                    const n = stepNumber;
                    renderedItem = (
                      <View key={item.id} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
                        <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginTop: 11, flexShrink: 0 }}>
                          <Text style={{ fontSize: 11, fontWeight: "900", color: "#fff" }}>{n}</Text>
                        </View>
                        <TextInput
                          value={item.description}
                          onChangeText={(v) => updateStepDescriptionById(item.id, v)}
                          placeholder={`Étape ${n}…`}
                          placeholderTextColor={colors.textSubtle}
                          multiline
                          style={[inputStyle, { flex: 1, minHeight: 72, textAlignVertical: "top" }]}
                        />
                        <Pressable onPress={() => removeStepItemById(item.id)} style={{ padding: 4, marginTop: 11 }}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Line x1={18} y1={6} x2={6} y2={18} />
                            <Line x1={6} y1={6} x2={18} y2={18} />
                          </Svg>
                        </Pressable>
                      </View>
                    );
                  }

                  if (!showInlineAdd) return [renderedItem];
                  return [
                    renderedItem,
                    <Pressable key={`add-${item.id}`} onPress={() => insertStepAt(i + 1)} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2, paddingLeft: 4 }}>
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Line x1={12} y1={5} x2={12} y2={19} />
                        <Line x1={5} y1={12} x2={19} y2={12} />
                      </Svg>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle }}>Ajouter une étape</Text>
                    </Pressable>,
                  ];
                });
              })()}
              <View style={{ flexDirection: "row", gap: 16, paddingVertical: 8 }}>
                <Pressable onPress={addStep} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={12} y1={5} x2={12} y2={19} />
                    <Line x1={5} y1={12} x2={19} y2={12} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>Étape</Text>
                </Pressable>
                <Pressable onPress={addStepSection} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={3} y1={7} x2={21} y2={7} />
                    <Line x1={3} y1={12} x2={21} y2={12} />
                    <Line x1={3} y1={17} x2={21} y2={17} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted }}>Section</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Step 4 — Détails (optionnel) */}
          {step === 4 && (
            <View style={{ gap: 20 }}>
              <Field label="Description">
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Une brève description…"
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  numberOfLines={3}
                  style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
                />
              </Field>
              <Field label="Régime alimentaire">
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {DIETARY_OPTIONS.map((opt) => {
                    const active = dietaryTags.includes(opt.key);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setDietaryTags((prev) => prev.includes(opt.key) ? prev.filter((k) => k !== opt.key) : [...prev, opt.key])}
                        style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: active ? colors.accent : colors.bgSurface }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#fff" : colors.textMuted }}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
              <Pressable
                onPress={() => setIsPublic((v) => !v)}
                style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  borderRadius: 14, backgroundColor: colors.bgCard,
                  paddingHorizontal: 16, paddingVertical: 14,
                  shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Recette publique</Text>
                  <Text style={{ fontSize: 12, color: colors.textSubtle }}>Visible par tous les utilisateurs</Text>
                </View>
                <View style={{ width: 46, height: 26, borderRadius: 13, backgroundColor: isPublic ? colors.accent : colors.border, justifyContent: "center", paddingHorizontal: 2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: isPublic ? "flex-end" : "flex-start" }} />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Import URL sheet */}
      <BottomModal isOpen={importSheet} onClose={() => { setImportSheet(false); setImportError(null); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Importer depuis une URL</Text>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <TextInput
            value={importUrl}
            onChangeText={setImportUrl}
            placeholder="https://www.marmiton.org/…"
            placeholderTextColor={colors.textSubtle}
            autoCapitalize="none"
            keyboardType="url"
            style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: colors.text }}
          />
          {importing && <ActivityIndicator color={colors.accent} />}
          {importError && <Text style={{ fontSize: 12, color: colors.danger }}>{importError}</Text>}
          <Pressable
            onPress={handleImport}
            disabled={importing || !importUrl.trim()}
            style={{ borderRadius: 16, backgroundColor: colors.accent, paddingVertical: 14, alignItems: "center", opacity: (importing || !importUrl.trim()) ? 0.6 : 1 }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>{importing ? "Importation…" : "Importer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      {/* Unit picker sheet */}
      <BottomModal isOpen={unitSheetId !== null} onClose={() => { setUnitSheetId(null); setCustomUnit(""); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 12 }}>Choisir une unité</Text>
        <TextInput
          value={customUnit}
          onChangeText={setCustomUnit}
          placeholder="Unité personnalisée…"
          placeholderTextColor={colors.textSubtle}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (unitSheetId !== null && customUnit.trim()) pickUnit(unitSheetId, customUnit.trim());
          }}
          style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.text, marginBottom: 12 }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8 }}>
          <Pressable
            onPress={() => { if (unitSheetId !== null) pickUnit(unitSheetId, ""); }}
            style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: currentUnit === "" ? colors.accent : colors.bgSurface }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: currentUnit === "" ? "#fff" : colors.text }}>sans unité</Text>
          </Pressable>
          {COMMON_UNITS.map((u) => (
            <Pressable
              key={u}
              onPress={() => { if (unitSheetId !== null) pickUnit(unitSheetId, u); }}
              style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: currentUnit === u ? colors.accent : colors.bgSurface }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: currentUnit === u ? "#fff" : colors.text }}>{u}</Text>
            </Pressable>
          ))}
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  const { colors } = useAppTheme();
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{label}</Text>
      {children}
    </View>
  );
}
