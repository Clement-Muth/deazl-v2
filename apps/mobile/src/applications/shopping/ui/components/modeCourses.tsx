import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline, Rect } from "react-native-svg";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from "react-native-reanimated";
import { BottomSheet } from "heroui-native";
import { findOrCreateProduct } from "../../application/useCases/findOrCreateProduct";
import { getOffProductByBarcode } from "../../application/useCases/searchOffProducts";
import type { OFFProductResult } from "../../application/useCases/searchOffProducts";
import { getUserStores } from "../../application/useCases/getUserStores";
import type { UserStore } from "../../application/useCases/getUserStores";
import { linkShoppingItemProduct } from "../../application/useCases/linkShoppingItemProduct";
import { addShoppingItem } from "../../application/useCases/addShoppingItem";
import { reportProductPrice } from "../../application/useCases/reportProductPrice";
import { reportIngredientPrice } from "../../application/useCases/reportIngredientPrice";
import { reportPriceForProduct } from "../../application/useCases/reportPriceForProduct";
import { toggleShoppingItem } from "../../application/useCases/toggleShoppingItem";
import {
  getSplitSettings,
  updateSplitSettings,
  DEFAULT_SPLIT,
} from "../../application/useCases/getSplitSettings";
import type { SplitSettings, SplitMember } from "../../application/useCases/getSplitSettings";
import type { ShoppingItem, ShoppingList } from "../../domain/entities/shopping";
import { useShoppingList } from "../../api/useShoppingList";

const CATEGORY_ORDER = [
  "Fruits & Légumes","Viandes & Poissons","Produits laitiers","Boulangerie",
  "Épicerie sèche","Surgelés","Boissons","Hygiène & Beauté","Entretien","Autre",
];
const CATEGORY_COLORS: Record<string, string> = {
  "Fruits & Légumes":"#22c55e","Viandes & Poissons":"#ef4444","Produits laitiers":"#3b82f6",
  "Boulangerie":"#f97316","Épicerie sèche":"#f59e0b","Surgelés":"#06b6d4",
  "Boissons":"#8b5cf6","Hygiène & Beauté":"#ec4899","Entretien":"#64748b","Autre":"#9ca3af",
};

function budgetBarColor(total: number, cap: number, color: string): string {
  if (total > cap) return "#DC2626";
  if (total > cap - 5) return "#F59E0B";
  return color;
}

function NumPad({ value, onChange, keyHeight = 68 }: { value: string; onChange: (v: string) => void; keyHeight?: number }) {
  const rows = [["1","2","3"],["4","5","6"],["7","8","9"],[".", "0","⌫"]];

  function press(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === "⌫") { onChange(value.slice(0, -1)); return; }
    if (key === ".") { if (value.includes(".")) return; onChange((value || "0") + "."); return; }
    const [, dec] = value.split(".");
    if (dec !== undefined && dec.length >= 2) return;
    if (value.replace(".", "").length >= 5) return;
    onChange(value === "0" ? key : value + key);
  }

  return (
    <View style={{ gap: 8 }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 8 }}>
          {row.map((key) => (
            <Pressable
              key={key}
              onPress={() => press(key)}
              style={({ pressed }) => ({
                flex: 1, height: keyHeight, borderRadius: 16,
                backgroundColor: key === "⌫" ? "#FEE2E280" : pressed ? "#E2DED8" : "#EDEAE4",
                alignItems: "center", justifyContent: "center",
                transform: [{ scale: pressed ? 0.92 : 1 }],
              })}
            >
              <Text style={{ fontSize: key === "⌫" ? 18 : 24, fontWeight: "600", color: key === "⌫" ? "#DC2626" : "#1C1917" }}>
                {key}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function StoreSelectorModal({
  isOpen,
  onClose,
  stores,
  onSelect,
  canDismiss,
}: {
  isOpen: boolean;
  onClose: () => void;
  stores: UserStore[];
  onSelect: (s: UserStore) => void;
  canDismiss: boolean;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(500, { duration: 260 });
    }
  }, [isOpen]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }} pointerEvents={isOpen ? "auto" : "none"}>
      <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)" }, backdropStyle]}>
        <Pressable style={{ flex: 1 }} onPress={canDismiss ? onClose : undefined} />
      </Animated.View>
      <Animated.View style={[{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "#fff",
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingTop: 20, paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
        gap: 16,
      }, panelStyle]}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0DDD7", alignSelf: "center", marginBottom: 4 }} />
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#1C1917", letterSpacing: -0.5 }}>Vous êtes où ?</Text>
          <Text style={{ fontSize: 13, color: "#78716C" }}>Les prix seront enregistrés pour ce magasin.</Text>
        </View>
        <View style={{ borderRadius: 14, backgroundColor: "#FAF9F6", overflow: "hidden" }}>
          {stores.map((store, i) => (
            <View key={store.id}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onSelect(store); onClose(); }}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 16, paddingVertical: 16,
                  backgroundColor: pressed ? "#F0EDE8" : "transparent",
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "#1C1917" }}>{store.name}</Text>
                  {store.city && <Text style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>{store.city}</Text>}
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C4B8AF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </Pressable>
              {i < stores.length - 1 && <View style={{ height: 1, backgroundColor: "#F0EDE8", marginLeft: 16 }} />}
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

function SplitEditSheet({
  isOpen,
  onOpenChange,
  settings,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SplitSettings;
  onSave: (s: SplitSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => { if (isOpen) setDraft(settings); }, [isOpen]);

  function updateMember(idx: number, patch: Partial<SplitMember>) {
    setDraft((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  }

  function handleClose(v: boolean) {
    if (!v) onSave(draft);
    onOpenChange(v);
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleClose}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["55%"]}>
          <View style={{ gap: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 }}>
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#1C1917" }}>Partager les dépenses</Text>
              <BottomSheet.Close />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9F8F6", borderRadius: 16, padding: 16 }}>
              <View style={{ gap: 2, flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917" }}>Activer</Text>
                <Text style={{ fontSize: 12, color: "#78716C" }}>Les articles sont répartis selon les budgets</Text>
              </View>
              <Pressable
                onPress={() => setDraft((prev) => ({ ...prev, enabled: !prev.enabled }))}
                style={{
                  width: 50, height: 28, borderRadius: 14,
                  backgroundColor: draft.enabled ? "#E8571C" : "#D1CCC5",
                  justifyContent: "center", padding: 2,
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
                  alignSelf: draft.enabled ? "flex-end" : "flex-start",
                  shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 }, elevation: 2,
                }} />
              </Pressable>
            </View>

            {draft.enabled && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                {draft.members.map((m, i) => (
                  <View key={i} style={{ flex: 1, borderRadius: 20, backgroundColor: "#F9F8F6", padding: 16, gap: 14, alignItems: "center" }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: m.color, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 20, fontWeight: "900", color: "#fff" }}>
                        {m.name.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                    <TextInput
                      value={m.name}
                      onChangeText={(v) => updateMember(i, { name: v })}
                      style={{ fontSize: 15, fontWeight: "700", color: "#1C1917", textAlign: "center", width: "100%" }}
                      maxLength={20}
                      selectTextOnFocus
                    />
                    <View style={{ width: "100%", height: 1, backgroundColor: "#EDEAE4" }} />
                    <View style={{ gap: 6, alignItems: "center", width: "100%" }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Budget</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <Pressable
                          onPress={() => updateMember(i, { budgetCap: Math.max(5, m.budgetCap - 5) })}
                          style={({ pressed }) => ({
                            width: 32, height: 32, borderRadius: 8,
                            backgroundColor: pressed ? "#E0DDD7" : "#EDEAE4",
                            alignItems: "center", justifyContent: "center",
                          })}
                        >
                          <Text style={{ fontSize: 18, fontWeight: "600", color: "#44403C", lineHeight: 22 }}>−</Text>
                        </Pressable>
                        <Text style={{ fontSize: 20, fontWeight: "900", color: "#1C1917", minWidth: 52, textAlign: "center" }}>
                          {m.budgetCap}€
                        </Text>
                        <Pressable
                          onPress={() => updateMember(i, { budgetCap: Math.min(500, m.budgetCap + 5) })}
                          style={({ pressed }) => ({
                            width: 32, height: 32, borderRadius: 8,
                            backgroundColor: pressed ? "#E0DDD7" : "#EDEAE4",
                            alignItems: "center", justifyContent: "center",
                          })}
                        >
                          <Text style={{ fontSize: 18, fontWeight: "600", color: "#44403C", lineHeight: 22 }}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function getProjectedMemberIdx(memberTotals: number[], split: SplitSettings, lockedIdx?: number): number {
  if (lockedIdx !== undefined) return lockedIdx;
  if (!split.enabled || split.members.length < 2) return 0;
  let best = 0;
  let bestRem = split.members[0].budgetCap - (memberTotals[0] ?? 0);
  for (let i = 1; i < split.members.length; i++) {
    const rem = split.members[i].budgetCap - (memberTotals[i] ?? 0);
    if (rem > bestRem) { bestRem = rem; best = i; }
  }
  return best;
}

interface PricePromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItem | null;
  prefillPrice: string;
  confirmedTotal: number;
  memberTotals: number[];
  splitSettings: SplitSettings;
  lockedMemberIdx?: number;
  hasProduct: boolean;
  onConfirm: (actualPaid: number, mode: "total" | "kg", kgPrice?: number) => void;
  onSkip: () => void;
  onCheckWithoutPrice: () => void;
  onRescan?: () => void;
}

function PricePrompt({ isOpen, onOpenChange, item, prefillPrice, confirmedTotal, memberTotals, splitSettings, lockedMemberIdx, hasProduct, onConfirm, onSkip, onCheckWithoutPrice, onRescan }: PricePromptProps) {
  const [value, setValue] = useState(prefillPrice);
  const [priceMode, setPriceMode] = useState<"total" | "kg">("total");
  const [kgStep, setKgStep] = useState<"price" | "weight">("price");
  const [kgPriceValue, setKgPriceValue] = useState("");
  useEffect(() => { setValue(prefillPrice); setKgStep("price"); setKgPriceValue(""); }, [prefillPrice]);

  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;
  const isWeightStep = priceMode === "kg" && kgStep === "weight";
  const kgPriceNum = parseFloat(kgPriceValue);

  const addedPrice = (() => {
    if (isWeightStep) {
      const w = valid ? parsed : 0;
      return !Number.isNaN(kgPriceNum) ? kgPriceNum * (w / 1000) : 0;
    }
    return priceMode === "kg" ? 0 : (valid ? parsed : 0);
  })();

  const projectedTotal = confirmedTotal + addedPrice;
  const projectedMemberIdx = getProjectedMemberIdx(memberTotals, splitSettings, lockedMemberIdx);
  const projectedMemberTotals = memberTotals.map((t, i) => i === projectedMemberIdx ? t + addedPrice : t);

  function handleConfirm() {
    if (!valid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (priceMode === "kg" && kgStep === "price") {
      setKgPriceValue(value);
      setValue("");
      setKgStep("weight");
    } else if (isWeightStep) {
      const actualPaid = kgPriceNum * (parsed / 1000);
      onConfirm(actualPaid, "kg", kgPriceNum);
    } else {
      onConfirm(parsed, "total");
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["85%"]}>
          {item && <View style={{ gap: 12 }}>
      <View style={{ borderRadius: 14, backgroundColor: "#FAF9F6", padding: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1 }}>Panier</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
            {addedPrice > 0 ? (
              <>
                <Text style={{ fontSize: 12, color: "#A8A29E" }}>{confirmedTotal.toFixed(2)}</Text>
                <Text style={{ fontSize: 11, color: "#C4B8AF" }}> +{addedPrice.toFixed(2)} =</Text>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#1C1917" }}>{projectedTotal.toFixed(2)} €</Text>
              </>
            ) : (
              <Text style={{ fontSize: 15, fontWeight: "900", color: "#1C1917" }}>{confirmedTotal.toFixed(2)} €</Text>
            )}
          </View>
        </View>
        {splitSettings.enabled && splitSettings.members.length >= 2 && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {splitSettings.members.map((m, i) => {
              const t = projectedMemberTotals[i] ?? 0;
              const ratio = Math.min(t / m.budgetCap, 1);
              const barColor = budgetBarColor(t, m.budgetCap, m.color);
              const isAssigned = i === projectedMemberIdx && addedPrice > 0;
              return (
                <View key={i} style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#44403C" }}>{m.name.slice(0, 8)}</Text>
                      {isAssigned && <Text style={{ fontSize: 9, color: m.color, fontWeight: "700" }}>← ce</Text>}
                    </View>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: barColor === "#DC2626" ? "#DC2626" : "#78716C" }}>
                      {t.toFixed(2)}<Text style={{ fontWeight: "400", color: "#A8A29E" }}>/{m.budgetCap}€</Text>
                    </Text>
                  </View>
                  <View style={{ height: 4, borderRadius: 99, backgroundColor: "#EDEAE4" }}>
                    <View style={{ height: 4, borderRadius: 99, backgroundColor: barColor, width: `${ratio * 100}%` }} />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          {isWeightStep ? (
            <Pressable onPress={() => { setKgStep("price"); setValue(kgPriceValue); setKgPriceValue(""); }} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="15 18 9 12 15 6" />
              </Svg>
              <Text style={{ fontSize: 13, color: "#E8571C", fontWeight: "600" }}>{kgPriceValue} €/kg</Text>
            </Pressable>
          ) : (
            <>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>
                {item.quantity > 1 ? `Prix total · ${item.quantity} ${item.unit}` : "Montant payé"}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#1C1917" }} numberOfLines={1}>
                {item.customName}
              </Text>
            </>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          {!isWeightStep && onRescan && (
            <Pressable onPress={onRescan} hitSlop={12}>
              <Text style={{ fontSize: 13, color: "#E8571C", fontWeight: "600" }}>Autre produit</Text>
            </Pressable>
          )}
          {!isWeightStep && (
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCheckWithoutPrice(); }} hitSlop={12}>
              <Text style={{ fontSize: 13, color: "#78716C", fontWeight: "600" }}>✓ Sans prix</Text>
            </Pressable>
          )}
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSkip(); }} hitSlop={16}>
            <Text style={{ fontSize: 13, color: "#C4B8AF", fontWeight: "500" }}>Passer</Text>
          </Pressable>
        </View>
      </View>

      {!hasProduct && !isWeightStep && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["total", "kg"] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => { Haptics.selectionAsync(); setPriceMode(mode); }}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                backgroundColor: priceMode === mode ? "#1C1917" : "#F0EDE8",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: priceMode === mode ? "#fff" : "#78716C" }}>
                {mode === "total" ? (item.quantity > 1 ? `Total · ${item.quantity} ${item.unit}` : "Montant payé") : "Prix au kg"}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={{
        borderRadius: 16, backgroundColor: "#FAF9F6",
        paddingVertical: 14, paddingHorizontal: 20,
        flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
      }}>
        <Text style={{
          fontSize: value ? 46 : 36, fontWeight: "900",
          color: value ? "#1C1917" : "#D1CCC5", letterSpacing: -2,
          minWidth: 60, textAlign: "right",
        }}>
          {value || "0"}
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#A8A29E", marginBottom: 2 }}>
          {isWeightStep ? "g" : (!hasProduct && priceMode === "kg" ? "€/kg" : "€")}
        </Text>
      </View>

      {isWeightStep && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#A8A29E", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>
          Poids estimé (g)
        </Text>
      )}
      {!isWeightStep && priceMode === "total" && item.quantity > 1 && valid && (
        <Text style={{ fontSize: 12, fontWeight: "600", color: "#A8A29E", textAlign: "center" }}>
          = {(parsed / item.quantity).toFixed(2)} € / {item.unit}
        </Text>
      )}
      <NumPad value={value} onChange={setValue} keyHeight={58} />

      <Pressable
        onPress={handleConfirm}
        style={({ pressed }) => ({
          borderRadius: 18, paddingVertical: 18, alignItems: "center",
          backgroundColor: valid ? (pressed ? "#C94415" : "#E8571C") : "#F0EDE8",
          transform: [{ scale: pressed && valid ? 0.97 : 1 }],
        })}
      >
        <Text style={{ fontSize: 17, fontWeight: "900", color: valid ? "#fff" : "#A8A29E", letterSpacing: -0.3 }}>
          {isWeightStep ? "✓ Confirmer le poids" : (priceMode === "kg" ? "Suivant →" : "✓ Confirmer")}
        </Text>
      </Pressable>
          </View>}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function AddItemSheet({
  isOpen,
  onOpenChange,
  splitSettings,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  splitSettings: SplitSettings;
  onConfirm: (name: string, actualPaid: number, memberIdx: number, mode: "total" | "kg", kgPrice?: number) => void;
}) {
  const [name, setName] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [memberIdx, setMemberIdx] = useState(0);
  const [step, setStep] = useState<"name" | "price" | "weight">("name");
  const [priceMode, setPriceMode] = useState<"total" | "kg">("total");
  const [kgPriceValue, setKgPriceValue] = useState("");
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isOpen) {
      setName(""); setPriceValue(""); setStep("name"); setMemberIdx(0); setPriceMode("total"); setKgPriceValue("");
    } else {
      const t = setTimeout(() => nameInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === "name") {
      const t = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [step]);

  const parsed = parseFloat(priceValue);
  const priceValid = !Number.isNaN(parsed) && parsed > 0;
  const valid = name.trim().length > 0 && priceValid;

  function goToPrice() {
    if (!name.trim()) return;
    Keyboard.dismiss();
    setStep("price");
  }

  const MemberSelector = () => splitSettings.enabled && splitSettings.members.length >= 2 ? (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {splitSettings.members.map((m, i) => (
        <Pressable
          key={i}
          onPress={() => setMemberIdx(i)}
          style={{
            flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center",
            backgroundColor: memberIdx === i ? `${m.color}18` : "#F5F3EF",
            borderWidth: 1.5, borderColor: memberIdx === i ? m.color : "transparent",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: m.color }} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: memberIdx === i ? m.color : "#78716C" }}>{m.name}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  ) : null;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["88%"]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {step !== "name" && (
                <Pressable
                  onPress={() => {
                    if (step === "weight") { setStep("price"); setPriceValue(kgPriceValue); setKgPriceValue(""); }
                    else { setStep("name"); }
                  }}
                  hitSlop={8}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="15 18 9 12 15 6" />
                  </Svg>
                </Pressable>
              )}
              <Text style={{ fontSize: 17, fontWeight: "900", color: "#1C1917" }}>
                {step === "name" ? "Ajouter un article" : name}
              </Text>
            </View>
            <BottomSheet.Close />
          </View>

          <View style={{ gap: 14 }}>
            {step === "name" ? (
              <>
                <TextInput
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom de l'article"
                  placeholderTextColor="#C4B8AF"
                  returnKeyType="next"
                  onSubmitEditing={goToPrice}
                  style={{
                    fontSize: 16, fontWeight: "600", color: "#1C1917",
                    borderRadius: 14, backgroundColor: "#FAF9F6",
                    paddingHorizontal: 16, paddingVertical: 14,
                  }}
                />
                <MemberSelector />
                <Pressable
                  onPress={goToPrice}
                  style={({ pressed }) => ({
                    borderRadius: 16, paddingVertical: 16, alignItems: "center",
                    backgroundColor: name.trim() ? (pressed ? "#C94415" : "#E8571C") : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: name.trim() ? "#fff" : "#A8A29E" }}>
                    Suivant →
                  </Text>
                </Pressable>
              </>
            ) : step === "price" ? (
              <>
                <MemberSelector />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["total", "kg"] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => { Haptics.selectionAsync(); setPriceMode(mode); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                        backgroundColor: priceMode === mode ? "#1C1917" : "#F0EDE8",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: priceMode === mode ? "#fff" : "#78716C" }}>
                        {mode === "total" ? "Total payé" : "Prix au kg"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{
                  borderRadius: 16, backgroundColor: "#FAF9F6",
                  paddingVertical: 14, paddingHorizontal: 20,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <Text style={{
                    fontSize: priceValue ? 46 : 36, fontWeight: "900",
                    color: priceValue ? "#1C1917" : "#D1CCC5", letterSpacing: -2, minWidth: 60, textAlign: "right",
                  }}>
                    {priceValue || "0"}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: "#A8A29E", marginBottom: 2 }}>
                    {priceMode === "kg" ? "€/kg" : "€"}
                  </Text>
                </View>
                <NumPad value={priceValue} onChange={setPriceValue} keyHeight={60} />
                <Pressable
                  onPress={() => {
                    if (!priceValid) return;
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (priceMode === "kg") {
                      setKgPriceValue(priceValue);
                      setPriceValue("");
                      setStep("weight");
                    } else {
                      onConfirm(name.trim(), parsed, memberIdx, "total");
                      onOpenChange(false);
                    }
                  }}
                  style={({ pressed }) => ({
                    borderRadius: 16, paddingVertical: 16, alignItems: "center",
                    backgroundColor: priceValid ? (pressed ? "#C94415" : "#E8571C") : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: priceValid ? "#fff" : "#A8A29E" }}>
                    {priceMode === "kg" ? "Suivant →" : "+ Ajouter au panier"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, color: "#A8A29E", fontWeight: "600" }}>{kgPriceValue} €/kg</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#A8A29E", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>
                  Poids estimé (g)
                </Text>
                <View style={{
                  borderRadius: 16, backgroundColor: "#FAF9F6",
                  paddingVertical: 14, paddingHorizontal: 20,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <Text style={{
                    fontSize: priceValue ? 46 : 36, fontWeight: "900",
                    color: priceValue ? "#1C1917" : "#D1CCC5", letterSpacing: -2, minWidth: 60, textAlign: "right",
                  }}>
                    {priceValue || "0"}
                  </Text>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: "#A8A29E", marginBottom: 2 }}>g</Text>
                </View>
                <NumPad value={priceValue} onChange={setPriceValue} keyHeight={60} />
                <Pressable
                  onPress={() => {
                    if (!priceValid) return;
                    const kgPriceNum = parseFloat(kgPriceValue);
                    const actualPaid = kgPriceNum * (parsed / 1000);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onConfirm(name.trim(), actualPaid, memberIdx, "kg", kgPriceNum);
                    onOpenChange(false);
                  }}
                  style={({ pressed }) => ({
                    borderRadius: 16, paddingVertical: 16, alignItems: "center",
                    backgroundColor: priceValid ? (pressed ? "#C94415" : "#E8571C") : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: priceValid ? "#fff" : "#A8A29E" }}>
                    + Ajouter au panier
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function ScanOverlay({
  targetItem,
  uncheckedItems,
  onMatch,
  onNewProduct,
  onSkipScan,
  onClose,
}: {
  targetItem: ShoppingItem | null;
  uncheckedItems: ShoppingItem[];
  onMatch: (item: ShoppingItem, product: OFFProductResult) => void;
  onNewProduct: (product: OFFProductResult) => void;
  onSkipScan: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannedRef = useRef(false);

  async function handleBarcode(barcode: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setLoading(true);
    const product = await getOffProductByBarcode(barcode);
    if (!product) {
      setLoading(false);
      setError("Produit introuvable");
      scannedRef.current = false;
      return;
    }
    const supabaseId = await findOrCreateProduct(product);
    setLoading(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (targetItem) {
      onMatch(targetItem, product);
    } else {
      const matched = supabaseId ? uncheckedItems.find((i) => i.productId === supabaseId) : null;
      if (matched) {
        onMatch(matched, product);
      } else {
        onNewProduct(product);
      }
    }
  }

  const title = targetItem ? targetItem.customName : "Ajouter un article";

  return (
    <View style={{ position: "absolute", inset: 0, zIndex: 50, backgroundColor: "#000" }}>
      {!permission?.granted ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", textAlign: "center" }}>
            Autorise la caméra pour scanner des produits
          </Text>
          <Pressable onPress={requestPermission} style={{ borderRadius: 14, backgroundColor: "#E8571C", paddingVertical: 14, paddingHorizontal: 28 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Autoriser</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: "500" }}>Annuler</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128"] }}
            onBarcodeScanned={(e) => handleBarcode(e.data)}
          />
          <View style={{ position: "absolute", inset: 0 }}>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </View>
            <View style={{ flexDirection: "row", height: 140 }}>
              <View style={{ width: 48, backgroundColor: "rgba(0,0,0,0.55)" }} />
              <View style={{ flex: 1, borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", borderRadius: 12 }} />
              <View style={{ width: 48, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </View>
            <View style={{ flex: 1, flexDirection: "row" }}>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }} />
            </View>
          </View>
          <View style={{ position: "absolute", top: insets.top + 12, left: 0, right: 0, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#fff" }} numberOfLines={1}>{title}</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
              </Svg>
            </Pressable>
          </View>
          <View style={{ position: "absolute", bottom: insets.bottom + 32, left: 0, right: 0, alignItems: "center", gap: 12 }}>
            {loading && <ActivityIndicator color="#fff" size="large" />}
            {error && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 13, color: "#FCA5A5", fontWeight: "500" }}>{error}</Text>
                <Pressable onPress={() => { setError(null); scannedRef.current = false; }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>Réessayer</Text>
                </Pressable>
              </View>
            )}
            {!loading && !error && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" }}>
                Pointez le code-barres dans le cadre
              </Text>
            )}
            <Pressable
              onPress={onSkipScan}
              style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20 }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                Pas de code-barres
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function EditVirtualPricePanel({ name, currentPrice, onConfirm, onClose }: {
  name: string;
  currentPrice: number;
  onConfirm: (price: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentPrice > 0 ? currentPrice.toFixed(2) : "");
  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;
  return (
    <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 10 }}>
      <Pressable style={{ flex: 1 }} onPress={onClose} />
      <View style={{
        backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 20, paddingBottom: 36, gap: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12, shadowRadius: 24, elevation: 20,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#1C1917" }} numberOfLines={1}>{name}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={{ fontSize: 13, color: "#A8A29E", fontWeight: "500" }}>Annuler</Text>
          </Pressable>
        </View>
        <View style={{
          borderRadius: 16, backgroundColor: "#FAF9F6",
          paddingVertical: 14, paddingHorizontal: 20,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <Text style={{ fontSize: value ? 46 : 36, fontWeight: "900", color: value ? "#1C1917" : "#D1CCC5", letterSpacing: -2, minWidth: 60, textAlign: "right" }}>
            {value || "0"}
          </Text>
          <Text style={{ fontSize: 24, fontWeight: "700", color: "#A8A29E", marginBottom: 2 }}>€</Text>
        </View>
        <NumPad value={value} onChange={setValue} keyHeight={58} />
        <Pressable
          onPress={() => { if (valid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onConfirm(parsed); } }}
          style={({ pressed }) => ({
            borderRadius: 18, paddingVertical: 18, alignItems: "center",
            backgroundColor: valid ? (pressed ? "#C94415" : "#E8571C") : "#F0EDE8",
            transform: [{ scale: pressed && valid ? 0.97 : 1 }],
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "900", color: valid ? "#fff" : "#A8A29E", letterSpacing: -0.3 }}>✓ Confirmer</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CheckoutSummary({
  checkedItems,
  virtualItems,
  session,
  splitSettings,
  memberTotals,
  confirmedTotal,
  onClose,
  onFinish,
  onEditPrice,
}: {
  checkedItems: ShoppingItem[];
  virtualItems: VirtualItem[];
  session: Session;
  splitSettings: SplitSettings;
  memberTotals: number[];
  confirmedTotal: number;
  onClose: () => void;
  onFinish: () => void;
  onEditPrice: (item: ShoppingItem) => void;
}) {
  const hasSplit = splitSettings.enabled && splitSettings.members.length >= 2;

  return (
    <View style={{ position: "absolute", inset: 0, backgroundColor: "#FAF9F6", zIndex: 30 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: pressed ? "#EDEAE4" : "#F0EDE8",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
            </Svg>
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: "900", color: "#1C1917", letterSpacing: -0.3 }}>Récapitulatif</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 12 }} showsVerticalScrollIndicator={false}>
          <View style={{ borderRadius: 20, backgroundColor: "#1C1917", padding: 22, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>Total panier</Text>
            <Text style={{ fontSize: 44, fontWeight: "900", color: "#fff", letterSpacing: -1.5 }}>
              {confirmedTotal.toFixed(2)} €
            </Text>
            <Text style={{ fontSize: 13, color: "#57534E" }}>
              {checkedItems.length + virtualItems.length} article{checkedItems.length + virtualItems.length > 1 ? "s" : ""}
            </Text>
          </View>

          {hasSplit && splitSettings.members.map((m, i) => {
            const total = memberTotals[i] ?? 0;
            const over = total > m.budgetCap;
            const ratio = Math.min(total / m.budgetCap, 1);
            const barColor = budgetBarColor(total, m.budgetCap, m.color);
            const memberChecked = checkedItems.filter((it) => session.assignments.get(it.id) === i);
            const memberVirtual = virtualItems.filter((v) => v.memberIdx === i);
            const allItems = [...memberChecked, ...memberVirtual];

            return (
              <View key={i} style={{ borderRadius: 18, backgroundColor: "#fff", overflow: "hidden", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 }}>
                <View style={{ padding: 18, gap: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>{m.name}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={{ fontSize: 22, fontWeight: "900", color: over ? "#DC2626" : "#1C1917", letterSpacing: -0.5 }}>
                        {total.toFixed(2)} €
                      </Text>
                      {over && (
                        <Text style={{ fontSize: 11, color: "#DC2626", fontWeight: "600" }}>
                          +{(total - m.budgetCap).toFixed(2)} € dépassement
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={{ height: 6, borderRadius: 99, backgroundColor: "#F0EDE8" }}>
                    <View style={{ height: 6, borderRadius: 99, backgroundColor: barColor, width: `${ratio * 100}%` }} />
                  </View>
                  <Text style={{ fontSize: 11, color: "#A8A29E" }}>{total.toFixed(2)} € / {m.budgetCap} €</Text>
                </View>

                {allItems.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: "#F5F3EF" }}>
                    {memberChecked.map((item, idx) => {
                      const price = session.confirmedPrices.get(item.id);
                      return (
                        <View key={item.id} style={{
                          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                          paddingHorizontal: 18, paddingVertical: 12,
                          borderBottomWidth: idx < allItems.length - 1 ? 1 : 0, borderBottomColor: "#F5F3EF",
                        }}>
                          <Text style={{ flex: 1, fontSize: 14, color: "#44403C" }} numberOfLines={1}>{item.customName}</Text>
                          {price !== undefined
                            ? <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917" }}>{price.toFixed(2)} €</Text>
                            : <Pressable onPress={() => onEditPrice(item)} hitSlop={8}>
                                <Text style={{ fontSize: 12, color: "#E8571C", fontWeight: "600" }}>+ Saisir le prix</Text>
                              </Pressable>}
                        </View>
                      );
                    })}
                    {memberVirtual.map((v, idx) => (
                      <View key={v.id} style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 18, paddingVertical: 12,
                        borderBottomWidth: idx < memberVirtual.length - 1 ? 1 : 0, borderBottomColor: "#F5F3EF",
                      }}>
                        <Text style={{ flex: 1, fontSize: 14, color: "#44403C", fontStyle: "italic" }} numberOfLines={1}>{v.customName}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917" }}>{v.price.toFixed(2)} €</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          {!hasSplit && (
            <View style={{ borderRadius: 18, backgroundColor: "#fff", overflow: "hidden" }}>
              {[...checkedItems, ...virtualItems.map((v) => ({ ...v, isVirtual: true }))].map((item, idx, arr) => {
                const isVirtual = "isVirtual" in item;
                const price = isVirtual ? (item as VirtualItem).price : session.confirmedPrices.get(item.id);
                const name = isVirtual ? (item as VirtualItem).customName : (item as ShoppingItem).customName;
                return (
                  <View key={item.id} style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingHorizontal: 18, paddingVertical: 14,
                    borderBottomWidth: idx < arr.length - 1 ? 1 : 0, borderBottomColor: "#F5F3EF",
                  }}>
                    <Text style={{ flex: 1, fontSize: 14, color: "#44403C", fontStyle: isVirtual ? "italic" : "normal" }} numberOfLines={1}>{name}</Text>
                    {price !== undefined
                      ? <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917" }}>{price.toFixed(2)} €</Text>
                      : !isVirtual
                        ? <Pressable onPress={() => onEditPrice(item as ShoppingItem)} hitSlop={8}>
                            <Text style={{ fontSize: 12, color: "#E8571C", fontWeight: "600" }}>+ Saisir le prix</Text>
                          </Pressable>
                        : null}
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onFinish(); }}
            style={({ pressed }) => ({
              borderRadius: 18, paddingVertical: 18, alignItems: "center",
              backgroundColor: pressed ? "#C94415" : "#E8571C",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "900", color: "#fff", letterSpacing: -0.3 }}>
              Terminer les courses
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

interface VirtualItem {
  id: string;
  customName: string;
  memberIdx: number;
  price: number;
}

interface Session {
  confirmedPrices: Map<string, number>;
  assignments: Map<string, number>;
  lockedAssignments: Set<string>;
  virtualItems: VirtualItem[];
}

const EMPTY_SESSION: Session = {
  confirmedPrices: new Map(),
  assignments: new Map(),
  lockedAssignments: new Set(),
  virtualItems: [],
};

export function ModeCourses() {
  const router = useRouter();
  const { list, setList, loading, reload, silentReload } = useShoppingList();
  const insets = useSafeAreaInsets();

  const [stores, setStores] = useState<UserStore[]>([]);
  const [storesLoaded, setStoresLoaded] = useState(false);
  const [selectedStore, setSelectedStore] = useState<UserStore | null>(null);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [splitSettings, setSplitSettings] = useState<SplitSettings>(DEFAULT_SPLIT);
  const splitRef = useRef(splitSettings);
  useEffect(() => { splitRef.current = splitSettings; }, [splitSettings]);

  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [pricePrompt, setPricePrompt] = useState<{ item: ShoppingItem; product: OFFProductResult | null; returnToCheckout?: boolean } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTargetItem, setScanTargetItem] = useState<ShoppingItem | null>(null);
  const [splitEditOpen, setSplitEditOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editVirtualId, setEditVirtualId] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editVirtualId) { setEditVirtualId(null); return true; }
      if (pricePrompt) { closePricePrompt(); return true; }
      if (scanOpen) { closeScan(); return true; }
      if (checkoutOpen) { setCheckoutOpen(false); return true; }
      if (storeSelectorOpen && selectedStore) { setStoreSelectorOpen(false); return true; }
      if (storeSelectorOpen) return true;
      router.navigate("/(tabs)/shopping");
      return true;
    });
    return () => sub.remove();
  }, [editVirtualId, pricePrompt, scanOpen, checkoutOpen, storeSelectorOpen]));

  useEffect(() => {
    getSplitSettings().then(setSplitSettings);
    getUserStores().then((s) => {
      setStores(s);
      if (s.length === 1) setSelectedStore(s[0]);
      setStoresLoaded(true);
    });
  }, []);

  const storeSelectorShownRef = useRef(false);
  const screenFocusedRef = useRef(false);

  useFocusEffect(useCallback(() => {
    screenFocusedRef.current = true;
    if (!storeSelectorShownRef.current && storesLoaded && stores.length > 1 && !selectedStore) {
      storeSelectorShownRef.current = true;
      setStoreSelectorOpen(true);
    }
    return () => { screenFocusedRef.current = false; };
  }, [storesLoaded, stores.length, selectedStore]));

  useEffect(() => {
    if (!storeSelectorShownRef.current && screenFocusedRef.current && storesLoaded && stores.length > 1 && !selectedStore) {
      storeSelectorShownRef.current = true;
      setStoreSelectorOpen(true);
    }
  }, [storesLoaded]);

  function handleToggle(id: string, isChecked: boolean) {
    setList((prev) => prev ? {
      ...prev,
      items: prev.items.map((i) => i.id === id ? { ...i, isChecked } : i),
    } : prev);
    toggleShoppingItem(id, isChecked);
  }

  const unchecked = useMemo(
    () => (list?.items ?? []).filter((i) => !i.isChecked).sort((a, b) => a.sortOrder - b.sortOrder),
    [list],
  );
  const checked = useMemo(() => (list?.items ?? []).filter((i) => i.isChecked), [list]);

  useEffect(() => {
    if (unchecked.length === 0 && checked.length > 0) setCheckoutOpen(true);
  }, [unchecked.length, checked.length]);

  const grouped = useMemo(() => unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? "Autre";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {}), [unchecked]);

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  const checkedIds = useMemo(() => new Set((list?.items ?? []).filter((i) => i.isChecked).map((i) => i.id)), [list]);

  const confirmedTotal = useMemo(() => {
    let total = 0;
    session.confirmedPrices.forEach((p, id) => { if (checkedIds.has(id)) total += p; });
    session.virtualItems.forEach((v) => { total += v.price; });
    return total;
  }, [session, checkedIds]);

  const memberTotals = useMemo(() => {
    const totals = new Array(splitSettings.members.length).fill(0) as number[];
    session.assignments.forEach((mIdx, itemId) => {
      if (!checkedIds.has(itemId)) return;
      const p = session.confirmedPrices.get(itemId);
      if (p !== undefined) totals[mIdx] += p;
    });
    session.virtualItems.forEach((v) => {
      if (v.memberIdx < totals.length) totals[v.memberIdx] += v.price;
    });
    return totals;
  }, [session, splitSettings, checkedIds]);

  const prevMemberTotalsRef = useRef<number[]>([]);
  useEffect(() => {
    if (!splitSettings.enabled) return;
    splitSettings.members.forEach((m, i) => {
      const prev = prevMemberTotalsRef.current[i] ?? 0;
      const curr = memberTotals[i] ?? 0;
      if (prev < m.budgetCap && curr >= m.budgetCap) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });
    prevMemberTotalsRef.current = [...memberTotals];
  }, [memberTotals, splitSettings]);

  const estimatedRemainingTotal = useMemo(() => {
    return unchecked.reduce((sum, item) => {
      const sessionPrice = session.confirmedPrices.get(item.id);
      if (sessionPrice !== undefined) return sum + sessionPrice;
      if (!selectedStore) return sum;
      const sp = item.allStorePrices.find((p) => p.storeId === selectedStore.id);
      return sp ? sum + sp.estimatedCost : sum;
    }, 0);
  }, [unchecked, session.confirmedPrices, selectedStore]);

  function getPrefillPrice(item: ShoppingItem): string {
    const sessionPrice = session.confirmedPrices.get(item.id);
    if (sessionPrice !== undefined) return sessionPrice.toFixed(2);
    if (!selectedStore) return "";
    const sp = item.allStorePrices.find((p) => p.storeId === selectedStore.id);
    if (sp) return sp.estimatedCost.toFixed(2);
    return "";
  }

  function openPricePrompt(item: ShoppingItem, product: OFFProductResult | null = null, returnToCheckout = false) {
    setScanOpen(false);
    setPricePrompt({ item, product, returnToCheckout });
  }

  function closePricePrompt() {
    const shouldReturn = pricePrompt?.returnToCheckout;
    setPricePrompt(null);
    if (shouldReturn) setCheckoutOpen(true);
  }

  async function handleConfirmPrice(actualPaid: number, mode: "total" | "kg" = "total", kgPrice?: number) {
    if (!pricePrompt) return;
    const { item, product, returnToCheckout } = pricePrompt;
    setPricePrompt(null);
    if (returnToCheckout) setCheckoutOpen(true);

    setSession((prev) => {
      const newPrices = new Map(prev.confirmedPrices).set(item.id, actualPaid);
      const newAssignments = new Map(prev.assignments);
      const split = splitRef.current;

      if (!prev.lockedAssignments.has(item.id)) {
        const members = split.members;
        if (split.enabled && members.length >= 2) {
          const totals = new Array(members.length).fill(0) as number[];
          newAssignments.forEach((mIdx, id) => {
            const p = newPrices.get(id);
            if (p !== undefined) totals[mIdx] += p;
          });
          let best = 0;
          let bestRemaining = members[0].budgetCap - totals[0];
          for (let i = 1; i < members.length; i++) {
            const rem = members[i].budgetCap - totals[i];
            if (rem > bestRemaining) { bestRemaining = rem; best = i; }
          }
          newAssignments.set(item.id, best);
        } else {
          newAssignments.set(item.id, 0);
        }
      }

      return { confirmedPrices: newPrices, assignments: newAssignments, lockedAssignments: prev.lockedAssignments, virtualItems: prev.virtualItems };
    });

    handleToggle(item.id, true);

    if (selectedStore) {
      if (product) {
        await reportProductPrice(product, selectedStore.id, actualPaid, item.quantity || 1, item.unit || "pièce");
        const productDbId = await findOrCreateProduct(product);
        if (productDbId && !item.productId) await linkShoppingItemProduct(item.id, productDbId);
      } else if (item.productId) {
        await reportPriceForProduct(item.productId, selectedStore.id, actualPaid, item.quantity || 1, item.unit || "pièce");
      } else if (mode === "kg" && kgPrice !== undefined) {
        await reportIngredientPrice(item.customName, selectedStore.id, kgPrice, 1000, "g");
      } else {
        await reportIngredientPrice(item.customName, selectedStore.id, actualPaid, item.quantity || 1, item.unit || "pièce");
      }
      silentReload();
    }
  }

  function handleCheckWithoutPrice() {
    if (!pricePrompt) return;
    const { item } = pricePrompt;
    setSession((prev) => {
      const newAssignments = new Map(prev.assignments);
      if (!prev.lockedAssignments.has(item.id)) {
        const split = splitRef.current;
        if (split.enabled && split.members.length >= 2) {
          const totals = new Array(split.members.length).fill(0) as number[];
          prev.assignments.forEach((mIdx, id) => {
            const p = prev.confirmedPrices.get(id);
            if (p !== undefined) totals[mIdx] += p;
          });
          let best = 0;
          let bestRem = split.members[0].budgetCap - totals[0];
          for (let i = 1; i < split.members.length; i++) {
            const rem = split.members[i].budgetCap - totals[i];
            if (rem > bestRem) { bestRem = rem; best = i; }
          }
          newAssignments.set(item.id, best);
        } else {
          newAssignments.set(item.id, 0);
        }
      }
      return { ...prev, assignments: newAssignments };
    });
    handleToggle(item.id, true);
    closePricePrompt();
  }

  function openScanForItem(item: ShoppingItem) {
    if (item.productId) {
      openPricePrompt(item, null);
      return;
    }
    forceScanForItem(item);
  }

  function forceScanForItem(item: ShoppingItem) {
    setPricePrompt(null);
    setScanTargetItem(item);
    setScanOpen(true);
  }

  function openScanGeneral() {
    setScanTargetItem(null);
    setScanOpen(true);
  }

  function closeScan() {
    setScanOpen(false);
    setScanTargetItem(null);
  }

  function handleScanMatch(item: ShoppingItem, product: OFFProductResult) {
    closeScan();
    openPricePrompt(item, product);
  }

  async function handleScanNewProduct(product: OFFProductResult) {
    closeScan();
    if (!list?.id) return;
    const { itemId, error } = await addShoppingItem(list.id, product.name);
    if (error || !itemId) return;
    const productDbId = await findOrCreateProduct(product);
    if (productDbId) await linkShoppingItemProduct(itemId, productDbId);
    const newItem: ShoppingItem = {
      id: itemId,
      customName: product.name,
      quantity: 1,
      unit: "pièce",
      isChecked: true,
      sortOrder: 0,
      productId: productDbId ?? null,
      category: null,
      allStorePrices: [],
    };
    setList((prev) => prev ? { ...prev, items: [...prev.items, newItem] } : prev);
    toggleShoppingItem(itemId, true);
    setPricePrompt({ item: newItem, product });
  }

  function handleScanSkip() {
    if (scanTargetItem) {
      const item = scanTargetItem;
      closeScan();
      openPricePrompt(item, null);
    } else {
      closeScan();
      setAddItemOpen(true);
    }
  }

  function handleSaveSplit(settings: SplitSettings) {
    setSplitSettings(settings);
    updateSplitSettings(settings);
  }

  function handleAddVirtualItem(name: string, actualPaid: number, memberIdx: number, mode: "total" | "kg", kgPrice?: number) {
    const id = `virtual_${Date.now()}`;
    setSession((prev) => ({ ...prev, virtualItems: [...prev.virtualItems, { id, customName: name, memberIdx, price: actualPaid }] }));
    if (selectedStore) {
      if (mode === "kg" && kgPrice !== undefined) {
        reportIngredientPrice(name, selectedStore.id, kgPrice, 1000, "g");
      } else {
        reportIngredientPrice(name, selectedStore.id, actualPaid, 1, "pièce");
      }
    }
  }

  function handleRemoveVirtualItem(id: string) {
    setSession((prev) => ({ ...prev, virtualItems: prev.virtualItems.filter((v) => v.id !== id) }));
  }

  const lockedMemberIdx = pricePrompt
    ? (session.lockedAssignments.has(pricePrompt.item.id) ? session.assignments.get(pricePrompt.item.id) : undefined)
    : undefined;

  const hasCartItems = checked.length > 0 || session.virtualItems.length > 0;

  const totalScale = useSharedValue(1);
  const totalAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: totalScale.value }] }));
  useEffect(() => {
    if (confirmedTotal > 0) {
      totalScale.value = withSequence(
        withTiming(1.07, { duration: 90 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  }, [confirmedTotal]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <ActivityIndicator color="#E8571C" />
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#F0EDE8" }}>
        <Pressable
          onPress={() => router.navigate("/(tabs)/shopping")}
          style={({ pressed }) => ({
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: pressed ? "#EDEAE4" : "#F0EDE8",
            alignItems: "center", justifyContent: "center",
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
          </Svg>
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "900", color: "#1C1917", letterSpacing: -0.3 }}>Mode courses</Text>
          {selectedStore ? (
            <Pressable
              onPress={() => { if (stores.length > 1) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStoreSelectorOpen(true); } }}
              hitSlop={8}
              style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
            >
              <Text style={{ fontSize: 12, color: "#A8A29E", fontWeight: "500" }}>{selectedStore.name}</Text>
              {stores.length > 1 && (
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#C4B8AF" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="6 9 12 15 18 9" />
                </Svg>
              )}
            </Pressable>
          ) : storesLoaded && stores.length === 0 ? (
            <Text style={{ fontSize: 12, color: "#F59E0B", fontWeight: "600" }}>Aucun magasin configuré</Text>
          ) : null}
        </View>
      </View>

      <>
          <Pressable
            onPress={() => { if (hasCartItems) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCheckoutOpen(true); } }}
            style={{ margin: 16, borderRadius: 22, backgroundColor: "#fff", padding: 18, gap: 12, shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Animated.View style={totalAnimatedStyle}>
                  <Text style={{ fontSize: 40, fontWeight: "900", color: "#1C1917", letterSpacing: -1.5 }}>
                    {confirmedTotal > 0 ? `${confirmedTotal.toFixed(2)} €` : "0 €"}
                  </Text>
                </Animated.View>
                {hasCartItems && (
                  <Text style={{ fontSize: 12, color: "#A8A29E", fontWeight: "500", marginTop: 1 }}>
                    {checked.length + session.virtualItems.length} article{checked.length + session.virtualItems.length > 1 ? "s" : ""}
                  </Text>
                )}
                {estimatedRemainingTotal > 0 && unchecked.length > 0 && (
                  <Text style={{ fontSize: 12, color: "#C4B8AF", fontWeight: "500", marginTop: 1 }}>
                    ~{(confirmedTotal + estimatedRemainingTotal).toFixed(2)} € estimé final
                  </Text>
                )}
              </View>
              <Pressable
                onPress={() => setSplitEditOpen(true)}
                style={({ pressed }) => ({
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: splitSettings.enabled ? `${splitSettings.members[0]?.color ?? "#E8571C"}15` : (pressed ? "#EDEAE4" : "#F0EDE8"),
                  alignItems: "center", justifyContent: "center",
                  borderWidth: splitSettings.enabled ? 1.5 : 0,
                  borderColor: splitSettings.enabled ? `${splitSettings.members[0]?.color ?? "#E8571C"}40` : "transparent",
                })}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={splitSettings.enabled ? (splitSettings.members[0]?.color ?? "#E8571C") : "#78716C"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                  <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </Svg>
              </Pressable>
            </View>

            {splitSettings.enabled && splitSettings.members.length >= 2 && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {splitSettings.members.map((m, i) => {
                  const total = memberTotals[i] ?? 0;
                  const over = total > m.budgetCap;
                  return (
                    <View key={i} style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      backgroundColor: `${m.color}12`, borderRadius: 10,
                      paddingHorizontal: 10, paddingVertical: 6,
                    }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#44403C" }}>{m.name}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "900", color: over ? "#DC2626" : "#1C1917" }}>
                        {total.toFixed(2)} €
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {(list?.items.length ?? 0) > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1, height: 3, borderRadius: 99, backgroundColor: "#F0EDE8" }}>
                  <View style={{
                    height: 3, borderRadius: 99, backgroundColor: "#E8571C",
                    width: `${((list?.items.length ?? 0) > 0 ? (checked.length / (list?.items.length ?? 1)) * 100 : 0)}%`,
                  }} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>
                  {checked.length}/{list?.items.length ?? 0}
                </Text>
              </View>
            )}
            {hasCartItems && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingTop: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#E8571C" }}>Voir le récap</Text>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </View>
            )}
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, flexGrow: 1 }}>
            {unchecked.length === 0 && !hasCartItems && (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#1C1917" }}>Liste vide</Text>
                <Text style={{ fontSize: 13, color: "#A8A29E", textAlign: "center", lineHeight: 18 }}>
                  Ajoutez des articles à votre liste de courses avant de démarrer.
                </Text>
              </View>
            )}
            {sortedCategories.map((cat, catIdx) => {
              const catItems = grouped[cat];
              const color = CATEGORY_COLORS[cat] ?? "#9ca3af";
              return (
                <View key={cat} style={{ marginTop: catIdx === 0 ? 4 : 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>{cat}</Text>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>{catItems.length}</Text>
                  </View>
                  <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
                    {catItems.map((item, i) => {
                      return (
                        <View key={item.id}>
                          <Pressable
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openScanForItem(item); }}
                            style={({ pressed }) => ({
                              flexDirection: "row", alignItems: "center", gap: 14,
                              paddingHorizontal: 16, paddingVertical: 16,
                              backgroundColor: pressed ? "#FAFAF8" : "transparent", minHeight: 64,
                            })}
                          >
                            <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "#D1D5DB", flexShrink: 0 }} />
                            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                              {item.quantity > 0 && (
                                <View style={{ borderRadius: 6, backgroundColor: "#FEF3ED", paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}>
                                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#E8571C" }}>
                                    {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                  </Text>
                                </View>
                              )}
                              <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#1C1917" }} numberOfLines={1}>
                                {item.customName}
                              </Text>
                            </View>
                            {getPrefillPrice(item) ? (
                              <Text style={{ fontSize: 12, fontWeight: "600", color: "#C4B8AF" }}>~{getPrefillPrice(item)} €</Text>
                            ) : null}
                          </Pressable>
                          {i < catItems.length - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF", marginLeft: 60 }} />}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {hasCartItems && (
              <View style={{ marginTop: 32 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4, paddingBottom: 8 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#E8571C" }} />
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: "#78716C", textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Dans le panier
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>{checked.length + session.virtualItems.length}</Text>
                </View>
                <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
                {checked.map((item, i) => {
                  const price = session.confirmedPrices.get(item.id);
                  const memberIdx = session.assignments.get(item.id) ?? 0;
                  const member = splitSettings.enabled && splitSettings.members.length >= 2 ? splitSettings.members[memberIdx] : null;
                  const totalRows = checked.length + session.virtualItems.length;
                  function uncheckItem() {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleToggle(item.id, false);
                    setSession((prev) => {
                      const p = new Map(prev.confirmedPrices);
                      p.delete(item.id);
                      return { ...prev, confirmedPrices: p };
                    });
                  }
                  return (
                    <View key={item.id}>
                      <ReanimatedSwipeable
                        ref={(r) => { if (r) swipeableRefs.current.set(item.id, r); else swipeableRefs.current.delete(item.id); }}
                        overshootLeft={false}
                        overshootRight={false}
                        onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                        onSwipeableOpen={(direction) => {
                          swipeableRefs.current.get(item.id)?.close();
                          if (direction === "left") uncheckItem();
                          else openPricePrompt(item, null);
                        }}
                        renderRightActions={() => (
                          <View style={{ width: 90, backgroundColor: "#F0EDE8", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#78716C" }}>Décocher</Text>
                          </View>
                        )}
                        renderLeftActions={() => (
                          <View style={{ width: 90, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Modifier</Text>
                          </View>
                        )}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12" />
                            </Svg>
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {item.quantity > 0 && (
                              <View style={{ borderRadius: 6, backgroundColor: "#F5F3EF", paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#A8A29E" }}>
                                  {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                </Text>
                              </View>
                            )}
                            <Text style={{ flex: 1, fontSize: 14, color: "#A8A29E", textDecorationLine: "line-through" }} numberOfLines={1}>
                              {item.customName}
                            </Text>
                          </View>
                          {price !== undefined && (
                            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>{price.toFixed(2)} €</Text>
                          )}
                          {member && (
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSession((prev) => {
                                  const members = splitRef.current.members;
                                  const current = prev.assignments.get(item.id) ?? 0;
                                  const next = (current + 1) % members.length;
                                  return {
                                    ...prev,
                                    assignments: new Map(prev.assignments).set(item.id, next),
                                    lockedAssignments: new Set(prev.lockedAssignments).add(item.id),
                                  };
                                });
                              }}
                              hitSlop={8}
                              style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: `${member.color}20` }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: "700", color: member.color }}>{member.name.slice(0, 3)}</Text>
                            </Pressable>
                          )}
                        </View>
                      </ReanimatedSwipeable>
                      {i < totalRows - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF", marginLeft: 60 }} />}
                    </View>
                  );
                })}
                {session.virtualItems.map((v, i) => {
                  const member = splitSettings.enabled && splitSettings.members.length >= 2 ? splitSettings.members[v.memberIdx] : null;
                  return (
                    <View key={v.id}>
                      <ReanimatedSwipeable
                        ref={(r) => { if (r) swipeableRefs.current.set(v.id, r); else swipeableRefs.current.delete(v.id); }}
                        overshootLeft={false}
                        overshootRight={false}
                        onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                        onSwipeableOpen={(direction) => {
                          swipeableRefs.current.get(v.id)?.close();
                          if (direction === "left") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleRemoveVirtualItem(v.id); }
                          else setEditVirtualId(v.id);
                        }}
                        renderRightActions={() => (
                          <View style={{ width: 90, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#DC2626" }}>Supprimer</Text>
                          </View>
                        )}
                        renderLeftActions={() => (
                          <View style={{ width: 90, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Modifier</Text>
                          </View>
                        )}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff" }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12" />
                            </Svg>
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, color: "#A8A29E", textDecorationLine: "line-through", fontStyle: "italic" }} numberOfLines={1}>
                            {v.customName}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>{v.price.toFixed(2)} €</Text>
                          {member && (
                            <View style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: `${member.color}20` }}>
                              <Text style={{ fontSize: 10, fontWeight: "700", color: member.color }}>{member.name.slice(0, 3)}</Text>
                            </View>
                          )}
                        </View>
                      </ReanimatedSwipeable>
                      {i < session.virtualItems.length - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF", marginLeft: 60 }} />}
                    </View>
                  );
                })}
                </View>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openScanGeneral(); }}
            style={({ pressed }) => ({
              position: "absolute", bottom: insets.bottom + 20, right: 20,
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: pressed ? "#C94415" : "#E8571C",
              alignItems: "center", justifyContent: "center",
              shadowColor: "#E8571C", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
              transform: [{ scale: pressed ? 0.93 : 1 }],
            })}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 7V4h3" /><Path d="M17 4h3v3" /><Path d="M20 17v3h-3" /><Path d="M7 20H4v-3" />
              <Line x1={4} y1={12} x2={20} y2={12} />
            </Svg>
          </Pressable>
        </>

      {editVirtualId && (() => {
        const v = session.virtualItems.find((vi) => vi.id === editVirtualId);
        if (!v) return null;
        return (
          <EditVirtualPricePanel
            name={v.customName}
            currentPrice={v.price}
            onConfirm={(newPrice) => {
              setSession((prev) => ({
                ...prev,
                virtualItems: prev.virtualItems.map((vi) => vi.id === editVirtualId ? { ...vi, price: newPrice } : vi),
              }));
              setEditVirtualId(null);
            }}
            onClose={() => setEditVirtualId(null)}
          />
        );
      })()}

      <PricePrompt
        isOpen={!!pricePrompt}
        onOpenChange={(open) => { if (!open) closePricePrompt(); }}
        item={pricePrompt?.item ?? null}
        prefillPrice={pricePrompt ? getPrefillPrice(pricePrompt.item) : ""}
        hasProduct={!!(pricePrompt?.product || pricePrompt?.item?.productId)}
        confirmedTotal={confirmedTotal}
        memberTotals={memberTotals}
        splitSettings={splitSettings}
        lockedMemberIdx={lockedMemberIdx}
        onConfirm={handleConfirmPrice}
        onSkip={closePricePrompt}
        onCheckWithoutPrice={handleCheckWithoutPrice}
        onRescan={pricePrompt?.item?.productId ? () => forceScanForItem(pricePrompt.item) : undefined}
      />

      {scanOpen && (
        <ScanOverlay
          targetItem={scanTargetItem}
          uncheckedItems={unchecked}
          onMatch={handleScanMatch}
          onNewProduct={handleScanNewProduct}
          onSkipScan={handleScanSkip}
          onClose={closeScan}
        />
      )}

      {checkoutOpen && (
        <CheckoutSummary
          checkedItems={checked}
          virtualItems={session.virtualItems}
          session={session}
          splitSettings={splitSettings}
          memberTotals={memberTotals}
          confirmedTotal={confirmedTotal}
          onClose={() => setCheckoutOpen(false)}
          onFinish={() => { setSession(EMPTY_SESSION); router.navigate("/(tabs)/shopping"); }}
          onEditPrice={(item) => { setCheckoutOpen(false); openPricePrompt(item, null, true); }}
        />
      )}

      <SplitEditSheet
        isOpen={splitEditOpen}
        onOpenChange={(v) => !v && setSplitEditOpen(false)}
        settings={splitSettings}
        onSave={handleSaveSplit}
      />

      <AddItemSheet
        isOpen={addItemOpen}
        onOpenChange={(v) => !v && setAddItemOpen(false)}
        splitSettings={splitSettings}
        onConfirm={handleAddVirtualItem}
      />

    </SafeAreaView>

    <StoreSelectorModal
      isOpen={storeSelectorOpen}
      onClose={() => setStoreSelectorOpen(false)}
      stores={stores}
      onSelect={setSelectedStore}
      canDismiss={!!selectedStore}
    />
    </>
  );
}
