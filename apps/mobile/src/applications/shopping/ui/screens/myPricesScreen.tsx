import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Button, Dialog } from "heroui-native";
import { useAppTheme } from "../../../../shared/theme";
import { BottomModal } from "../components/bottomModal";
import { ItemDetailSheet } from "../components/itemDetailSheet";
import {
  getUserReportedPrices,
  deleteReportedPrice,
  type ReportedPrice,
} from "../../application/useCases/getUserReportedPrices";
import { reportPriceForProduct } from "../../application/useCases/reportPriceForProduct";
import type { ShoppingItem } from "../../domain/entities/shopping";

const PAGE_SIZE = 30;
const UNITS = ["pièce", "kg", "g", "L", "cL", "mL"];

type SortMode = "date_desc" | "date_asc" | "price_asc" | "price_desc" | "name_asc";

const SORT_LABELS: Record<SortMode, string> = {
  date_desc: "Date récente → ancienne",
  date_asc: "Date ancienne → récente",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
  name_asc: "Nom A-Z",
};

function formatRelativeDate(iso: string): { label: string; isStale: boolean } {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isStale = diffDays > 30;
  let label: string;
  if (diffDays === 0) label = "aujourd'hui";
  else if (diffDays === 1) label = "hier";
  else if (diffDays < 7) label = `il y a ${diffDays}j`;
  else if (diffDays < 30) label = `il y a ${Math.floor(diffDays / 7)}sem`;
  else label = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return { label, isStale };
}

function toShoppingItem(price: ReportedPrice): ShoppingItem {
  return {
    id: price.id,
    customName: price.productName,
    quantity: price.quantity,
    unit: price.unit,
    isChecked: false,
    sortOrder: 0,
    productId: price.productId || null,
    allStorePrices: [{
      storeId: price.storeId,
      storeName: price.storeName,
      estimatedCost: price.price,
      confidence: "exact",
      reportedAt: price.reportedAt,
      reporterCount: 1,
      isPromo: price.isPromo,
      normalUnitPrice: null,
      promoTriggerQty: null,
    }],
  };
}

function ProductIcon({ price, size = 40 }: { price: ReportedPrice; size?: number }) {
  const { colors } = useAppTheme();
  const [imgError, setImgError] = useState(false);

  if (price.productImageUrl && !imgError) {
    return (
      <Image
        source={{ uri: price.productImageUrl }}
        style={{ width: size, height: size, borderRadius: 10 }}
        onError={() => setImgError(true)}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <Path d="M7 7h.01" />
      </Svg>
    </View>
  );
}

function PriceRow({
  price,
  onEdit,
  onDelete,
  onProductTap,
}: {
  price: ReportedPrice;
  onEdit: (p: ReportedPrice) => void;
  onDelete: (p: ReportedPrice) => void;
  onProductTap: (p: ReportedPrice) => void;
}) {
  const { colors } = useAppTheme();
  const { label, isStale } = formatRelativeDate(price.reportedAt);

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onProductTap(price); }}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 12,
        backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
        paddingHorizontal: 14, paddingVertical: 12,
      })}
    >
      <ProductIcon price={price} />

      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, flexShrink: 1 }} numberOfLines={1}>
            {price.productName}
          </Text>
          {price.isGeneric && (
            <View style={{ borderRadius: 6, backgroundColor: colors.bgSurface, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSubtle }}>Générique</Text>
            </View>
          )}
          {price.isPromo && (
            <View style={{ borderRadius: 6, backgroundColor: "#FEF3C7", paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#D97706" }}>Promo</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ borderRadius: 6, backgroundColor: colors.accentBg, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>{price.storeName}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.textSubtle }}>{price.quantity} {price.unit}</Text>
          <Text style={{ fontSize: 11, color: isStale ? "#F59E0B" : colors.textMuted }}>· {label}</Text>
        </View>
      </View>

      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>{price.price.toFixed(2)} €</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(price); }}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: pressed ? colors.bgCard : colors.bgSurface,
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </Svg>
          </Pressable>
          <Pressable
            onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onDelete(price); }}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 28, height: 28, borderRadius: 8,
              backgroundColor: pressed ? colors.dangerBg : colors.bgSurface,
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="3 6 5 6 21 6" />
              <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <Path d="M10 11v6M14 11v6" />
            </Svg>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function MyPricesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const [prices, setPrices] = useState<ReportedPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [sortMode, setSortMode] = useState<SortMode>("date_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterStore, setFilterStore] = useState<string | null>(null);
  const [filterPromo, setFilterPromo] = useState(false);
  const [filterStale, setFilterStale] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<ReportedPrice | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editItem, setEditItem] = useState<ReportedPrice | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState("pièce");
  const [saving, setSaving] = useState(false);

  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    getUserReportedPrices().then((data) => {
      setPrices(data);
      setLoading(false);
    });
  }, []);

  const storeNames = useMemo(() => [...new Set(prices.map((p) => p.storeName))].sort(), [prices]);
  const hasAnyPromo = useMemo(() => prices.some((p) => p.isPromo), [prices]);
  const hasAnyStale = useMemo(() => prices.some((p) => formatRelativeDate(p.reportedAt).isStale), [prices]);

  const isFiltered = search.trim().length > 0 || filterStore !== null || filterPromo || filterStale || sortMode !== "date_desc";
  const hasActiveFilter = filterStore !== null || filterPromo || filterStale;

  const processedPrices = useMemo(() => {
    let result = [...prices];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.productName.toLowerCase().includes(q) || p.storeName.toLowerCase().includes(q)
      );
    }

    if (filterStore) result = result.filter((p) => p.storeName === filterStore);
    if (filterPromo) result = result.filter((p) => p.isPromo);
    if (filterStale) result = result.filter((p) => formatRelativeDate(p.reportedAt).isStale);

    result.sort((a, b) => {
      switch (sortMode) {
        case "date_desc": return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
        case "date_asc": return new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime();
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "name_asc": return a.productName.localeCompare(b.productName, "fr");
      }
    });

    return result;
  }, [prices, search, filterStore, filterPromo, filterStale, sortMode]);

  const displayedPrices = processedPrices.slice(0, visibleCount);
  const remaining = processedPrices.length - visibleCount;

  const groupedByStore = useMemo(() => {
    const map = new Map<string, ReportedPrice[]>();
    for (const p of displayedPrices) {
      const arr = map.get(p.storeName) ?? [];
      arr.push(p);
      map.set(p.storeName, arr);
    }
    return map;
  }, [displayedPrices]);

  function resetFilters() {
    setSearch("");
    setFilterStore(null);
    setFilterPromo(false);
    setFilterStale(false);
    setSortMode("date_desc");
    setVisibleCount(PAGE_SIZE);
  }

  function handleSearchChange(text: string) {
    setSearch(text);
    setVisibleCount(PAGE_SIZE);
  }

  function handleFilterChange(fn: () => void) {
    fn();
    setVisibleCount(PAGE_SIZE);
  }

  function handleEditTap(price: ReportedPrice) {
    setEditItem(price);
    setEditPrice(price.price.toFixed(2));
    setEditQty(String(price.quantity));
    setEditUnit(price.unit);
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    const newPrice = parseFloat(editPrice.replace(",", "."));
    const newQty = parseFloat(editQty.replace(",", "."));
    if (isNaN(newPrice) || newPrice <= 0 || isNaN(newQty) || newQty <= 0) return;
    setSaving(true);
    await reportPriceForProduct(editItem.productId, editItem.storeId, newPrice, newQty, editUnit);
    const now = new Date().toISOString();
    setPrices((prev) => prev.map((x) =>
      x.productId === editItem.productId && x.storeId === editItem.storeId
        ? { ...x, price: newPrice, quantity: newQty, unit: editUnit, reportedAt: now }
        : x
    ));
    setSaving(false);
    setEditItem(null);
    Keyboard.dismiss();
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await deleteReportedPrice(pendingDelete.id);
    setPrices((prev) => prev.filter((p) => !(p.productId === pendingDelete.productId && p.storeId === pendingDelete.storeId)));
    setPendingDelete(null);
    setDeleting(false);
  }

  function handleProductTap(price: ReportedPrice) {
    setDetailItem(toShoppingItem(price));
    setDetailOpen(true);
  }

  const showFilterRow = !loading && prices.length > 0 && (storeNames.length > 1 || hasAnyPromo || hasAnyStale);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: pressed ? colors.bgSurface : colors.bgCard,
            alignItems: "center", justifyContent: "center",
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="15 18 9 12 15 6" />
          </Svg>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, flex: 1 }}>Mes prix</Text>
        {isFiltered && (
          <Pressable onPress={resetFilters} hitSlop={8}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Réinitialiser</Text>
          </Pressable>
        )}
        {!loading && prices.length > 0 && (
          <Text style={{ fontSize: 12, color: colors.textSubtle, fontWeight: "500" }}>
            {prices.length} produit{prices.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingBottom: 10, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{
            flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: colors.bgCard, borderRadius: 12,
            paddingHorizontal: 12, paddingVertical: 10,
          }}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={11} cy={11} r={8} />
              <Line x1={21} y1={21} x2={16.65} y2={16.65} />
            </Svg>
            <TextInput
              value={search}
              onChangeText={handleSearchChange}
              placeholder="Rechercher un produit ou magasin…"
              placeholderTextColor={colors.textMuted}
              style={{ flex: 1, fontSize: 14, color: colors.text }}
            />
            {search.length > 0 && (
              <Pressable onPress={() => handleSearchChange("")} hitSlop={8}>
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M18 6L6 18M6 6l12 12" />
                  </Svg>
                </View>
              </Pressable>
            )}
          </View>

          {!loading && prices.length > 0 && (
            <Pressable
              onPress={() => setSortOpen(true)}
              style={({ pressed }) => ({
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: sortMode !== "date_desc" ? colors.accentBg : pressed ? colors.bgSurface : colors.bgCard,
                alignItems: "center", justifyContent: "center",
              })}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={sortMode !== "date_desc" ? colors.accent : colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 6h18M7 12h10M11 18h2" />
              </Svg>
            </Pressable>
          )}
        </View>

        {showFilterRow && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {storeNames.map((name) => {
              const active = filterStore === name;
              return (
                <Pressable
                  key={name}
                  onPress={() => handleFilterChange(() => setFilterStore(active ? null : name))}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: active ? colors.accent : colors.bgCard,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#fff" : colors.text }}>{name}</Text>
                </Pressable>
              );
            })}
            {hasAnyPromo && (
              <Pressable
                onPress={() => handleFilterChange(() => setFilterPromo(!filterPromo))}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: filterPromo ? "#D97706" : colors.bgCard,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: filterPromo ? "#fff" : colors.text }}>Promos</Text>
              </Pressable>
            )}
            {hasAnyStale && (
              <Pressable
                onPress={() => handleFilterChange(() => setFilterStale(!filterStale))}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: filterStale ? "#F59E0B" : colors.bgCard,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: filterStale ? "#fff" : colors.text }}>À mettre à jour</Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : processedPrices.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <Path d="M7 7h.01" />
            </Svg>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {isFiltered ? "Aucun résultat" : "Aucun prix reporté"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            {isFiltered ? "Essayez d'autres filtres ou réinitialisez." : "Les prix que vous ajoutez en mode courses apparaîtront ici."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {isFiltered ? (
            <View style={{ marginHorizontal: 16, borderRadius: 14, overflow: "hidden" }}>
              {displayedPrices.map((price, i) => (
                <View key={price.id}>
                  <PriceRow price={price} onEdit={handleEditTap} onDelete={setPendingDelete} onProductTap={handleProductTap} />
                  {i < displayedPrices.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface, marginLeft: 66 }} />}
                </View>
              ))}
            </View>
          ) : (
            Array.from(groupedByStore.entries()).map(([storeName, storeItems]) => (
              <View key={storeName} style={{ marginBottom: 16 }}>
                <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>
                    {storeName}
                  </Text>
                </View>
                <View style={{ marginHorizontal: 16, borderRadius: 14, overflow: "hidden" }}>
                  {storeItems.map((price, i) => (
                    <View key={price.id}>
                      <PriceRow price={price} onEdit={handleEditTap} onDelete={setPendingDelete} onProductTap={handleProductTap} />
                      {i < storeItems.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface, marginLeft: 66 }} />}
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}

          {remaining > 0 && (
            <Pressable
              onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
              style={({ pressed }) => ({
                marginHorizontal: 16, marginTop: 8, borderRadius: 12,
                backgroundColor: pressed ? colors.bgSurface : colors.bgCard,
                paddingVertical: 14, alignItems: "center",
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>
                Voir plus ({remaining} restant{remaining > 1 ? "s" : ""})
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      <BottomModal isOpen={sortOpen} onClose={() => setSortOpen(false)} height="auto">
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Trier par</Text>
          {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => { setSortMode(mode); setSortOpen(false); setVisibleCount(PAGE_SIZE); }}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingVertical: 13, paddingHorizontal: 4,
                borderRadius: 10, backgroundColor: pressed ? colors.bgSurface : "transparent",
              })}
            >
              <Text style={{ fontSize: 15, color: sortMode === mode ? colors.accent : colors.text, fontWeight: sortMode === mode ? "700" : "400" }}>
                {SORT_LABELS[mode]}
              </Text>
              {sortMode === mode && (
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="20 6 9 17 4 12" />
                </Svg>
              )}
            </Pressable>
          ))}
        </View>
      </BottomModal>

      <BottomModal isOpen={editItem !== null} onClose={() => { setEditItem(null); Keyboard.dismiss(); }} height="auto">
        {editItem && (
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <ProductIcon price={editItem} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }} numberOfLines={1}>{editItem.productName}</Text>
                <Text style={{ fontSize: 12, color: colors.textSubtle }}>{editItem.storeName}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, marginBottom: 6 }}>PRIX (€)</Text>
                <TextInput
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="decimal-pad"
                  style={{
                    borderRadius: 12, backgroundColor: colors.bgSurface,
                    paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 16, fontWeight: "700", color: colors.text,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, marginBottom: 6 }}>QUANTITÉ</Text>
                <TextInput
                  value={editQty}
                  onChangeText={setEditQty}
                  keyboardType="decimal-pad"
                  style={{
                    borderRadius: 12, backgroundColor: colors.bgSurface,
                    paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 16, fontWeight: "700", color: colors.text,
                  }}
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, marginBottom: 6 }}>UNITÉ</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setEditUnit(u)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: editUnit === u ? colors.accent : pressed ? colors.bgSurface : colors.bgCard,
                    })}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: editUnit === u ? "#fff" : colors.text }}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => { setEditItem(null); Keyboard.dismiss(); }}>
                <Button.Label>Annuler</Button.Label>
              </Button>
              <Button variant="primary" style={{ flex: 1 }} onPress={handleSaveEdit} isDisabled={saving}>
                <Button.Label>{saving ? "Enregistrement…" : "Enregistrer"}</Button.Label>
              </Button>
            </View>
          </View>
        )}
      </BottomModal>

      <Dialog isOpen={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Supprimer ce prix ?</Dialog.Title>
            <Dialog.Description>
              {pendingDelete ? `${pendingDelete.productName} · ${pendingDelete.price.toFixed(2)} € chez ${pendingDelete.storeName}` : ""}
            </Dialog.Description>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setPendingDelete(null)}>
                <Button.Label>Annuler</Button.Label>
              </Button>
              <Button variant="danger" style={{ flex: 1 }} onPress={handleConfirmDelete} isDisabled={deleting}>
                <Button.Label>{deleting ? "Suppression…" : "Supprimer"}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <ItemDetailSheet
        item={detailItem}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </SafeAreaView>
  );
}
