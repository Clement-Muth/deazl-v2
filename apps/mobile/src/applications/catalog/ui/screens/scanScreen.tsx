import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Polyline, Rect, Line } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import {
  getOffProductByBarcode,
  searchOffProducts,
  type OFFProductResult,
} from "../../../shopping/application/useCases/searchOffProducts";
import { getProductWithPrices, type ProductWithPrices } from "../../application/useCases/getProductWithPrices";
import { ProductSheet } from "../components/productSheet";

function CloseIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round">
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  );
}

function ScanIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <Line x1={7} y1={12} x2={17} y2={12} />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M21 21l-4.35-4.35" />
      <Path d="M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </Svg>
  );
}

const NUTRISCORE_COLORS: Record<string, string> = {
  a: "#1a9a48", b: "#71bb44", c: "#f9c623", d: "#e8771c", e: "#e63e11",
};

function NutriScoreBadge({ grade }: { grade: string }) {
  const bg = NUTRISCORE_COLORS[grade.toLowerCase()] ?? "#9ca3af";
  return (
    <View style={{ borderRadius: 4, backgroundColor: bg, paddingHorizontal: 5, paddingVertical: 1 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", color: grade === "c" ? "#1C1917" : "#fff" }}>
        {grade.toUpperCase()}
      </Text>
    </View>
  );
}

export function ScanScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"scan" | "search">("scan");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OFFProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPrices | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchOffProducts(query);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query]);

  async function handleBarcode({ data }: { data: string }) {
    if (scanned || scanLoading) return;
    setScanned(true);
    setScanLoading(true);
    setScanError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const offProduct = await getOffProductByBarcode(data);
    setScanLoading(false);
    if (!offProduct) {
      setScanError("Produit non trouvé dans Open Food Facts.");
      setTimeout(() => { setScanned(false); setScanError(null); }, 2500);
      return;
    }
    await openProductSheet(offProduct);
  }

  async function openProductSheet(offProduct: OFFProductResult) {
    setLoadingProduct(true);
    const result = await getProductWithPrices(offProduct);
    setLoadingProduct(false);
    if (result) setSelectedProduct(result);
  }

  function handleQueryChange(text: string) {
    setQuery(text);
    if (text.length > 0 && mode === "scan") {
      setMode("search");
    } else if (text.length === 0 && mode === "search") {
      setMode("scan");
      setScanned(false);
      setScanError(null);
    }
  }

  function handleClearSearch() {
    setQuery("");
    setSearchResults([]);
    setMode("scan");
    setScanned(false);
    setScanError(null);
    inputRef.current?.blur();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {mode === "scan" && permission?.granted && (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "code128", "upc_a", "upc_e"] }}
          onBarcodeScanned={scanned ? undefined : handleBarcode}
        >
          <View style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 240, height: 140, position: "relative" }}>
                <View style={{ position: "absolute", top: 0, left: 0, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderTopLeftRadius: 4 }} />
                <View style={{ position: "absolute", top: 0, right: 0, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderTopRightRadius: 4 }} />
                <View style={{ position: "absolute", bottom: 0, left: 0, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: "#fff", borderBottomLeftRadius: 4 }} />
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: "#fff", borderBottomRightRadius: 4 }} />
                {scanLoading && (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator color="#fff" size="large" />
                  </View>
                )}
              </View>
              {scanError && (
                <View style={{ marginTop: 16, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: "#fff", fontSize: 13, textAlign: "center" }}>{scanError}</Text>
                </View>
              )}
              {!scanned && !scanLoading && (
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 16 }}>
                  Pointez la caméra vers un code-barres
                </Text>
              )}
            </View>
          </View>
        </CameraView>
      )}

      {mode === "search" && (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
          <View style={{ height: 60 }} />
          {searching ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : searchResults.length === 0 && query.trim().length > 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Aucun résultat</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
                Essaie un autre nom ou scanne le code-barres.
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            >
              {searchResults.map((result) => (
                <Pressable
                  key={result.offId}
                  onPress={() => {
                    Keyboard.dismiss();
                    openProductSheet(result);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  {result.imageUrl ? (
                    <Image
                      source={{ uri: result.imageUrl }}
                      style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.bgSurface }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 20 }}>🛒</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                      {result.name}
                    </Text>
                    {result.brand && (
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                        {result.brand}
                      </Text>
                    )}
                  </View>
                  {result.nutriscoreGrade && <NutriScoreBadge grade={result.nutriscoreGrade} />}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      )}

      {mode === "scan" && !permission?.granted && (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 }}>
          <View style={{ height: 60 }} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>Caméra non autorisée</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Autorise l'accès à la caméra dans les réglages pour scanner des codes-barres.
          </Text>
        </SafeAreaView>
      )}

      <SafeAreaView
        edges={["top"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, pointerEvents: "box-none" }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: mode === "scan" ? "rgba(0,0,0,0.4)" : colors.bgSurface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <CloseIcon color={mode === "scan" ? "#fff" : colors.text} />
          </Pressable>

          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderRadius: 14,
              backgroundColor: mode === "scan" ? "rgba(0,0,0,0.45)" : colors.bgCard,
              paddingHorizontal: 12,
              paddingVertical: 9,
              borderWidth: mode === "search" ? 1 : 0,
              borderColor: colors.border,
            }}
          >
            <SearchIcon color={mode === "scan" ? "rgba(255,255,255,0.7)" : colors.textMuted} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Rechercher un produit…"
              placeholderTextColor={mode === "scan" ? "rgba(255,255,255,0.5)" : colors.textSubtle}
              style={{
                flex: 1,
                fontSize: 15,
                color: mode === "scan" ? "#fff" : colors.text,
                padding: 0,
              }}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClearSearch} hitSlop={8}>
                <CloseIcon color={mode === "scan" ? "rgba(255,255,255,0.7)" : colors.textMuted} />
              </Pressable>
            )}
          </View>

          {mode === "search" && (
            <Pressable
              onPress={() => {
                handleClearSearch();
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>Scanner</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>

      {loadingProduct && (
        <View style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          alignItems: "center", justifyContent: "center",
        }}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}

      <ProductSheet
        product={selectedProduct}
        visible={selectedProduct !== null}
        onClose={() => { setSelectedProduct(null); setScanned(false); setScanError(null); }}
        onAddedToList={() => router.back()}
      />
    </View>
  );
}
