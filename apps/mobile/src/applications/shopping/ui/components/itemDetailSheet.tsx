import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useCameraPermissions, CameraView } from "expo-camera";
import * as Haptics from "expo-haptics";
import { BottomSheet } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from "react-native";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { getAdditiveRisk, parseAdditiveTag } from "../../domain/additiveRisks";
import type { AlternativeProduct } from "../../application/useCases/getProductAlternatives";
import { getProductAlternatives } from "../../application/useCases/getProductAlternatives";
import type { ProductDetails } from "../../application/useCases/getProductById";
import { getProductById } from "../../application/useCases/getProductById";
import { findOrCreateProduct } from "../../application/useCases/findOrCreateProduct";
import { linkShoppingItemProduct } from "../../application/useCases/linkShoppingItemProduct";
import { updateShoppingItem } from "../../application/useCases/updateShoppingItem";
import type { OFFProductResult } from "../../application/useCases/searchOffProducts";
import { getOffProductByBarcode, searchOffProducts } from "../../application/useCases/searchOffProducts";
import type { ShoppingItem } from "../../domain/entities/shopping";
import { PriceReportSheet } from "./priceReportSheet";

const NUTRI_SCORE_MAP: Record<string, number> = { a: 100, b: 75, c: 50, d: 25, e: 0 };
const NOVA_SCORE_MAP: Record<number, number> = { 1: 100, 2: 75, 3: 25, 4: 0 };
const NOVA_LABEL: Record<number, string> = {
  1: "Peu transformé", 2: "Ingrédient culinaire", 3: "Transformé", 4: "Ultra-transformé",
};
const NUTRI_COLOR: Record<string, string> = {
  a: "#16A34A", b: "#65A30D", c: "#CA8A04", d: "#EA580C", e: "#DC2626",
};
const NOVA_COLOR: Record<number, string> = {
  1: "#16A34A", 2: "#65A30D", 3: "#EA580C", 4: "#DC2626",
};
const RISK_COLOR: Record<string, string> = {
  high: "#EF4444", moderate: "#F97316", low: "#22C55E",
};
const RISK_LABEL: Record<string, string> = {
  high: "À éviter", moderate: "Limité", low: "OK",
};
const RISK_BG: Record<string, string> = {
  high: "#FEF2F2", moderate: "#FFF7ED", low: "#F0FDF4",
};
const RISK_TEXT: Record<string, string> = {
  high: "#B91C1C", moderate: "#C2410C", low: "#15803D",
};

const NUTRI_ROWS = [
  { key: "energyKcal" as const, label: "Énergie", unit: "kcal", sub: false, warn: () => false },
  { key: "fat" as const, label: "Graisses", unit: "g", sub: false, warn: (v: number) => v > 20 },
  { key: "saturatedFat" as const, label: "dont saturées", unit: "g", sub: true, warn: (v: number) => v > 5 },
  { key: "carbohydrates" as const, label: "Glucides", unit: "g", sub: false, warn: () => false },
  { key: "sugars" as const, label: "dont sucres", unit: "g", sub: true, warn: (v: number) => v > 12 },
  { key: "fiber" as const, label: "Fibres", unit: "g", sub: false, warn: () => false },
  { key: "proteins" as const, label: "Protéines", unit: "g", sub: false, warn: () => false },
  { key: "salt" as const, label: "Sel", unit: "g", sub: false, warn: (v: number) => v > 1.5 },
];

function computeHealthScore(product: ProductDetails, highCount: number): number {
  const ns = product.nutriscoreGrade ? NUTRI_SCORE_MAP[product.nutriscoreGrade.toLowerCase()] : null;
  const nv = product.novaGroup ? NOVA_SCORE_MAP[product.novaGroup] : null;
  const as_ = highCount > 0 ? 0 : 100;
  const parts: { v: number; w: number }[] = [];
  if (ns != null) parts.push({ v: ns, w: 0.6 });
  if (nv != null) parts.push({ v: nv, w: 0.3 });
  parts.push({ v: as_, w: 0.1 });
  const tw = parts.reduce((s, p) => s + p.w, 0);
  return Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / tw);
}

function gradeFromScore(score: number) {
  if (score >= 75) return { label: "Excellent", color: "#16A34A" };
  if (score >= 50) return { label: "Bon", color: "#65A30D" };
  if (score >= 25) return { label: "Médiocre", color: "#EA580C" };
  return { label: "Mauvais", color: "#DC2626" };
}

function fmt(v: number) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

interface ItemDetailSheetProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onReload?: () => void;
}

type Tab = "details" | "prix" | "alternatives";

export function ItemDetailSheet({ item, isOpen, onClose, onReload }: ItemDetailSheetProps) {
  const [tab, setTab] = useState<Tab>("prix");
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeProduct[]>([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [priceReportOpen, setPriceReportOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    setProduct(null);
    setAlternatives([]);
    setTab(item.productId ? "details" : "prix");

    if (!item.productId) return;

    let cancelled = false;
    setLoadingProduct(true);

    getProductById(item.productId).then((p) => {
      if (cancelled) return;
      setProduct(p);
      setLoadingProduct(false);
      if (!p) return;
      const grade = p.nutriscoreGrade?.toLowerCase();
      if (!grade || ["a", "b"].includes(grade)) return;
      setLoadingAlts(true);
      getProductAlternatives(item.productId!).then((alts) => {
        if (cancelled) return;
        setAlternatives(alts);
        setLoadingAlts(false);
      });
    });

    return () => { cancelled = true; };
  }, [isOpen, item?.id]);

  if (!item) return null;

  const cheapest = item.allStorePrices.length > 0
    ? item.allStorePrices.reduce((min, p) => p.estimatedCost < min.estimatedCost ? p : min)
    : null;

  const badNutriscore = product?.nutriscoreGrade && ["c", "d", "e"].includes(product.nutriscoreGrade.toLowerCase());
  const showAltsTab = !!item.productId && (loadingAlts || alternatives.length > 0 || !!badNutriscore);

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Détails" },
    { key: "prix", label: "Prix" },
    ...(showAltsTab ? [{ key: "alternatives" as Tab, label: "Alternatives" }] : []),
  ];

  const qty = item.quantity % 1 === 0
    ? item.quantity
    : parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""));

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(v) => !v && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["92%"]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#1C1917" }} numberOfLines={2}>
                  {item.customName}
                </Text>
                <Text style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>
                  {qty} {item.unit}
                </Text>
              </View>
              <Pressable
                onPress={() => setEditOpen(true)}
                style={({ pressed }) => ({
                  width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center",
                  backgroundColor: pressed ? "#F5F3EF" : "#FAF9F6", marginRight: 6,
                })}
              >
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Svg>
              </Pressable>
              <BottomSheet.Close />
            </View>

            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F5F3EF", marginBottom: 0 }}>
              {tabs.map(({ key, label }) => (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  style={{ paddingBottom: 10, paddingRight: 20, position: "relative" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: tab === key ? "#1C1917" : "#A8A29E" }}>
                    {label}
                  </Text>
                  {tab === key && (
                    <View style={{ position: "absolute", bottom: 0, left: 0, right: 20, height: 2, borderRadius: 2, backgroundColor: "#E8571C" }} />
                  )}
                </Pressable>
              ))}
            </View>

            <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
              {tab === "details" && (
                <DetailsTab
                  item={item}
                  product={product}
                  loadingProduct={loadingProduct}
                  onGoToPrix={() => setTab("prix")}
                  onAddPrice={() => setPriceReportOpen(true)}
                  onLinkProduct={() => setLinkOpen(true)}
                />
              )}
              {tab === "prix" && (
                <PrixTab item={item} cheapest={cheapest} qty={qty} onAddPrice={() => setPriceReportOpen(true)} />
              )}
              {tab === "alternatives" && (
                <AlternativesTab alternatives={alternatives} loadingAlts={loadingAlts} />
              )}
            </BottomSheetScrollView>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
      <PriceReportSheet
        item={item}
        isOpen={priceReportOpen}
        onClose={() => setPriceReportOpen(false)}
        onSuccess={() => { onReload?.(); }}
      />
      <LinkProductSheet
        item={item}
        isOpen={linkOpen}
        onClose={() => setLinkOpen(false)}
        onSuccess={() => { setLinkOpen(false); onReload?.(); }}
      />
      <EditItemSheet
        item={item}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => { setEditOpen(false); onReload?.(); }}
      />
    </BottomSheet>
  );
}

function SectionHeader({ label, count, right }: { label: string; count?: string; right?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F3EF" }}>
      <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</Text>
      {count && <Text style={{ fontSize: 11, color: "#A8A29E" }}>{count}</Text>}
      {right && <Text style={{ fontSize: 11, color: "#A8A29E" }}>{right}</Text>}
    </View>
  );
}

function DetailsTab({ item, product, loadingProduct, onGoToPrix, onAddPrice, onLinkProduct }: {
  item: ShoppingItem;
  product: ProductDetails | null;
  loadingProduct: boolean;
  onGoToPrix: () => void;
  onAddPrice: () => void;
  onLinkProduct: () => void;
}) {
  if (loadingProduct) {
    return (
      <View style={{ alignItems: "center", paddingTop: 40 }}>
        <ActivityIndicator color="#E8571C" />
      </View>
    );
  }

  if (!item.productId || !product) {
    return (
      <View style={{ alignItems: "center", paddingTop: 32, gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
          </Svg>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }}>Aucun produit lié</Text>
        <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center", maxWidth: 240 }}>
          Associez un produit du catalogue pour voir sa fiche nutritionnelle.
        </Text>
        <Pressable
          onPress={onLinkProduct}
          style={({ pressed }) => ({
            marginTop: 4, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
            backgroundColor: pressed ? "#D14A18" : "#E8571C",
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Associer un produit</Text>
        </Pressable>
        <Pressable onPress={onAddPrice}>
          <Text style={{ fontSize: 13, color: "#A8A29E", textDecorationLine: "underline" }}>Ou ajouter un prix</Text>
        </Pressable>
      </View>
    );
  }

  const additives = product.additiveTags
    .map(parseAdditiveTag)
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({ ...a, risk: getAdditiveRisk(a.code) }))
    .sort((a, b) => ({ high: 0, moderate: 1, low: 2 }[a.risk] - { high: 0, moderate: 1, low: 2 }[b.risk]));

  const allergens = product.allergenTags
    .map((t) => t.replace(/^[a-z]{2}:/, "").replace(/-/g, " "))
    .filter(Boolean);

  const highCount = additives.filter((a) => a.risk === "high").length;
  const score = computeHealthScore(product, highCount);
  const grade = gradeFromScore(score);

  const r = 52, circ = 2 * Math.PI * r;
  const arcLen = circ * 0.75;
  const progressLen = arcLen * (score / 100);

  const hasNutriments = product.nutriments &&
    Object.values(product.nutriments).some((v) => v !== null);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: "#F5F3EF" }} resizeMode="contain" />
        ) : (
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: "#F5F3EF" }} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }} numberOfLines={2}>{product.name}</Text>
          {product.brand && <Text style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>{product.brand}</Text>}
        </View>
        <Pressable
          onPress={onLinkProduct}
          style={({ pressed }) => ({
            paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10,
            backgroundColor: pressed ? "#F5F3EF" : "#FAF9F6",
            borderWidth: 1, borderColor: "#E8E5E1",
          })}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#78716C" }}>Changer</Text>
        </Pressable>
      </View>

      <View style={{ borderRadius: 16, backgroundColor: "#F5F3EF", overflow: "hidden" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, padding: 16 }}>
          <View style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}>
            <Svg width={100} height={100} viewBox="0 0 120 120" style={{ position: "absolute" }}>
              <Circle cx={60} cy={60} r={r} fill="none" stroke={`${grade.color}22`} strokeWidth={9} strokeLinecap="round"
                strokeDasharray={`${arcLen} ${circ - arcLen}`}
                transform="rotate(135, 60, 60)" />
              <Circle cx={60} cy={60} r={r} fill="none" stroke={grade.color} strokeWidth={9} strokeLinecap="round"
                strokeDasharray={`${progressLen} ${circ - progressLen}`}
                transform="rotate(135, 60, 60)" />
            </Svg>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 30, fontWeight: "900", color: grade.color, lineHeight: 34 }}>{score}</Text>
              <Text style={{ fontSize: 10, color: "#A8A29E" }}>/100</Text>
            </View>
          </View>

          <View style={{ flex: 1, gap: 8 }}>
            <View>
              <Text style={{ fontSize: 17, fontWeight: "800", color: grade.color }}>{grade.label}</Text>
              <Text style={{ fontSize: 11, color: "#A8A29E" }}>Score santé global</Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#78716C" }}>Nutrition</Text>
              {product.nutriscoreGrade ? (
                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: NUTRI_COLOR[product.nutriscoreGrade.toLowerCase()] ?? "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>{product.nutriscoreGrade.toUpperCase()}</Text>
                </View>
              ) : <Text style={{ fontSize: 11, color: "#A8A29E" }}>—</Text>}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#78716C" }}>Additifs</Text>
              {additives.length === 0 ? (
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#16A34A" }}>Aucun</Text>
              ) : highCount > 0 ? (
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#EF4444" }}>{highCount} à éviter</Text>
              ) : (
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#F97316" }}>{additives.length} limité{additives.length > 1 ? "s" : ""}</Text>
              )}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#78716C" }}>Transformation</Text>
              {product.novaGroup ? (
                <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: NOVA_COLOR[product.novaGroup] ?? "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: "#fff" }}>{product.novaGroup}</Text>
                </View>
              ) : <Text style={{ fontSize: 11, color: "#A8A29E" }}>—</Text>}
            </View>
          </View>
        </View>

        {product.novaGroup && (
          <View style={{ borderTopWidth: 1, borderTopColor: "#E8E5E1", paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ fontSize: 12, color: "#78716C" }}>{NOVA_LABEL[product.novaGroup]}</Text>
          </View>
        )}
      </View>

      <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
        <SectionHeader label="Additifs" count={additives.length > 0 ? `${additives.length} détecté${additives.length > 1 ? "s" : ""}` : undefined} />
        {additives.length === 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 14 }}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
              <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="20 6 9 17 4 12" />
              </Svg>
            </View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#15803D" }}>Aucun additif détecté</Text>
          </View>
        ) : (
          additives.map((a, i) => (
            <View key={a.code} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#F5F3EF" }}>
              <View style={{ width: 4, height: 32, borderRadius: 2, backgroundColor: RISK_COLOR[a.risk], flexShrink: 0 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917" }} numberOfLines={1}>{a.name}</Text>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase" }}>{a.code}</Text>
              </View>
              <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: RISK_BG[a.risk] }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: RISK_TEXT[a.risk] }}>{RISK_LABEL[a.risk]}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {allergens.length > 0 && (
        <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
          <SectionHeader label="Allergènes" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 14, paddingVertical: 12 }}>
            {allergens.map((a) => (
              <View key={a} style={{ borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#92400E", textTransform: "capitalize" }}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hasNutriments && (
        <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
          <SectionHeader label="Valeurs nutritionnelles" right="/ 100g" />
          {NUTRI_ROWS.filter((row) => product.nutriments![row.key] !== null).map((row, i) => (
            <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#F5F3EF" }}>
              <Text style={{ fontSize: 13, color: row.sub ? "#A8A29E" : "#1C1917", fontWeight: row.sub ? "400" : "500", paddingLeft: row.sub ? 12 : 0 }}>
                {row.label}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "600", color: row.warn(product.nutriments![row.key] as number) ? "#F97316" : "#1C1917" }}>
                {fmt(product.nutriments![row.key] as number)} {row.unit}
              </Text>
            </View>
          ))}
        </View>
      )}

      {product.ingredientsText && (
        <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
          <SectionHeader label="Ingrédients" />
          <Text style={{ fontSize: 12, color: "#78716C", paddingHorizontal: 14, paddingVertical: 12, lineHeight: 18 }}>
            {product.ingredientsText}
          </Text>
        </View>
      )}
    </View>
  );
}

function PrixTab({ item, cheapest, qty, onAddPrice }: {
  item: ShoppingItem;
  cheapest: typeof item.allStorePrices[0] | null;
  qty: number;
  onAddPrice: () => void;
}) {
  if (item.allStorePrices.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingTop: 32, gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </Svg>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }}>Aucun prix disponible</Text>
        <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center", maxWidth: 240 }}>
          Les prix sont partagés par la communauté. Aucun prix trouvé pour cet article.
        </Text>
        <Pressable
          onPress={onAddPrice}
          style={({ pressed }) => ({
            marginTop: 4, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
            backgroundColor: pressed ? "#D14A18" : "#E8571C",
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Ajouter un prix</Text>
        </Pressable>
      </View>
    );
  }

  const sorted = [...item.allStorePrices].sort((a, b) => a.estimatedCost - b.estimatedCost);

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, color: "#A8A29E", fontWeight: "500" }}>
        Estimation pour {qty} {item.unit} · Prix communautaires
      </Text>
      {sorted.map((sp) => {
        const isCheapest = cheapest?.storeId === sp.storeId && sorted.length > 1;
        return (
          <View key={sp.storeId} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, backgroundColor: isCheapest ? "#F0FDF4" : "#F5F3EF", paddingHorizontal: 14, paddingVertical: 12, borderWidth: isCheapest ? 1.5 : 0, borderColor: isCheapest ? "#BBF7D0" : "transparent" }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: isCheapest ? "#DCFCE7" : "#fff", alignItems: "center", justifyContent: "center" }}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isCheapest ? "#16A34A" : "#A8A29E"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Polyline points="9 22 9 12 15 12 15 22" />
              </Svg>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: isCheapest ? "#15803D" : "#1C1917" }}>{sp.storeName}</Text>
              {isCheapest && <Text style={{ fontSize: 11, fontWeight: "600", color: "#16A34A" }}>Le moins cher ✓</Text>}
              {sp.confidence !== "exact" && (
                <Text style={{ fontSize: 10, color: "#92400E", fontWeight: "500" }}>
                  {sp.confidence === "brand_city" ? "Moy. ville" : "Moy. nationale"}
                </Text>
              )}
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: isCheapest ? "#16A34A" : "#1C1917" }}>
              {sp.estimatedCost.toFixed(2)} €
            </Text>
          </View>
        );
      })}
      {sorted.length > 1 && cheapest && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, backgroundColor: "#F0FDF4", paddingHorizontal: 14, paddingVertical: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </Svg>
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: "#15803D" }}>
            <Text style={{ fontWeight: "700" }}>{cheapest.storeName}</Text>{" "}est le moins cher pour cet article
          </Text>
        </View>
      )}
      <Pressable
        onPress={onAddPrice}
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          borderRadius: 14, borderWidth: 1.5, borderColor: "#FDBA74",
          paddingVertical: 12, backgroundColor: pressed ? "#FFF7ED" : "transparent",
        })}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 5v14M5 12h14" />
        </Svg>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#E8571C" }}>Ajouter un prix</Text>
      </Pressable>
    </View>
  );
}

const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#16A34A", b: "#65A30D", c: "#CA8A04", d: "#EA580C", e: "#DC2626",
};

function LinkProductSheet({ item, isOpen, onClose, onSuccess }: {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<"search" | "scan">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OFFProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    setMode("search");
    setQuery(item.customName);
    setResults([]);
    setScanned(false);
    setScanError(null);
    setLinkError(null);
    handleSearch(item.customName);
  }, [isOpen, item?.id]);

  function handleSearch(q: string) {
    setQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchOffProducts(q);
      setResults(res);
      setSearching(false);
    }, 400);
  }

  async function handleSwitchToScan() {
    setMode("scan");
    if (!permission?.granted) await requestPermission();
  }

  async function handleBarcode({ data }: { data: string }) {
    if (scanned || scanLoading) return;
    setScanned(true);
    setScanLoading(true);
    setScanError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const product = await getOffProductByBarcode(data);
    setScanLoading(false);
    if (!product) {
      setScanError(`Code-barres ${data} non trouvé dans Open Food Facts.`);
      return;
    }
    await linkProduct(product);
  }

  async function linkProduct(product: OFFProductResult) {
    if (!item) return;
    setLinking(true);
    setLinkError(null);
    const productId = await findOrCreateProduct(product);
    if (!productId) {
      setLinkError("Impossible de trouver le produit.");
      setLinking(false);
      return;
    }
    try {
      await linkShoppingItemProduct(item.id, productId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess();
    } catch {
      setLinkError("Erreur lors de l'association.");
    }
    setLinking(false);
  }

  if (!item) return null;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(v) => !v && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["92%"]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14 }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 17, fontWeight: "800", color: "#1C1917" }}>Associer un produit</Text>
                <Text style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>{item.customName}</Text>
              </View>
              <BottomSheet.Close />
            </View>

            <View style={{ flexDirection: "row", backgroundColor: "#F5F3EF", borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 }}>
              <Pressable
                onPress={() => { setMode("search"); setScanned(false); setScanError(null); }}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center", backgroundColor: mode === "search" ? "#fff" : "transparent", shadowColor: mode === "search" ? "#1C1917" : "transparent", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: mode === "search" ? 2 : 0 }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: mode === "search" ? "#1C1917" : "#A8A29E" }}>Rechercher</Text>
              </Pressable>
              <Pressable
                onPress={handleSwitchToScan}
                style={{ flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: mode === "scan" ? "#fff" : "transparent", shadowColor: mode === "scan" ? "#1C1917" : "transparent", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: mode === "scan" ? 2 : 0 }}
              >
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={mode === "scan" ? "#1C1917" : "#A8A29E"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M3 9V6a2 2 0 0 1 2-2h3" /><Path d="M15 4h3a2 2 0 0 1 2 2v3" /><Path d="M21 15v3a2 2 0 0 1-2 2h-3" /><Path d="M9 20H6a2 2 0 0 1-2-2v-3" /><Line x1={7} y1={12} x2={17} y2={12} />
                </Svg>
                <Text style={{ fontSize: 13, fontWeight: "700", color: mode === "scan" ? "#1C1917" : "#A8A29E" }}>Scanner</Text>
              </Pressable>
            </View>

            {linkError && (
              <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <Text style={{ fontSize: 13, color: "#DC2626" }}>{linkError}</Text>
              </View>
            )}

            {mode === "search" ? (
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F5F3EF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={11} cy={11} r={8} /><Line x1={21} y1={21} x2={16.65} y2={16.65} />
                  </Svg>
                  <TextInput
                    value={query}
                    onChangeText={handleSearch}
                    placeholder="Nom du produit…"
                    placeholderTextColor="#A8A29E"
                    style={{ flex: 1, fontSize: 15, color: "#1C1917" }}
                    returnKeyType="search"
                    autoFocus
                  />
                  {searching && <ActivityIndicator size="small" color="#E8571C" />}
                </View>
                <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
                  {results.length === 0 && !searching && query.trim() ? (
                    <View style={{ alignItems: "center", paddingTop: 32 }}>
                      <Text style={{ fontSize: 14, color: "#A8A29E" }}>Aucun résultat pour «{query}»</Text>
                    </View>
                  ) : results.map((product) => (
                    <Pressable
                      key={product.offId}
                      onPress={() => linkProduct(product)}
                      disabled={linking}
                      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: pressed ? "#FFF7ED" : "#F5F3EF", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 })}
                    >
                      {product.imageUrl ? (
                        <Image source={{ uri: product.imageUrl }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#E8E5E1" }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#E8E5E1" }} />
                      )}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917" }} numberOfLines={1}>{product.name}</Text>
                        {product.brand && <Text style={{ fontSize: 12, color: "#A8A29E" }} numberOfLines={1}>{product.brand}</Text>}
                      </View>
                      {product.nutriscoreGrade && (
                        <View style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: NUTRISCORE_COLORS[product.nutriscoreGrade] ?? "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "900", color: "#fff" }}>{product.nutriscoreGrade.toUpperCase()}</Text>
                        </View>
                      )}
                      {linking ? (
                        <ActivityIndicator size="small" color="#E8571C" />
                      ) : (
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M9 18l6-6-6-6" />
                        </Svg>
                      )}
                    </Pressable>
                  ))}
                </BottomSheetScrollView>
              </View>
            ) : (
              <View style={{ flex: 1, gap: 12 }}>
                {!permission ? (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#E8571C" /></View>
                ) : !permission.granted ? (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917", textAlign: "center" }}>Accès à la caméra requis</Text>
                    <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>Pour scanner des codes-barres, autorisez Deazl à accéder à votre caméra.</Text>
                  </View>
                ) : (
                  <>
                    <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#000", minHeight: 300 }}>
                      <CameraView
                        style={{ flex: 1 }}
                        facing="back"
                        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "upc_a", "upc_e"] }}
                        onBarcodeScanned={scanned ? undefined : handleBarcode}
                      />
                      {!scanned && (
                        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                          <View style={{ width: 220, height: 140, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }}>
                            <View style={{ position: "absolute", top: -1, left: -1, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#E8571C", borderTopLeftRadius: 16 }} />
                            <View style={{ position: "absolute", top: -1, right: -1, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#E8571C", borderTopRightRadius: 16 }} />
                            <View style={{ position: "absolute", bottom: -1, left: -1, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#E8571C", borderBottomLeftRadius: 16 }} />
                            <View style={{ position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#E8571C", borderBottomRightRadius: 16 }} />
                          </View>
                          <Text style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>Centrez le code-barres</Text>
                        </View>
                      )}
                      {(scanLoading || linking) && (
                        <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", gap: 10 }}>
                          <ActivityIndicator color="#fff" size="large" />
                          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{scanLoading ? "Recherche du produit…" : "Association en cours…"}</Text>
                        </View>
                      )}
                    </View>
                    {scanError && (
                      <View style={{ backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, gap: 8 }}>
                        <Text style={{ fontSize: 13, color: "#DC2626", fontWeight: "600" }}>{scanError}</Text>
                        <Pressable onPress={() => { setScanned(false); setScanError(null); }} style={({ pressed }) => ({ alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: pressed ? "#FEE2E2" : "#F5F3EF" })}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>Réessayer</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function AlternativesTab({ alternatives, loadingAlts }: { alternatives: AlternativeProduct[]; loadingAlts: boolean }) {
  if (loadingAlts) {
    return (
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 11, color: "#A8A29E", fontWeight: "500" }}>Recherche d'alternatives…</Text>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F5F3EF", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#E8E5E1" }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ height: 12, width: "70%", borderRadius: 6, backgroundColor: "#E8E5E1" }} />
              <View style={{ height: 10, width: "45%", borderRadius: 5, backgroundColor: "#E8E5E1" }} />
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "#E8E5E1" }} />
          </View>
        ))}
      </View>
    );
  }
  if (alternatives.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingTop: 32, gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" }}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="20 6 9 17 4 12" />
          </Svg>
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }}>Aucune alternative trouvée</Text>
        <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center", maxWidth: 240 }}>
          Pas de meilleure option connue dans cette catégorie.
        </Text>
      </View>
    );
  }
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 11, color: "#A8A29E", fontWeight: "500" }}>Meilleur Nutri-Score dans la même catégorie</Text>
      <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
        {alternatives.map((alt, i) => (
          <View key={alt.offId} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: "#F5F3EF" }}>
            {alt.imageUrl ? (
              <Image source={{ uri: alt.imageUrl }} style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F5F3EF" }} resizeMode="contain" />
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#F5F3EF" }} />
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917" }} numberOfLines={1}>{alt.name}</Text>
              {alt.brand && <Text style={{ fontSize: 12, color: "#A8A29E" }} numberOfLines={1}>{alt.brand}</Text>}
            </View>
            {alt.nutriscoreGrade && (
              <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: NUTRI_COLOR[alt.nutriscoreGrade] ?? "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#fff" }}>{alt.nutriscoreGrade.toUpperCase()}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function EditItemSheet({ item, isOpen, onClose, onSuccess }: {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setName(item.customName);
    setQuantity(
      item.quantity % 1 === 0
        ? String(item.quantity)
        : String(parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""))),
    );
    setUnit(item.unit ?? "");
  }, [isOpen, item?.id]);

  async function handleSave() {
    if (!item || !name.trim()) return;
    setSaving(true);
    await updateShoppingItem(item.id, name.trim(), parseFloat(quantity) || 1, unit.trim() || "pièce");
    setSaving(false);
    onSuccess();
  }

  if (!item) return null;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(v) => !v && onClose()}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["45%"]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Modifier l'article</Text>
            <BottomSheet.Close />
          </View>
          <View style={{ gap: 12 }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nom de l'article…"
              placeholderTextColor="#A8A29E"
              autoFocus
              style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
              returnKeyType="next"
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor="#A8A29E"
                style={{ flex: 1, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
              />
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder="pièce, kg, L…"
                placeholderTextColor="#A8A29E"
                style={{ flex: 2, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
              />
            </View>
            <Pressable
              onPress={handleSave}
              disabled={saving || !name.trim()}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center",
                backgroundColor: (!name.trim() || saving) ? "#F5F3EF" : pressed ? "#D14A18" : "#E8571C",
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: (!name.trim() || saving) ? "#A8A29E" : "#fff" }}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Text>
            </Pressable>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
