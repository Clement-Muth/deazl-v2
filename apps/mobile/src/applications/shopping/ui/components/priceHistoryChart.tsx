import { useEffect, useState } from "react";
import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { getPriceHistory, type PriceHistoryPoint } from "../../application/useCases/getPriceHistory";

const CHART_H = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 36;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const INNER_H = CHART_H - PAD_TOP - PAD_BOTTOM;

const STORE_COLORS = ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#06B6D4"];

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i].x - pts[i - 1].x) / 3;
    d += ` C ${pts[i - 1].x + cpx},${pts[i - 1].y} ${pts[i].x - cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }
  return d;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

interface PriceHistoryChartProps {
  productId: string;
}

export function PriceHistoryChart({ productId }: PriceHistoryChartProps) {
  const { colors } = useAppTheme();
  const { width: screenW } = useWindowDimensions();
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const chartW = screenW - 32 - PAD_LEFT - PAD_RIGHT;

  useEffect(() => {
    setLoading(true);
    getPriceHistory(productId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return (
      <View style={{ height: CHART_H + 40, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const totalPoints = history.length;
  if (totalPoints < 2) {
    return (
      <View style={{ paddingVertical: 32, alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Pas encore d'historique</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", paddingHorizontal: 24 }}>
          Les prochains prix enregistrés s'afficheront ici sous forme de courbe.
        </Text>
      </View>
    );
  }

  const groupedByStore = new Map<string, PriceHistoryPoint[]>();
  for (const p of history) {
    const arr = groupedByStore.get(p.storeId) ?? [];
    arr.push(p);
    groupedByStore.set(p.storeId, arr);
  }

  const allPrices = history.map((p) => p.price);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const allDates = history.map((p) => new Date(p.reportedAt).getTime());
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const dateRange = maxDate - minDate || 1;

  function xScale(iso: string): number {
    return PAD_LEFT + ((new Date(iso).getTime() - minDate) / dateRange) * chartW;
  }

  function yScale(price: number): number {
    if (maxPrice === minPrice) return PAD_TOP + INNER_H / 2;
    return PAD_TOP + (1 - (price - minPrice) / priceRange) * INNER_H;
  }

  const gridPrices = [minPrice, (minPrice + maxPrice) / 2, maxPrice];

  const storeKeys = Array.from(groupedByStore.keys());
  const firstDate = history[0].reportedAt;
  const lastDate = history[history.length - 1].reportedAt;

  const totalW = PAD_LEFT + chartW + PAD_RIGHT;

  return (
    <View style={{ gap: 12 }}>
      <Svg width={totalW} height={CHART_H}>
        {gridPrices.map((gp, i) => {
          const y = yScale(gp);
          return (
            <Line
              key={i}
              x1={PAD_LEFT}
              y1={y}
              x2={PAD_LEFT + chartW}
              y2={y}
              stroke={colors.bgSurface}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          );
        })}

        {gridPrices.map((gp, i) => (
          <SvgText
            key={i}
            x={PAD_LEFT - 6}
            y={yScale(gp) + 4}
            fontSize={10}
            textAnchor="end"
            fill={colors.textMuted}
          >
            {gp.toFixed(2)}
          </SvgText>
        ))}

        <SvgText
          x={PAD_LEFT}
          y={CHART_H - 6}
          fontSize={10}
          textAnchor="start"
          fill={colors.textMuted}
        >
          {formatDate(firstDate)}
        </SvgText>
        {firstDate !== lastDate && (
          <SvgText
            x={PAD_LEFT + chartW}
            y={CHART_H - 6}
            fontSize={10}
            textAnchor="end"
            fill={colors.textMuted}
          >
            {formatDate(lastDate)}
          </SvgText>
        )}

        {storeKeys.map((storeId, colorIdx) => {
          const pts = groupedByStore.get(storeId)!;
          const color = STORE_COLORS[colorIdx % STORE_COLORS.length];
          const coords = pts.map((p) => ({ x: xScale(p.reportedAt), y: yScale(p.price) }));
          return (
            <>
              <Path
                key={`line-${storeId}`}
                d={smoothPath(coords)}
                stroke={color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {coords.map((c, i) => (
                <Circle
                  key={`dot-${storeId}-${i}`}
                  cx={c.x}
                  cy={c.y}
                  r={4}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}
            </>
          );
        })}
      </Svg>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 4 }}>
        {storeKeys.map((storeId, colorIdx) => {
          const pts = groupedByStore.get(storeId)!;
          const storeName = pts[0].storeName;
          const color = STORE_COLORS[colorIdx % STORE_COLORS.length];
          return (
            <View
              key={storeId}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                backgroundColor: colors.bgSurface,
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.text }}>{storeName}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
