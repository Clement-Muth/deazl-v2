import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { BottomModal } from "../components/bottomModal";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline } from "react-native-svg";
import { useShoppingList } from "../../api/useShoppingList";
import { addShoppingItem } from "../../application/useCases/addShoppingItem";
import { clearCheckedItems } from "../../application/useCases/clearCheckedItems";
import { createEmptyShoppingList } from "../../application/useCases/createEmptyShoppingList";
import { deleteShoppingItem } from "../../application/useCases/deleteShoppingItem";
import { getItemSuggestions } from "../../application/useCases/getItemSuggestions";
import { toggleShoppingItem } from "../../application/useCases/toggleShoppingItem";
import type { ShoppingItem } from "../../domain/entities/shopping";
import { ItemDetailSheet } from "../components/itemDetailSheet";

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
          backgroundColor: pressed ? "#FAFAF8" : "#fff",
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
            borderColor: item.isChecked ? "#E8571C" : "#D1D5DB",
            backgroundColor: item.isChecked ? "#E8571C" : pressed ? "#FFF0EB" : "transparent",
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
            <View style={{ borderRadius: 6, backgroundColor: item.isChecked ? "#F5F3EF" : "#FEF3ED", paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: item.isChecked ? "#A8A29E" : "#E8571C" }}>
                {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              </Text>
            </View>
          )}
          <Text
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: item.isChecked ? "400" : "600",
              color: item.isChecked ? "#A8A29E" : "#1C1917",
              textDecorationLine: item.isChecked ? "line-through" : "none",
            }}
            numberOfLines={1}
          >
            {item.customName}
          </Text>
          {item.price && (
            <Text style={{ fontSize: 12, fontWeight: "600", color: item.isChecked ? "#D1CCC5" : "#C4B8AF" }}>
              ~{item.price.estimatedCost.toFixed(2)} €
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: pressed ? "#FEE2E2" : "#F5F3EF",
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
      {!isLast && <View style={{ height: 1, backgroundColor: "#F5F3EF", marginLeft: 60 }} />}
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
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: "#E8E5E0", opacity }, style]} />;
}

function ShoppingSkeleton() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
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
          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            {([170, 110, 145] as number[]).map((w, i) => (
              <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: "#F5F3EF" }}>
                <SkeletonBlock width={22} height={22} borderRadius={11} />
                <SkeletonBlock width={w} height={14} borderRadius={6} />
              </View>
            ))}
          </View>
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <SkeletonBlock width={70} height={10} borderRadius={4} style={{ marginBottom: 10 }} />
          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            {([190, 130] as number[]).map((w, i) => (
              <View key={i} style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: i < 1 ? 1 : 0, borderBottomColor: "#F5F3EF" }}>
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
  const router = useRouter();

  useFocusEffect(useCallback(() => { reload(); }, []));

  useEffect(() => {
    getItemSuggestions().then(setSuggestions);
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
    setList((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === id ? { ...i, isChecked } : i),
    } : prev);
    toggleShoppingItem(id, isChecked).catch(() => setList(snapshot));
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
    }
    const qty = parseFloat(addQuantity) || 1;
    const result = await addShoppingItem(listId, addName, qty, addUnit);
    setSubmitting(false);
    if (!result.error) {
      resetAddForm();
      setAddOpen(false);
      await reload();
      getItemSuggestions().then(setSuggestions);
    }
  }

  const totalItems = items.length;
  const checkedCount = checked.length;

  if (loading) return <ShoppingSkeleton />;

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }} edges={["top"]}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626", textAlign: "center" }}>Impossible de charger la liste</Text>
        <Pressable onPress={reload} style={({ pressed }) => ({ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, backgroundColor: pressed ? "#D14A18" : "#E8571C" })}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ fontSize: 28, fontWeight: "900", color: "#1C1917", letterSpacing: -0.5 }}>Courses</Text>
            {totalItems > 0 && (
              <Text style={{ fontSize: 13, color: "#A8A29E", fontWeight: "500" }}>
                {checkedCount}/{totalItems}
              </Text>
            )}
          </View>
        </View>

        {storeSummariesSorted.length > 0 && unchecked.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 4 }}
            style={{ marginBottom: 4 }}
          >
            {storeSummariesSorted.map((store) => {
              const isBest = store.storeId === bestStoreId;
              const displayCost = hasMeaningfulIntersection ? store.intersectionCost : store.totalCost;
              return (
                <View
                  key={store.storeId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderRadius: 99,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    backgroundColor: isBest ? "#F0FDF4" : "#F5F3EF",
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isBest ? "#22c55e" : "#D1CCC5" }} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: isBest ? "#15803D" : "#44403C" }} numberOfLines={1}>
                    {store.storeName}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: isBest ? "#15803D" : "#78716C" }}>
                    ~{displayCost.toFixed(2)} €
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        )}

        <Pressable
          onPress={() => setAddOpen(true)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 20,
            paddingVertical: 14,
            marginBottom: 4,
            backgroundColor: pressed ? "#F0EDE8" : "transparent",
          })}
        >
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#FEF0EC", alignItems: "center", justifyContent: "center" }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={12} y1={5} x2={12} y2={19} />
              <Line x1={5} y1={12} x2={19} y2={12} />
            </Svg>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "500", color: "#A8A29E" }}>Ajouter un article</Text>
        </Pressable>

        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32, gap: 12 }}>
            <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <Line x1={3} y1={6} x2={21} y2={6} />
                <Path d="M16 10a4 4 0 0 1-8 0" />
              </Svg>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1917" }}>Liste vide</Text>
            <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>
              Ajoutez vos articles ou générez la liste depuis le planning
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            {sortedCategories.map((cat, catIdx) => {
              const catItems = grouped[cat];
              const color = CATEGORY_COLORS[cat] ?? "#9ca3af";
              return (
                <View key={cat} style={{ marginTop: catIdx === 0 ? 4 : 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>
                      {cat}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>{catItems.length}</Text>
                  </View>
                  <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
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
            })}

            {checked.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#E8571C" }} />
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Cochés
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", marginRight: 4 }}>{checked.length}</Text>
                  <Pressable
                    onPress={handleClear}
                    style={({ pressed }) => ({ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: pressed ? "#FEE2E2" : "#FEF2F2" })}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#DC2626" }}>Effacer</Text>
                  </Pressable>
                </View>
                <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
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

      {totalItems > 0 && (
        <Pressable
          onPress={() => router.push("/shopping/mode-courses")}
          style={({ pressed }) => ({
            position: "absolute",
            bottom: 100,
            right: 20,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: pressed ? "#D14A18" : "#E8571C",
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
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <Line x1={3} y1={6} x2={21} y2={6} />
            <Path d="M16 10a4 4 0 0 1-8 0" />
          </Svg>
        </Pressable>
      )}

      <BottomModal isOpen={addOpen} onClose={() => { resetAddForm(); setAddOpen(false); }} height="30%">
        <View style={{ paddingBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Ajouter un article</Text>
        </View>
        <View style={{ gap: 12 }}>
          <TextInput
            value={addName}
            onChangeText={(v) => { setAddName(v); setSuggestionPicked(false); }}
            placeholder="Nom de l'article…"
            placeholderTextColor="#A8A29E"
            autoFocus
            style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
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
                    style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F5F3EF" }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "500", color: "#44403C" }}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null;
          })()}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Qté</Text>
              <TextInput
                value={addQuantity}
                onChangeText={setAddQuantity}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor="#A8A29E"
                style={{ width: 72, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, fontWeight: "700", color: "#1C1917", textAlign: "center" }}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Unité</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setAddUnit(u)}
                    style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: addUnit === u ? "#E8571C" : "#F5F3EF" }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: addUnit === u ? "#fff" : "#78716C" }}>{u}</Text>
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
              backgroundColor: (!addName.trim() || submitting) ? "#F5F3EF" : pressed ? "#D14A18" : "#E8571C",
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: (!addName.trim() || submitting) ? "#A8A29E" : "#fff" }}>
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

    </SafeAreaView>
  );
}
