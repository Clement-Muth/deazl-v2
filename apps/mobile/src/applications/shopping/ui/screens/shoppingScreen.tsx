import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { BottomSheet, Button, SearchField, Separator } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline } from "react-native-svg";
import { useShoppingList } from "../../api/useShoppingList";
import { addShoppingItem } from "../../application/useCases/addShoppingItem";
import { clearCheckedItems } from "../../application/useCases/clearCheckedItems";
import { createEmptyShoppingList } from "../../application/useCases/createEmptyShoppingList";
import { deleteShoppingItem } from "../../application/useCases/deleteShoppingItem";
import { getItemSuggestions } from "../../application/useCases/getItemSuggestions";
import { toggleShoppingItem } from "../../application/useCases/toggleShoppingItem";
import { transferCheckedToPantry } from "../../application/useCases/transferCheckedToPantry";
import type { ShoppingItem } from "../../domain/entities/shopping";
import { ItemDetailSheet } from "../components/itemDetailSheet";

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

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

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
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingLeft: 16,
          paddingRight: 8,
          paddingVertical: 12,
          backgroundColor: "#fff",
          minHeight: 56,
        }}
      >
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={({ pressed }) => ({
            width: 26,
            height: 26,
            borderRadius: 13,
            borderWidth: 2,
            borderColor: item.isChecked ? "#E8571C" : "#D1D5DB",
            backgroundColor: item.isChecked ? "#E8571C" : pressed ? "#FFF0EB" : "transparent",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          })}
        >
          {item.isChecked && (
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <Polyline points="20 6 9 17 4 12" />
            </Svg>
          )}
        </Pressable>

        <Pressable
          onPress={handleOpenDetail}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            backgroundColor: pressed ? "#FAFAF8" : "transparent",
            borderRadius: 8,
            paddingVertical: 2,
            paddingHorizontal: 4,
            marginHorizontal: -4,
          })}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: item.isChecked ? "400" : "500",
                color: item.isChecked ? "#A8A29E" : "#1C1917",
                textDecorationLine: item.isChecked ? "line-through" : "none",
              }}
              numberOfLines={1}
            >
              {item.quantity > 0 && (
                <Text style={{ fontWeight: "700", color: item.isChecked ? "#A8A29E" : "#E8571C" }}>
                  {item.quantity}{item.unit ? ` ${item.unit}` : ""}{"  "}
                </Text>
              )}
              {item.customName}
            </Text>
          </View>

          {item.price && !item.isChecked && (
            <View style={{
              backgroundColor: "#FFF7ED",
              borderRadius: 8,
              paddingHorizontal: 7,
              paddingVertical: 3,
              flexShrink: 0,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#EA580C" }}>
                ~{item.price.estimatedCost.toFixed(2)} €
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={handleDelete}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: pressed ? "#FEE2E2" : "#F5F3EF",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="3 6 5 6 21 6" />
            <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <Path d="M10 11v6M14 11v6" />
          </Svg>
        </Pressable>
      </View>
      {!isLast && <Separator />}
    </View>
  );
}

export function ShoppingScreen() {
  const { list, setList, loading, error, reload } = useShoppingList();
  const [addName, setAddName] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [addUnit, setAddUnit] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [transferDone, setTransferDone] = useState(false);
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

  const searchQ = normalize(search.trim());
  const filteredUnchecked = searchQ
    ? unchecked.filter((i) => normalize(i.customName).includes(searchQ))
    : unchecked;
  const filteredChecked = searchQ
    ? checked.filter((i) => normalize(i.customName).includes(searchQ))
    : checked;

  const grouped = filteredUnchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const cheapestStore = list?.storeSummaries?.[0] ?? null;
  const hasNoPrices = unchecked.length > 0 && unchecked.every((i) => i.allStorePrices.length === 0);

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
    setDetailOpen(true);
  }

  async function handleClear() {
    if (!list) return;
    setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => !i.isChecked) } : prev);
    await clearCheckedItems(list.id);
  }

  async function handleTransferToPantry() {
    if (!list) return;
    const payload = checked.map((i) => ({ name: i.customName, quantity: i.quantity, unit: i.unit }));
    try {
      await transferCheckedToPantry(payload);
      await clearCheckedItems(list.id);
      setList((prev) => prev ? { ...prev, items: prev.items.filter((i) => !i.isChecked) } : prev);
      setTransferDone(true);
      setTimeout(() => setTransferDone(false), 2500);
    } catch {}
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
    const result = await addShoppingItem(listId, addName, qty, addUnit.trim() || "pièce");
    setSubmitting(false);
    if (!result.error) {
      setAddName(""); setAddQuantity("1"); setAddUnit("");
      setAddOpen(false);
      await reload();
      getItemSuggestions().then(setSuggestions);
    }
  }

  const totalItems = items.length;
  const checkedCount = checked.length;
  const itemsWithPrice = unchecked.filter((i) => i.price).length;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center" }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          </Svg>
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {totalItems > 0 && (
                <Text style={{ fontSize: 13, color: "#A8A29E", fontWeight: "500" }}>
                  {checkedCount}/{totalItems}
                </Text>
              )}
              {totalItems > 0 && (
                <Pressable
                  onPress={() => router.push("/shopping/mode-courses")}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 5,
                    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                    backgroundColor: pressed ? "#D14A18" : "#E8571C",
                  })}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <Line x1={3} y1={6} x2={21} y2={6} />
                    <Path d="M16 10a4 4 0 0 1-8 0" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Mode courses</Text>
                </Pressable>
              )}
            </View>
          </View>
          {totalItems > 0 && (
            <View style={{ height: 3, borderRadius: 99, backgroundColor: "#F5F3EF", marginTop: 6 }}>
              <View style={{
                height: 3, borderRadius: 99, backgroundColor: "#E8571C",
                width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%`,
              }} />
            </View>
          )}
        </View>

        {hasNoPrices && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" }}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Polyline points="9 22 9 12 15 12 15 22" />
              </Svg>
            </View>
            <Text style={{ flex: 1, fontSize: 12, color: "#92400E" }}>
              <Text style={{ fontWeight: "700" }}>Ajoutez vos magasins </Text>dans le profil pour voir les prix estimés
            </Text>
          </View>
        )}

        {cheapestStore && itemsWithPrice > 0 && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 16, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" }}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <Polyline points="9 22 9 12 15 12 15 22" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#15803D" }}>
                {cheapestStore.storeName}
                <Text style={{ fontWeight: "500" }}> · {cheapestStore.storeCity}</Text>
              </Text>
              <Text style={{ fontSize: 11, color: "#16A34A", fontWeight: "500" }}>
                ~{cheapestStore.totalCost.toFixed(2)} € pour {cheapestStore.coveredCount}/{cheapestStore.totalCount} articles
                {cheapestStore.hasEstimates ? " (estimé)" : ""}
              </Text>
            </View>
          </View>
        )}

        {totalItems > 4 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <SearchField value={search} onChange={setSearch}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Rechercher…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </View>
        )}

        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 64, paddingHorizontal: 32, gap: 12 }}>
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
          <View style={{ paddingHorizontal: 16, gap: 8 }}>
            {sortedCategories.map((cat) => {
              const catItems = grouped[cat];
              const color = CATEGORY_COLORS[cat] ?? "#9ca3af";
              return (
                <View key={cat} style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F3EF" }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>
                      {cat}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>{catItems.length}</Text>
                  </View>
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
              );
            })}

            {filteredChecked.length > 0 && (
              <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F3EF" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Cochés ({filteredChecked.length})
                  </Text>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable onPress={handleTransferToPantry}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#E8571C" }}>
                        {transferDone ? "✓ Ajouté !" : "Au stock"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={handleClear}>
                      <Text style={{ fontSize: 12, fontWeight: "600", color: "#DC2626" }}>Effacer</Text>
                    </Pressable>
                  </View>
                </View>
                {filteredChecked.map((item, i) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onOpenDetail={handleOpenDetail}
                    isLast={i === filteredChecked.length - 1}
                  />
                ))}
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
          backgroundColor: "#E8571C",
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

      <BottomSheet isOpen={addOpen} onOpenChange={(v) => !v && setAddOpen(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["55%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Ajouter un article</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ gap: 12 }}>
              <TextInput
                value={addName}
                onChangeText={setAddName}
                placeholder="Nom de l'article…"
                placeholderTextColor="#A8A29E"
                autoFocus
                style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
                onSubmitEditing={handleAddItem}
                returnKeyType="done"
              />
              {suggestions.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
                  {suggestions
                    .filter((s) => !addName.trim() || s.toLowerCase().includes(addName.toLowerCase()))
                    .slice(0, 12)
                    .map((s) => (
                      <Pressable
                        key={s}
                        onPress={() => setAddName(s)}
                        style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#F5F3EF" }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "500", color: "#44403C" }}>{s}</Text>
                      </Pressable>
                    ))}
                </ScrollView>
              )}
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={addQuantity}
                  onChangeText={setAddQuantity}
                  placeholder="1"
                  keyboardType="numeric"
                  placeholderTextColor="#A8A29E"
                  style={{ flex: 1, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
                />
                <TextInput
                  value={addUnit}
                  onChangeText={setAddUnit}
                  placeholder="pièce, kg, L…"
                  placeholderTextColor="#A8A29E"
                  style={{ flex: 2, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
                />
              </View>
              <Button
                variant="primary"
                onPress={handleAddItem}
                isDisabled={submitting || !addName.trim()}
                className="w-full rounded-2xl"
              >
                <Button.Label>{submitting ? "Ajout…" : "Ajouter"}</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <ItemDetailSheet
        item={selectedItem}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onReload={reload}
      />

    </SafeAreaView>
  );
}
