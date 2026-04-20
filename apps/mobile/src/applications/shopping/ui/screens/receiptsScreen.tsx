import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line, Path, Polyline, Rect } from "react-native-svg";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../../../../shared/theme";
import { BottomModal, BottomModalScrollView } from "../components/bottomModal";
import {
  getShoppingHistory,
  getShoppingReceiptDetail,
  type ShoppingReceipt,
  type ReceiptItem,
} from "../../application/useCases/getShoppingHistory";

const PAPER = "#FEFCF8";
const PAPER_DARK = "#F5F2EC";
const INK = "#1A1A18";
const INK_MUTED = "#888880";
const INK_LIGHT = "#C8C4BC";

function formatDate(iso: string | null): string {
  if (!iso) return "Date inconnue";
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDateRelative(iso: string | null): string {
  if (!iso) return "Date inconnue";
  const now = new Date();
  const date = new Date(iso);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(iso);
}

function DashedSeparator() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 0, marginVertical: 10 }}>
      <Text style={{ fontSize: 11, color: INK_LIGHT, letterSpacing: 2, flex: 1 }}>
        {"- - - - - - - - - - - - - - - - - - - - - - - - - - - - - -"}
      </Text>
    </View>
  );
}

function DoubleSeparator() {
  return (
    <View style={{ marginVertical: 10, gap: 3 }}>
      <View style={{ height: 1, backgroundColor: INK }} />
      <View style={{ height: 1, backgroundColor: INK }} />
    </View>
  );
}

function TornBottom({ width }: { width: number }) {
  const teeth = Math.floor(width / 7);
  const tw = width / teeth;
  let d = `M 0 7`;
  for (let i = 0; i < teeth; i++) {
    d += ` L ${i * tw + tw / 2} 0 L ${(i + 1) * tw} 7`;
  }
  d += ` L ${width} 7 L ${width} 8 L 0 8 Z`;
  return (
    <Svg width={width} height={8} style={{ marginTop: -1 }}>
      <Path d={d} fill={PAPER_DARK} />
    </Svg>
  );
}

function Barcode({ id }: { id: string }) {
  const bars: { w: number; h: number }[] = [];
  const seed = id.replace(/-/g, "");
  for (let i = 0; i < 52; i++) {
    const c = seed.charCodeAt(i % seed.length);
    bars.push({ w: (c % 2) + 1, h: 28 + (c % 16) });
  }
  const totalW = bars.reduce((s, b) => s + b.w + 1, 0);

  return (
    <View style={{ alignItems: "center", gap: 6, marginTop: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 44 }}>
        {bars.map((bar, i) => (
          <View
            key={i}
            style={{ width: bar.w, height: bar.h, backgroundColor: INK, marginRight: 1 }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 9, letterSpacing: 3, color: INK_MUTED, fontVariant: ["tabular-nums"] }}>
        {id.replace(/-/g, "").slice(0, 20).toUpperCase()}
      </Text>
    </View>
  );
}

function ReceiptCard({ receipt, onPress }: { receipt: ShoppingReceipt; onPress: () => void }) {
  const { width: screenW } = useWindowDimensions();
  const cardW = screenW - 32;

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{
        backgroundColor: PAPER,
        borderRadius: 4,
        borderTopLeftRadius: 12, borderTopRightRadius: 12,
        paddingHorizontal: 18, paddingTop: 18, paddingBottom: 14,
        shadowColor: "#1C1917", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
      }}>
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "900", color: INK, letterSpacing: 2, textTransform: "uppercase" }}>
            {receipt.storeName ?? "Magasin inconnu"}
          </Text>
          {receipt.storeCity && (
            <Text style={{ fontSize: 11, color: INK_MUTED, letterSpacing: 1, marginTop: 1 }}>
              {receipt.storeCity.toUpperCase()}
            </Text>
          )}
        </View>

        <DashedSeparator />

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 11, color: INK_MUTED }}>{formatDate(receipt.purchasedAt)}</Text>
          <Text style={{ fontSize: 11, color: INK_MUTED }}>{formatTime(receipt.purchasedAt)}</Text>
        </View>

        <DashedSeparator />

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
          <View>
            <Text style={{ fontSize: 11, color: INK_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Articles</Text>
            <Text style={{ fontSize: 13, color: INK, fontWeight: "700", marginTop: 2 }}>
              {receipt.checkedCount > 0 ? receipt.checkedCount : receipt.itemCount} achetés
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 11, color: INK_MUTED, textTransform: "uppercase", letterSpacing: 1 }}>Total</Text>
            {receipt.totalAmount != null ? (
              <Text style={{ fontSize: 22, fontWeight: "900", color: INK, letterSpacing: -0.5, marginTop: 2 }}>
                {receipt.totalAmount.toFixed(2)} €
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: INK_MUTED, marginTop: 2 }}>Non capturé</Text>
            )}
          </View>
        </View>
      </View>
      <TornBottom width={cardW} />
    </Pressable>
  );
}

function ReceiptDetail({ receipt, items, loading }: { receipt: ShoppingReceipt; items: ReceiptItem[]; loading: boolean }) {
  const checked = items.filter((i) => i.isChecked);
  const unchecked = items.filter((i) => !i.isChecked);

  return (
    <View style={{ flex: 1, backgroundColor: PAPER, marginHorizontal: -16, marginBottom: -16, paddingHorizontal: 24 }}>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={INK} />
        </View>
      ) : (
        <BottomModalScrollView
          contentContainerStyle={{ paddingBottom: 48, paddingTop: 8 }}
          style={{ flex: 1 }}
        >
          <View style={{ alignItems: "center", gap: 3, paddingTop: 8, paddingBottom: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: "900", color: INK, letterSpacing: 3, textTransform: "uppercase" }}>
              {receipt.storeName ?? "Magasin inconnu"}
            </Text>
            {receipt.storeCity && (
              <Text style={{ fontSize: 12, color: INK_MUTED, letterSpacing: 2, textTransform: "uppercase" }}>
                {receipt.storeCity}
              </Text>
            )}
          </View>

          <DashedSeparator />

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: INK_MUTED }}>
              {formatDate(receipt.purchasedAt)}  {formatTime(receipt.purchasedAt)}
            </Text>
            <Text style={{ fontSize: 12, color: INK_MUTED }}>
              {receipt.checkedCount > 0 ? receipt.checkedCount : receipt.itemCount} article{(receipt.checkedCount || receipt.itemCount) > 1 ? "s" : ""}
            </Text>
          </View>

          <DashedSeparator />

          {checked.length > 0 && (
            <View style={{ gap: 12 }}>
              {checked.map((item) => (
                <View key={item.id} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, color: INK, fontWeight: "600" }} numberOfLines={2}>
                      {item.customName}
                    </Text>
                    <Text style={{ fontSize: 11, color: INK_MUTED, marginTop: 1 }}>
                      {item.quantity} {item.unit}
                      {item.pricePaid != null
                        ? `  ×  ${(item.pricePaid / item.quantity).toFixed(2)} €/${item.unit}`
                        : ""}
                    </Text>
                  </View>
                  {item.pricePaid != null ? (
                    <Text style={{ fontSize: 14, fontWeight: "700", color: INK, fontVariant: ["tabular-nums"] }}>
                      {item.pricePaid.toFixed(2)} €
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: INK_MUTED }}>—</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {unchecked.length > 0 && (
            <>
              <DashedSeparator />
              <Text style={{ fontSize: 10, color: INK_MUTED, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>
                Non achetés
              </Text>
              <View style={{ gap: 8, opacity: 0.5 }}>
                {unchecked.map((item) => (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ flex: 1, fontSize: 13, color: INK }} numberOfLines={1}>{item.customName}</Text>
                    <Text style={{ fontSize: 11, color: INK_MUTED }}>{item.quantity} {item.unit}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <DoubleSeparator />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontSize: 15, fontWeight: "900", color: INK, letterSpacing: 1, textTransform: "uppercase" }}>
              Total
            </Text>
            {receipt.totalAmount != null ? (
              <Text style={{ fontSize: 26, fontWeight: "900", color: INK, letterSpacing: -0.5 }}>
                {receipt.totalAmount.toFixed(2)} €
              </Text>
            ) : (
              <Text style={{ fontSize: 14, color: INK_MUTED }}>Non capturé</Text>
            )}
          </View>

          <DoubleSeparator />

          <View style={{ alignItems: "center", marginTop: 16 }}>
            <Barcode id={receipt.id} />
          </View>
        </BottomModalScrollView>
      )}
    </View>
  );
}

export function ReceiptsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();

  const [receipts, setReceipts] = useState<ShoppingReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState<ShoppingReceipt | null>(null);
  const [detailItems, setDetailItems] = useState<ReceiptItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getShoppingHistory().then((data) => {
      setReceipts(data);
      setLoading(false);
    });
  }, []);

  function handleOpenReceipt(receipt: ShoppingReceipt) {
    setSelectedReceipt(receipt);
    setDetailItems([]);
    setDetailLoading(true);
    getShoppingReceiptDetail(receipt.id).then((items) => {
      setDetailItems(items);
      setDetailLoading(false);
    });
  }

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
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text, flex: 1 }}>Tickets de caisse</Text>
        {!loading && receipts.length > 0 && (
          <Text style={{ fontSize: 12, color: colors.textSubtle, fontWeight: "500" }}>
            {receipts.length} course{receipts.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : receipts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 20, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Rect x={4} y={2} width={16} height={20} rx={2} />
              <Line x1={8} y1={8} x2={16} y2={8} />
              <Line x1={8} y1={12} x2={16} y2={12} />
              <Line x1={8} y1={16} x2={12} y2={16} />
            </Svg>
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Pas encore de courses terminées</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
            Vos tickets apparaîtront ici après votre première session en mode courses.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} onPress={() => handleOpenReceipt(receipt)} />
          ))}
        </ScrollView>
      )}

      <BottomModal isOpen={selectedReceipt !== null} onClose={() => setSelectedReceipt(null)} height="92%">
        {selectedReceipt && (
          <ReceiptDetail receipt={selectedReceipt} items={detailItems} loading={detailLoading} />
        )}
      </BottomModal>
    </SafeAreaView>
  );
}
