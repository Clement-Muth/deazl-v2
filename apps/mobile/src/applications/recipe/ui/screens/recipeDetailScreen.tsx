import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import { Button, PressableFeedback, SearchField } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Polyline, Rect } from "react-native-svg";
import { useAppTheme, type AppColors } from "../../../../shared/theme";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { addRecipeToShoppingList } from "../../application/useCases/addRecipeToShoppingList";
import { getUserIngredientPreferences } from "../../../user/application/useCases/getUserIngredientPreferences";
import type { IngredientPreference } from "../../../user/application/useCases/getUserIngredientPreferences";
import { getRecipeEstimatedCost } from "../../application/useCases/getRecipeEstimatedCost";
import type { RecipeCostResult } from "../../application/useCases/getRecipeEstimatedCost";
import { normalizeIngredientName } from "../../../shopping/domain/normalizeIngredientName";
import { getIngredientEmoji } from "../utils/ingredientEmoji";
import { deleteRecipe } from "../../application/useCases/deleteRecipe";
import { duplicateRecipe } from "../../application/useCases/duplicateRecipe";
import { getRecipeById } from "../../application/useCases/getRecipeById";
import { toggleRecipePublic } from "../../application/useCases/toggleRecipePublic";
import { scheduleRecipe } from "../../../planning/application/useCases/scheduleRecipe";
import type { MealType } from "../../../planning/domain/entities/planning";
import { linkProductToIngredient } from "../../application/useCases/linkProductToIngredient";
import { searchProducts } from "../../application/useCases/searchProducts";
import { toggleFavorite } from "../../application/useCases/toggleFavorite";
import { getCookLog } from "../../application/useCases/getCookLog";
import type { CookLog } from "../../application/useCases/getCookLog";
import { getRecipeNotes } from "../../application/useCases/getRecipeNotes";
import { getRecipeNutrition } from "../../application/useCases/getRecipeNutrition";
import type { RecipeNutrition } from "../../application/useCases/getRecipeNutrition";
import { getRecipeQuality } from "../../application/useCases/getRecipeQuality";
import type { RecipeQuality } from "../../application/useCases/getRecipeQuality";
import { saveRecipeNotes } from "../../application/useCases/saveRecipeNotes";
import type { CatalogProduct, Recipe, RecipeIngredient, RecipeStep } from "../../domain/entities/recipe";

const HERO_HEIGHT = 420;

const PALETTES: [string, string][] = [
  ["#E8571C", "#FF8C42"],
  ["#16A34A", "#4ADE80"],
  ["#7C3AED", "#A78BFA"],
  ["#0284C7", "#38BDF8"],
  ["#E11D48", "#FB7185"],
  ["#0D9488", "#2DD4BF"],
];

function paletteForName(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function fmtTime(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function fmtCost(c: number): string {
  if (c < 0.005) return "<0,01€";
  return `${c.toFixed(2).replace(".", ",")}€`;
}

function fmtLastCooked(date: Date): string {
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtQty(qty: number, multiplier: number): string {
  const v = qty * multiplier;
  if (v === Math.floor(v)) return String(Math.floor(v));
  return v.toFixed(1).replace(/\.0$/, "");
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const GRID_PADDING = 20;
const GRID_GAP = 10;
const GRID_COLS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const CATEGORY_COLORS = ["#E8571C", "#16A34A", "#0284C7", "#7C3AED", "#0D9488", "#CA8A04"];

function categoryColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return CATEGORY_COLORS[Math.abs(h) % CATEGORY_COLORS.length];
}

function groupStepsBySection(steps: RecipeStep[]): Array<{ section: string | null; items: RecipeStep[] }> {
  const groups: Array<{ section: string | null; items: RecipeStep[] }> = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (last && last.section === (step.section ?? null)) {
      last.items.push(step);
    } else {
      groups.push({ section: step.section ?? null, items: [step] });
    }
  }
  return groups;
}

function groupIngredientsBySection(ingredients: RecipeIngredient[]): Array<{ section: string | null; items: RecipeIngredient[] }> {
  const groups: Array<{ section: string | null; items: RecipeIngredient[] }> = [];
  for (const ing of ingredients) {
    const last = groups[groups.length - 1];
    if (last && last.section === (ing.section ?? null)) {
      last.items.push(ing);
    } else {
      groups.push({ section: ing.section ?? null, items: [ing] });
    }
  }
  return groups;
}

interface IngredientGridProps {
  ingredients: RecipeIngredient[];
  multiplier: number;
  checkedIngredients: Set<string>;
  onToggle: (id: string) => void;
  colors: AppColors;
  recipeCost: RecipeCostResult | null;
}

function IngredientGrid({ ingredients, multiplier, checkedIngredients, onToggle, colors, recipeCost }: IngredientGridProps) {
  const groups = groupIngredientsBySection(ingredients);
  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {groups.map((group, gi) => (
        <View key={group.section ?? `__unsectioned_${gi}`}>
          {group.section && (
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2, marginTop: gi > 0 ? 20 : 0, marginBottom: 12 }}>
              {group.section}
            </Text>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
            {group.items.map((ing) => {
        const isChecked = checkedIngredients.has(ing.id);
        const displayName = ing.productName ?? ing.customName ?? "";
        const emoji = getIngredientEmoji(ing.customName ?? ing.productName ?? "");
        const color = categoryColor(displayName);
        const ingCost = recipeCost?.ingredientCosts.get(ing.id);
        const adjustedIngCost = ingCost?.estimatedCost != null ? ingCost.estimatedCost * multiplier : null;
        return (
          <Pressable
            key={ing.id}
            onPress={() => onToggle(ing.id)}
            style={{
              width: CARD_WIDTH,
              backgroundColor: colors.bgSurface,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 8,
              alignItems: "center",
              gap: 4,
              opacity: isChecked ? 0.45 : 1,
            }}
          >
            {emoji ? (
              <Text style={{ fontSize: 30, lineHeight: 36 }}>{emoji}</Text>
            ) : (
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color }}>{displayName.trim().charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.text, textAlign: "center", lineHeight: 15, textDecorationLine: isChecked ? "line-through" : "none" }} numberOfLines={2}>
              {displayName}
            </Text>
            {ing.quantity > 0 && (
              <Text style={{ fontSize: 11, fontWeight: "700", color: isChecked ? colors.textSubtle : "#E8571C" }} numberOfLines={1}>
                {fmtQty(ing.quantity, multiplier)}{ing.unit ? ` ${ing.unit}` : ""}
              </Text>
            )}
            {adjustedIngCost != null && (
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle }} numberOfLines={1}>
                {fmtCost(adjustedIngCost)}
              </Text>
            )}
            {isChecked && (
              <View style={{ position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="20 6 9 17 4 12" />
                </Svg>
              </View>
            )}
          </Pressable>
            );
          })}
          </View>
        </View>
      ))}
    </View>
  );
}


const AJR = { energyKcal: 2000, fat: 70, saturatedFat: 20, carbohydrates: 260, sugars: 90, proteins: 50, fiber: 25, salt: 6 };

function ajrPercent(value: number, ref: number): number {
  return Math.round((value / ref) * 100);
}

type NutrientPolarity = "warn" | "good" | "neutral";

function ajrColor(pct: number, polarity: NutrientPolarity): string {
  if (polarity === "good") {
    if (pct >= 30) return "#16A34A";
    return "transparent";
  }
  if (polarity === "warn") {
    if (pct > 30) return "#DC2626";
    if (pct > 15) return "#D97706";
  }
  return "transparent";
}

function NutritionCell({ label, value, unit, ajrRef, polarity = "neutral", colors }: { label: string; value: number; unit: string; ajrRef: number; polarity?: NutrientPolarity; colors: AppColors }) {
  const pct = ajrPercent(value, ajrRef);
  const accentColor = ajrColor(pct, polarity);
  const hasAccent = accentColor !== "transparent";
  const cellW = (SCREEN_WIDTH - 40 - 9) / 4;
  return (
    <View style={{ width: cellW, backgroundColor: colors.bgSurface, borderRadius: 14, overflow: "hidden" }}>
      <View style={{ paddingHorizontal: 8, paddingTop: 12, paddingBottom: 10, alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>
          {value}<Text style={{ fontSize: 11, fontWeight: "700" }}>{unit}</Text>
        </Text>
        <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 4, textAlign: "center" }}>{label}</Text>
      </View>
      <View style={{ backgroundColor: colors.bgCard, paddingVertical: 5, alignItems: "center" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: hasAccent ? accentColor : colors.textSubtle }}>{pct}%</Text>
      </View>
    </View>
  );
}

function NutritionGrid({ nutrition, colors }: { nutrition: RecipeNutrition; colors: AppColors }) {
  const isPartial = nutrition.coveredCount < nutrition.totalCount;
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>
          Nutrition par portion
        </Text>
        {isPartial && (
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
            {nutrition.coveredCount}/{nutrition.totalCount} ingrédients
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 3, marginBottom: 3 }}>
        <NutritionCell label="Calories" value={nutrition.energyKcal} unit="kcal" ajrRef={AJR.energyKcal} polarity="warn" colors={colors} />
        <NutritionCell label="Lipides" value={nutrition.fat} unit="g" ajrRef={AJR.fat} polarity="warn" colors={colors} />
        <NutritionCell label="Glucides" value={nutrition.carbohydrates} unit="g" ajrRef={AJR.carbohydrates} polarity="neutral" colors={colors} />
        <NutritionCell label="Protéines" value={nutrition.proteins} unit="g" ajrRef={AJR.proteins} polarity="good" colors={colors} />
      </View>
      <View style={{ flexDirection: "row", gap: 3 }}>
        <NutritionCell label="Lip. sat." value={nutrition.saturatedFat} unit="g" ajrRef={AJR.saturatedFat} polarity="warn" colors={colors} />
        <NutritionCell label="Sucres" value={nutrition.sugars} unit="g" ajrRef={AJR.sugars} polarity="warn" colors={colors} />
        <NutritionCell label="Sel" value={nutrition.salt} unit="g" ajrRef={AJR.salt} polarity="warn" colors={colors} />
        <NutritionCell label="Fibres" value={nutrition.fiber} unit="g" ajrRef={AJR.fiber} polarity="good" colors={colors} />
      </View>
      <Text style={{ fontSize: 10, color: colors.textSubtle, marginTop: 8 }}>
        % des apports journaliers de référence (adulte, 2000 kcal)
      </Text>
    </View>
  );
}

const ALLERGEN_LABELS: Record<string, string> = {
  "en:gluten": "Gluten", "en:milk": "Lait", "en:eggs": "Œufs",
  "en:nuts": "Fruits à coque", "en:peanuts": "Arachides", "en:soybeans": "Soja",
  "en:fish": "Poisson", "en:crustaceans": "Crustacés", "en:molluscs": "Mollusques",
  "en:celery": "Céleri", "en:mustard": "Moutarde", "en:sesame-seeds": "Sésame",
  "en:sulphur-dioxide-and-sulphites": "Sulfites", "en:lupin": "Lupin",
};

const ADDITIVE_NAMES: Record<string, string> = {
  e100: "Curcumine", e101: "Riboflavine (B2)", e102: "Tartrazine", e104: "Jaune de quinoléine",
  e110: "Jaune orangé S", e120: "Cochenille", e122: "Azorubine", e123: "Amarante",
  e124: "Ponceau 4R", e129: "Rouge Allura AC", e131: "Bleu patenté V", e132: "Indigotine",
  e133: "Bleu brillant FCF", e140: "Chlorophylles", e150a: "Caramel nature",
  e150b: "Caramel sulfite caustique", e150c: "Caramel ammoniacal", e150d: "Caramel sulfite d'ammonium",
  e160a: "Carotènes", e160b: "Rocou", e160c: "Extrait de paprika", e162: "Rouge de betterave",
  e171: "Dioxyde de titane", e172: "Oxydes de fer", e200: "Acide sorbique",
  e202: "Sorbate de potassium", e203: "Sorbate de calcium", e210: "Acide benzoïque",
  e211: "Benzoate de sodium", e212: "Benzoate de potassium", e220: "Dioxyde de soufre",
  e221: "Sulfite de sodium", e222: "Bisulfite de sodium", e223: "Métabisulfite de sodium",
  e224: "Métabisulfite de potassium", e249: "Nitrite de potassium", e250: "Nitrite de sodium",
  e251: "Nitrate de sodium", e252: "Nitrate de potassium", e260: "Acide acétique",
  e261: "Acétate de potassium", e262: "Acétates de sodium", e263: "Acétate de calcium",
  e270: "Acide lactique", e280: "Acide propionique", e281: "Propionate de sodium",
  e282: "Propionate de calcium", e283: "Propionate de potassium", e290: "Dioxyde de carbone",
  e296: "Acide malique", e297: "Acide fumarique", e300: "Acide ascorbique (vitamine C)",
  e301: "Ascorbate de sodium", e302: "Ascorbate de calcium", e304: "Esters d'acides gras de l'acide ascorbique",
  e306: "Tocophérols (vitamine E)", e307: "Alpha-tocophérol", e310: "Gallate de propyle",
  e316: "Érythorbate de sodium", e317: "Érythorbate de potassium", e319: "TBHQ",
  e320: "BHA", e321: "BHT", e322: "Lécithines", e325: "Lactate de sodium",
  e326: "Lactate de potassium", e327: "Lactate de calcium", e330: "Acide citrique",
  e331: "Citrate de sodium", e332: "Citrate de potassium", e333: "Citrate de calcium",
  e334: "Acide tartrique", e335: "Tartrate de sodium", e336: "Tartrate de potassium",
  e337: "Tartrate de sodium-potassium", e338: "Acide phosphorique", e339: "Phosphate de sodium",
  e340: "Phosphate de potassium", e341: "Phosphate de calcium", e343: "Phosphate de magnésium",
  e350: "Malate de sodium", e351: "Malate de potassium", e352: "Malate de calcium",
  e385: "EDTA calcique disodique", e400: "Acide alginique", e401: "Alginate de sodium",
  e402: "Alginate de potassium", e404: "Alginate de calcium", e405: "Alginate de propylène glycol",
  e406: "Agar-agar", e407: "Carraghénane", e410: "Farine de caroube",
  e412: "Gomme de guar", e413: "Gomme adragante", e414: "Gomme arabique",
  e415: "Gomme xanthane", e416: "Gomme karaya", e417: "Gomme tara",
  e418: "Gomme gellane", e420: "Sorbitol", e421: "Mannitol", e422: "Glycérol",
  e425: "Konjac", e440: "Pectines", e442: "Phosphatides d'ammonium",
  e450: "Diphosphates", e451: "Triphosphates", e452: "Polyphosphates",
  e460: "Cellulose microcristalline", e461: "Méthylcellulose", e463: "Hydroxypropylcellulose",
  e464: "Hydroxypropylméthylcellulose", e465: "Méthyléthylcellulose", e466: "Carboxyméthylcellulose",
  e471: "Mono- et diglycérides d'acides gras", e472a: "Esters acétiques", e472b: "Esters lactiques",
  e472c: "Esters citriques", e472e: "Esters monoacétyltartriques", e473: "Sucroesters",
  e474: "Sucroglycérides", e475: "Esters polyglycériques", e476: "Polyricinooléate de polyglycérol",
  e477: "Esters propylénoglycol", e481: "Stéaroyl-2-lactylate de sodium",
  e482: "Stéaroyl-2-lactylate de calcium", e491: "Monostéarate de sorbitane",
  e500: "Carbonate de sodium", e501: "Carbonate de potassium", e503: "Carbonate d'ammonium",
  e504: "Carbonate de magnésium", e508: "Chlorure de potassium", e509: "Chlorure de calcium",
  e516: "Sulfate de calcium", e551: "Dioxyde de silicium", e570: "Acides gras",
  e575: "Glucono-delta-lactone", e621: "Glutamate monosodique", e622: "Glutamate de monopotassium",
  e627: "Guanylate disodique", e631: "Inosinate disodique", e635: "Ribonucléotides disodiques",
  e900: "Diméticone", e901: "Cire d'abeille", e903: "Cire de carnauba",
  e904: "Shellac", e920: "L-cystéine", e927b: "Carbamide", e938: "Argon",
  e939: "Hélium", e941: "Azote", e942: "Protoxyde d'azote", e943a: "Butane",
  e948: "Oxygène", e950: "Acésulfame K", e951: "Aspartame", e952: "Cyclamate de sodium",
  e954: "Saccharine", e955: "Sucralose", e959: "Néohespéridine DC", e960: "Stéviol",
  e961: "Néotame", e962: "Sel d'aspartame-acésulfame", e965: "Maltitol",
  e966: "Lactitol", e967: "Xylitol", e968: "Érythritol",
};

function formatAdditive(tag: string): { code: string; name: string | null } {
  const match = tag.match(/en:e(\d+\w*)/i);
  if (!match) return { code: tag.replace("en:", "").toUpperCase(), name: null };
  const code = `E${match[1].toUpperCase()}`;
  const name = ADDITIVE_NAMES[`e${match[1].toLowerCase()}`] ?? null;
  return { code, name };
}

const ADDITIVES_VISIBLE = 5;

const QUALITY_CONFIG = {
  excellent: { label: "Excellent", color: "#16A34A", bg: "#DCFCE7", textColor: "#14532D" },
  bon: { label: "Bon", color: "#65A30D", bg: "#ECFCCB", textColor: "#365314" },
  surveiller: { label: "À surveiller", color: "#EA580C", bg: "#FFF7ED", textColor: "#7C2D12" },
  mauvais: { label: "Mauvais", color: "#DC2626", bg: "#FEF2F2", textColor: "#7F1D1D" },
};

function RecipeQualitySection({ quality, colors }: { quality: RecipeQuality; colors: AppColors }) {
  const [showAllAdditives, setShowAllAdditives] = useState(false);
  const knownAllergens = quality.allergens.filter((t) => ALLERGEN_LABELS[t]);

  const nova4 = quality.ultraProcessed.filter((i) => i.novaGroup === 4);
  const nova3 = quality.ultraProcessed.filter((i) => i.novaGroup === 3);

  const visibleAdditives = showAllAdditives
    ? quality.additives
    : quality.additives.slice(0, ADDITIVES_VISIBLE);
  const hiddenCount = quality.additives.length - ADDITIVES_VISIBLE;

  const config = QUALITY_CONFIG[quality.level];

  const rows: Array<{ key: string; node: React.ReactNode }> = [];

  rows.push({
    key: "__level",
    node: (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: config.color }} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{config.label}</Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.textSubtle }}>
          {quality.coveredCount}/{quality.totalCount} ingrédients
        </Text>
      </View>
    ),
  });

  if (knownAllergens.length > 0) {
    rows.push({
      key: "__allergens",
      node: (
        <View style={{ paddingVertical: 13, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle }}>Allergènes</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {knownAllergens.map((tag) => (
              <View key={tag} style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>{ALLERGEN_LABELS[tag]}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    });
  }

  for (const group of [{ items: nova4, novaGroup: 4 }, { items: nova3, novaGroup: 3 }]) {
    if (group.items.length === 0) continue;
    const badgeColor = group.novaGroup === 4 ? "#DC2626" : "#EA580C";
    rows.push({
      key: `__nova${group.novaGroup}`,
      node: (
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 13 }}>
          <View style={{ backgroundColor: badgeColor, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: "#fff" }}>NOVA {group.novaGroup}</Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.textMuted, flex: 1, lineHeight: 20 }}>
            {group.items.map((i) => i.name).join(", ")}
          </Text>
        </View>
      ),
    });
  }

  for (const tag of visibleAdditives) {
    const { code, name } = formatAdditive(tag);
    rows.push({
      key: tag,
      node: (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSubtle, width: 44 }}>{code}</Text>
          <Text style={{ fontSize: 14, color: name ? colors.textMuted : colors.textSubtle, flex: 1 }}>
            {name ?? "—"}
          </Text>
        </View>
      ),
    });
  }

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>
          Qualité
        </Text>
        {quality.additives.length > 0 && (
          <Text style={{ fontSize: 11, color: colors.textSubtle }}>
            {quality.additives.length} additif{quality.additives.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {rows.map((row, i) => (
        <View key={row.key}>
          {row.node}
          {i < rows.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface }} />}
        </View>
      ))}

      {!showAllAdditives && hiddenCount > 0 && (
        <Pressable onPress={() => setShowAllAdditives(true)} style={{ paddingVertical: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>
            Voir {hiddenCount} additif{hiddenCount > 1 ? "s" : ""} de plus
          </Text>
        </Pressable>
      )}
    </View>
  );
}

interface RecipeDetailScreenProps {
  id: string;
  onBack: () => void;
  onEdit?: (id: string) => void;
  onDelete?: () => void;
}

export function RecipeDetailScreen({ id, onBack, onEdit, onDelete }: RecipeDetailScreenProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [servings, setServings] = useState(4);
  const [cookModeOpen, setCookModeOpen] = useState(false);
  const [cookStep, setCookStep] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [linkingIngredient, setLinkingIngredient] = useState<RecipeIngredient | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<CatalogProduct[]>([]);
  const [productSearching, setProductSearching] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [ingredientPrefs, setIngredientPrefs] = useState<Map<string, IngredientPreference>>(new Map());
  const [recipeCost, setRecipeCost] = useState<RecipeCostResult | null>(null);
  const [recipeNutrition, setRecipeNutrition] = useState<RecipeNutrition | null>(null);
  const [recipeQuality, setRecipeQuality] = useState<RecipeQuality | null>(null);

  const [cookLog, setCookLog] = useState<CookLog | null>(null);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  const [ingredientsView, setIngredientsView] = useState<"list" | "grid">("list");

  const [headerVisible, setHeaderVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem("@deazl/ingredients_view").then(v => {
      if (v === "grid" || v === "list") setIngredientsView(v);
    });
  }, []);

  function toggleIngredientsView() {
    const next = ingredientsView === "list" ? "grid" : "list";
    setIngredientsView(next);
    AsyncStorage.setItem("@deazl/ingredients_view", next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setHeaderVisible(value >= HERO_HEIGHT - 40);
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [HERO_HEIGHT - 100, HERO_HEIGHT - 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const heroContentOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT / 2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  useEffect(() => {
    Promise.all([
      getRecipeById(id),
      getUserIngredientPreferences(),
      getCookLog(id),
      getRecipeNotes(id),
    ]).then(([r, prefs, log, savedNotes]) => {
      setRecipe(r);
      setIngredientPrefs(prefs);
      setCookLog(log);
      setNotes(savedNotes);
      if (r) {
        setIsFavorite(r.isFavorite);
        setIsPublic(r.isPublic);
        setServings(r.servings);
        getRecipeEstimatedCost(r.ingredients, r.servings).then(setRecipeCost);
        getRecipeNutrition(r.ingredients, r.servings).then(setRecipeNutrition);
        getRecipeQuality(r.ingredients).then(setRecipeQuality);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (cookModeOpen) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    return () => { deactivateKeepAwake(); };
  }, [cookModeOpen]);

  async function handleToggleFavorite() {
    const next = !isFavorite;
    setIsFavorite(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(id, next);
  }

  async function handleAddToShoppingList() {
    setAddingToList(true);
    await addRecipeToShoppingList(id, servings);
    setAddingToList(false);
    setAddedToList(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setAddedToList(false), 2500);
  }

  async function handleDuplicate() {
    setActionsOpen(false);
    setDuplicating(true);
    const result = await duplicateRecipe(id);
    setDuplicating(false);
    if (typeof result === "string") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onEdit?.(result);
    }
  }

  async function handleTogglePublic() {
    const next = !isPublic;
    setIsPublic(next);
    setActionsOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleRecipePublic(id, next);
  }

  function toggleIngredient(ingredientId: string) {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function openLinkSheet(ing: RecipeIngredient) {
    setLinkingIngredient(ing);
    setProductSearch("");
    const normalized = normalizeIngredientName(ing.customName ?? "");
    const suggestion = ingredientPrefs.get(normalized);
    setProductResults(suggestion && !ing.productId ? [{
      id: suggestion.productId,
      name: suggestion.productName,
      brand: suggestion.productBrand,
      imageUrl: suggestion.productImageUrl,
    }] : []);
  }

  function closeLinkSheet() {
    setLinkingIngredient(null);
    setProductSearch("");
    setProductResults([]);
  }

  async function handleProductSearch(q: string) {
    setProductSearch(q);
    if (!q.trim()) { setProductResults([]); return; }
    setProductSearching(true);
    const results = await searchProducts(q);
    setProductResults(results);
    setProductSearching(false);
  }

  async function handleLinkProduct(product: CatalogProduct) {
    if (!linkingIngredient || !recipe) return;
    await linkProductToIngredient(linkingIngredient.id, product.id);
    setRecipe(prev => prev ? {
      ...prev,
      ingredients: prev.ingredients.map(i =>
        i.id === linkingIngredient.id ? { ...i, productId: product.id, productName: product.name } : i
      ),
    } : prev);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeLinkSheet();
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteRecipe(id);
    setDeleting(false);
    setConfirmDelete(false);
    onDelete?.();
  }

  async function handleUnlinkProduct() {
    if (!linkingIngredient || !recipe) return;
    await linkProductToIngredient(linkingIngredient.id, null);
    setRecipe(prev => prev ? {
      ...prev,
      ingredients: prev.ingredients.map(i =>
        i.id === linkingIngredient.id ? { ...i, productId: null, productName: null } : i
      ),
    } : prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeLinkSheet();
  }

  function openNotesSheet() {
    setNotesDraft(notes);
    setNotesOpen(true);
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    await saveRecipeNotes(id, notesDraft);
    setNotes(notesDraft);
    setNotesSaving(false);
    setNotesOpen(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.textMuted }}>Recette introuvable.</Text>
      </View>
    );
  }

  const [palFrom, palTo] = paletteForName(recipe.name);
  const hasImg = !!recipe.imageUrl;
  const multiplier = recipe.servings > 0 ? servings / recipe.servings : 1;
  const prepTime = recipe.prepTimeMinutes ?? 0;
  const cookTime = recipe.cookTimeMinutes ?? 0;
  const cookCount = cookLog?.count ?? 0;
  const hasStats = prepTime > 0 || cookTime > 0 || cookCount > 0;

  const adjustedTotalCost = recipeCost?.totalCost != null
    ? recipeCost.totalCost * multiplier
    : null;
  const costPerServing = recipeCost?.costPerServing ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Sticky compact header — fades in after scrolling past hero */}
      <Animated.View
        pointerEvents={headerVisible ? "auto" : "none"}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 50,
          opacity: headerOpacity,
          backgroundColor: colors.bg,
          borderBottomWidth: 1, borderBottomColor: colors.border,
          paddingTop: insets.top,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <PressableFeedback
            onPress={onBack}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="15 18 9 12 15 6" />
            </Svg>
          </PressableFeedback>
          <Text style={{ flex: 1, fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>{recipe.name}</Text>
          <PressableFeedback
            onPress={handleToggleFavorite}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill={isFavorite ? "#E8571C" : "none"} stroke={isFavorite ? "#E8571C" : colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
          </PressableFeedback>
        </View>
      </Animated.View>

      {/* Main scrollable content */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Hero */}
        <View style={{ height: HERO_HEIGHT }}>
          {hasImg ? (
            <Image
              source={{ uri: recipe.imageUrl! }}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[palFrom, palTo]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ position: "absolute", inset: 0 }}
            />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.78)"]}
            locations={[0, 0.38, 1]}
            style={{ position: "absolute", inset: 0 }}
          />

          {!hasImg && (
            <Text style={{ position: "absolute", right: 16, top: "12%", fontSize: 210, fontWeight: "900", color: "#fff", opacity: 0.08, lineHeight: 210 }}>
              {recipe.name.trim().charAt(0).toUpperCase()}
            </Text>
          )}

          {/* Floating nav buttons */}
          <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 }}>
              <Pressable
                onPress={onBack}
                style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="15 18 9 12 15 6" />
                </Svg>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={handleToggleFavorite}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill={isFavorite ? "#E8571C" : "none"} stroke={isFavorite ? "#E8571C" : "#1C1917"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </Svg>
                </Pressable>
                <Pressable
                  onPress={() => setActionsOpen(true)}
                  style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={12} cy={5} r={1} fill="#1C1917" />
                    <Circle cx={12} cy={12} r={1} fill="#1C1917" />
                    <Circle cx={12} cy={19} r={1} fill="#1C1917" />
                  </Svg>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

          {/* Hero title + meta — fades out on scroll */}
          <Animated.View style={{ position: "absolute", bottom: 60, left: 20, right: 20, opacity: heroContentOpacity }}>
            <Text style={{ fontSize: 30, fontWeight: "900", color: "#fff", letterSpacing: -0.5, lineHeight: 36, marginBottom: 14 }}>
              {recipe.name}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {prepTime + cookTime > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                    <Circle cx={12} cy={12} r={10} />
                    <Polyline points="12 6 12 12 16 14" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{fmtTime(prepTime + cookTime)}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                  <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <Circle cx={9} cy={7} r={4} />
                </Svg>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.servings} pers.</Text>
              </View>
              {recipe.ingredients.length > 0 && (
                <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>{recipe.ingredients.length} ingrédients</Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* White content card — overlaps hero slightly */}
        <View style={{ marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32, backgroundColor: colors.bg, overflow: "hidden" }}>

          {/* Stats strip */}
          {hasStats && (
            <>
              <View style={{ flexDirection: "row", paddingTop: 24, paddingBottom: 20 }}>
                {prepTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{fmtTime(prepTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Préparation</Text>
                  </View>
                )}
                {prepTime > 0 && cookTime > 0 && <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />}
                {cookTime > 0 && (
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{fmtTime(cookTime)}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Cuisson</Text>
                  </View>
                )}
                {(prepTime > 0 || cookTime > 0) && <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />}
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{recipe.servings}</Text>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Portions</Text>
                </View>
                {cookCount > 0 && (
                  <>
                    <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 4 }} />
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text }}>{cookCount}</Text>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.8 }}>Cuisinée</Text>
                    </View>
                  </>
                )}
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 20 }} />
            </>
          )}

          {!hasStats && <View style={{ height: 24 }} />}

          {/* Cost estimate band */}
          {recipeCost && recipeCost.totalCount > 0 && (
            <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 8 }}>
              <View style={{
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                backgroundColor: costPerServing != null ? colors.accentBg : colors.bgSurface,
                borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={costPerServing != null ? colors.accent : colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={12} y1={1} x2={12} y2={23} />
                    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </Svg>
                  {costPerServing != null ? (
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: colors.accent }}>
                        {fmtCost(adjustedTotalCost!)}
                        {servings !== recipe.servings && (
                          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}> · {fmtCost(costPerServing)}/pers.</Text>
                        )}
                      </Text>
                      {recipeCost.coveredCount < recipeCost.totalCount && (
                        <Text style={{ fontSize: 11, color: colors.textSubtle, marginTop: 1 }}>
                          estimé sur {recipeCost.coveredCount}/{recipeCost.totalCount} ingrédients
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textSubtle }}>Coût indisponible</Text>
                  )}
                </View>
                {costPerServing != null && servings === recipe.servings && (
                  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>
                    {fmtCost(costPerServing)}<Text style={{ fontWeight: "400", color: colors.textSubtle }}>/pers.</Text>
                  </Text>
                )}
                {costPerServing == null && recipeCost.totalCount > 0 && (
                  <Text style={{ fontSize: 11, color: colors.textSubtle }}>
                    {recipeCost.coveredCount}/{recipeCost.totalCount} ingrédients
                  </Text>
                )}
              </View>
            </View>
          )}


          {/* Description */}
          {recipe.description ? (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 }}>
              <Text style={{ fontSize: 15, color: colors.textMuted, lineHeight: 24 }}>{recipe.description}</Text>
              <View style={{ height: 1, backgroundColor: colors.border, marginTop: 20 }} />
            </View>
          ) : null}

          {/* Ingredients */}
          {recipe.ingredients.length > 0 && (
            <View style={{ paddingTop: 28 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  Ingrédients
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ flexDirection: "row", backgroundColor: colors.bgSurface, borderRadius: 10, padding: 3 }}>
                    <Pressable
                      onPress={() => { if (ingredientsView !== "list") toggleIngredientsView(); }}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ingredientsView === "list" ? colors.bg : "transparent" }}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ingredientsView === "list" ? colors.text : colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Line x1={8} y1={6} x2={21} y2={6} />
                        <Line x1={8} y1={12} x2={21} y2={12} />
                        <Line x1={8} y1={18} x2={21} y2={18} />
                        <Line x1={3} y1={6} x2={3.01} y2={6} />
                        <Line x1={3} y1={12} x2={3.01} y2={12} />
                        <Line x1={3} y1={18} x2={3.01} y2={18} />
                      </Svg>
                    </Pressable>
                    <Pressable
                      onPress={() => { if (ingredientsView !== "grid") toggleIngredientsView(); }}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: ingredientsView === "grid" ? colors.bg : "transparent" }}
                    >
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ingredientsView === "grid" ? colors.text : colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Rect x={3} y={3} width={7} height={7} rx={1} />
                        <Rect x={14} y={3} width={7} height={7} rx={1} />
                        <Rect x={3} y={14} width={7} height={7} rx={1} />
                        <Rect x={14} y={14} width={7} height={7} rx={1} />
                      </Svg>
                    </Pressable>
                  </View>
                  {/* Inline servings adjuster */}
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bgSurface, borderRadius: 12, overflow: "hidden" }}>
                    <Pressable
                      onPress={() => setServings(s => Math.max(1, s - 1))}
                      style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round">
                        <Line x1={5} y1={12} x2={19} y2={12} />
                      </Svg>
                    </Pressable>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, minWidth: 44, textAlign: "center" }}>{servings} pers.</Text>
                    <Pressable
                      onPress={() => setServings(s => s + 1)}
                      style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    >
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round">
                        <Line x1={12} y1={5} x2={12} y2={19} />
                        <Line x1={5} y1={12} x2={19} y2={12} />
                      </Svg>
                    </Pressable>
                  </View>
                </View>
              </View>

              {ingredientsView === "list" ? (
                <View style={{ paddingHorizontal: 20 }}>
                  {groupIngredientsBySection(recipe.ingredients).map((group, gi) => (
                    <View key={group.section ?? `__unsectioned_${gi}`}>
                      {group.section && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingTop: gi > 0 ? 16 : 0, paddingBottom: 4 }}>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                          <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                            {group.section}
                          </Text>
                          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                        </View>
                      )}
                      {group.items.map((ing, i) => {
                        const isChecked = checkedIngredients.has(ing.id);
                        const displayName = ing.productName ?? ing.customName ?? "";
                        const isLinked = !!ing.productId;
                        const normalized = normalizeIngredientName(ing.customName ?? "");
                        const suggestion = !isLinked ? ingredientPrefs.get(normalized) : undefined;
                        const ingCost = recipeCost?.ingredientCosts.get(ing.id);
                        const adjustedIngCost = ingCost?.estimatedCost != null
                          ? ingCost.estimatedCost * multiplier
                          : null;
                        return (
                          <View key={ing.id}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13 }}>
                              <Pressable onPress={() => toggleIngredient(ing.id)}>
                                <View style={{
                                  width: 24, height: 24, borderRadius: 12,
                                  borderWidth: 2,
                                  borderColor: isChecked ? "#E8571C" : "#D6D3D1",
                                  backgroundColor: isChecked ? "#E8571C" : "transparent",
                                  alignItems: "center", justifyContent: "center",
                                }}>
                                  {isChecked && (
                                    <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                      <Polyline points="20 6 9 17 4 12" />
                                    </Svg>
                                  )}
                                </View>
                              </Pressable>
                              <Pressable style={{ flex: 1 }} onPress={() => toggleIngredient(ing.id)}>
                                <Text style={{ fontSize: 15, color: isChecked ? "#B0AAA5" : colors.text, opacity: isChecked ? 0.55 : 1, textDecorationLine: isChecked ? "line-through" : "none" }}>
                                  {ing.quantity > 0 ? (
                                    <Text style={{ fontWeight: "700", color: isChecked ? "#B0AAA5" : "#E8571C" }}>
                                      {fmtQty(ing.quantity, multiplier)}{ing.unit ? ` ${ing.unit}` : ""}{" "}
                                    </Text>
                                  ) : null}
                                  {displayName}
                                  {ing.isOptional ? <Text style={{ color: colors.textSubtle, fontSize: 13 }}> (opt.)</Text> : null}
                                </Text>
                                {adjustedIngCost != null ? (
                                  <Text style={{ fontSize: 11, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                                    <Text style={{ color: colors.accent }}>{fmtCost(adjustedIngCost)}</Text>
                                    {ingCost?.storeName ? (
                                      <Text style={{ color: colors.textSubtle, fontWeight: "400" }}> · {ingCost.storeName}</Text>
                                    ) : ingCost?.confidence !== "exact" ? (
                                      <Text style={{ color: colors.textSubtle, fontWeight: "400" }}> estimé</Text>
                                    ) : null}
                                  </Text>
                                ) : suggestion ? (
                                  <Text style={{ fontSize: 11, color: colors.accent, fontWeight: "600", marginTop: 2 }} numberOfLines={1}>
                                    → {suggestion.productName}
                                  </Text>
                                ) : null}
                              </Pressable>
                              <Pressable
                                onPress={() => openLinkSheet(ing)}
                                style={{
                                  width: 30, height: 30, borderRadius: 8,
                                  backgroundColor: isLinked ? colors.accentBg : suggestion ? colors.accentBg + "66" : colors.bgSurface,
                                  alignItems: "center", justifyContent: "center",
                                }}
                              >
                                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={isLinked ? colors.accent : suggestion ? colors.accent : "#A8A29E"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                  <Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                  <Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </Svg>
                              </Pressable>
                            </View>
                            {i < group.items.length - 1 && (
                              <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
                            )}
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              ) : (
                <IngredientGrid
                  ingredients={recipe.ingredients}
                  multiplier={multiplier}
                  checkedIngredients={checkedIngredients}
                  onToggle={toggleIngredient}
                  colors={colors}
                  recipeCost={recipeCost}
                />
              )}
            </View>
          )}

          {/* Steps — connected timeline layout */}
          {recipe.steps.length > 0 && (
            <View style={{ paddingTop: 36, paddingHorizontal: 20, paddingBottom: 28 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24 }}>
                Préparation
              </Text>
              {groupStepsBySection(recipe.steps).map((group, gi) => (
                <View key={group.section ?? `__unsectioned_${gi}`}>
                  {group.section && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, marginTop: gi > 0 ? 8 : 0 }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                        {group.section}
                      </Text>
                      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                    </View>
                  )}
                  {group.items.map((step, i) => (
                    <View key={step.id} style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ alignItems: "center", width: 36 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 15, fontWeight: "900", color: "#fff" }}>{step.stepNumber}</Text>
                        </View>
                        {i < group.items.length - 1 && (
                          <View style={{ width: 2, flex: 1, minHeight: 20, backgroundColor: "#FCDCC8", marginTop: 6 }} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: i < group.items.length - 1 ? 28 : 0, paddingTop: 7 }}>
                        <Text style={{ fontSize: 15, color: colors.textMuted, lineHeight: 24 }}>
                          {step.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {gi < groupStepsBySection(recipe.steps).length - 1 && (
                    <View style={{ height: 28 }} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Nutrition grid */}
          {recipeNutrition && (
            <NutritionGrid nutrition={recipeNutrition} colors={colors} />
          )}

          {/* Quality */}
          {recipeQuality && (
            <RecipeQualitySection quality={recipeQuality} colors={colors} />
          )}

          {/* Personal notes */}
          <Pressable
            onPress={openNotesSheet}
            style={{ marginHorizontal: 20, marginTop: 28, marginBottom: 16 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>
                Notes personnelles
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </Svg>
            </View>
            <View style={{ backgroundColor: colors.bgSurface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 72 }}>
              {notes.trim() ? (
                <Text style={{ fontSize: 15, color: colors.textMuted, lineHeight: 22 }}>{notes}</Text>
              ) : (
                <Text style={{ fontSize: 15, color: colors.textSubtle, lineHeight: 22, fontStyle: "italic" }}>
                  Ajoutez vos notes, variantes, astuces…
                </Text>
              )}
            </View>
          </Pressable>

          {/* Bottom spacing for sticky button */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Sticky bottom bar */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: colors.bg,
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
        flexDirection: "row",
        gap: 10,
      }}>
        <Button
          variant="outline"
          className="flex-1 rounded-2xl"
          isDisabled={addingToList}
          onPress={handleAddToShoppingList}
        >
          {addedToList ? (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20 6 9 17 4 12" />
            </Svg>
          ) : (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Line x1={3} y1={6} x2={21} y2={6} />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
          )}
          <Button.Label style={{ color: addedToList ? colors.green : colors.text }}>
            {addingToList ? "Ajout…" : addedToList ? "Ajouté ✓" : "Courses"}
          </Button.Label>
        </Button>
        {recipe.steps.length > 0 && (
          <Button
            variant="primary"
            className="flex-1 rounded-2xl"
            onPress={() => { setCookStep(0); setCookModeOpen(true); }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Polygon points="5 3 19 12 5 21 5 3" />
            </Svg>
            <Button.Label>Mode Cuisine</Button.Label>
          </Button>
        )}
      </View>

      {/* Product linking BottomModal */}
      <BottomModal isOpen={linkingIngredient !== null} onClose={closeLinkSheet} height="70%">
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>Lier un produit</Text>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 }} numberOfLines={1}>
                    {linkingIngredient?.productName ?? linkingIngredient?.customName ?? ""}
                  </Text>
                </View>
                <Pressable onPress={closeLinkSheet} hitSlop={8} style={{ padding: 4 }}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round">
                    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
                  </Svg>
                </Pressable>
              </View>

              {linkingIngredient?.productId && (
                <Pressable
                  onPress={handleUnlinkProduct}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 10,
                    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                    backgroundColor: "#FFF1F2", marginBottom: 12,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
                    <Path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
                    <Line x1={8} y1={2} x2={8} y2={5} />
                    <Line x1={2} y1={8} x2={5} y2={8} />
                    <Line x1={16} y1={19} x2={16} y2={22} />
                    <Line x1={19} y1={16} x2={22} y2={16} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#E11D48" }}>Délier le produit actuel</Text>
                </Pressable>
              )}

              <SearchField value={productSearch} onChange={handleProductSearch}>
                <SearchField.Group className="rounded-2xl">
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Rechercher un produit…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <BottomModalScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}>
                {productSearching ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <ActivityIndicator color="#E8571C" />
                  </View>
                ) : productResults.length === 0 && productSearch.trim() ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 14, color: colors.textSubtle }}>Aucun produit trouvé</Text>
                  </View>
                ) : productResults.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 14, color: colors.textSubtle }}>Tapez un nom de produit pour rechercher</Text>
                  </View>
                ) : (
                  productResults.map(product => (
                    <Pressable
                      key={product.id}
                      onPress={() => handleLinkProduct(product)}
                      style={({ pressed }) => ({
                        flexDirection: "row", alignItems: "center", gap: 12,
                        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                        backgroundColor: linkingIngredient?.productId === product.id ? colors.accentBg : pressed ? colors.bgSubtle : "transparent",
                        marginBottom: 2,
                      })}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", backgroundColor: colors.bgSurface, flexShrink: 0, alignItems: "center", justifyContent: "center" }}>
                        {product.imageUrl ? (
                          <Image source={{ uri: product.imageUrl }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                        ) : (
                          <Text style={{ fontSize: 18 }}>🛒</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "600", color: linkingIngredient?.productId === product.id ? colors.accent : colors.text }}>{product.name}</Text>
                        {product.brand && <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSubtle, marginTop: 1 }}>{product.brand}</Text>}
                      </View>
                      {linkingIngredient?.productId === product.id && (
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M20 6 9 17l-5-5" />
                        </Svg>
                      )}
                    </Pressable>
                  ))
                )}
              </BottomModalScrollView>
            </View>
      </BottomModal>

      {/* Cook Mode BottomModal */}
      <BottomModal isOpen={cookModeOpen && recipe.steps.length > 0} onClose={() => setCookModeOpen(false)} height="88%">
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Étape {cookStep + 1} / {recipe.steps.length}
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 2 }} numberOfLines={1}>{recipe.name}</Text>
                </View>
                <Pressable onPress={() => setCookModeOpen(false)} hitSlop={8} style={{ padding: 4 }}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round">
                    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
                  </Svg>
                </Pressable>
              </View>

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: colors.bgSurface, marginHorizontal: 20, borderRadius: 99 }}>
                <View style={{
                  height: 3, borderRadius: 99, backgroundColor: colors.accent,
                  width: `${((cookStep + 1) / recipe.steps.length) * 100}%`,
                }} />
              </View>

              {/* Step content */}
              <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 20 }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent,
                  alignItems: "center", justifyContent: "center", marginBottom: 28,
                }}>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: "#fff" }}>{recipe.steps[cookStep]?.stepNumber}</Text>
                </View>
                <Text style={{ fontSize: 20, color: colors.text, lineHeight: 32, fontWeight: "400", flex: 1 }}>
                  {recipe.steps[cookStep]?.description}
                </Text>
              </View>

              {/* Navigation */}
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 32 }}>
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  isDisabled={cookStep === 0}
                  onPress={() => setCookStep(s => s - 1)}
                >
                  <Button.Label>Précédent</Button.Label>
                </Button>
                {cookStep < recipe.steps.length - 1 ? (
                  <Button variant="primary" className="flex-1 rounded-2xl" onPress={() => setCookStep(s => s + 1)}>
                    <Button.Label>Suivant</Button.Label>
                  </Button>
                ) : (
                  <Button variant="primary" className="flex-1 rounded-2xl" onPress={() => setCookModeOpen(false)}>
                    <Button.Label>Terminé ✓</Button.Label>
                  </Button>
                )}
              </View>
            </View>
      </BottomModal>

      <BottomModal isOpen={actionsOpen} onClose={() => setActionsOpen(false)} height="auto">
            <View style={{ paddingBottom: 8, gap: 4 }}>
              <Pressable
                onPress={() => { setActionsOpen(false); setScheduleOpen(true); }}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
                  <Line x1={16} y1={2} x2={16} y2={6} />
                  <Line x1={8} y1={2} x2={8} y2={6} />
                  <Line x1={3} y1={10} x2={21} y2={10} />
                  <Path d="M8 14h.01M12 14h.01M16 14h.01" />
                </Svg>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.accent }}>Planifier cette recette</Text>
              </Pressable>
              <Pressable
                onPress={handleTogglePublic}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  {isPublic ? (
                    <>
                      <Circle cx={12} cy={12} r={10} />
                      <Line x1={2} y1={12} x2={22} y2={12} />
                      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </>
                  ) : (
                    <>
                      <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
                      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </>
                  )}
                </Svg>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                  {isPublic ? "Rendre privée" : "Rendre publique"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleDuplicate}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: (pressed || duplicating) ? 0.7 : 1 })}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
                  <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </Svg>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                  {duplicating ? "Duplication…" : "Dupliquer la recette"}
                </Text>
              </Pressable>
              {onEdit && (
                <Pressable
                  onPress={() => { setActionsOpen(false); onEdit(id); }}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </Svg>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>Modifier la recette</Text>
                </Pressable>
              )}
              {onDelete && (
                <Pressable
                  onPress={() => { setActionsOpen(false); setConfirmDelete(true); }}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16, opacity: pressed ? 0.7 : 1 })}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="3 6 5 6 21 6" />
                    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <Path d="M10 11v6M14 11v6M9 6V4h6v2" />
                  </Svg>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.danger }}>Supprimer la recette</Text>
                </Pressable>
              )}
            </View>
      </BottomModal>

      <ScheduleSheet
        recipeId={id}
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />

      <BottomModal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} height="auto">
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>Supprimer la recette ?</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>Cette action est irréversible.</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Button variant="ghost" onPress={handleDelete} isDisabled={deleting} className="w-full rounded-2xl">
                <Button.Label style={{ color: colors.danger }}>{deleting ? "Suppression…" : "Supprimer"}</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => setConfirmDelete(false)} className="w-full rounded-2xl">
                <Button.Label>Annuler</Button.Label>
              </Button>
            </View>
      </BottomModal>

      <BottomModal isOpen={notesOpen} onClose={() => setNotesOpen(false)} height="60%">
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>Notes personnelles</Text>
                <Pressable onPress={() => setNotesOpen(false)} hitSlop={8} style={{ padding: 4 }}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round">
                    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
                  </Svg>
                </Pressable>
              </View>
              <TextInput
                value={notesDraft}
                onChangeText={setNotesDraft}
                placeholder="Vos notes, variantes, astuces…"
                placeholderTextColor={colors.textSubtle}
                multiline
                autoFocus
                style={{
                  flex: 1,
                  backgroundColor: colors.bgSurface,
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 15,
                  color: colors.text,
                  lineHeight: 22,
                  textAlignVertical: "top",
                  marginBottom: 16,
                }}
              />
              <Button
                variant="primary"
                className="w-full rounded-2xl"
                isDisabled={notesSaving}
                onPress={handleSaveNotes}
              >
                <Button.Label>{notesSaving ? "Enregistrement…" : "Sauvegarder"}</Button.Label>
              </Button>
            </View>
      </BottomModal>
    </View>
  );
}

const MEAL_LABELS: Record<MealType, string> = { breakfast: "Petit-déjeuner", lunch: "Déjeuner", dinner: "Dîner" };
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getWeekDays(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function ScheduleSheet({ recipeId, isOpen, onClose }: { recipeId: string; isOpen: boolean; onClose: () => void }) {
  const { colors } = useAppTheme();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekDays = getWeekDays();
  const todayIdx = weekDays.findIndex((d) => d.getTime() === today.getTime());

  const [selectedDay, setSelectedDay] = useState(todayIdx >= 0 ? todayIdx : 0);
  const [selectedMeal, setSelectedMeal] = useState<MealType>("lunch");
  const [scheduling, setScheduling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (isOpen) { setDone(false); setSelectedDay(todayIdx >= 0 ? todayIdx : 0); setSelectedMeal("lunch"); }
  }, [isOpen]);

  async function handleSchedule() {
    setScheduling(true);
    await scheduleRecipe(recipeId, selectedDay + 1, selectedMeal);
    setScheduling(false);
    setDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(onClose, 1200);
  }

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="52%">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>Planifier cette recette</Text>
            <Pressable onPress={onClose} hitSlop={8} style={{ padding: 4 }}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round">
                <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
              </Svg>
            </Pressable>
          </View>

          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Jour</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {weekDays.map((day, i) => {
                  const isPast = day < today;
                  const isSelected = i === selectedDay;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => !isPast && setSelectedDay(i)}
                      style={{
                        flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", gap: 2,
                        backgroundColor: isSelected ? colors.accent : isPast ? colors.bgSubtle : colors.bgSurface,
                        opacity: isPast ? 0.4 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "700", color: isSelected ? "#fff" : colors.textSubtle, textTransform: "uppercase" }}>
                        {DAY_LABELS[i]}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: isSelected ? "#fff" : colors.text }}>
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Repas</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {MEAL_TYPES.map((mt) => (
                  <Pressable
                    key={mt}
                    onPress={() => setSelectedMeal(mt)}
                    style={{
                      flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center",
                      backgroundColor: selectedMeal === mt ? colors.accent : colors.bgSurface,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: selectedMeal === mt ? "#fff" : colors.textMuted }}>
                      {MEAL_LABELS[mt]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              onPress={handleSchedule}
              disabled={scheduling || done}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center",
                backgroundColor: done ? colors.green : pressed ? colors.accentPress : colors.accent,
              })}
            >
              {scheduling ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
                  {done ? "Planifié ✓" : "Planifier"}
                </Text>
              )}
            </Pressable>
          </View>
    </BottomModal>
  );
}
