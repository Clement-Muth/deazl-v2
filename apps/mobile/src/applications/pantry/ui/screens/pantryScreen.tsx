import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Button, Card, Separator } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline, Rect } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { addPantryItem } from "../../application/useCases/addPantryItem";
import { deletePantryItem } from "../../application/useCases/deletePantryItem";
import { updatePantryItem } from "../../application/useCases/updatePantryItem";
import { updatePantryItemQuantity } from "../../application/useCases/updatePantryItemQuantity";
import { usePantryItems } from "../../api/usePantryItems";
import { addShoppingItem } from "../../../shopping/application/useCases/addShoppingItem";
import { createEmptyShoppingList } from "../../../shopping/application/useCases/createEmptyShoppingList";
import { getActiveShoppingList } from "../../../shopping/application/useCases/getActiveShoppingList";
import type { PantryItem, StorageLocation } from "../../domain/entities/pantry";
import { LOCATION_LABELS, LOCATION_ORDER } from "../../domain/entities/pantry";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";

function daysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function LocationIcon({ loc, size = 14, color = "#78716C" }: { loc: StorageLocation; size?: number; color?: string }) {
  if (loc === "fridge") return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={2} width={14} height={20} rx={2} />
      <Line x1={5} y1={10} x2={19} y2={10} />
      <Line x1={15} y1={6} x2={15} y2={8} />
    </Svg>
  );
  if (loc === "freezer") return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={12} y1={2} x2={12} y2={22} />
      <Polyline points="17 7 12 12 7 7" />
      <Polyline points="17 17 12 12 7 17" />
      <Line x1={2} y1={12} x2={22} y2={12} />
    </Svg>
  );
  if (loc === "pantry") return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={2} width={18} height={20} rx={2} />
      <Line x1={12} y1={2} x2={12} y2={22} />
    </Svg>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={2} y={7} width={20} height={15} rx={2} />
      <Path d="M16 7V5a2 2 0 0 0-4 0v2" />
      <Path d="M8 7V5a2 2 0 0 1 4 0" />
    </Svg>
  );
}

function DateInput({ value, onChange, colors }: { value: string; onChange: (v: string) => void; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  const [day, setDay] = useState(value ? value.slice(8, 10) : "");
  const [month, setMonth] = useState(value ? value.slice(5, 7) : "");
  const [year, setYear] = useState(value ? value.slice(0, 4) : "");
  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDay(value ? value.slice(8, 10) : "");
      setMonth(value ? value.slice(5, 7) : "");
      setYear(value ? value.slice(0, 4) : "");
    }
  }, [value]);

  function commit(d: string, m: string, y: string) {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      onChange(`${y}-${m}-${d}`);
    } else {
      onChange("");
    }
  }

  const inputStyle = { borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text, textAlign: "center" as const };

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Jour</Text>
        <TextInput
          value={day}
          onChangeText={(t) => { setDay(t); commit(t, month, year); if (t.length === 2) monthRef.current?.focus(); }}
          placeholder="JJ"
          maxLength={2}
          keyboardType="numeric"
          placeholderTextColor="#A8A29E"
          style={inputStyle}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Mois</Text>
        <TextInput
          ref={monthRef}
          value={month}
          onChangeText={(t) => { setMonth(t); commit(day, t, year); if (t.length === 2) yearRef.current?.focus(); }}
          placeholder="MM"
          maxLength={2}
          keyboardType="numeric"
          placeholderTextColor="#A8A29E"
          style={inputStyle}
        />
      </View>
      <View style={{ flex: 2, gap: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Année</Text>
        <TextInput
          ref={yearRef}
          value={year}
          onChangeText={(t) => { setYear(t); commit(day, month, t); }}
          placeholder="AAAA"
          maxLength={4}
          keyboardType="numeric"
          placeholderTextColor="#A8A29E"
          style={inputStyle}
        />
      </View>
    </View>
  );
}

function PantryItemRow({ item, onEdit, onDelete, onQuantityChange }: {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, newQty: number) => void;
}) {
  const { colors } = useAppTheme();
  const days = item.expiryDate ? daysUntilExpiry(item.expiryDate) : null;
  const isExpiringSoon = days !== null && days >= 0 && days <= 3;
  const isExpired = days !== null && days < 0;

  return (
    <Pressable
      onPress={() => onEdit(item)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: pressed ? colors.bgSubtle : "transparent" })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{item.customName}</Text>
        {item.expiryDate && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <View style={{
              borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1,
              backgroundColor: isExpired ? colors.dangerBg : isExpiringSoon ? "#FEF3C7" : colors.bgSurface,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "600", color: isExpired ? colors.danger : isExpiringSoon ? "#D97706" : colors.textMuted }}>
                {isExpired ? "Expiré" : days === 0 ? "Expire auj." : `J-${days}`}
              </Text>
            </View>
          </View>
        )}
      </View>
      {item.quantity !== null && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Pressable
            onPress={() => onQuantityChange(item.id, Math.max(0, (item.quantity ?? 0) - 1))}
            hitSlop={8}
            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 22 }}>−</Text>
          </Pressable>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text, minWidth: 42, textAlign: "center" }}>
            {item.quantity}{item.unit ? ` ${item.unit}` : ""}
          </Text>
          <Pressable
            onPress={() => onQuantityChange(item.id, (item.quantity ?? 0) + 1)}
            hitSlop={8}
            style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontSize: 16, color: colors.textMuted, lineHeight: 22 }}>+</Text>
          </Pressable>
        </View>
      )}
      <Pressable onPress={() => onDelete(item.id)} hitSlop={12} style={{ padding: 4 }}>
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="3 6 5 6 21 6" />
          <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <Path d="M10 11v6" />
          <Path d="M14 11v6" />
        </Svg>
      </Pressable>
    </Pressable>
  );
}

function LocationSelector({ value, onChange, colors }: { value: StorageLocation; onChange: (loc: StorageLocation) => void; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Emplacement</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {LOCATION_ORDER.map((loc) => (
          <Pressable
            key={loc}
            onPress={() => onChange(loc)}
            style={{ borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: value === loc ? colors.accent : colors.bgSurface }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: value === loc ? "#fff" : colors.textMuted }}>
              {LOCATION_LABELS[loc]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function AddPantryItemSheet({ isOpen, onClose, onAdded }: { isOpen: boolean; onClose: () => void; onAdded: () => void }) {
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setSubmitting(true);
    const result = await addPantryItem({
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity.replace(",", ".")) : null,
      unit: unit.trim() || null,
      location,
      expiryDate: expiryDate || null,
    });
    setSubmitting(false);
    if (result.error) { setError(result.error); return; }
    setName(""); setQuantity(""); setUnit(""); setLocation("pantry"); setExpiryDate(""); setError(null);
    onAdded();
    onClose();
  }

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) return;
    }
    scannedRef.current = false;
    setScanning(true);
  }

  async function handleBarcode(ean: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json?fields=product_name,quantity`, { headers: { "User-Agent": "Deazl/1.0 (contact@deazl.app)" } });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 1 && json.product?.product_name) {
          setName(json.product.product_name);
          const qty = json.product.quantity;
          if (qty) {
            const match = qty.match(/^([\d.,]+)\s*(.*)$/);
            if (match) { setQuantity(match[1]); setUnit(match[2].trim()); }
          }
        }
      }
    } catch {}
    setScanLoading(false);
    setScanning(false);
  }

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="75%">
      <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 8 }}>Ajouter au stock</Text>
      {scanning && (
        <View style={{ height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128"] }}
            onBarcodeScanned={(e) => handleBarcode(e.data)}
          />
          {scanLoading && (
            <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color="#fff" size="large" />
            </View>
          )}
          <Pressable onPress={() => setScanning(false)} style={{ position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 99, width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={18} y1={6} x2={6} y2={18} />
              <Line x1={6} y1={6} x2={18} y2={18} />
            </Svg>
          </Pressable>
        </View>
      )}
      <BottomModalScrollView contentContainerStyle={{ paddingBottom: 40, gap: 12 }}>
        {error && <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>{error}</Text>}
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Produit *</Text>
            <Pressable onPress={openScanner} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, backgroundColor: colors.bgSurface, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 9V5a2 2 0 0 1 2-2h4M3 15v4a2 2 0 0 0 2 2h4M15 3h4a2 2 0 0 1 2 2v4M15 21h4a2 2 0 0 0 2-2v-4" />
                <Rect x={7} y={7} width={10} height={10} rx={1} />
              </Svg>
              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted }}>Scanner</Text>
            </Pressable>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Carottes"
            placeholderTextColor="#A8A29E"
            style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Quantité</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
              keyboardType="numeric"
              placeholderTextColor="#A8A29E"
              style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Unité</Text>
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder="kg, L, pièce..."
              placeholderTextColor="#A8A29E"
              style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
            />
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Date d'expiration</Text>
          <DateInput value={expiryDate} onChange={setExpiryDate} colors={colors} />
        </View>
        <LocationSelector value={location} onChange={setLocation} colors={colors} />
        <Button variant="primary" onPress={handleSubmit} isDisabled={submitting} className="w-full rounded-2xl mt-2">
          <Button.Label>{submitting ? "Ajout…" : "Ajouter"}</Button.Label>
        </Button>
      </BottomModalScrollView>
    </BottomModal>
  );
}

function EditPantryItemSheet({ item, isOpen, onClose, onSaved }: { item: PantryItem | null; isOpen: boolean; onClose: () => void; onSaved: () => void }) {
  const { colors } = useAppTheme();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState<StorageLocation>("pantry");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingToList, setAddingToList] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    setAddedToList(false);
    setName(item.customName);
    setQuantity(item.quantity !== null ? String(item.quantity) : "");
    setUnit(item.unit ?? "");
    setLocation(item.location);
    setExpiryDate(item.expiryDate ?? "");
    setError(null);
  }, [isOpen, item?.id]);

  async function handleAddToList() {
    if (!item) return;
    setAddingToList(true);
    let list = await getActiveShoppingList();
    let listId = list?.id;
    if (!listId) {
      const newList = await createEmptyShoppingList();
      listId = newList?.id;
    }
    if (listId) {
      await addShoppingItem(listId, name.trim() || item.customName, parseFloat(quantity) || 1, unit.trim() || "pièce");
      setAddedToList(true);
      setTimeout(() => setAddedToList(false), 2000);
    }
    setAddingToList(false);
  }

  async function handleSave() {
    if (!item || !name.trim()) { setError("Le nom est requis"); return; }
    setSaving(true);
    await updatePantryItem(item.id, {
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity.replace(",", ".")) : null,
      unit: unit.trim() || null,
      location,
      expiryDate: expiryDate || null,
    });
    setSaving(false);
    onSaved();
    onClose();
  }

  if (!item) return null;

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="80%">
      <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 8 }}>Modifier</Text>
      <BottomModalScrollView contentContainerStyle={{ paddingBottom: 40, gap: 12 }}>
        {error && <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>{error}</Text>}
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Produit *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            placeholderTextColor="#A8A29E"
            style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Quantité</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholderTextColor="#A8A29E"
              style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Unité</Text>
            <TextInput
              value={unit}
              onChangeText={setUnit}
              placeholder="kg, L, pièce..."
              placeholderTextColor="#A8A29E"
              style={{ borderRadius: 12, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.text }}
            />
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted }}>Date d'expiration</Text>
          <DateInput value={expiryDate} onChange={setExpiryDate} colors={colors} />
        </View>
        <LocationSelector value={location} onChange={setLocation} colors={colors} />
        <Pressable
          onPress={handleAddToList}
          disabled={addingToList || addedToList}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            borderRadius: 14, paddingVertical: 14,
            borderWidth: 1.5, borderColor: addedToList ? "#BBF7D0" : "#FDBA74",
            backgroundColor: addedToList ? colors.greenBg : pressed ? colors.accentBg : "transparent",
          })}
        >
          {addingToList ? (
            <ActivityIndicator size="small" color="#E8571C" />
          ) : (
            <>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={addedToList ? "#16A34A" : "#E8571C"} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                {addedToList ? <Polyline points="20 6 9 17 4 12" /> : <><Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><Path d="M12 11v6M9 14h6" /></>}
              </Svg>
              <Text style={{ fontSize: 14, fontWeight: "700", color: addedToList ? colors.green : colors.accent }}>
                {addedToList ? "Ajouté à la liste ✓" : "Ajouter à la liste de courses"}
              </Text>
            </>
          )}
        </Pressable>
        <Button variant="primary" onPress={handleSave} isDisabled={saving} className="w-full rounded-2xl mt-2">
          <Button.Label>{saving ? "Enregistrement…" : "Enregistrer"}</Button.Label>
        </Button>
      </BottomModalScrollView>
    </BottomModal>
  );
}

export function PantryScreen() {
  const { colors } = useAppTheme();
  const { items, loading, reload } = usePantryItems();
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [openLocation, setOpenLocation] = useState<StorageLocation | null>("pantry");
  const [deletingExpired, setDeletingExpired] = useState(false);

  const grouped: Record<StorageLocation, PantryItem[]> = {
    fridge: [], freezer: [], pantry: [], other: [],
  };
  for (const item of items) {
    grouped[item.location].push(item);
  }

  const expiringSoon = items.filter((i) => {
    if (!i.expiryDate) return false;
    const days = daysUntilExpiry(i.expiryDate);
    return days >= 0 && days <= 3;
  });

  const expiredItems = items.filter((i) => {
    if (!i.expiryDate) return false;
    return daysUntilExpiry(i.expiryDate) < 0;
  });

  const nonEmptyLocations = LOCATION_ORDER.filter((loc) => grouped[loc].length > 0);

  async function handleDelete(id: string) {
    await deletePantryItem(id);
    reload();
  }

  async function handleQuantityChange(id: string, newQty: number) {
    const qty = newQty <= 0 ? null : newQty;
    await updatePantryItemQuantity(id, qty);
    reload();
  }

  async function handleDeleteExpired() {
    setDeletingExpired(true);
    await Promise.all(expiredItems.map((i) => deletePantryItem(i.id)));
    setDeletingExpired(false);
    reload();
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8571C" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 }}>
        <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5, marginBottom: 16 }}>Mon stock</Text>

        {expiredItems.length > 0 && (
          <View style={{
            borderRadius: 16, backgroundColor: colors.dangerBg, paddingHorizontal: 16, paddingVertical: 12,
            borderWidth: 1, borderColor: colors.danger + "33", marginBottom: 8,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.danger} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <Line x1={12} y1={9} x2={12} y2={13} />
                  <Line x1={12} y1={17} x2={12.01} y2={17} />
                </Svg>
                <Text style={{ fontSize: 12, fontWeight: "700", color: colors.danger }}>
                  {expiredItems.length} article{expiredItems.length > 1 ? "s" : ""} expiré{expiredItems.length > 1 ? "s" : ""}
                </Text>
              </View>
              <Pressable
                onPress={handleDeleteExpired}
                disabled={deletingExpired}
                style={({ pressed }) => ({ borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: pressed ? colors.danger + "22" : "transparent" })}
              >
                {deletingExpired ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.danger }}>Supprimer</Text>
                )}
              </Pressable>
            </View>
            <Text style={{ fontSize: 12, color: colors.danger, opacity: 0.7, marginTop: 4, paddingLeft: 22 }}>
              {expiredItems.map((i) => i.customName).join(", ")}
            </Text>
          </View>
        )}

        {expiringSoon.length > 0 && (
          <View style={{
            borderRadius: 16, backgroundColor: colors.accentBg, paddingHorizontal: 16, paddingVertical: 12,
            borderWidth: 1, borderColor: colors.accentBgBorder, marginBottom: 12,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <Line x1={12} y1={9} x2={12} y2={13} />
                <Line x1={12} y1={17} x2={12.01} y2={17} />
              </Svg>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#C2410C" }}>
                {expiringSoon.length} article{expiringSoon.length > 1 ? "s" : ""} expire{expiringSoon.length === 1 ? "" : "nt"} bientôt
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: "#C2410C", opacity: 0.7, marginTop: 4, paddingLeft: 22 }}>
              {expiringSoon.map((i) => i.customName).join(", ")}
            </Text>
          </View>
        )}

        {items.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 64, gap: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", shadowColor: "#1C1917", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <Rect x={3} y={2} width={18} height={20} rx={2} />
                <Line x1={12} y1={2} x2={12} y2={22} />
              </Svg>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Stock vide</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: "center" }}>Ajoutez vos produits pour suivre vos stocks</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {nonEmptyLocations.map((loc) => {
              const locItems = grouped[loc];
              const isOpen = openLocation === loc;
              return (
                <Card key={loc}>
                  <Pressable
                    onPress={() => setOpenLocation(isOpen ? null : loc)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 }}
                  >
                    <LocationIcon loc={loc} />
                    <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      {LOCATION_LABELS[loc]}
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textSubtle }}>{locItems.length}</Text>
                    <Svg
                      width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: [{ rotate: isOpen ? "0deg" : "-90deg" }] }}
                    >
                      <Polyline points="6 9 12 15 18 9" />
                    </Svg>
                  </Pressable>
                  {isOpen && (
                    <View style={{ borderTopWidth: 1, borderTopColor: colors.bgSurface }}>
                      {locItems.map((item, i) => (
                        <View key={item.id}>
                          <PantryItemRow
                            item={item}
                            onEdit={setEditItem}
                            onDelete={handleDelete}
                            onQuantityChange={handleQuantityChange}
                          />
                          {i < locItems.length - 1 && <Separator />}
                        </View>
                      ))}
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => ({
          position: "absolute", bottom: 100, left: 16, right: 16,
          borderRadius: 16, backgroundColor: colors.bgCard,
          paddingVertical: 16,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Line x1={12} y1={5} x2={12} y2={19} />
          <Line x1={5} y1={12} x2={19} y2={12} />
        </Svg>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>Ajouter un produit</Text>
      </Pressable>

      <AddPantryItemSheet isOpen={addOpen} onClose={() => setAddOpen(false)} onAdded={reload} />
      <EditPantryItemSheet item={editItem} isOpen={editItem !== null} onClose={() => setEditItem(null)} onSaved={reload} />
    </SafeAreaView>
  );
}
