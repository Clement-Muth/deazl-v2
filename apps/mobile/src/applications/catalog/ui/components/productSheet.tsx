import * as Haptics from "expo-haptics";
import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { useAppTheme } from "../../../../shared/theme";
import { addShoppingItem } from "../../../shopping/application/useCases/addShoppingItem";
import { createEmptyShoppingList } from "../../../shopping/application/useCases/createEmptyShoppingList";
import { getActiveShoppingList } from "../../../shopping/application/useCases/getActiveShoppingList";
import { getAdditiveRisk, parseAdditiveTag } from "../../../shopping/domain/additiveRisks";
import type { ProductWithPrices } from "../../application/useCases/getProductWithPrices";

const NUTRISCORE_COLORS: Record<string, { bg: string; text: string }> = {
  a: { bg: "#1a9a48", text: "#fff" },
  b: { bg: "#71bb44", text: "#fff" },
  c: { bg: "#f9c623", text: "#1C1917" },
  d: { bg: "#e8771c", text: "#fff" },
  e: { bg: "#e63e11", text: "#fff" },
};

const NOVA_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "#1a9a48", text: "#fff", label: "Non transformé" },
  2: { bg: "#71bb44", text: "#fff", label: "Ingrédients culinaires" },
  3: { bg: "#e8771c", text: "#fff", label: "Transformé" },
  4: { bg: "#e63e11", text: "#fff", label: "Ultra-transformé" },
};

const ALLERGEN_LABELS: Record<string, string> = {
  "en:gluten": "Gluten", "en:crustaceans": "Crustacés", "en:eggs": "Œufs",
  "en:fish": "Poisson", "en:peanuts": "Arachides", "en:soybeans": "Soja",
  "en:milk": "Lait", "en:nuts": "Fruits à coque", "en:celery": "Céleri",
  "en:mustard": "Moutarde", "en:sesame-seeds": "Sésame", "en:sulphur-dioxide": "Sulfites",
  "en:lupin": "Lupin", "en:molluscs": "Mollusques",
};


function NutriScore({ grade }: { grade: string }) {
  const g = grade.toLowerCase();
  const s = NUTRISCORE_COLORS[g] ?? { bg: "#9ca3af", text: "#fff" };
  return (
    <View style={{ borderRadius: 6, backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 12, fontWeight: "800", color: s.text, letterSpacing: 0.5 }}>
        Nutri-Score {grade.toUpperCase()}
      </Text>
    </View>
  );
}

function NovaGroup({ group, muted }: { group: number; muted: string }) {
  const s = NOVA_COLORS[group] ?? { bg: "#9ca3af", text: "#fff", label: "" };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ borderRadius: 6, backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 3 }}>
        <Text style={{ fontSize: 12, fontWeight: "800", color: s.text }}>NOVA {group}</Text>
      </View>
      <Text style={{ fontSize: 11, color: muted }}>{s.label}</Text>
    </View>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ProductSheet({
  product,
  visible,
  onClose,
  onAddedToList,
}: {
  product: ProductWithPrices | null;
  visible: boolean;
  onClose: () => void;
  onAddedToList?: () => void;
}) {
  const { colors } = useAppTheme();

  if (!product) return null;

  const { offProduct, storePrices } = product;

  const allergens = offProduct.allergensTags.map((t) => ALLERGEN_LABELS[t]).filter(Boolean);
  const additives = offProduct.additivesTags
    .map((tag) => {
      const parsed = parseAdditiveTag(tag);
      if (!parsed) return null;
      return { code: parsed.code, name: parsed.name, risk: getAdditiveRisk(parsed.code) };
    })
    .filter((a): a is { code: string; name: string; risk: "high" | "moderate" | "low" } => a !== null);

  const hasNutrition = offProduct.energyKcal100g != null
    || offProduct.proteins100g != null
    || offProduct.fat100g != null
    || offProduct.carbohydrates100g != null;

  async function handleAddToList() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const existing = await getActiveShoppingList();
    const listId = existing?.id ?? (await createEmptyShoppingList())?.id;
    if (!listId) return;
    await addShoppingItem(listId, offProduct.name, 1, "pièce");
    onAddedToList?.();
    onClose();
  }

  return (
    <BottomModal isOpen={visible} onClose={onClose} height="auto">
      <BottomModalScrollView>
        <View style={{ padding: 20, gap: 16 }}>

          {/* Header */}
          <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
            {offProduct.imageUrl ? (
              <Image
                source={{ uri: offProduct.imageUrl }}
                style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.bgSurface }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 28 }}>🛒</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }} numberOfLines={2}>
                {offProduct.name}
              </Text>
              {offProduct.brand && (
                <Text style={{ fontSize: 13, color: colors.textMuted }}>{offProduct.brand}</Text>
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {offProduct.nutriscoreGrade && <NutriScore grade={offProduct.nutriscoreGrade} />}
              </View>
              {offProduct.novaGroup != null && <NovaGroup group={offProduct.novaGroup} muted={colors.textMuted} />}
            </View>
          </View>

          {/* Prix */}
          {storePrices.length > 0 ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Prix dans tes magasins
              </Text>
              {storePrices.map((sp, i) => {
                const isBest = i === 0;
                return (
                  <View
                    key={sp.storeId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      backgroundColor: isBest ? colors.greenBg : colors.bgSurface,
                    }}
                  >
                    {isBest && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green, marginRight: 8 }} />
                    )}
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: isBest ? colors.green : colors.text }}>
                      {sp.storeName}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: isBest ? colors.green : colors.text }}>
                      {sp.price.toFixed(2)} €
                    </Text>
                    <Text style={{ fontSize: 11, color: isBest ? colors.green : colors.textMuted, marginLeft: 4, opacity: 0.7 }}>
                      /{sp.quantity}{sp.unit}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ borderRadius: 12, backgroundColor: colors.bgSurface, padding: 16, alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                Aucun prix dans tes magasins pour ce produit.
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSubtle, textAlign: "center" }}>
                Reporte le prix depuis la liste de courses pour alimenter le comparateur.
              </Text>
            </View>
          )}

          {/* Valeurs nutritionnelles */}
          {hasNutrition && (
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
                Valeurs nutritionnelles · pour 100g
              </Text>
              <View style={{ backgroundColor: colors.bgSurface, borderRadius: 12, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 2 }}>
                {offProduct.energyKcal100g != null && (
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: colors.text }}>Énergie</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{offProduct.energyKcal100g} kcal</Text>
                  </View>
                )}
                {([
                  { label: "Matières grasses", value: offProduct.fat100g, unit: "g" },
                  { label: "dont saturées", value: offProduct.saturatedFat100g, unit: "g" },
                  { label: "Glucides", value: offProduct.carbohydrates100g, unit: "g" },
                  { label: "dont sucres", value: offProduct.sugars100g, unit: "g" },
                  { label: "Fibres", value: offProduct.fiber100g, unit: "g" },
                  { label: "Protéines", value: offProduct.proteins100g, unit: "g" },
                  { label: "Sel", value: offProduct.salt100g, unit: "g" },
                ] as { label: string; value: number | null; unit: string }[]).filter((r) => r.value != null).map((r, i, arr) => (
                  <View key={r.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                    <Text style={{ flex: 1, fontSize: 13, color: colors.textMuted }}>{r.label}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
                      {(r.value! % 1 === 0 ? r.value : r.value!.toFixed(1))} {r.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Allergènes */}
          {allergens.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Allergènes
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {allergens.map((a) => (
                  <View key={a} style={{ borderRadius: 8, backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accentBgBorder, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additifs */}
          {additives.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.2 }}>
                Additifs · {additives.length}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {additives.map((a) => {
                  const bg = a.risk === "high" ? colors.dangerBg : a.risk === "moderate" ? colors.accentBg : colors.bgSurface;
                  const border = a.risk === "high" ? colors.danger : a.risk === "moderate" ? colors.accentBgBorder : colors.border;
                  const textColor = a.risk === "high" ? colors.dangerText : a.risk === "moderate" ? colors.accent : colors.textMuted;
                  return (
                    <View key={a.code} style={{ borderRadius: 8, backgroundColor: bg, borderWidth: 1, borderColor: border, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>{a.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* CTA */}
          <Pressable
            onPress={handleAddToList}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 14,
              backgroundColor: pressed ? colors.accentPress : colors.accent,
              paddingVertical: 16,
            })}
          >
            <PlusIcon color="#fff" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
              Ajouter à ma liste
            </Text>
          </Pressable>

        </View>
      </BottomModalScrollView>
    </BottomModal>
  );
}
