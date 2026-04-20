import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../../../lib/supabase";
import { categorizeItem } from "../../domain/categorizeItem";
import { useAppTheme } from "../../../../shared/theme";
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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Ellipse, Line, Path, Polyline, RadialGradient, Rect, Stop } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import ReanimatedSwipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring, withRepeat } from "react-native-reanimated";
import { BottomModal } from "./bottomModal";
import { SplitEditSheet } from "./splitSettingsSheet";
import { findOrCreateProduct } from "../../application/useCases/findOrCreateProduct";
import { getOffProductByBarcode } from "../../application/useCases/searchOffProducts";
import type { OFFProductResult } from "../../application/useCases/searchOffProducts";
import { getUserStores } from "../../application/useCases/getUserStores";
import type { UserStore } from "../../application/useCases/getUserStores";
import { linkShoppingItemProduct } from "../../application/useCases/linkShoppingItemProduct";
import { addShoppingItem } from "../../application/useCases/addShoppingItem";
import { reportProductPrice } from "../../application/useCases/reportProductPrice";
import { getProductPriceAtStore } from "../../application/useCases/getProductPriceAtStore";
import { findOrCreateGenericProduct } from "../../application/useCases/findOrCreateGenericProduct";
import { createEmptyShoppingList } from "../../application/useCases/createEmptyShoppingList";
import { reportPriceForProduct } from "../../application/useCases/reportPriceForProduct";
import { toggleShoppingItem } from "../../application/useCases/toggleShoppingItem";
import { transferCheckedToPantry } from "../../application/useCases/transferCheckedToPantry";
import { clearCheckedItems } from "../../application/useCases/clearCheckedItems";
import { completeShoppingList } from "../../application/useCases/completeShoppingList";
import { checkAndUnlockBadges } from "../../../user/application/useCases/checkAndUnlockBadges";
import { setPendingBadges } from "../../../user/application/useCases/pendingBadgeStore";
import {
  getSplitSettings,
  updateSplitSettings,
  DEFAULT_SPLIT,
} from "../../application/useCases/getSplitSettings";
import type { SplitSettings, SplitMember } from "../../application/useCases/getSplitSettings";
import { rebalanceAssignments } from "../../application/useCases/rebalanceAssignments";
import type { ShoppingItem, ShoppingList } from "../../domain/entities/shopping";
import { useShoppingList } from "../../api/useShoppingList";
import { ItemDetailSheet } from "./itemDetailSheet";

const NON_FOOD_CATEGORIES = new Set(["Hygiène & Beauté", "Entretien"]);

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

function PulsingDot({ color, size = 5 }: { color: string; size?: number }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1, false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, animStyle]} />;
}

function ShimmerProgressBar({ progress }: { progress: number }) {
  const { width: screenWidth } = useWindowDimensions();
  const shimmerX = useSharedValue(-80);
  useEffect(() => {
    shimmerX.value = withRepeat(withTiming(screenWidth, { duration: 1800 }), -1, false);
  }, [screenWidth]);
  const shimStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));
  return (
    <View style={{ height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <View style={{ width: `${Math.min(progress, 1) * 100}%`, height: 4, borderRadius: 999, backgroundColor: "#E8571C", overflow: "hidden" }}>
        <Animated.View style={[{ position: "absolute", top: 0, width: 80, height: 4 }, shimStyle]}>
               <LinearGradient colors={["transparent", "rgba(255,255,255,0.6)", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
             </Animated.View>
      </View>
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
  const { colors } = useAppTheme();
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
        backgroundColor: colors.bgCard,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        paddingTop: 20, paddingHorizontal: 20,
        paddingBottom: insets.bottom + 24,
        gap: 16,
      }, panelStyle]}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#E0DDD7", alignSelf: "center", marginBottom: 4 }} />
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Quel magasin ?</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Les prix seront enregistrés pour ce magasin.</Text>
        </View>
        <View style={{ borderRadius: 14, backgroundColor: colors.bg, overflow: "hidden" }}>
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
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>{store.name}</Text>
                  {store.city && <Text style={{ fontSize: 12, color: colors.textSubtle, marginTop: 2 }}>{store.city}</Text>}
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



interface PricePromptProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  item: ShoppingItem | null;
  prefillPrice: string;
  prefillContext?: PriceContext;
  hasProduct: boolean;
  onConfirm: (actualPaid: number, mode: "total" | "kg", kgPrice?: number, actualQty?: number, promo?: { normalUnitPrice: number; promoTriggerQty: number }, context?: PriceContext) => void;
  onSkip: () => void;
  onCheckWithoutPrice: () => void;
  onRescan?: () => void;
}

function PricePrompt({ isOpen, onOpenChange, item, prefillPrice, prefillContext, hasProduct, onConfirm, onSkip, onCheckWithoutPrice, onRescan }: PricePromptProps) {
  const { colors } = useAppTheme();
  const [value, setValue] = useState(prefillPrice);
  const [priceMode, setPriceMode] = useState<"total" | "kg">("total");
  const [kgStep, setKgStep] = useState<"price" | "weight">("price");
  const [kgPriceValue, setKgPriceValue] = useState("");
  const [actualQty, setActualQty] = useState(item?.quantity || 1);
  const [isPromo, setIsPromo] = useState(false);
  const [promoMode, setPromoMode] = useState<"discount" | "lot">("discount");
  const [discountValue, setDiscountValue] = useState("");
  const [lotPriceValue, setLotPriceValue] = useState("");
  const priceInputRef = useRef<TextInput>(null);
  useEffect(() => {
    setKgStep("price");
    setKgPriceValue("");
    if (prefillContext) {
      setValue(prefillContext.shelfUnitPrice.toFixed(2));
      setActualQty(prefillContext.confirmedQty);
      setIsPromo(prefillContext.isPromo);
      setPromoMode(prefillContext.promoMode);
      setDiscountValue(prefillContext.discountValue);
      setLotPriceValue(prefillContext.lotPriceValue);
    } else {
      setValue(prefillPrice);
      setActualQty(item?.quantity || 1);
      setIsPromo(false);
      setPromoMode("discount");
      setDiscountValue("");
      setLotPriceValue("");
    }
  }, [prefillPrice, item?.id]);
  useEffect(() => {
    if (!isOpen) return;
    if (kgStep === "price" && prefillPrice) return;
    const t = setTimeout(() => priceInputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [isOpen, kgStep, prefillPrice]);
  function handlePriceChange(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,5}(\.\d{0,2})?$/.test(cleaned)) setValue(cleaned);
  }
  function handleDiscountChange(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,3}(\.\d{0,1})?$/.test(cleaned)) setDiscountValue(cleaned);
  }
  function handleLotPriceChange(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,5}(\.\d{0,2})?$/.test(cleaned)) setLotPriceValue(cleaned);
  }

  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;
  const isWeightStep = priceMode === "kg" && kgStep === "weight";
  const kgPriceNum = parseFloat(kgPriceValue);
  const discountNum = parseFloat(discountValue);
  const lotPrice = parseFloat(lotPriceValue);
  const hasDiscount = !Number.isNaN(discountNum) && discountNum > 0 && discountNum <= 100;
  const hasLotPrice = !Number.isNaN(lotPrice) && lotPrice > 0;
  const computedTotal = (() => {
    if (!valid) return null;
    if (isPromo && promoMode === "lot" && hasLotPrice) return lotPrice;
    if (isPromo && promoMode === "discount" && hasDiscount) return (actualQty - 1) * parsed + parsed * (1 - discountNum / 100);
    return parsed * actualQty;
  })();
  const canConfirm = valid && (!isPromo || promoMode !== "lot" || hasLotPrice);

  function handleConfirm() {
    if (!canConfirm) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (priceMode === "kg" && kgStep === "price") {
      setKgPriceValue(value);
      setValue("");
      setKgStep("weight");
    } else if (isWeightStep) {
      const actualPaid = kgPriceNum * (parsed / 1000);
      onConfirm(actualPaid, "kg", kgPriceNum);
    } else {
      const promo = isPromo ? { normalUnitPrice: parsed, promoTriggerQty: actualQty } : undefined;
      const totalPaid = computedTotal ?? parsed * actualQty;
      const context: PriceContext = { shelfUnitPrice: parsed, confirmedQty: actualQty, isPromo, promoMode, discountValue, lotPriceValue };
      onConfirm(totalPaid, "total", undefined, actualQty, promo, context);
    }
  }

  return (
    <BottomModal isOpen={isOpen} onClose={() => onOpenChange(false)} height="auto">
      {item && (
        <View style={{ gap: 14 }}>

          {/* Header : nom produit + Passer */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isWeightStep ? (
              <Pressable
                onPress={() => { setKgStep("price"); setValue(kgPriceValue); setKgPriceValue(""); }}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="15 18 9 12 15 6" />
                </Svg>
                <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>{kgPriceValue} €/kg</Text>
              </Pressable>
            ) : (
              <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text, flex: 1 }} numberOfLines={1}>
                {item.customName}
              </Text>
            )}
          </View>

          {/* Mode toggle (sans produit scanné) */}
          {!hasProduct && !isWeightStep && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["total", "kg"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => { Haptics.selectionAsync(); setPriceMode(mode); }}
                  style={{
                    flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center",
                    backgroundColor: priceMode === mode ? colors.text : "#F0EDE8",
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: priceMode === mode ? "#fff" : colors.textMuted }}>
                    {mode === "total" ? "Prix unitaire" : "Prix au kg"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Stepper quantité */}
          {!isWeightStep && priceMode === "total" && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setActualQty((q) => Math.max(1, q - 1)); }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#F0EDE8", alignItems: "center", justifyContent: "center" }}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={5} y1={12} x2={19} y2={12} />
                </Svg>
              </Pressable>
              <View style={{ alignItems: "center", minWidth: 52 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text }}>{actualQty}</Text>
                <Text style={{ fontSize: 11, color: colors.textSubtle }}>{item.unit || "pièce"}</Text>
              </View>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setActualQty((q) => q + 1); }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center" }}
              >
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} />
                </Svg>
              </Pressable>
            </View>
          )}

          {/* Saisie prix */}
          <View style={{
            borderRadius: 16, backgroundColor: colors.bg,
            paddingVertical: 14, paddingHorizontal: 20,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
          }}>
            <TextInput
              ref={priceInputRef}
              value={value}
              onChangeText={handlePriceChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              placeholder="0"
              placeholderTextColor="#D1CCC5"
              style={{ fontSize: 46, fontWeight: "900", color: colors.text, letterSpacing: -2, minWidth: 60, textAlign: "right" }}
            />
            <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textSubtle, marginBottom: 2 }}>
              {isWeightStep ? "g" : (!hasProduct && priceMode === "kg" ? "€/kg" : "€")}
            </Text>
          </View>

          {isWeightStep && (
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>
              Poids estimé (g)
            </Text>
          )}

          {/* Total payé — read-only */}
          {!isWeightStep && priceMode === "total" && computedTotal !== null && (actualQty > 1 || (isPromo && (hasDiscount || hasLotPrice))) && (
            <View style={{ alignItems: "center", gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1 }}>Prix sur l'étiquette</Text>
              <Text style={{ fontSize: 26, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>
                {computedTotal.toFixed(2)} €
              </Text>
              {isPromo && promoMode === "discount" && hasDiscount && actualQty > 1 && (
                <Text style={{ fontSize: 12, color: colors.textSubtle, fontWeight: "500" }}>
                  {actualQty === 2
                    ? `${parsed.toFixed(2)} + ${(parsed * (1 - discountNum / 100)).toFixed(2)}`
                    : `${actualQty - 1} × ${parsed.toFixed(2)} + ${(parsed * (1 - discountNum / 100)).toFixed(2)}`}
                </Text>
              )}
              {isPromo && promoMode === "lot" && hasLotPrice && (
                <Text style={{ fontSize: 12, color: colors.textSubtle, fontWeight: "500" }}>
                  {`${lotPrice.toFixed(2)} ÷ ${actualQty} = ${(lotPrice / actualQty).toFixed(2)} €/unité`}
                </Text>
              )}
            </View>
          )}

          {/* Toggle promo */}
          {!isWeightStep && priceMode === "total" && (
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setIsPromo((v) => !v); setDiscountValue(""); setLotPriceValue(""); setPromoMode("discount"); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: isPromo ? "#FFF7F4" : colors.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: isPromo ? "#F5C4B0" : "transparent" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: isPromo ? colors.accent : colors.textMuted }}>🏷 C'est une promo</Text>
                <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: isPromo ? colors.accent : "#D1CCC5", justifyContent: "center", padding: 2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: isPromo ? "flex-end" : "flex-start", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
                </View>
              </Pressable>

              {isPromo && (
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(["discount", "lot"] as const).map((mode) => (
                      <Pressable
                        key={mode}
                        onPress={() => { Haptics.selectionAsync(); setPromoMode(mode); setDiscountValue(""); setLotPriceValue(""); }}
                        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", backgroundColor: promoMode === mode ? colors.text : "#F0EDE8" }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: promoMode === mode ? "#fff" : colors.textMuted }}>
                          {mode === "discount" ? "% de remise" : "Prix du lot"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {promoMode === "discount" && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSubtle, flex: 1 }}>
                        {actualQty > 1 ? `Remise sur le ${actualQty}ème` : "Remise"}
                      </Text>
                      <TextInput
                        value={discountValue}
                        onChangeText={handleDiscountChange}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        placeholder="50"
                        placeholderTextColor="#D1CCC5"
                        style={{ fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "right", minWidth: 40 }}
                      />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSubtle }}>%</Text>
                    </View>
                  )}

                  {promoMode === "lot" && (
                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSubtle, flex: 1 }}>
                        {`Prix pour ${actualQty}`}
                      </Text>
                      <TextInput
                        value={lotPriceValue}
                        onChangeText={handleLotPriceChange}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        placeholder="5.00"
                        placeholderTextColor="#D1CCC5"
                        style={{ fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "right", minWidth: 60 }}
                      />
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSubtle }}>€</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Bouton principal */}
          <Pressable
            onPress={handleConfirm}
            style={({ pressed }) => ({
              borderRadius: 18, paddingVertical: 16, alignItems: "center",
              backgroundColor: canConfirm ? (pressed ? "#C94415" : colors.accent) : "#F0EDE8",
              transform: [{ scale: pressed && canConfirm ? 0.97 : 1 }],
            })}
          >
            <Text style={{ fontSize: 17, fontWeight: "900", color: canConfirm ? "#fff" : colors.textSubtle, letterSpacing: -0.3 }}>
              {isWeightStep ? "✓ Confirmer le poids" : (priceMode === "kg" ? "Suivant →" : "✓ Confirmer")}
            </Text>
          </Pressable>

          {/* Actions secondaires */}
          {!isWeightStep && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 28 }}>
              {onRescan && (
                <Pressable onPress={onRescan} hitSlop={12}>
                  <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>Autre produit</Text>
                </Pressable>
              )}
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onCheckWithoutPrice(); }} hitSlop={12}>
                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "600" }}>✓ Sans prix</Text>
              </Pressable>
            </View>
          )}

        </View>
      )}
    </BottomModal>
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
  onConfirm: (name: string, actualPaid: number, memberIdx: number, mode: "total" | "kg", kgPrice?: number, promo?: { normalUnitPrice: number; promoTriggerQty: number }) => void;
}) {
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const [priceValue, setPriceValue] = useState("");
  const [memberIdx, setMemberIdx] = useState(0);
  const [step, setStep] = useState<"main" | "weight">("main");
  const [priceMode, setPriceMode] = useState<"total" | "kg">("total");
  const [kgPriceValue, setKgPriceValue] = useState("");
  const [isPromo, setIsPromo] = useState(false);
  const [promoMode, setPromoMode] = useState<"discount" | "lot">("discount");
  const [discountValue, setDiscountValue] = useState("");
  const [lotQty, setLotQty] = useState("2");
  const nameInputRef = useRef<TextInput>(null);
  const priceInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isOpen) {
      setName(""); setPriceValue(""); setStep("main"); setMemberIdx(0); setPriceMode("total"); setKgPriceValue(""); setIsPromo(false); setPromoMode("discount"); setDiscountValue(""); setLotQty("2");
    } else {
      const t = setTimeout(() => nameInputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && step === "main") {
      const t = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
    if (isOpen && step === "weight") {
      const t = setTimeout(() => priceInputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handleChangePriceValue(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,5}(\.\d{0,2})?$/.test(cleaned)) setPriceValue(cleaned);
  }

  function handleChangeDiscountValue(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,3}(\.\d{0,1})?$/.test(cleaned)) setDiscountValue(cleaned);
  }

  const parsed = parseFloat(priceValue);
  const priceValid = !Number.isNaN(parsed) && parsed > 0;
  const discountNum = parseFloat(discountValue);
  const hasDiscount = !Number.isNaN(discountNum) && discountNum > 0 && discountNum <= 100;
  const promoTotal = isPromo && hasDiscount ? parsed * (1 - discountNum / 100) : parsed;
  const valid = name.trim().length > 0 && priceValid;

  const MemberSelector = () => splitSettings.enabled && splitSettings.members.length >= 2 ? (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {splitSettings.members.map((m, i) => (
        <Pressable
          key={i}
          onPress={() => setMemberIdx(i)}
          style={{
            flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center",
            backgroundColor: memberIdx === i ? `${m.color}18` : colors.bgSurface,
            borderWidth: 1.5, borderColor: memberIdx === i ? m.color : "transparent",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: m.color }} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: memberIdx === i ? m.color : colors.textMuted }}>{m.name}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  ) : null;

  return (
    <BottomModal isOpen={isOpen} onClose={() => onOpenChange(false)} height="60%">
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {step === "weight" && (
                <Pressable
                  onPress={() => { setStep("main"); setPriceValue(kgPriceValue); setKgPriceValue(""); }}
                  hitSlop={8}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="15 18 9 12 15 6" />
                  </Svg>
                </Pressable>
              )}
              <Text style={{ fontSize: 17, fontWeight: "900", color: colors.text }}>
                {step === "weight" ? name : "Ajouter un article"}
              </Text>
            </View>
          </View>

          <View style={{ gap: 14 }}>
            {step === "main" ? (
              <>
                <TextInput
                  ref={nameInputRef}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom de l'article"
                  placeholderTextColor="#C4B8AF"
                  returnKeyType="next"
                  onSubmitEditing={() => priceInputRef.current?.focus()}
                  style={{
                    fontSize: 16, fontWeight: "600", color: colors.text,
                    borderRadius: 14, backgroundColor: colors.bg,
                    paddingHorizontal: 16, paddingVertical: 14,
                  }}
                />
                <MemberSelector />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["total", "kg"] as const).map((mode) => (
                    <Pressable
                      key={mode}
                      onPress={() => { Haptics.selectionAsync(); setPriceMode(mode); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center",
                        backgroundColor: priceMode === mode ? colors.text : "#F0EDE8",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: priceMode === mode ? "#fff" : colors.textMuted }}>
                        {mode === "total" ? "Prix unitaire" : "Prix au kg"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{
                  borderRadius: 16, backgroundColor: colors.bg,
                  paddingVertical: 14, paddingHorizontal: 20,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <TextInput
                    ref={priceInputRef}
                    value={priceValue}
                    onChangeText={handleChangePriceValue}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor="#D1CCC5"
                    style={{ fontSize: 46, fontWeight: "900", color: colors.text, letterSpacing: -2, minWidth: 60, textAlign: "right" }}
                  />
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textSubtle, marginBottom: 2 }}>
                    {priceMode === "kg" ? "€/kg" : "€"}
                  </Text>
                </View>
                {priceMode === "total" && (
                  <Pressable
                    onPress={() => { Haptics.selectionAsync(); setIsPromo((v) => !v); setDiscountValue(""); }}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: isPromo ? "#FFF7F4" : colors.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: isPromo ? "#F5C4B0" : "transparent" }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: isPromo ? colors.accent : colors.textMuted }}>🏷 C'est une promo</Text>
                    <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: isPromo ? colors.accent : "#D1CCC5", justifyContent: "center", padding: 2 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff", alignSelf: isPromo ? "flex-end" : "flex-start", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
                    </View>
                  </Pressable>
                )}
                {isPromo && priceMode === "total" && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {(["discount", "lot"] as const).map((mode) => (
                      <Pressable
                        key={mode}
                        onPress={() => setPromoMode(mode)}
                        style={{
                          flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center",
                          backgroundColor: promoMode === mode ? colors.text : "#F0EDE8",
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: promoMode === mode ? "#fff" : colors.textMuted }}>
                          {mode === "discount" ? "Réduction %" : "Lot (3 pour 2…)"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                {isPromo && priceMode === "total" && promoMode === "discount" && (
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSubtle, flex: 1 }}>Remise</Text>
                    <TextInput
                      value={discountValue}
                      onChangeText={handleChangeDiscountValue}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                      placeholder="50"
                      placeholderTextColor="#D1CCC5"
                      style={{ fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "right", minWidth: 40 }}
                    />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSubtle }}>%</Text>
                  </View>
                )}
                {isPromo && priceMode === "total" && promoMode === "lot" && (
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.bg, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSubtle, flex: 1 }}>Nb articles dans le lot</Text>
                    <TextInput
                      value={lotQty}
                      onChangeText={setLotQty}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      placeholder="2"
                      placeholderTextColor="#D1CCC5"
                      style={{ fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "right", minWidth: 40 }}
                    />
                  </View>
                )}
                <Pressable
                  onPress={() => {
                    if (!valid) return;
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    if (priceMode === "kg") {
                      setKgPriceValue(priceValue);
                      setPriceValue("");
                      setStep("weight");
                    } else if (name.trim()) {
                      let promo: { normalUnitPrice: number; promoTriggerQty: number } | undefined;
                      if (isPromo) {
                        if (promoMode === "discount" && hasDiscount) {
                          promo = { normalUnitPrice: parsed, promoTriggerQty: 1 };
                        } else if (promoMode === "lot") {
                          const qty = parseInt(lotQty, 10);
                          if (qty > 1) promo = { normalUnitPrice: parsed / qty, promoTriggerQty: qty };
                        }
                      }
                      const actualPaidFinal = promoMode === "discount" ? promoTotal : parsed;
                      onConfirm(name.trim(), actualPaidFinal, memberIdx, "total", undefined, promo);
                      onOpenChange(false);
                    }
                  }}
                  style={({ pressed }) => ({
                    borderRadius: 16, paddingVertical: 16, alignItems: "center",
                    backgroundColor: valid ? (pressed ? "#C94415" : colors.accent) : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: valid ? "#fff" : colors.textSubtle }}>
                    {priceMode === "kg" ? "Suivant →" : "+ Ajouter au panier"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.textSubtle, fontWeight: "600" }}>{kgPriceValue} €/kg</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>
                  Poids estimé (g)
                </Text>
                <View style={{
                  borderRadius: 16, backgroundColor: colors.bg,
                  paddingVertical: 14, paddingHorizontal: 20,
                  flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
                }}>
                  <TextInput
                    ref={priceInputRef}
                    value={priceValue}
                    onChangeText={handleChangePriceValue}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    placeholder="0"
                    placeholderTextColor="#D1CCC5"
                    style={{ fontSize: 46, fontWeight: "900", color: colors.text, letterSpacing: -2, minWidth: 60, textAlign: "right" }}
                  />
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textSubtle, marginBottom: 2 }}>g</Text>
                </View>
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
                    backgroundColor: priceValid ? (pressed ? "#C94415" : colors.accent) : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: "900", color: priceValid ? "#fff" : colors.textSubtle }}>
                    + Ajouter au panier
                  </Text>
                </Pressable>
              </>
            )}
          </View>
    </BottomModal>
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
  const { colors } = useAppTheme();
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
          <Pressable onPress={requestPermission} style={{ borderRadius: 14, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 28 }}>
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

function EditVirtualPricePanel({ name, currentPrice, isOpen, onConfirm, onClose }: {
  name: string;
  currentPrice: number;
  isOpen: boolean;
  onConfirm: (price: number) => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [value, setValue] = useState(currentPrice > 0 ? currentPrice.toFixed(2) : "");
  const inputRef = useRef<TextInput>(null);
  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;
  useEffect(() => {
    if (isOpen) {
      setValue(currentPrice > 0 ? currentPrice.toFixed(2) : "");
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);
  function handleChange(text: string) {
    const cleaned = text.replace(",", ".");
    if (cleaned === "" || /^\d{0,5}(\.\d{0,2})?$/.test(cleaned)) setValue(cleaned);
  }
  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="auto">
      <View style={{ gap: 14 }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }} numberOfLines={1}>{name}</Text>
        <View style={{
          borderRadius: 16, backgroundColor: colors.bg,
          paddingVertical: 14, paddingHorizontal: 20,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={handleChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={() => { if (valid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onConfirm(parsed); } }}
            placeholder="0"
            placeholderTextColor="#D1CCC5"
            style={{ fontSize: 46, fontWeight: "900", color: colors.text, letterSpacing: -2, minWidth: 60, textAlign: "right" }}
          />
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.textSubtle, marginBottom: 2 }}>€</Text>
        </View>
        <Pressable
          onPress={() => { if (valid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onConfirm(parsed); } }}
          style={({ pressed }) => ({
            borderRadius: 18, paddingVertical: 16, alignItems: "center",
            backgroundColor: valid ? (pressed ? "#C94415" : colors.accent) : "#F0EDE8",
            transform: [{ scale: pressed && valid ? 0.97 : 1 }],
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: "900", color: valid ? "#fff" : colors.textSubtle, letterSpacing: -0.3 }}>✓ Confirmer</Text>
        </Pressable>
      </View>
    </BottomModal>
  );
}

function CRBadge() {
  return (
    <View style={{ borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: "#D6EDE1" }}>
      <Text style={{ fontSize: 9, fontWeight: "800", color: "#2E7D5B", letterSpacing: 0.5 }}>CR</Text>
    </View>
  );
}

function HCBadge() {
  return (
    <View style={{ borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: "#F7DDE5" }}>
      <Text style={{ fontSize: 9, fontWeight: "800", color: "#D14B7A", letterSpacing: 0.5 }}>HC</Text>
    </View>
  );
}

function CheckoutSummary({
  checkedItems,
  virtualItems,
  session,
  splitSettings,
  memberTotals,
  memberCarteTotals,
  memberHorsCarteTotals,
  confirmedTotal,
  sessionMinutes,
  selectedStore,
  onClose,
  onFinish,
  onFinishWithPantry,
  onEditPrice,
}: {
  checkedItems: ShoppingItem[];
  virtualItems: VirtualItem[];
  session: Session;
  splitSettings: SplitSettings;
  memberTotals: number[];
  memberCarteTotals: number[];
  memberHorsCarteTotals: number[];
  confirmedTotal: number;
  sessionMinutes: number;
  selectedStore: { name: string; brand?: string | null } | null;
  onClose: () => void;
  onFinish: () => void;
  onFinishWithPantry: () => void;
  onEditPrice: (item: ShoppingItem) => void;
}) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const hasSplit = splitSettings.enabled && splitSettings.members.length >= 2;
  const hasCR = splitSettings.carteRestoEnabled;

  const allItemCount = checkedItems.length + virtualItems.length;

  const totalSavings = Array.from(session.confirmedContexts.entries()).reduce((sum, [id, ctx]) => {
    if (!ctx.isPromo || !session.confirmedPrices.has(id)) return sum;
    const paid = session.confirmedPrices.get(id)!;
    const normal = ctx.shelfUnitPrice * ctx.confirmedQty;
    return sum + Math.max(0, normal - paid);
  }, 0);

  const globalCRTotal = memberCarteTotals.reduce((s, v) => s + v, 0);
  const globalHCTotal = memberHorsCarteTotals.reduce((s, v) => s + v, 0);

  const storeLabel = selectedStore
    ? [selectedStore.brand, selectedStore.name].filter(Boolean).join(" ")
    : null;

  const now = new Date();
  const dateLabel = `${now.getDate()} ${["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"][now.getMonth()]} · ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  type Segment = { label: string; value: number; color: string; opacity: number };
  let segments: Segment[] = [];
  if (hasSplit && hasCR) {
    segments = splitSettings.members.flatMap((m, i) => {
      const cr = memberCarteTotals[i] ?? 0;
      const hc = memberHorsCarteTotals[i] ?? 0;
      return [
        ...(cr > 0 ? [{ label: `${m.name} CR`, value: cr, color: m.color, opacity: 1 }] : []),
        ...(hc > 0 ? [{ label: `${m.name} HC`, value: hc, color: m.color, opacity: 0.35 }] : []),
      ];
    });
  } else if (hasSplit) {
    segments = splitSettings.members.map((m, i) => ({ label: m.name, value: memberTotals[i] ?? 0, color: m.color, opacity: 1 })).filter(s => s.value > 0);
  } else if (hasCR) {
    segments = [
      ...(globalCRTotal > 0 ? [{ label: "CR", value: globalCRTotal, color: "#2E7D5B", opacity: 1 }] : []),
      ...(globalHCTotal > 0 ? [{ label: "HC", value: globalHCTotal, color: "#D14B7A", opacity: 1 }] : []),
    ];
  }

  return (
    <View style={{ position: "absolute", inset: 0, backgroundColor: colors.bg, zIndex: 30 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, gap: 12 }}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 11,
              backgroundColor: pressed ? "#EDEAE4" : "#F0EDE8",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
            </Svg>
          </Pressable>
          <View style={{ flex: 1 }}>
            {storeLabel && (
              <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 1 }}>
                {storeLabel} · {dateLabel}
              </Text>
            )}
            <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>Récapitulatif</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 120, gap: 12 }} showsVerticalScrollIndicator={false}>

          {/* Hero sombre */}
          <View style={{ borderRadius: 22, backgroundColor: "#1A1A1A", padding: 20, overflow: "hidden" }}>
            <View style={{ position: "absolute", right: -50, top: -50, width: 160, height: 160, borderRadius: 999, backgroundColor: "rgba(232,87,28,0.15)" }} />

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10} /><Path d="M12 6v6l4 2" />
                </Svg>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>
                  {sessionMinutes < 1 ? "< 1 min" : `${sessionMinutes} min`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)" }}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><Line x1={3} y1={6} x2={21} y2={6} />
                </Svg>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.7)" }}>
                  {allItemCount} article{allItemCount > 1 ? "s" : ""}
                </Text>
              </View>
              {totalSavings > 0.01 && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(74,222,128,0.2)" }}>
                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><Line x1={7} y1={7} x2={7.01} y2={7} />
                  </Svg>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: "#4ADE80" }}>-{totalSavings.toFixed(2).replace(".", ",")} € économisés</Text>
                </View>
              )}
            </View>

            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 4 }}>Total</Text>
              <Text style={{ fontSize: 52, fontWeight: "900", color: "#fff", letterSpacing: -1.5, lineHeight: 56 }}>
                {confirmedTotal.toFixed(2).replace(".", ",")}
                <Text style={{ fontSize: 28, fontWeight: "700", opacity: 0.65 }}> €</Text>
              </Text>
            </View>

            {segments.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <View style={{ height: 6, borderRadius: 999, overflow: "hidden", flexDirection: "row", gap: 1 }}>
                  {segments.map((s, i) => (
                    <View key={i} style={{ flex: s.value, height: "100%", backgroundColor: s.color, opacity: s.opacity, borderRadius: 2 }} />
                  ))}
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                  {segments.map((s, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: s.color, opacity: s.opacity }} />
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.6)" }}>
                        {s.label} {s.value.toFixed(2).replace(".", ",")} €
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Tuiles CR / HC globales (pas de split, mais CR activé) */}
          {hasCR && !hasSplit && (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, padding: 14, backgroundColor: "#D6EDE1", borderRadius: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <CRBadge />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#2E7D5B", textTransform: "uppercase", letterSpacing: 0.5 }}>Carte</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#2E7D5B", letterSpacing: -0.5 }}>{globalCRTotal.toFixed(2).replace(".", ",")} €</Text>
              </View>
              <View style={{ flex: 1, padding: 14, backgroundColor: "#F7DDE5", borderRadius: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <HCBadge />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#D14B7A", textTransform: "uppercase", letterSpacing: 0.5 }}>Hors carte</Text>
                </View>
                <Text style={{ fontSize: 22, fontWeight: "900", color: "#D14B7A", letterSpacing: -0.5 }}>{globalHCTotal.toFixed(2).replace(".", ",")} €</Text>
              </View>
            </View>
          )}

          {/* PersonCards (split activé) */}
          {hasSplit && splitSettings.members.map((m, i) => {
            const total = memberTotals[i] ?? 0;
            const carteTotal = memberCarteTotals[i] ?? 0;
            const horsCarteTotal = memberHorsCarteTotals[i] ?? 0;
            const isCRMember = m.crMode === "CR";
            const over = hasCR && isCRMember && carteTotal > m.budgetCap;
            const crRatio = Math.min(carteTotal / m.budgetCap, 1);
            const memberChecked = checkedItems.filter((it) => session.assignments.get(it.id) === i);
            const memberVirtual = virtualItems.filter((v) => v.memberIdx === i);
            const allMemberItems = [...memberChecked, ...memberVirtual];

            return (
              <View key={i} style={{
                borderRadius: 18, backgroundColor: colors.bgCard,
                borderWidth: over ? 1.5 : 1, borderColor: over ? "#D14B7A" : "rgba(26,26,26,0.07)",
                overflow: "hidden",
              }}>
                <View style={{ padding: 16, gap: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>{m.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>· {allMemberItems.length} art.</Text>
                      {over && (
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999, backgroundColor: "#F7DDE5" }}>
                          <Text style={{ fontSize: 9, fontWeight: "800", color: "#D14B7A", letterSpacing: 0.4 }}>Plafond CR atteint</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.5 }}>
                      {total.toFixed(2).replace(".", ",")} €
                    </Text>
                  </View>

                  {hasCR && isCRMember && (
                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, color: colors.textMuted }}>Carte Restaurant</Text>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.text }}>
                          {carteTotal.toFixed(2).replace(".", ",")} <Text style={{ color: colors.textMuted, fontWeight: "500" }}>/ {m.budgetCap} €</Text>
                        </Text>
                      </View>
                      <View style={{ height: 7, borderRadius: 999, backgroundColor: "rgba(26,26,26,0.06)" }}>
                        <View style={{ height: 7, borderRadius: 999, width: `${crRatio * 100}%`, backgroundColor: over ? "#D14B7A" : m.color }} />
                      </View>
                    </View>
                  )}

                  {hasCR && (!isCRMember || horsCarteTotal > 0) && (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F0EDE8", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 12 }}>
                      <Text style={{ fontSize: 10, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>Hors carte</Text>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: "#D14B7A" }}>{horsCarteTotal.toFixed(2).replace(".", ",")} €</Text>
                    </View>
                  )}
                </View>

                {allMemberItems.length > 0 && (
                  <View style={{ borderTopWidth: 1, borderTopColor: "rgba(26,26,26,0.06)" }}>
                    {memberChecked.map((item, idx) => {
                      const price = session.confirmedPrices.get(item.id);
                      const ctx = session.confirmedContexts.get(item.id);
                      const isHC = session.horsCarteIds.has(item.id) || m.crMode === "HC";
                      const saving = ctx?.isPromo && price !== undefined
                        ? Math.max(0, ctx.shelfUnitPrice * ctx.confirmedQty - price)
                        : 0;
                      return (
                        <View key={item.id} style={{
                          flexDirection: "row", alignItems: "center", gap: 8,
                          paddingHorizontal: 16, paddingVertical: 11,
                          borderBottomWidth: idx < allMemberItems.length - 1 ? 0.5 : 0, borderBottomColor: "rgba(26,26,26,0.06)",
                        }}>
                          {hasCR && (isHC ? <HCBadge /> : <CRBadge />)}
                          <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#44403C" }} numberOfLines={1}>{item.customName}</Text>
                          {saving > 0.01 && (
                            <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: "#FFF0E8" }}>
                              <Text style={{ fontSize: 9, fontWeight: "800", color: "#E8571C" }}>-{saving.toFixed(2).replace(".", ",")} €</Text>
                            </View>
                          )}
                          {price !== undefined
                            ? <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{price.toFixed(2).replace(".", ",")} €</Text>
                            : <Pressable onPress={() => onEditPrice(item)} hitSlop={8}>
                                <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "600" }}>+ Saisir</Text>
                              </Pressable>}
                        </View>
                      );
                    })}
                    {memberVirtual.map((v, idx) => {
                      const isHC = session.horsCarteIds.has(v.id) || m.crMode === "HC";
                      return (
                        <View key={v.id} style={{
                          flexDirection: "row", alignItems: "center", gap: 8,
                          paddingHorizontal: 16, paddingVertical: 11,
                          borderBottomWidth: idx < memberVirtual.length - 1 ? 0.5 : 0, borderBottomColor: "rgba(26,26,26,0.06)",
                        }}>
                          {hasCR && (isHC ? <HCBadge /> : <CRBadge />)}
                          <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#44403C", fontStyle: "italic" }} numberOfLines={1}>{v.customName}</Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{v.price.toFixed(2).replace(".", ",")} €</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Liste globale (pas de split) */}
          {!hasSplit && (
            <View style={{ borderRadius: 18, backgroundColor: colors.bgCard, overflow: "hidden", borderWidth: 1, borderColor: "rgba(26,26,26,0.07)" }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
                Articles · {allItemCount}
              </Text>
              {[...checkedItems, ...virtualItems.map((v) => ({ ...v, isVirtual: true }))].map((item, idx, arr) => {
                const isVirtual = "isVirtual" in item;
                const price = isVirtual ? (item as VirtualItem).price : session.confirmedPrices.get(item.id);
                const ctx = !isVirtual ? session.confirmedContexts.get(item.id) : undefined;
                const name = isVirtual ? (item as VirtualItem).customName : (item as ShoppingItem).customName;
                const isHC = !isVirtual && session.horsCarteIds.has(item.id);
                const saving = ctx?.isPromo && price !== undefined
                  ? Math.max(0, ctx.shelfUnitPrice * ctx.confirmedQty - price)
                  : 0;
                return (
                  <View key={item.id} style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    paddingHorizontal: 16, paddingVertical: 11,
                    borderTopWidth: idx === 0 ? 0.5 : 0.5, borderTopColor: "rgba(26,26,26,0.06)",
                  }}>
                    {hasCR && (isHC ? <HCBadge /> : <CRBadge />)}
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#44403C", fontStyle: isVirtual ? "italic" : "normal" }} numberOfLines={1}>{name}</Text>
                    {saving > 0.01 && (
                      <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: "#FFF0E8" }}>
                        <Text style={{ fontSize: 9, fontWeight: "800", color: "#E8571C" }}>-{saving.toFixed(2).replace(".", ",")} €</Text>
                      </View>
                    )}
                    {price !== undefined
                      ? <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{price.toFixed(2).replace(".", ",")} €</Text>
                      : !isVirtual
                        ? <Pressable onPress={() => onEditPrice(item as ShoppingItem)} hitSlop={8}>
                            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "600" }}>+ Saisir</Text>
                          </Pressable>
                        : null}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* CTAs fixes avec dégradé */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          <LinearGradient
            colors={["rgba(250,249,247,0)", "rgba(250,249,247,0.97)", "rgba(250,249,247,1)"]}
            style={{ paddingTop: 24, paddingHorizontal: 14, paddingBottom: insets.bottom + 12 }}
          >
            <Pressable
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onFinishWithPantry(); }}
              style={({ pressed }) => ({
                height: 54, borderRadius: 16, backgroundColor: pressed ? "#333" : "#1A1A1A",
                alignItems: "center", justifyContent: "center", marginBottom: 8,
                shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }}>
                + Ajouter au stock + Terminer
              </Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onFinish(); }}
              style={{ paddingVertical: 8, alignItems: "center" }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted }}>
                Terminer sans mettre au stock
              </Text>
            </Pressable>
          </LinearGradient>
        </View>
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

interface PriceContext {
  shelfUnitPrice: number;
  confirmedQty: number;
  isPromo: boolean;
  promoMode: "discount" | "lot";
  discountValue: string;
  lotPriceValue: string;
}

interface Session {
  confirmedPrices: Map<string, number>;
  confirmedContexts: Map<string, PriceContext>;
  assignments: Map<string, number>;
  lockedAssignments: Set<string>;
  virtualItems: VirtualItem[];
  horsCarteIds: Set<string>;
}

const EMPTY_SESSION: Session = {
  confirmedPrices: new Map(),
  confirmedContexts: new Map(),
  assignments: new Map(),
  lockedAssignments: new Set(),
  virtualItems: [],
  horsCarteIds: new Set(),
};

function serializeSession(s: Session): string {
  return JSON.stringify({
    confirmedPrices: Array.from(s.confirmedPrices.entries()),
    confirmedContexts: Array.from(s.confirmedContexts.entries()),
    assignments: Array.from(s.assignments.entries()),
    lockedAssignments: Array.from(s.lockedAssignments),
    virtualItems: s.virtualItems,
    horsCarteIds: Array.from(s.horsCarteIds),
  });
}

function deserializeSession(raw: string): Session {
  const p = JSON.parse(raw);
  return {
    confirmedPrices: new Map(p.confirmedPrices),
    confirmedContexts: new Map(p.confirmedContexts),
    assignments: new Map(p.assignments),
    lockedAssignments: new Set(p.lockedAssignments),
    virtualItems: p.virtualItems ?? [],
    horsCarteIds: new Set(p.horsCarteIds),
  };
}

export function ModeCourses() {
  const { colors } = useAppTheme();
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
  const sessionRestoredRef = useRef(false);
  const [pricePrompt, setPricePrompt] = useState<{ item: ShoppingItem; product: OFFProductResult | null; returnToCheckout?: boolean; prefillOverride?: string } | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTargetItem, setScanTargetItem] = useState<ShoppingItem | null>(null);
  const [splitEditOpen, setSplitEditOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [editVirtualId, setEditVirtualId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"category" | "recipe">("category");
  const [detailItem, setDetailItem] = useState<ShoppingItem | null>(null);
  const swipeableRefs = useRef<Map<string, { close: () => void }>>(new Map());

  const sessionStartRef = useRef(Date.now());
  const [sessionMinutes, setSessionMinutes] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setSessionMinutes(Math.floor((Date.now() - sessionStartRef.current) / 60000)), 60000);
    return () => clearInterval(iv);
  }, []);

  const [pinnedCategory, setPinnedCategory] = useState<string | null>(null);
  const [lastCheckedCategory, setLastCheckedCategory] = useState<string | null>(null);
  const [showFullCart, setShowFullCart] = useState(false);
  const [skippedItemIds, setSkippedItemIds] = useState<Set<string>>(new Set());
  const [scanToast, setScanToast] = useState<{ itemId: string; itemName: string; price: number | null; memberIdx: number | null; isHC: boolean } | null>(null);
  const scanToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTranslateY = useSharedValue(80);
  const toastOpacityVal = useSharedValue(0);
  const toastAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: toastTranslateY.value }],
    opacity: toastOpacityVal.value,
  }));

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (editVirtualId) { setEditVirtualId(null); return true; }
      if (pricePrompt) { closePricePrompt(); return true; }
      if (scanOpen) { closeScan(); return true; }
      if (checkoutOpen) { setCheckoutOpen(false); return true; }
      if (storeSelectorOpen && selectedStore) { setStoreSelectorOpen(false); return true; }
      if (storeSelectorOpen) return true;
      confirmLeave();
      return true;
    });
    return () => sub.remove();
  }, [editVirtualId, pricePrompt, scanOpen, checkoutOpen, storeSelectorOpen]));

  const selectedStoreRef = useRef(selectedStore);
  useEffect(() => { selectedStoreRef.current = selectedStore; }, [selectedStore]);

  const storeSelectorShownRef = useRef(false);

  const loadStores = useCallback(async () => {
    const s = await getUserStores();
    setStores(s);
    if (s.length === 1 && !selectedStoreRef.current) setSelectedStore(s[0]);
    setStoresLoaded(true);
  }, []);

  useEffect(() => {
    getSplitSettings().then(setSplitSettings);
    loadStores();
  }, []);

  useEffect(() => {
    if (!list?.id) return;
    AsyncStorage.getItem(`mode_courses_session_${list.id}`).then((raw) => {
      if (raw) {
        setSession(deserializeSession(raw));
      } else {
        const initialHC = new Set(
          (list.items ?? [])
            .filter((item) => NON_FOOD_CATEGORIES.has(item.category ?? ""))
            .map((item) => item.id),
        );
        if (initialHC.size > 0) {
          setSession((prev) => ({ ...prev, horsCarteIds: initialHC }));
        }
      }
      sessionRestoredRef.current = true;
    });
  }, [list?.id]);

  useEffect(() => {
    if (!list?.id || !sessionRestoredRef.current) return;
    AsyncStorage.setItem(`mode_courses_session_${list.id}`, serializeSession(session));
  }, [session, list?.id]);

  useEffect(() => {
    if (splitSettings.members[1]?.name !== "Nous·elle") return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!membership?.household_id) return;
      const { data } = await supabase
        .from("household_members")
        .select("profiles(display_name)")
        .eq("household_id", membership.household_id)
        .neq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      const profile = data?.profiles;
      const name = (Array.isArray(profile) ? profile[0] : profile)?.display_name;
      if (name) {
        const updated = { ...splitSettings, members: [splitSettings.members[0], { ...splitSettings.members[1], name }] };
        setSplitSettings(updated);
        updateSplitSettings(updated);
      }
    })();
  }, [splitSettings.members[1]?.name]);

  useFocusEffect(useCallback(() => {
    if (storesLoaded && stores.length === 0) loadStores();

    if (!storeSelectorShownRef.current && storesLoaded && stores.length > 1 && !selectedStoreRef.current) {
      storeSelectorShownRef.current = true;
      setStoreSelectorOpen(true);
    }
  }, [storesLoaded, stores.length, loadStores]));

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

  const groupedByRecipe = useMemo(() => unchecked.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const key = item.recipeName ?? "__manual";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {}), [unchecked]);

  const sortedRecipes = useMemo(() => [
    ...Object.keys(groupedByRecipe).filter((k) => k !== "__manual"),
    ...(groupedByRecipe["__manual"] ? ["__manual"] : []),
  ], [groupedByRecipe]);

  const hasRecipeItems = useMemo(() => unchecked.some((i) => i.recipeName), [unchecked]);

  const activeCategory = useMemo(() => {
    if (pinnedCategory && grouped[pinnedCategory]) return pinnedCategory;
    if (lastCheckedCategory && grouped[lastCheckedCategory]) return lastCheckedCategory;
    return sortedCategories[0] ?? null;
  }, [pinnedCategory, lastCheckedCategory, grouped, sortedCategories]);

  const nextItem = useMemo(() => {
    if (!activeCategory) return null;
    const items = grouped[activeCategory] ?? [];
    return items.find((i) => !skippedItemIds.has(i.id)) ?? items[0] ?? null;
  }, [activeCategory, grouped, skippedItemIds]);

  useEffect(() => {
    if (pinnedCategory && !grouped[pinnedCategory]) setPinnedCategory(null);
  }, [pinnedCategory, grouped]);

  const checkedIds = useMemo(() => new Set((list?.items ?? []).filter((i) => i.isChecked).map((i) => i.id)), [list]);

  const confirmedTotal = useMemo(() => {
    let total = 0;
    session.confirmedPrices.forEach((p, id) => { if (checkedIds.has(id)) total += p; });
    session.virtualItems.forEach((v) => { total += v.price; });
    return total;
  }, [session, checkedIds]);

  const { memberTotals, memberCarteTotals, memberHorsCarteTotals } = useMemo(() => {
    const totals = new Array(splitSettings.members.length).fill(0) as number[];
    const carteTotals = new Array(splitSettings.members.length).fill(0) as number[];
    const horsCarteTotals = new Array(splitSettings.members.length).fill(0) as number[];
    session.assignments.forEach((mIdx, itemId) => {
      if (!checkedIds.has(itemId)) return;
      const p = session.confirmedPrices.get(itemId);
      if (p !== undefined) {
        totals[mIdx] += p;
        const isHC = session.horsCarteIds.has(itemId) || (splitSettings.members[mIdx]?.crMode === "HC");
        if (isHC) horsCarteTotals[mIdx] += p;
        else carteTotals[mIdx] += p;
      }
    });
    session.virtualItems.forEach((v) => {
      if (v.memberIdx < totals.length) {
        totals[v.memberIdx] += v.price;
        const isHC = session.horsCarteIds.has(v.id) || (splitSettings.members[v.memberIdx]?.crMode === "HC");
        if (isHC) horsCarteTotals[v.memberIdx] += v.price;
        else carteTotals[v.memberIdx] += v.price;
      }
    });
    return { memberTotals: totals, memberCarteTotals: carteTotals, memberHorsCarteTotals: horsCarteTotals };
  }, [session, splitSettings, checkedIds]);

  const prevMemberTotalsRef = useRef<number[]>([]);
  useEffect(() => {
    if (!splitSettings.enabled) return;
    const capTotals = splitSettings.carteRestoEnabled ? memberCarteTotals : memberTotals;
    splitSettings.members.forEach((m, i) => {
      const prev = prevMemberTotalsRef.current[i] ?? 0;
      const curr = capTotals[i] ?? 0;
      if (prev < m.budgetCap && curr >= m.budgetCap) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });
    prevMemberTotalsRef.current = [...capTotals];
  }, [memberTotals, memberCarteTotals, splitSettings]);

  const estimatedRemainingTotal = useMemo(() => {
    return unchecked.reduce((sum, item) => {
      const sessionPrice = session.confirmedPrices.get(item.id);
      if (sessionPrice !== undefined) return sum + sessionPrice;
      if (!selectedStore) return sum;
      const sp = item.allStorePrices.find((p) => p.storeId === selectedStore.id);
      return (sp && sp.confidence === "exact") ? sum + sp.estimatedCost : sum;
    }, 0);
  }, [unchecked, session.confirmedPrices, selectedStore]);

  function getPrefillPrice(item: ShoppingItem): string {
    if (pricePrompt?.prefillOverride) return pricePrompt.prefillOverride;
    const sessionPrice = session.confirmedPrices.get(item.id);
    if (sessionPrice !== undefined) return sessionPrice.toFixed(2);
    if (!selectedStore) return "";
    const sp = item.allStorePrices.find((p) => p.storeId === selectedStore.id);
    if (sp && sp.confidence === "exact") return sp.estimatedCost.toFixed(2);
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

  async function handleConfirmPrice(actualPaid: number, mode: "total" | "kg" = "total", kgPrice?: number, actualQty?: number, promo?: { normalUnitPrice: number; promoTriggerQty: number }, context?: PriceContext) {
    if (!pricePrompt) return;
    const { item, product, returnToCheckout } = pricePrompt;
    const qty = actualQty ?? item.quantity ?? 1;
    setPricePrompt(null);
    if (returnToCheckout) setCheckoutOpen(true);

    setSession((prev) => {
      const newPrices = new Map(prev.confirmedPrices).set(item.id, actualPaid);
      let newAssignments = new Map(prev.assignments);
      if (!newAssignments.has(item.id)) newAssignments.set(item.id, 0);
      const split = splitRef.current;
      if (split.enabled && split.members.length >= 2) {
        newAssignments = rebalanceAssignments(newPrices, newAssignments, prev.lockedAssignments, split.members, prev.horsCarteIds);
      } else {
        newAssignments.set(item.id, 0);
      }
      const newContexts = context
        ? new Map(prev.confirmedContexts).set(item.id, context)
        : prev.confirmedContexts;
      return { confirmedPrices: newPrices, confirmedContexts: newContexts, assignments: newAssignments, lockedAssignments: prev.lockedAssignments, virtualItems: prev.virtualItems, horsCarteIds: prev.horsCarteIds };
    });

    handleToggle(item.id, true);
    setSkippedItemIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    const cat = item.category ?? null;
    if (cat) setLastCheckedCategory(cat);
    const prevAssignment = session.assignments.get(item.id) ?? 0;
    showScanToast(item.id, item.customName, actualPaid, splitSettings.enabled && splitSettings.members.length >= 2 ? prevAssignment : null, session.horsCarteIds.has(item.id));

    if (selectedStore) {
      const unitPrice = qty > 1 ? actualPaid / qty : actualPaid;
      if (product) {
        await reportProductPrice(product, selectedStore.id, unitPrice, 1, item.unit || "pièce", promo);
        const productDbId = await findOrCreateProduct(product);
        if (productDbId && !item.productId) await linkShoppingItemProduct(item.id, productDbId);
      } else if (item.productId) {
        await reportPriceForProduct(item.productId, selectedStore.id, unitPrice, 1, item.unit || "pièce", promo);
      } else {
        const genericId = await findOrCreateGenericProduct(item.customName);
        if (genericId) {
          const priceVal = mode === "kg" && kgPrice !== undefined ? kgPrice : unitPrice;
          const priceQty = mode === "kg" && kgPrice !== undefined ? 1000 : 1;
          const priceUnit = mode === "kg" && kgPrice !== undefined ? "g" : item.unit || "pièce";
          const pricePromo = mode === "kg" ? undefined : promo;
          await reportPriceForProduct(genericId, selectedStore.id, priceVal, priceQty, priceUnit, pricePromo);
          if (!item.productId) await linkShoppingItemProduct(item.id, genericId);
        }
      }
      silentReload();
    }
  }

  function handleCheckWithoutPrice() {
    if (!pricePrompt) return;
    checkItemWithoutPrice(pricePrompt.item);
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
    let listId = list?.id;
    if (!listId) {
      const created = await createEmptyShoppingList();
      if (!created) return;
      listId = created.id;
      setList({ id: listId, status: "active", items: [], storeSummaries: [], estimatedTotal: 0, itemsWithoutPrice: 0 });
    }
    const { itemId, error } = await addShoppingItem(listId, product.name);
    if (error || !itemId) return;
    const productDbId = await findOrCreateProduct(product);
    if (productDbId) await linkShoppingItemProduct(itemId, productDbId);
    let prefillOverride: string | undefined;
    if (productDbId && selectedStore) {
      const knownPrice = await getProductPriceAtStore(productDbId, selectedStore.id);
      if (knownPrice !== null) prefillOverride = knownPrice.toFixed(2);
    }
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
    setPricePrompt({ item: newItem, product, prefillOverride });
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

  function rebalanceWithVirtuals(prev: Session, members: SplitMember[], horsCarteIds: Set<string>) {
    const combinedPrices = new Map(prev.confirmedPrices);
    const combinedAssignments = new Map(prev.assignments);
    for (const v of prev.virtualItems) {
      combinedPrices.set(v.id, v.price);
      combinedAssignments.set(v.id, v.memberIdx);
    }
    const rebalanced = rebalanceAssignments(combinedPrices, combinedAssignments, prev.lockedAssignments, members, horsCarteIds);
    const newAssignments = new Map(prev.assignments);
    for (const [id] of prev.assignments) newAssignments.set(id, rebalanced.get(id) ?? 0);
    const newVirtualItems = prev.virtualItems.map((v) => ({ ...v, memberIdx: rebalanced.get(v.id) ?? v.memberIdx }));
    return { assignments: newAssignments, virtualItems: newVirtualItems };
  }

  function handleSaveSplit(settings: SplitSettings) {
    setSplitSettings(settings);
    updateSplitSettings(settings);
    if (settings.enabled && settings.members.length >= 2) {
      setSession((prev) => {
        const { assignments, virtualItems } = rebalanceWithVirtuals(prev, settings.members, prev.horsCarteIds);
        return { ...prev, assignments, virtualItems };
      });
    }
  }

  function toggleHorsCarte(itemId: string) {
    Haptics.selectionAsync();
    setSession((prev) => {
      const newSet = new Set(prev.horsCarteIds);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      const split = splitRef.current;
      if (!split.enabled || split.members.length < 2) return { ...prev, horsCarteIds: newSet };
      const { assignments, virtualItems } = rebalanceWithVirtuals(prev, split.members, newSet);
      return { ...prev, horsCarteIds: newSet, assignments, virtualItems };
    });
  }

  function handleAddVirtualItem(name: string, actualPaid: number, memberIdx: number, mode: "total" | "kg", kgPrice?: number, promo?: { normalUnitPrice: number; promoTriggerQty: number }) {
    const id = `virtual_${Date.now()}`;
    const isNonFood = NON_FOOD_CATEGORIES.has(categorizeItem(name));
    setSession((prev) => {
      const split = splitRef.current;
      const newHorsCarteIds = isNonFood ? new Set([...prev.horsCarteIds, id]) : prev.horsCarteIds;
      const newVirtualItems = [...prev.virtualItems, { id, customName: name, memberIdx, price: actualPaid }];
      if (!split.enabled || split.members.length < 2) return { ...prev, virtualItems: newVirtualItems, horsCarteIds: newHorsCarteIds };
      const withNew = { ...prev, virtualItems: newVirtualItems, horsCarteIds: newHorsCarteIds };
      const { assignments, virtualItems } = rebalanceWithVirtuals(withNew, split.members, newHorsCarteIds);
      return { ...prev, assignments, virtualItems, horsCarteIds: newHorsCarteIds };
    });
    if (selectedStore) {
      const storeId = selectedStore.id;
      findOrCreateGenericProduct(name).then((genericId) => {
        if (!genericId) return;
        if (mode === "kg" && kgPrice !== undefined) {
          reportPriceForProduct(genericId, storeId, kgPrice, 1000, "g");
        } else {
          reportPriceForProduct(genericId, storeId, actualPaid, 1, "pièce", promo);
        }
      });
    }
  }

  function handleRemoveVirtualItem(id: string) {
    setSession((prev) => ({ ...prev, virtualItems: prev.virtualItems.filter((v) => v.id !== id) }));
  }

  const hasCartItems = checked.length > 0 || session.virtualItems.length > 0;

  const hasCartItemsRef = useRef(false);
  useEffect(() => { hasCartItemsRef.current = hasCartItems; }, [hasCartItems]);

  function confirmLeave() {
    router.navigate("/(tabs)/shopping");
  }

  function showScanToast(itemId: string, itemName: string, price: number | null, memberIdx: number | null, isHC: boolean) {
    if (scanToastTimerRef.current) clearTimeout(scanToastTimerRef.current);
    setScanToast({ itemId, itemName, price, memberIdx, isHC });
    toastTranslateY.value = 80;
    toastOpacityVal.value = 0;
    toastTranslateY.value = withSpring(0, { damping: 16, stiffness: 200 });
    toastOpacityVal.value = withTiming(1, { duration: 150 });
    scanToastTimerRef.current = setTimeout(dismissScanToast, 3000);
  }

  function dismissScanToast() {
    if (scanToastTimerRef.current) { clearTimeout(scanToastTimerRef.current); scanToastTimerRef.current = null; }
    toastTranslateY.value = withTiming(80, { duration: 200 });
    toastOpacityVal.value = withTiming(0, { duration: 200 });
    setTimeout(() => setScanToast(null), 220);
  }

  function handleUndoLastScan() {
    if (!scanToast) return;
    const { itemId } = scanToast;
    handleToggle(itemId, false);
    setSession((prev) => {
      const p = new Map(prev.confirmedPrices); p.delete(itemId);
      const a = new Map(prev.assignments); a.delete(itemId);
      return { ...prev, confirmedPrices: p, assignments: a };
    });
    setSkippedItemIds((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
    dismissScanToast();
  }

  function checkItemWithoutPrice(item: ShoppingItem) {
    setSession((prev) => {
      let newAssignments = new Map(prev.assignments);
      if (!newAssignments.has(item.id)) newAssignments.set(item.id, 0);
      const split = splitRef.current;
      if (split.enabled && split.members.length >= 2) {
        newAssignments = rebalanceAssignments(prev.confirmedPrices, newAssignments, prev.lockedAssignments, split.members, prev.horsCarteIds);
      } else {
        newAssignments.set(item.id, 0);
      }
      return { ...prev, assignments: newAssignments };
    });
    handleToggle(item.id, true);
    setSkippedItemIds((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    const cat = item.category ?? null;
    if (cat) setLastCheckedCategory(cat);
    const prevAssignment = session.assignments.get(item.id) ?? 0;
    showScanToast(item.id, item.customName, null, splitSettings.enabled && splitSettings.members.length >= 2 ? prevAssignment : null, session.horsCarteIds.has(item.id));
  }

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (storesLoaded && stores.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable
            onPress={() => router.navigate("/(tabs)/shopping")}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: pressed ? "#EDEAE4" : "#F0EDE8",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
            </Svg>
          </Pressable>
          <Text style={{ flex: 1, fontSize: 17, fontWeight: "900", color: colors.text, letterSpacing: -0.3 }}>Mode courses</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 24 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#FEF0EC", alignItems: "center", justifyContent: "center" }}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Line x1={3} y1={6} x2={21} y2={6} />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
          </View>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.3, textAlign: "center" }}>
              Aucun magasin configuré
            </Text>
            <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 }}>
              Pour enregistrer les prix pendant tes courses, ajoute d'abord un magasin dans ton profil.
            </Text>
          </View>
          <Pressable
            onPress={() => router.navigate("/(tabs)/profile")}
            style={({ pressed }) => ({
              borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40,
              backgroundColor: pressed ? "#D14A18" : colors.accent,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>Configurer mes magasins</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: "#FCE7DB", alignSelf: "flex-start" }}>
            <PulsingDot color="#E8571C" size={6} />
            <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: "#E8571C" }}>En rayon · Live</Text>
          </View>
          <Pressable
            onPress={() => { if (stores.length > 1) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStoreSelectorOpen(true); } }}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}
          >
            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.4 }}>
              {selectedStore ? selectedStore.name : storesLoaded && stores.length === 0 ? "Aucun magasin" : "Chargement…"}
            </Text>
            {stores.length > 1 && (
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="6 9 12 15 18 9" />
              </Svg>
            )}
          </Pressable>
          <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, marginTop: 1 }}>
            {`Session démarrée ${sessionMinutes === 0 ? "à l'instant" : `il y a ${sessionMinutes} min`}`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSplitEditOpen(true); }}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: pressed ? "#E8E3DC" : "#F0EDE8",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <Circle cx={12} cy={12} r={3} />
            </Svg>
          </Pressable>
          <Pressable
            onPress={confirmLeave}
            style={({ pressed }) => ({
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: pressed ? "#E8E3DC" : "#F0EDE8",
              alignItems: "center", justifyContent: "center",
            })}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 6l12 12M18 6L6 18" />
            </Svg>
          </Pressable>
        </View>
      </View>

      <>
          <Pressable
            onPress={() => { if (hasCartItems) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCheckoutOpen(true); } }}
            style={{ marginHorizontal: 14, marginTop: 4, marginBottom: 8, borderRadius: 22, backgroundColor: "#1A1A1A", padding: 18, overflow: "hidden" }}
          >
            {/* Orange ambient glow */}
            <Svg width={220} height={220} style={{ position: "absolute", right: -70, top: -70 }} pointerEvents="none">
              <Defs>
                <RadialGradient id="orangeGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#E8571C" stopOpacity={0.22} />
                  <Stop offset="100%" stopColor="#E8571C" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={110} cy={110} rx={110} ry={110} fill="url(#orangeGlow)" />
            </Svg>

            {/* Total + Progression row */}
            <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>Total panier</Text>
                <Animated.View style={[totalAnimatedStyle, { flexDirection: "row", alignItems: "flex-end" }]}>
                  <Text style={{ fontSize: 42, fontWeight: "900", color: "#fff", letterSpacing: -1.2, lineHeight: 44 }}>{Math.floor(confirmedTotal)}</Text>
                  <Text style={{ fontSize: 42, fontWeight: "900", color: "rgba(255,255,255,0.5)", letterSpacing: -1.2, lineHeight: 44 }}>,{(confirmedTotal % 1).toFixed(2).slice(2)}</Text>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "rgba(255,255,255,0.7)", marginLeft: 4, marginBottom: 5 }}>€</Text>
                </Animated.View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>Progression</Text>
                <Pressable onPress={() => setSplitEditOpen(true)} hitSlop={12} style={{ flexDirection: "row", alignItems: "baseline", gap: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.4 }}>{checked.length}</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.4)" }}>/{list?.items.length ?? 0}</Text>
                </Pressable>
              </View>
            </View>

            {/* Progress bar with shimmer */}
            {(list?.items.length ?? 0) > 0 && (
              <View style={{ marginTop: 14 }}>
                <ShimmerProgressBar progress={(list?.items.length ?? 0) > 0 ? checked.length / (list?.items.length ?? 1) : 0} />
              </View>
            )}

            {/* Per-person CR/HC mini cards */}
            {splitSettings.enabled && splitSettings.members.length >= 2 && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                {splitSettings.members.map((m, i) => {
                  const carteTotal = memberCarteTotals[i] ?? 0;
                  const horsCarteTotal = memberHorsCarteTotals[i] ?? 0;
                  const total = memberTotals[i] ?? 0;
                  const crPct = Math.min(m.crMode === "CR" && m.budgetCap > 0 ? carteTotal / m.budgetCap : 0, 1);
                  const hcPct = m.crMode === "HC"
                    ? Math.min(total > 0 ? horsCarteTotal / total : 1, 1)
                    : Math.min(m.budgetCap > 0 ? horsCarteTotal / m.budgetCap : 0, 1);
                  return (
                    <View key={i} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 11 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: m.color }} />
                        <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.65)" }}>{m.name}</Text>
                      </View>
                      <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", letterSpacing: -0.4, marginBottom: splitSettings.carteRestoEnabled ? 8 : 0 }}>
                        {total.toFixed(2).replace(".", ",")} €
                      </Text>
                      {splitSettings.carteRestoEnabled && m.crMode === "CR" && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          <View style={{ width: 16, height: 14, borderRadius: 3, backgroundColor: "#4ADE80", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Text style={{ fontSize: 8, fontWeight: "900", color: "#0D3F1E", letterSpacing: 0.4 }}>CR</Text>
                          </View>
                          <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <View style={{ width: `${crPct * 100}%`, height: 4, borderRadius: 999, backgroundColor: "#4ADE80" }} />
                          </View>
                          <Text style={{ fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.65)", flexShrink: 0 }}>{Math.round(carteTotal)}/{m.budgetCap}</Text>
                        </View>
                      )}
                      {splitSettings.carteRestoEnabled && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <View style={{ width: 16, height: 14, borderRadius: 3, backgroundColor: "#F9A8D4", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Text style={{ fontSize: 8, fontWeight: "900", color: "#5A1636", letterSpacing: 0.4 }}>HC</Text>
                          </View>
                          <View style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <View style={{ width: `${hcPct * 100}%`, height: 4, borderRadius: 999, backgroundColor: "#F9A8D4" }} />
                          </View>
                          <Text style={{ fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.65)", flexShrink: 0 }}>{Math.round(horsCarteTotal)}€</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {hasCartItems && (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#E8571C" }}>Voir le récap</Text>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <Polyline points="9 18 15 12 9 6" />
                </Svg>
              </View>
            )}
          </Pressable>

          {nextItem && (
            <View style={{ marginHorizontal: 14, marginBottom: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8, paddingLeft: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#E8571C" }} />
                <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: "#E8571C" }}>Prochain article</Text>
              </View>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openScanForItem(nextItem); }}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#F5F1ED" : "#fff",
                  borderRadius: 20, padding: 14,
                  flexDirection: "row", alignItems: "center", gap: 14,
                  shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
                  borderWidth: 1, borderColor: "rgba(26,26,26,0.04)",
                })}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4, alignSelf: "flex-start", backgroundColor: "#F0EDE8", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" /><Circle cx={12} cy={9} r={2.5} />
                    </Svg>
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.1 }}>
                      {activeCategory ?? "Autre"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.3, lineHeight: 20 }} numberOfLines={1}>
                    {nextItem.customName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {nextItem.quantity > 0 && (
                      <Text style={{ fontSize: 11, fontWeight: "600", color: "#9B8E86" }}>
                        {nextItem.quantity}{nextItem.unit ? ` ${nextItem.unit}` : ""}
                      </Text>
                    )}
                    {nextItem.quantity > 0 && getPrefillPrice(nextItem) ? <Text style={{ fontSize: 10, color: "#9B8E86" }}>·</Text> : null}
                    {getPrefillPrice(nextItem) ? (
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#3A3330" }}>~{getPrefillPrice(nextItem)} €</Text>
                    ) : null}
                  </View>
                </View>
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9B8E86" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M9 6l6 6-6 6" />
                </Svg>
              </Pressable>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); checkItemWithoutPrice(nextItem); }}
                  style={({ pressed }) => ({
                    flex: 1, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
                    backgroundColor: pressed ? "#E8E3DC" : "#F0EDE8",
                  })}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M6 6l12 12M18 6L6 18" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#1A1A1A", letterSpacing: -0.1 }}>Introuvable</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!nextItem) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSkippedItemIds((prev) => new Set([...prev, nextItem.id]));
                  }}
                  style={({ pressed }) => ({
                    flex: 1, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6,
                    backgroundColor: pressed ? "#E8E3DC" : "#F0EDE8",
                  })}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M9 6l6 6-6 6" />
                  </Svg>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#1A1A1A", letterSpacing: -0.1 }}>Passer</Text>
                </Pressable>
              </View>
            </View>
          )}

          {hasRecipeItems && (
            <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingBottom: 10 }}>
              {(["category", "recipe"] as const).map((mode) => (
                <Pressable
                  key={mode}
                  onPress={() => setGroupBy(mode)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 99,
                    backgroundColor: groupBy === mode ? colors.text : pressed ? "#F5F0EB" : "#F0EDE8",
                  })}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: groupBy === mode ? colors.bg : "#78716C" }}>
                    {mode === "category" ? "Catégories" : "Recettes"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, flexGrow: 1 }}>
            {unchecked.length === 0 && !hasCartItems && (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>Liste vide</Text>
                <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center", lineHeight: 18 }}>
                  Ajoutez des articles à votre liste de courses avant de démarrer.
                </Text>
              </View>
            )}
            {(groupBy === "category" ? sortedCategories : sortedRecipes).map((key, groupIdx) => {
              const groupItems = groupBy === "category" ? grouped[key] : groupedByRecipe[key];
              const color = groupBy === "category"
                ? (CATEGORY_COLORS[key] ?? "#9ca3af")
                : (key === "__manual" ? "#9ca3af" : colors.accent);
              const label = groupBy === "category" ? key : (key === "__manual" ? "Hors recette" : key);
              const isActive = groupBy === "category" && key === activeCategory;
              return (
                <View key={key} style={{ marginTop: groupIdx === 0 ? 4 : 16, opacity: isActive ? 1 : 0.88 }}>
                  <Pressable
                    onPress={() => {
                      if (groupBy !== "category") return;
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (isActive && pinnedCategory === key) setPinnedCategory(null);
                      else setPinnedCategory(key);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8, paddingLeft: 4 }}
                  >
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 7,
                      paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999,
                      backgroundColor: isActive ? colors.text : "#F0EDE8",
                    }}>
                      <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={isActive ? "#fff" : colors.text} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" /><Circle cx={12} cy={9} r={2.5} />
                      </Svg>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: isActive ? "#fff" : colors.text, letterSpacing: -0.1 }}>{label}</Text>
                      {groupBy === "recipe" && label !== key && (
                        <Text style={{ fontSize: 10, fontWeight: "600", color: isActive ? "rgba(255,255,255,0.65)" : colors.textMuted }}>· {label}</Text>
                      )}
                    </View>
                    {isActive && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <PulsingDot color="#E8571C" size={5} />
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#E8571C", letterSpacing: 0.8, textTransform: "uppercase" }}>Tu es ici</Text>
                      </View>
                    )}
                    <Text style={{ marginLeft: "auto", fontSize: 10, fontWeight: "600", color: colors.textMuted }}>{groupItems.length} art.</Text>
                  </Pressable>
                  <View style={{
                    borderRadius: 16, backgroundColor: "#fff", overflow: "hidden",
                    borderWidth: isActive ? 1.5 : 1,
                    borderColor: isActive ? colors.text : "rgba(26,26,26,0.08)",
                  }}>
                    {groupItems.map((item, i) => {
                      return (
                        <View key={item.id}>
                          <Pressable
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openScanForItem(item); }}
                            style={({ pressed }) => ({
                              flexDirection: "row", alignItems: "center", gap: 12,
                              paddingHorizontal: 14, paddingVertical: 11,
                              backgroundColor: pressed ? "#F8F5F0" : "transparent",
                            })}
                          >
                            <View style={{ width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: "rgba(26,26,26,0.22)", flexShrink: 0 }} />
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, letterSpacing: -0.1 }} numberOfLines={1}>
                                {item.customName}
                              </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                {item.quantity > 0 && (
                                  <Text style={{ fontSize: 10.5, fontWeight: "600", color: "#9B8E86" }}>
                                    {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                  </Text>
                                )}
                                {item.quantity > 0 && getPrefillPrice(item) ? <Text style={{ fontSize: 10, color: "#9B8E86" }}>·</Text> : null}
                                {getPrefillPrice(item) ? (
                                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#3A3330" }}>~{getPrefillPrice(item)} €</Text>
                                ) : null}
                              </View>
                            </View>
                            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9B8E86" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                              <Path d="M9 6l6 6-6 6" />
                            </Svg>
                          </Pressable>
                          {i < groupItems.length - 1 && <View style={{ height: 0.5, backgroundColor: "rgba(26,26,26,0.08)", marginLeft: 48 }} />}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}

            {hasCartItems && (
              <View style={{ marginTop: 32 }}>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, paddingHorizontal: 6, paddingBottom: 8 }}>
                  <Text style={{ flex: 1, fontSize: 11, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.2 }}>Dans le panier</Text>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textMuted, opacity: 0.6 }}>{checked.length + session.virtualItems.length}</Text>
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFullCart((v) => !v); }} hitSlop={8}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#E8571C" }}>
                      {showFullCart ? "Réduire" : "Voir tout"}
                    </Text>
                  </Pressable>
                </View>
                {!showFullCart && (
                  <View style={{ borderRadius: 16, backgroundColor: "#fff", overflow: "hidden" }}>
                    {checked.slice(-3).map((item, i, sliced) => {
                      const price = session.confirmedPrices.get(item.id);
                      const memberIdx = session.assignments.get(item.id) ?? 0;
                      const member = splitSettings.enabled && splitSettings.members.length >= 2 ? splitSettings.members[memberIdx] : null;
                      const isHC = session.horsCarteIds.has(item.id);
                      return (
                        <View key={item.id}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11 }}>
                            <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: colors.text, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M5 12.5l4.5 4.5L19 7.5" />
                              </Svg>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text, letterSpacing: -0.1 }} numberOfLines={1}>{item.customName}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                {splitSettings.carteRestoEnabled && (
                                  <View style={{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: isHC ? "rgba(249,168,212,0.28)" : "rgba(74,222,128,0.22)" }}>
                                    <Text style={{ fontSize: 9, fontWeight: "800", color: isHC ? "#F9A8D4" : "#4ADE80", letterSpacing: 0.4 }}>{isHC ? "HC" : "CR"}</Text>
                                  </View>
                                )}
                                {member && (
                                  <View style={{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: `${member.color}25` }}>
                                    <Text style={{ fontSize: 9, fontWeight: "700", color: member.color }}>{member.name.slice(0, 3)}</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            {price !== undefined && <Text style={{ fontSize: 14, fontWeight: "800", color: colors.text }}>{price.toFixed(2).replace(".", ",")} €</Text>}
                          </View>
                          {i < sliced.length - 1 && <View style={{ height: 0.5, backgroundColor: "rgba(26,26,26,0.08)", marginLeft: 48 }} />}
                        </View>
                      );
                    })}
                    {(checked.length > 3 || session.virtualItems.length > 0) && (
                      <Pressable
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFullCart(true); }}
                        style={{ paddingVertical: 12, alignItems: "center", borderTopWidth: 1, borderTopColor: colors.bgSurface }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.accent }}>
                          {checked.length > 3 ? `+ ${checked.length - 3 + session.virtualItems.length} autres` : `+ ${session.virtualItems.length} ajout${session.virtualItems.length > 1 ? "s" : ""} manuel${session.virtualItems.length > 1 ? "s" : ""}`}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
                {showFullCart && (
                <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
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
                        ref={((r: SwipeableMethods | null) => { if (r) swipeableRefs.current.set(item.id, r); else swipeableRefs.current.delete(item.id); }) as unknown as React.RefObject<SwipeableMethods | null>}
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
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>Décocher</Text>
                          </View>
                        )}
                        renderLeftActions={() => (
                          <View style={{ width: 90, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Modifier</Text>
                          </View>
                        )}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bgCard }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12" />
                            </Svg>
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {item.quantity > 0 && (
                              <View style={{ borderRadius: 6, backgroundColor: colors.bgSurface, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textSubtle }}>
                                  {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                                </Text>
                              </View>
                            )}
                            <Text style={{ flex: 1, fontSize: 14, color: colors.textSubtle, textDecorationLine: "line-through" }} numberOfLines={1}>
                              {item.customName}
                            </Text>
                          </View>
                          {price !== undefined && (
                            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{price.toFixed(2)} €</Text>
                          )}
                          {item.productId && (
                            <Pressable
                              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDetailItem(item); }}
                              hitSlop={8}
                              style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
                            >
                              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <Circle cx={12} cy={12} r={10} />
                                <Line x1={12} y1={16} x2={12} y2={12} />
                                <Line x1={12} y1={8} x2={12} y2={8} />
                              </Svg>
                            </Pressable>
                          )}
                          {splitSettings.carteRestoEnabled && splitSettings.enabled && (() => {
                            const isHC = session.horsCarteIds.has(item.id);
                            return (
                              <Pressable
                                onPress={() => toggleHorsCarte(item.id)}
                                hitSlop={8}
                                style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: isHC ? colors.dangerBg : "#F0FDF4" }}
                              >
                                <Text style={{ fontSize: 9, fontWeight: "800", color: isHC ? colors.danger : "#16A34A", letterSpacing: 0.5 }}>
                                  {isHC ? "HC" : "CR"}
                                </Text>
                              </Pressable>
                            );
                          })()}
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
                      {i < totalRows - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface, marginLeft: 60 }} />}
                    </View>
                  );
                })}
                {session.virtualItems.map((v, i) => {
                  const member = splitSettings.enabled && splitSettings.members.length >= 2 ? splitSettings.members[v.memberIdx] : null;
                  return (
                    <View key={v.id}>
                      <ReanimatedSwipeable
                        ref={((r: SwipeableMethods | null) => { if (r) swipeableRefs.current.set(v.id, r); else swipeableRefs.current.delete(v.id); }) as unknown as React.RefObject<SwipeableMethods | null>}
                        overshootLeft={false}
                        overshootRight={false}
                        onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                        onSwipeableOpen={(direction) => {
                          swipeableRefs.current.get(v.id)?.close();
                          if (direction === "left") { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleRemoveVirtualItem(v.id); }
                          else setEditVirtualId(v.id);
                        }}
                        renderRightActions={() => (
                          <View style={{ width: 90, backgroundColor: colors.dangerBg, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.danger }}>Supprimer</Text>
                          </View>
                        )}
                        renderLeftActions={() => (
                          <View style={{ width: 90, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#fff" }}>Modifier</Text>
                          </View>
                        )}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bgCard }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <Polyline points="20 6 9 17 4 12" />
                            </Svg>
                          </View>
                          <Text style={{ flex: 1, fontSize: 14, color: colors.textSubtle, textDecorationLine: "line-through", fontStyle: "italic" }} numberOfLines={1}>
                            {v.customName}
                          </Text>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{v.price.toFixed(2)} €</Text>
                          {splitSettings.carteRestoEnabled && splitSettings.enabled && (() => {
                            const isHC = session.horsCarteIds.has(v.id);
                            return (
                              <Pressable
                                onPress={() => toggleHorsCarte(v.id)}
                                hitSlop={8}
                                style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: isHC ? colors.dangerBg : "#F0FDF4" }}
                              >
                                <Text style={{ fontSize: 9, fontWeight: "800", color: isHC ? colors.danger : "#16A34A", letterSpacing: 0.5 }}>
                                  {isHC ? "HC" : "CR"}
                                </Text>
                              </Pressable>
                            );
                          })()}
                          {member && (
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSession((prev) => {
                                  const members = splitRef.current.members;
                                  const next = (v.memberIdx + 1) % members.length;
                                  return { ...prev, virtualItems: prev.virtualItems.map((vi) => vi.id === v.id ? { ...vi, memberIdx: next } : vi) };
                                });
                              }}
                              hitSlop={8}
                              style={{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: `${member.color}20` }}
                            >
                              <Text style={{ fontSize: 10, fontWeight: "700", color: member.color }}>{member.name.slice(0, 3)}</Text>
                            </Pressable>
                          )}
                          <Pressable onPress={() => handleRemoveVirtualItem(v.id)} hitSlop={12} style={{ padding: 4 }}>
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
                            </Svg>
                          </Pressable>
                        </View>
                      </ReanimatedSwipeable>
                      {i < session.virtualItems.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface, marginLeft: 60 }} />}
                    </View>
                  );
                })}
                </View>
                )}
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openScanGeneral(); }}
            style={({ pressed }) => ({
              position: "absolute", bottom: insets.bottom + 20, right: 20,
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: pressed ? "#C94415" : colors.accent,
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

          {scanToast && (
            <Animated.View style={[{
              position: "absolute", bottom: insets.bottom + 80, left: 14, right: 14,
              borderRadius: 14, backgroundColor: "#1A1A1A",
              flexDirection: "row", alignItems: "center", gap: 12,
              paddingHorizontal: 14, paddingVertical: 11,
              shadowColor: "#1A1A1A", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 32, elevation: 8,
            }, toastAnimStyle]}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#4ADE80", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0D3F1E" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7.5" />
                </Svg>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#fff", letterSpacing: -0.1 }} numberOfLines={1}>{scanToast.itemName} ajouté</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 1 }}>
                  {scanToast.price !== null && (
                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#fff" }}>+{scanToast.price.toFixed(2).replace(".", ",")} €</Text>
                  )}
                  {scanToast.price !== null && <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>·</Text>}
                  {splitSettings.enabled && (
                    <View style={{ borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, backgroundColor: scanToast.isHC ? "rgba(249,168,212,0.28)" : "rgba(74,222,128,0.22)" }}>
                      <Text style={{ fontSize: 9, fontWeight: "800", color: scanToast.isHC ? "#F9A8D4" : "#4ADE80", letterSpacing: 0.4 }}>{scanToast.isHC ? "HC" : "CR"}</Text>
                    </View>
                  )}
                  {scanToast.memberIdx !== null && splitSettings.enabled && splitSettings.members[scanToast.memberIdx] && (
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.6)" }}>
                      · {splitSettings.members[scanToast.memberIdx].name}
                    </Text>
                  )}
                </View>
              </View>
              <Pressable
                onPress={handleUndoLastScan}
                hitSlop={8}
                style={{ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.14)" }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: -0.1 }}>Annuler</Text>
              </Pressable>
            </Animated.View>
          )}
        </>

      {(() => {
        const v = editVirtualId ? session.virtualItems.find((vi) => vi.id === editVirtualId) : null;
        return (
          <EditVirtualPricePanel
            isOpen={!!editVirtualId}
            name={v?.customName ?? ""}
            currentPrice={v?.price ?? 0}
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
        prefillContext={pricePrompt ? session.confirmedContexts.get(pricePrompt.item.id) : undefined}
        hasProduct={!!(pricePrompt?.product || pricePrompt?.item?.productId)}
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
          memberCarteTotals={memberCarteTotals}
          memberHorsCarteTotals={memberHorsCarteTotals}
          confirmedTotal={confirmedTotal}
          sessionMinutes={sessionMinutes}
          selectedStore={selectedStore}
          onClose={() => setCheckoutOpen(false)}
          onFinish={async () => {
            if (list?.id) {
              const itemPrices = Array.from(session.confirmedPrices.entries()).map(([itemId, pricePaid]) => ({ itemId, pricePaid }));
              await completeShoppingList(list.id, { storeId: selectedStore?.id, total: confirmedTotal, itemPrices }).catch(() => null);
              await AsyncStorage.removeItem(`mode_courses_session_${list.id}`);
              checkAndUnlockBadges().then((newBadges) => {
                if (newBadges.length > 0) {
                  setPendingBadges(newBadges);
                  router.push("/badge-unlock" as never);
                }
              }).catch(() => null);
            }
            setSession(EMPTY_SESSION);
            router.navigate("/(tabs)/shopping");
          }}
          onFinishWithPantry={async () => {
            try {
              if (list?.id) {
                const pantryPayload = checked.map((i) => ({ name: i.customName, quantity: i.quantity, unit: i.unit, productId: i.productId }));
                const itemPrices = Array.from(session.confirmedPrices.entries()).map(([itemId, pricePaid]) => ({ itemId, pricePaid }));
                await completeShoppingList(list.id, { storeId: selectedStore?.id, total: confirmedTotal, itemPrices }).catch(() => null);
                await AsyncStorage.removeItem(`mode_courses_session_${list.id}`);
                await transferCheckedToPantry(pantryPayload);
                checkAndUnlockBadges().then((newBadges) => {
                  if (newBadges.length > 0) {
                    setPendingBadges(newBadges);
                    router.push("/badge-unlock" as never);
                  }
                }).catch(() => null);
              }
            } catch {}
            setSession(EMPTY_SESSION);
            router.navigate("/(tabs)/shopping");
          }}
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

    <ItemDetailSheet
      item={detailItem}
      isOpen={detailItem !== null}
      onClose={() => setDetailItem(null)}
      onReload={silentReload}
    />

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
