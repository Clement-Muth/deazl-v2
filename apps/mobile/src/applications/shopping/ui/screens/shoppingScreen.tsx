import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { BottomModal } from "../components/bottomModal";
import { Button, Dialog } from "heroui-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { useShoppingList } from "../../api/useShoppingList";
import { addShoppingItem } from "../../application/useCases/addShoppingItem";
import { clearCheckedItems } from "../../application/useCases/clearCheckedItems";
import { createEmptyShoppingList } from "../../application/useCases/createEmptyShoppingList";
import { deleteShoppingItem } from "../../application/useCases/deleteShoppingItem";
import { getItemSuggestions } from "../../application/useCases/getItemSuggestions";
import { toggleShoppingItem } from "../../application/useCases/toggleShoppingItem";
import type { ShoppingItem } from "../../domain/entities/shopping";
import { ItemDetailSheet } from "../components/itemDetailSheet";
import { SplitEditSheet } from "../components/splitSettingsSheet";
import { DEFAULT_SPLIT, getSplitSettings, updateSplitSettings } from "../../application/useCases/getSplitSettings";
import type { SplitSettings } from "../../application/useCases/getSplitSettings";

const UNITS = ["pièce", "kg", "g", "L", "cL", "mL"];

const CATEGORY_ORDER = [
  "Fruits & Légumes", "Viandes & Poissons", "Produits laitiers", "Boulangerie",
  "Épicerie sèche", "Surgelés", "Boissons", "Hygiène & Beauté", "Entretien", "Autre",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Fruits & Légumes": "#22c55e",
  "Viandes & Poissons": "#ef4444",
  "Produits laitiers": "#3b82f6",
  "Boulangerie": "#f97316",
  "Épicerie sèche": "#f59e0b",
  "Surgelés": "#06b6d4",
  "Boissons": "#8b5cf6",
  "Hygiène & Beauté": "#ec4899",
  "Entretien": "#64748b",
  "Autre": "#9ca3af",
};


function ItemRow({
  item,
  onToggle,
  onDelete,
  onOpenDetail,
  isLast,
}: {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onOpenDetail: (item: ShoppingItem) => void;
  isLast: boolean;
}) {
  const { colors } = useAppTheme();

  function handleDelete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(item.id);
  }

  function handleToggle() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(item.id, !item.isChecked);
  }

  function handleOpenDetail() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDetail(item);
  }

  return (
    <View>
      <Pressable
        onPress={handleOpenDetail}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingLeft: 16,
          paddingRight: 8,
          paddingVertical: 14,
          backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
          minHeight: 64,
        })}
      >
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 30,
            height: 30,
            borderRadius: 15,
            borderWidth: 2,
            borderColor: item.isChecked ? colors.accent : colors.inputBorder,
            backgroundColor: item.isChecked ? colors.accent : pressed ? "#FFF0EB" : "transparent",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          {item.isChecked && (
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20 6 9 17 4 12" />
            </Svg>
          )}
        </Pressable>

        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
          {item.quantity > 0 && (
            <View style={{ borderRadius: 6, backgroundColor: item.isChecked ? colors.bgSurface : colors.accentBg, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: item.isChecked ? colors.textSubtle : colors.accent }}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: item.isChecked ? "400" : "600",
                color: item.isChecked ? colors.textSubtle : colors.text,
                textDecorationLine: item.isChecked ? "line-through" : "none",
              }}
              numberOfLines={1}
            >
              {item.customName}
            </Text>
            {item.recipeName && !item.isChecked && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4V4z" />
                  <Path d="M20 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8V4z" />
                </Svg>
                <Text style={{ fontSize: 10, fontWeight: "500", color: colors.textSubtle }} numberOfLines={1}>
                  {item.recipeName}
                </Text>
              </View>
            )}
          </View>
          {item.price && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: item.isChecked ? "#D1CCC5" : "#C4B8AF" }}>
                ~{item.price.estimatedCost.toFixed(2)} €
              </Text>
              {item.price.storeName ? (
                <Text style={{ fontSize: 10, color: colors.textSubtle }}>{item.price.storeName}</Text>
              ) : null}
            </View>
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: pressed ? colors.dangerBg : colors.bgSurface,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="3 6 5 6 21 6" />
            <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <Path d="M10 11v6M14 11v6" />
          </Svg>
        </Pressable>
      </Pressable>
      {!isLast && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 60 }} />}
    </View>
  );
}

function SkeletonBlock({ width, height, borderRadius = 8, style }: {
  width: number | string; height: number; borderRadius?: number; style?: object;
}) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const { colors } = useAppTheme();
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.border, opacity }, style]} />;
}

function ShoppingSkeleton() {
  const { colors } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <SkeletonBlock width={140} height={30} borderRadius={10} />
        </View>
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 8 }}>
          <SkeletonBlock width={116} height={34} borderRadius={99} />
          <SkeletonBlock width={96} height={34} borderRadius={99} />
        </View>
        <View style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", gap: 14, alignItems: "center" }}>
          <SkeletonBlock width={30} height={30} borderRadius={15} />
          <SkeletonBlock width={130} height={14} borderRadius={6} />
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <SkeletonBlock width={100} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            {([170, 110, 145] as number[]).map((w, i) => (
              <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.border }}>
                <SkeletonBlock width={22} height={22} borderRadius={11} />
                <SkeletonBlock width={w} height={14} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <SkeletonBlock width={70} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            {([190, 130] as number[]).map((w, i) => (
              <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < 1 ? 1 : 0, borderBottomColor: colors.border }}>
                <SkeletonBlock width={22} height={22} borderRadius={11} />
                <SkeletonBlock width={w} height={14} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function ShoppingScreen() {
  const { colors } = useAppTheme();
  const { list, setList, loading, error, reload, silentReload } = useShoppingList();
  const [addName, setAddName] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [addUnit, setAddUnit] = useState("pièce");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestionPicked, setSuggestionPicked] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<"category" | "recipe">("category");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [splitSettings, setSplitSettings] = useState<SplitSettings>(DEFAULT_SPLIT);
  const [splitEditOpen, setSplitEditOpen] = useState(false);
  const router = useRouter();

  useFocusEffect(useCallback(() => { silentReload(); }, []));

  useEffect(() => {
    getItemSuggestions().then(setSuggestions);
  }, []);

  useEffect(() => {
    getSplitSettings().then(setSplitSettings);
  }, []);

  useEffect(() => {
    if (selectedItem && list) {
      const updated = list.items.find((i) => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [list]);

  const items = list?.items ?? [];
  const unchecked = items.filter((i) => !i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);
  const checked = items.filter((i) => i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder);

  const grouped = unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const groupedByRecipe = unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.recipeName ?? "__manual";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const sortedRecipes = [
    ...Object.keys(groupedByRecipe).filter((k) => k !== "__manual"),
    ...(groupedByRecipe["__manual"] ? ["__manual"] : []),
  ];

  const hasRecipeItems = unchecked.some((i) => i.recipeName);

  const HC_CATS = new Set(["Hygiène & Beauté", "Entretien"]);
  const estimatedTotal = list?.estimatedTotal ?? 0;
  const crEstimate = items.reduce((s, i) => !HC_CATS.has(i.category ?? "") ? s + (i.price?.estimatedCost ?? 0) : s, 0);
  const hcEstimate = items.reduce((s, i) => HC_CATS.has(i.category ?? "") ? s + (i.price?.estimatedCost ?? 0) : s, 0);

  const storeSummaries = list?.storeSummaries ?? [];
  const storeIds = storeSummaries.map((s) => s.storeId);
  const intersectionItems = storeIds.length >= 2
    ? unchecked.filter((item) => storeIds.every((sid) => item.allStorePrices.some((p) => p.storeId === sid)))
    : [];
  const hasMeaningfulIntersection = intersectionItems.length >= 3;
  const storeSummariesSorted = [...storeSummaries].map((store) => ({
    ...store,
    intersectionCost: intersectionItems.reduce((sum, item) => {
      const p = item.allStorePrices.find((p) => p.storeId === store.storeId);
      return sum + (p?.estimatedCost ?? 0);
    }, 0),
  })).sort((a, b) =>
    hasMeaningfulIntersection ? a.intersectionCost - b.intersectionCost : a.totalCost - b.totalCost
  );
  const bestStoreId = hasMeaningfulIntersection && storeSummariesSorted.length >= 2
    ? storeSummariesSorted[0].storeId
    : null;

  function handleToggle(id: string, isChecked: boolean) {
    const snapshot = list;
    const item = list?.items.find((i) => i.id === id);
    setList((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === id ? { ...i, isChecked } : i),
    } : prev);
    toggleShoppingItem(id, isChecked, item?.productId, item?.customName).catch(() => setList(snapshot));
  }

  function handleDelete(id: string) {
    const snapshot = list;
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev);
    deleteShoppingItem(id).catch(() => setList(snapshot));
  }

  function handleOpenDetail(item: ShoppingItem) {
    setSelectedItem(item);
    requestAnimationFrame(() => setDetailOpen(true));
  }

  async function handleClear() {
    if (!list) return;
    setClearDialogOpen(false);
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => !i.isChecked) } : prev);
    await clearCheckedItems(list.id);
  }


  function resetAddForm() {
    setAddName("");
    setAddQuantity("1");
    setAddUnit("pièce");
    setSuggestionPicked(false);
  }

  async function handleAddItem() {
    if (!addName.trim()) return;
    setSubmitting(true);
    let listId = list?.id;
    if (!listId) {
      const newList = await createEmptyShoppingList();
      if (!newList) { setSubmitting(false); return; }
      listId = newList.id;
      setList({ id: listId, status: "active", items: [], storeSummaries: [], estimatedTotal: 0, itemsWithoutPrice: 0 });
    }
    const qty = parseFloat(addQuantity) || 1;
    const result = await addShoppingItem(listId, addName, qty, addUnit);
    setSubmitting(false);
    if (!result.error && result.itemId) {
      const newItem: ShoppingItem = {
        id: result.itemId,
        customName: addName.trim(),
        quantity: qty,
        unit: addUnit,
        isChecked: false,
        sortOrder: (list?.items.length ?? 0),
        category: null,
        allStorePrices: [],
      };
      setList((prev) => prev ? { ...prev, items: [...prev.items, newItem] } : prev);
      resetAddForm();
      setAddOpen(false);
      getItemSuggestions().then(setSuggestions);
    }
  }

  const totalItems = items.length;
  const checkedCount = checked.length;

  if (loading && !list) return <ShoppingSkeleton />;

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }} edges={["top"]}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.danger, textAlign: "center" }}>Impossible de charger la liste</Text>
        <Pressable onPress={reload} style={({ pressed }) => ({ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: pressed ? colors.accentPress : colors.accent })}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        {items.length === 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Courses</Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
            <View style={{
              borderRadius: 22,
              backgroundColor: colors.accent,
              padding: 16,
              shadowColor: "#E8571C",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
              overflow: "hidden",
            }}>
              <View style={{ position: "absolute", right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.07)" }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                {storeSummariesSorted.length > 0 ? (
                  <Pressable
                    onPress={() => storeSummariesSorted.length >= 2 && router.push("/shopping/compare")}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 6, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 10, fontWeight: "900", color: colors.accent }}>
                        {(storeSummariesSorted[0].storeName ?? "M")[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff", letterSpacing: -0.2 }} numberOfLines={1}>
                      {storeSummariesSorted[0].storeName}
                    </Text>
                    {storeSummariesSorted.length >= 2 && (
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M6 9l6 6 6-6" />
                      </Svg>
                    )}
                  </Pressable>
                ) : (
                  <View style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>Aucun magasin</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSplitEditOpen(true); }}
                    style={({ pressed }) => ({
                      width: 34, height: 34, borderRadius: 999,
                      backgroundColor: pressed ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)",
                      alignItems: "center", justifyContent: "center",
                    })}
                  >
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                      <Circle cx={12} cy={12} r={3} />
                    </Svg>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/shopping/mode-courses")}
                    style={({ pressed }) => ({
                      flexDirection: "row", alignItems: "center", gap: 6,
                      backgroundColor: "#fff", borderRadius: 99,
                      paddingHorizontal: 12, paddingVertical: 7,
                      opacity: pressed ? 0.85 : 1,
                      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
                    })}
                  >
                    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10" />
                    </Svg>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: colors.accent, letterSpacing: -0.2 }}>Démarrer</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 18, gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.7)", letterSpacing: 1.4, textTransform: "uppercase" }}>
                    Estimation
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 2 }}>
                    <Text style={{ fontSize: 46, fontWeight: "900", color: "#fff", letterSpacing: -1.5, lineHeight: 52 }}>
                      {Math.floor(estimatedTotal)}
                    </Text>
                    <Text style={{ fontSize: 46, fontWeight: "900", color: "rgba(255,255,255,0.55)", letterSpacing: -1.5, lineHeight: 52 }}>
                      ,{String(Math.round((estimatedTotal % 1) * 100)).padStart(2, "0")}
                    </Text>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.75)", marginLeft: 3, marginBottom: 2 }}>€</Text>
                  </View>

                  {(crEstimate > 0 || hcEstimate > 0) && (
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                      {crEstimate > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" }} />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.9)" }}>
                            CR ~{crEstimate.toFixed(0)} €
                          </Text>
                        </View>
                      )}
                      {hcEstimate > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#F9A8D4" }} />
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.9)" }}>
                            HC ~{hcEstimate.toFixed(0)} €
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" }} />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.92)" }}>
                      {totalItems} article{totalItems > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <View style={{ width: 56, height: 56, alignItems: "center", justifyContent: "center" }}>
                  <Svg width={56} height={56} style={{ transform: [{ rotate: "-90deg" }], position: "absolute" }}>
                    <Circle cx={28} cy={28} r={25.5} stroke="rgba(255,255,255,0.25)" strokeWidth={5} fill="none" />
                    <Circle
                      cx={28} cy={28} r={25.5}
                      stroke="#fff" strokeWidth={5} fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 25.5}`}
                      strokeDashoffset={`${(2 * Math.PI * 25.5) * (1 - (totalItems > 0 ? checkedCount / totalItems : 0))}`}
                    />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: "#fff", textAlign: "center" }}>
                    {checkedCount}<Text style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>/{totalItems}</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {hasRecipeItems && items.length > 0 && (
          <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, marginBottom: 8 }}>
            {(["category", "recipe"] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setGroupBy(mode)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 99,
                  backgroundColor: groupBy === mode ? colors.text : pressed ? colors.bgSurface : colors.bgCard,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: groupBy === mode ? colors.bg : colors.textMuted }}>
                  {mode === "category" ? "Catégories" : "Recettes"}
                </Text>
              </Pressable>
            ))}
          </View>
        )}



        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <Line x1={3} y1={6} x2={21} y2={6} />
                <Path d="M16 10a4 4 0 0 1-8 0" />
              </Svg>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Liste vide</Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
              Ajoutez vos articles ou générez la liste depuis le planning
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {groupBy === "category" ? sortedCategories.map((cat, catIdx) => {
              const catItems = grouped[cat];
              const color = CATEGORY_COLORS[cat] ?? "#9ca3af";
              return (
                <View key={cat} style={{ marginTop: catIdx === 0 ? 4 : 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      {cat}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle }}>{catItems.length}</Text>
                  </View>
                  <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
                    {catItems.map((item, i) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onOpenDetail={handleOpenDetail}
                        isLast={i === catItems.length - 1}
                      />
                    ))}
                  </View>
                </View>
              );
            }) : sortedRecipes.map((key, idx) => {
              const recipeItems = groupedByRecipe[key];
              const label = key === "__manual" ? "Hors recette" : key;
              return (
                <View key={key} style={{ marginTop: idx === 0 ? 4 : 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: key === "__manual" ? colors.textSubtle : colors.accent }} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      {label}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle }}>{recipeItems.length}</Text>
                  </View>
                  <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
                    {recipeItems.map((item, i) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        onOpenDetail={handleOpenDetail}
                        isLast={i === recipeItems.length - 1}
                      />
                    ))}
                  </View>
                </View>
              );
            })}

            {checked.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.accent }} />
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Cochés
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, marginRight: 4 }}>{checked.length}</Text>
                  <Pressable
                    onPress={() => setClearDialogOpen(true)}
                    style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: pressed ? colors.dangerBg : "#FEF2F2" })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.danger }}>Effacer</Text>
                  </Pressable>
                </View>
                <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
                  {checked.map((item, i) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onOpenDetail={handleOpenDetail}
                      isLast={i === checked.length - 1}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

      </ScrollView>

      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => ({
          position: "absolute",
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: pressed ? colors.accentPress : colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#E8571C",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 10,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        })}
      >
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Line x1={12} y1={5} x2={12} y2={19} />
          <Line x1={5} y1={12} x2={19} y2={12} />
        </Svg>
      </Pressable>

      <BottomModal isOpen={addOpen} onClose={() => { resetAddForm(); setAddOpen(false); }} height="auto">
        <View style={{ paddingBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text }}>Ajouter un article</Text>
        </View>
        <View style={{ gap: 12 }}>
          <TextInput
            value={addName}
            onChangeText={(v) => { setAddName(v); setSuggestionPicked(false); }}
            placeholder="Nom de l'article…"
            placeholderTextColor={colors.textSubtle}
            autoFocus
            style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          {(() => {
            const filtered = suggestions
              .filter((s) => !addName.trim() || s.toLowerCase().includes(addName.toLowerCase()))
              .slice(0, 12);
            return !suggestionPicked && filtered.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
                {filtered.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => { setAddName(s); setSuggestionPicked(true); }}
                    style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.bgSurface }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#44403C" }}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null;
          })()}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>Qté</Text>
              <TextInput
                value={addQuantity}
                onChangeText={setAddQuantity}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={colors.textSubtle}
                style={{ width: 72, borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center" }}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>Unité</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setAddUnit(u)}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: addUnit === u ? colors.accent : colors.bgSurface }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: addUnit === u ? "#fff" : colors.textMuted }}>{u}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          <Pressable
            onPress={handleAddItem}
            disabled={submitting || !addName.trim()}
            style={({ pressed }) => ({
              borderRadius: 16, paddingVertical: 16, alignItems: "center",
              backgroundColor: (!addName.trim() || submitting) ? colors.bgSurface : pressed ? colors.accentPress : colors.accent,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: (!addName.trim() || submitting) ? colors.textSubtle : "#fff" }}>
              {submitting ? "Ajout…" : "Ajouter"}
            </Text>
          </Pressable>
        </View>
      </BottomModal>

      <ItemDetailSheet
        item={selectedItem}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onReload={silentReload}
      />

      <SplitEditSheet
        isOpen={splitEditOpen}
        onOpenChange={(v) => !v && setSplitEditOpen(false)}
        settings={splitSettings}
        onSave={(s) => { setSplitSettings(s); updateSplitSettings(s); }}
      />

      <Dialog isOpen={clearDialogOpen} onOpenChange={(open) => { if (!open) setClearDialogOpen(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Effacer les articles cochés ?</Dialog.Title>
            <Dialog.Description>
              {`${list?.items.filter((i) => i.isChecked).length ?? 0} article(s) seront supprimés de la liste.`}
            </Dialog.Description>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setClearDialogOpen(false)}>
                <Button.Label>Annuler</Button.Label>
              </Button>
              <Button variant="danger" style={{ flex: 1 }} onPress={handleClear}>
                <Button.Label>Effacer</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

    </SafeAreaView>
  );
}
