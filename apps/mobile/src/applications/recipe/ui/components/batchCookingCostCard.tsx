import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Share, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import type { PreviousSession } from "../../application/useCases/getPreviousSessions";
import { getBatchCookingCost, type BatchCookingCost } from "../../application/useCases/getBatchCookingCost";
import { getBatchCookingMargin, DEFAULT_MARGIN } from "../../application/useCases/batchCookingMarginStore";

export function CostCard({ session, colors }: { session: PreviousSession; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  const [cost, setCost] = useState<BatchCookingCost | null>(null);
  const [margin, setMargin] = useState(DEFAULT_MARGIN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const recipeNames = Object.fromEntries(session.recipeIds.map((id, i) => [id, session.recipeNames[i] ?? "Recette"]));
    Promise.all([
      getBatchCookingCost(session.weekStart, session.recipeIds, recipeNames),
      getBatchCookingMargin(),
    ]).then(([c, m]) => {
      setCost(c);
      setMargin(m);
      setLoading(false);
    });
  }, []);

  const divisor = cost?.servingsPerMeal ?? 1;
  const perPerson = divisor > 1;

  function formatEuro(n: number): string {
    return n.toFixed(2).replace(".", ",") + " €";
  }

  async function handleShare() {
    if (!cost) return;
    const weekDate = new Date(session.weekStart + "T00:00:00");
    const dateLabel = weekDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const shareIngCost = cost.totalIngredientsCost / divisor;
    const shareMargeAmt = shareIngCost * margin;
    const shareTotal = shareIngCost + shareMargeAmt;
    const disclaimer = cost.totalMissingPriceCount > 0 ? `\n⚠️ ${cost.totalMissingPriceCount} ingrédient(s) sans prix` : "";

    const DISCRETE_UNITS = new Set(["pièce", "pièces", "bouquet", "bouquets", "tranche", "tranches", "càs", "càc", "cs", "cc"]);
    const formatQty = (qty: number, unit: string) => {
      if (DISCRETE_UNITS.has(unit.toLowerCase().trim())) return Math.ceil(qty).toString();
      if (qty % 1 === 0) return qty.toString();
      return qty < 10 ? qty.toFixed(1) : Math.round(qty).toString();
    };

    const recipeBlocks = cost.recipeCosts.map((r) => {
      const recipeCostPP = r.cost / divisor;
      const ingLines = r.ingredients.map((ing) => {
        const ingCostPP = ing.cost !== null ? ing.cost / divisor : null;
        const costStr = ingCostPP !== null ? `~${formatEuro(ingCostPP)}` : "—";
        return `  - ${ing.name} (${formatQty(ing.quantity / divisor, ing.unit)} ${ing.unit}) : ${costStr}`;
      });
      return [`${r.recipeName} : ~${formatEuro(recipeCostPP)}`, ...ingLines].join("\n");
    });

    const text = [
      `Batch cooking — semaine du ${dateLabel}`,
      perPerson ? `(prix par personne — ${divisor} pers.)` : ``,
      ``,
      ...recipeBlocks.flatMap((b) => [b, ``]),
      `Ingrédients : ~${formatEuro(shareIngCost)}`,
      `Marge (${Math.round(margin * 100)}%) : +${formatEuro(shareMargeAmt)}`,
      `Total : ~${formatEuro(shareTotal)} 🍱`,
      disclaimer,
    ].join("\n");
    await Share.share({ message: text });
  }

  if (loading) {
    return (
      <View style={{ paddingHorizontal: 18, paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator color={colors.accent} size="small" />
      </View>
    );
  }

  if (!cost?.hasData) {
    return (
      <View style={{ paddingHorizontal: 18, paddingVertical: 14 }}>
        <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center" }}>
          Aucune donnée de prix disponible pour cette semaine.
        </Text>
      </View>
    );
  }

  const ingredientsCostPerPerson = cost.totalIngredientsCost / divisor;
  const margeAmt = ingredientsCostPerPerson * margin;
  const total = ingredientsCostPerPerson + margeAmt;
  const hasApproximate = cost.totalMissingPriceCount > 0;

  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 }}>
      <Text style={{ fontSize: 11, fontWeight: "800", color: colors.accent, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
        Résumé de coût
      </Text>

      {cost.recipeCosts.map((r) => {
        const recipeCostPP = r.cost / divisor;
        return (
          <View key={r.recipeId} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 13, color: colors.text, flex: 1, fontWeight: "500" }} numberOfLines={1}>{r.recipeName}</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, marginLeft: 12 }}>
              {recipeCostPP > 0 ? `~${formatEuro(recipeCostPP)}` : "—"}
            </Text>
          </View>
        );
      })}

      <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12, gap: 6 }}>
        {perPerson && (
          <Text style={{ fontSize: 11, color: colors.textSubtle, marginBottom: 4 }}>
            Prix par personne ({divisor} pers.)
          </Text>
        )}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Ingrédients</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>
            {hasApproximate ? "~" : ""}{formatEuro(ingredientsCostPerPerson)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Marge ({Math.round(margin * 100)}%)</Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>+{formatEuro(margeAmt)}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>Total</Text>
          <Text style={{ fontSize: 15, fontWeight: "900", color: colors.accent }}>
            {hasApproximate ? "~" : ""}{formatEuro(total)}
          </Text>
        </View>
      </View>

      {hasApproximate && (
        <Text style={{ fontSize: 11, color: colors.textSubtle, marginTop: 8 }}>
          ⚠️ {cost.totalMissingPriceCount} ingrédient(s) sans prix — estimation partielle
        </Text>
      )}

      <Pressable
        onPress={handleShare}
        style={({ pressed }) => ({
          marginTop: 14, borderRadius: 12, backgroundColor: pressed ? colors.accentPress : colors.accent,
          paddingVertical: 11, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 7,
        })}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <Path d="M16 6l-4-4-4 4" />
          <Path d="M12 2v13" />
        </Svg>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Partager</Text>
      </Pressable>
    </View>
  );
}
