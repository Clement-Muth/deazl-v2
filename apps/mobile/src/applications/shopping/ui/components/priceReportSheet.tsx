import * as Haptics from "expo-haptics";
import { useCameraPermissions, CameraView } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { BottomModal, BottomModalScrollView } from "./bottomModal";
import Svg, { Path, Polyline, Line, Circle } from "react-native-svg";
import type { OFFProductResult } from "../../application/useCases/searchOffProducts";
import { getOffProductByBarcode, searchOffProducts } from "../../application/useCases/searchOffProducts";
import { reportProductPrice } from "../../application/useCases/reportProductPrice";
import { linkShoppingItemProduct } from "../../application/useCases/linkShoppingItemProduct";
import type { UserStore } from "../../application/useCases/getUserStores";
import { getUserStores } from "../../application/useCases/getUserStores";
import type { ShoppingItem } from "../../domain/entities/shopping";

const UNITS = ["pièce", "kg", "g", "L", "cL", "mL"];

const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#16A34A", b: "#65A30D", c: "#CA8A04", d: "#EA580C", e: "#DC2626",
};

interface PriceReportSheetProps {
  item: ShoppingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "find" | "price";
type FindMode = "search" | "scan";

export function PriceReportSheet({ item, isOpen, onClose, onSuccess }: PriceReportSheetProps) {
  const [step, setStep] = useState<Step>("find");
  const [findMode, setFindMode] = useState<FindMode>("search");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFProductResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [scanned, setScanned] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<OFFProductResult | null>(null);

  const [stores, setStores] = useState<UserStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [qtyInput, setQtyInput] = useState("1");
  const [unit, setUnit] = useState("pièce");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("find");
    setFindMode("search");
    setSearchQuery(item?.customName ?? "");
    setSearchResults([]);
    setScanned(false);
    setScanError(null);
    setSelectedProduct(null);
    setPriceInput("");
    setQtyInput("1");
    setUnit("pièce");
    setSubmitError(null);
    getUserStores().then((s) => {
      setStores(s);
      if (s.length > 0) setSelectedStoreId(s[0].id);
    });
  }, [isOpen, item?.id]);

  useEffect(() => {
    if (isOpen && item?.customName && findMode === "search") {
      handleSearch(item.customName);
    }
  }, [isOpen]);

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchOffProducts(q);
      setSearchResults(results);
      setSearching(false);
    }, 400);
  }

  async function handleSwitchToScan() {
    setFindMode("scan");
    if (!permission?.granted) {
      await requestPermission();
    }
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
    selectProduct(product);
  }

  function selectProduct(product: OFFProductResult) {
    setSelectedProduct(product);
    setStep("price");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function handleSubmit() {
    if (!selectedProduct || !selectedStoreId || !priceInput || !item) return;
    const price = parseFloat(priceInput.replace(",", "."));
    const qty = parseFloat(qtyInput.replace(",", ".")) || 1;
    if (isNaN(price) || price <= 0) { setSubmitError("Prix invalide"); return; }

    setSubmitting(true);
    setSubmitError(null);
    Keyboard.dismiss();

    const result = await reportProductPrice(selectedProduct, selectedStoreId, price, qty, unit);
    if (result.error) {
      setSubmitError(result.error);
      setSubmitting(false);
      return;
    }

    if (result.productId && !item.productId) {
      try {
        await linkShoppingItemProduct(item.id, result.productId);
      } catch {}
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitting(false);
    onSuccess();
    onClose();
  }

  if (!item) return null;

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} height="95%">
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: "#1C1917" }}>
              {step === "find" ? "Trouver le produit" : "Ajouter un prix"}
            </Text>
            <Text style={{ fontSize: 12, color: "#A8A29E", marginTop: 2 }}>
              {item.customName}
            </Text>
          </View>
        </View>

        {step === "find" ? (
          <FindStep
            findMode={findMode}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searching={searching}
            scanned={scanned}
            scanLoading={scanLoading}
            scanError={scanError}
            permission={permission}
            onSearch={handleSearch}
            onSwitchToScan={handleSwitchToScan}
            onSwitchToSearch={() => { setFindMode("search"); setScanned(false); setScanError(null); }}
            onBarcode={handleBarcode}
            onRetryScan={() => { setScanned(false); setScanError(null); }}
            onSelectProduct={selectProduct}
          />
        ) : (
          <PriceStep
            product={selectedProduct!}
            stores={stores}
            selectedStoreId={selectedStoreId}
            priceInput={priceInput}
            qtyInput={qtyInput}
            unit={unit}
            submitting={submitting}
            submitError={submitError}
            onBack={() => setStep("find")}
            onSelectStore={setSelectedStoreId}
            onPriceChange={setPriceInput}
            onQtyChange={setQtyInput}
            onUnitChange={setUnit}
            onSubmit={handleSubmit}
          />
        )}
      </View>
    </BottomModal>
  );
}

function FindStep({
  findMode, searchQuery, searchResults, searching,
  scanned, scanLoading, scanError, permission,
  onSearch, onSwitchToScan, onSwitchToSearch,
  onBarcode, onRetryScan, onSelectProduct,
}: {
  findMode: FindMode;
  searchQuery: string;
  searchResults: OFFProductResult[];
  searching: boolean;
  scanned: boolean;
  scanLoading: boolean;
  scanError: string | null;
  permission: ReturnType<typeof useCameraPermissions>[0];
  onSearch: (q: string) => void;
  onSwitchToScan: () => void;
  onSwitchToSearch: () => void;
  onBarcode: (e: { data: string }) => void;
  onRetryScan: () => void;
  onSelectProduct: (p: OFFProductResult) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", backgroundColor: "#F5F3EF", borderRadius: 14, padding: 4, marginBottom: 14, gap: 4 }}>
        <Pressable
          onPress={onSwitchToSearch}
          style={{
            flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center",
            backgroundColor: findMode === "search" ? "#fff" : "transparent",
            shadowColor: findMode === "search" ? "#1C1917" : "transparent",
            shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: findMode === "search" ? 2 : 0,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: findMode === "search" ? "#1C1917" : "#A8A29E" }}>
            Rechercher
          </Text>
        </Pressable>
        <Pressable
          onPress={onSwitchToScan}
          style={{
            flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6,
            backgroundColor: findMode === "scan" ? "#fff" : "transparent",
            shadowColor: findMode === "scan" ? "#1C1917" : "transparent",
            shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: findMode === "scan" ? 2 : 0,
          }}
        >
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={findMode === "scan" ? "#1C1917" : "#A8A29E"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 9V6a2 2 0 0 1 2-2h3" />
            <Path d="M15 4h3a2 2 0 0 1 2 2v3" />
            <Path d="M21 15v3a2 2 0 0 1-2 2h-3" />
            <Path d="M9 20H6a2 2 0 0 1-2-2v-3" />
            <Line x1={7} y1={12} x2={17} y2={12} />
          </Svg>
          <Text style={{ fontSize: 13, fontWeight: "700", color: findMode === "scan" ? "#1C1917" : "#A8A29E" }}>
            Scanner
          </Text>
        </Pressable>
      </View>

      {findMode === "search" ? (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F5F3EF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={11} cy={11} r={8} />
              <Line x1={21} y1={21} x2={16.65} y2={16.65} />
            </Svg>
            <TextInput
              value={searchQuery}
              onChangeText={onSearch}
              placeholder="Nom du produit…"
              placeholderTextColor="#A8A29E"
              style={{ flex: 1, fontSize: 15, color: "#1C1917" }}
              returnKeyType="search"
            />
            {searching && <ActivityIndicator size="small" color="#E8571C" />}
          </View>

          <BottomModalScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {searchResults.length === 0 && !searching && searchQuery.trim() ? (
              <View style={{ alignItems: "center", paddingTop: 32, gap: 8 }}>
                <Text style={{ fontSize: 14, color: "#A8A29E" }}>Aucun résultat pour «{searchQuery}»</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {searchResults.map((product) => (
                  <ProductRow key={product.offId} product={product} onPress={() => onSelectProduct(product)} />
                ))}
              </View>
            )}
          </BottomModalScrollView>
        </View>
      ) : (
        <ScanStep
          scanned={scanned}
          scanLoading={scanLoading}
          scanError={scanError}
          permission={permission}
          onBarcode={onBarcode}
          onRetry={onRetryScan}
        />
      )}
    </View>
  );
}

function ScanStep({
  scanned, scanLoading, scanError, permission, onBarcode, onRetry,
}: {
  scanned: boolean;
  scanLoading: boolean;
  scanError: string | null;
  permission: ReturnType<typeof useCameraPermissions>[0];
  onBarcode: (e: { data: string }) => void;
  onRetry: () => void;
}) {
  if (!permission) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color="#E8571C" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 }}>
        <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <Circle cx={12} cy={13} r={4} />
          </Svg>
        </View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1917", textAlign: "center" }}>
          Accès à la caméra requis
        </Text>
        <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>
          Pour scanner des codes-barres, autorisez Deazl à accéder à votre caméra.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, gap: 12 }}>
      <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: "#000", minHeight: 300 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "upc_a", "upc_e", "qr"] }}
          onBarcodeScanned={scanned ? undefined : onBarcode}
        />
        {!scanned && (
          <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 220, height: 140, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }}>
              <View style={{ position: "absolute", top: -1, left: -1, width: 24, height: 24, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#E8571C", borderTopLeftRadius: 16 }} />
              <View style={{ position: "absolute", top: -1, right: -1, width: 24, height: 24, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#E8571C", borderTopRightRadius: 16 }} />
              <View style={{ position: "absolute", bottom: -1, left: -1, width: 24, height: 24, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#E8571C", borderBottomLeftRadius: 16 }} />
              <View style={{ position: "absolute", bottom: -1, right: -1, width: 24, height: 24, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#E8571C", borderBottomRightRadius: 16 }} />
            </View>
            <Text style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
              Centrez le code-barres
            </Text>
          </View>
        )}
        {scanLoading && (
          <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Recherche du produit…</Text>
          </View>
        )}
      </View>

      {scanError && (
        <View style={{ backgroundColor: "#FEF2F2", borderRadius: 14, padding: 14, gap: 8 }}>
          <Text style={{ fontSize: 13, color: "#DC2626", fontWeight: "600" }}>{scanError}</Text>
          <Pressable onPress={onRetry} style={({ pressed }) => ({ alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: pressed ? "#FEE2E2" : "#F5F3EF" })}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>Réessayer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ProductRow({ product, onPress }: { product: OFFProductResult; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: pressed ? "#FFF7ED" : "#F5F3EF",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
      })}
    >
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#E8E5E1" }} resizeMode="contain" />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#E8E5E1", alignItems: "center", justifyContent: "center" }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </Svg>
        </View>
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
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </Pressable>
  );
}

function PriceStep({
  product, stores, selectedStoreId, priceInput, qtyInput, unit,
  submitting, submitError,
  onBack, onSelectStore, onPriceChange, onQtyChange, onUnitChange, onSubmit,
}: {
  product: OFFProductResult;
  stores: UserStore[];
  selectedStoreId: string | null;
  priceInput: string;
  qtyInput: string;
  unit: string;
  submitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSelectStore: (id: string) => void;
  onPriceChange: (v: string) => void;
  onQtyChange: (v: string) => void;
  onUnitChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <BottomModalScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 10,
          backgroundColor: pressed ? "#F5F3EF" : "#FAF9F6",
          marginBottom: 4,
        })}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M15 18l-6-6 6-6" />
        </Svg>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#78716C" }}>Changer de produit</Text>
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#F5F3EF", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: "#E8E5E1" }} resizeMode="contain" />
        ) : (
          <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: "#E8E5E1" }} />
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }} numberOfLines={2}>{product.name}</Text>
          {product.brand && <Text style={{ fontSize: 12, color: "#78716C" }}>{product.brand}</Text>}
        </View>
        {product.nutriscoreGrade && (
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: NUTRISCORE_COLORS[product.nutriscoreGrade] ?? "#9CA3AF", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#fff" }}>{product.nutriscoreGrade.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>Magasin</Text>
        {stores.length === 0 ? (
          <View style={{ backgroundColor: "#F5F3EF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 13, color: "#A8A29E", textAlign: "center" }}>
              Ajoutez des magasins dans votre profil pour contribuer les prix.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 6 }}>
            {stores.map((store) => (
              <Pressable
                key={store.id}
                onPress={() => onSelectStore(store.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: selectedStoreId === store.id ? "#FFF7ED" : "#F5F3EF",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderWidth: selectedStoreId === store.id ? 1.5 : 0,
                  borderColor: selectedStoreId === store.id ? "#FDBA74" : "transparent",
                }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selectedStoreId === store.id ? "#E8571C" : "#D1D5DB",
                  backgroundColor: selectedStoreId === store.id ? "#E8571C" : "transparent",
                  alignItems: "center", justifyContent: "center",
                }}>
                  {selectedStoreId === store.id && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917" }}>{store.name}</Text>
                  {store.city && <Text style={{ fontSize: 12, color: "#A8A29E" }}>{store.city}</Text>}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>Prix</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F5F3EF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
          <TextInput
            value={priceInput}
            onChangeText={onPriceChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#A8A29E"
            style={{ flex: 1, fontSize: 24, fontWeight: "800", color: "#1C1917" }}
          />
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#A8A29E" }}>€</Text>
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#1C1917" }}>Pour</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1, backgroundColor: "#F5F3EF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 }}>
            <TextInput
              value={qtyInput}
              onChangeText={onQtyChange}
              placeholder="1"
              keyboardType="decimal-pad"
              placeholderTextColor="#A8A29E"
              style={{ fontSize: 16, fontWeight: "600", color: "#1C1917" }}
            />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 2, gap: 6 }}>
            {UNITS.map((u) => (
              <Pressable
                key={u}
                onPress={() => onUnitChange(u)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: unit === u ? "#E8571C" : "#F5F3EF",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: unit === u ? "#fff" : "#78716C" }}>
                  {u}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {submitError && (
        <View style={{ backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12 }}>
          <Text style={{ fontSize: 13, color: "#DC2626" }}>{submitError}</Text>
        </View>
      )}

      <Pressable
        onPress={onSubmit}
        disabled={submitting || !priceInput || !selectedStoreId || stores.length === 0}
        style={({ pressed }) => ({
          borderRadius: 16,
          backgroundColor: (!priceInput || !selectedStoreId || stores.length === 0)
            ? "#F5F3EF"
            : pressed ? "#D14A18" : "#E8571C",
          paddingVertical: 16,
          alignItems: "center",
        })}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{
            fontSize: 16, fontWeight: "800",
            color: (!priceInput || !selectedStoreId || stores.length === 0) ? "#A8A29E" : "#fff",
          }}>
            Ajouter le prix
          </Text>
        )}
      </Pressable>
    </BottomModalScrollView>
  );
}
