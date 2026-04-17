import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useAppTheme } from "../../../../shared/theme";
import { getPreviousSessions, type PreviousSession } from "../../application/useCases/getPreviousSessions";
import { CostCard } from "../components/batchCookingCostCard";

function formatSessionDate(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return "Session du " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function getMonthLabel(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }).toUpperCase();
}

function getMonthKey(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  return `${d.getFullYear()}-${d.getMonth()}`;
}

interface Group {
  monthKey: string;
  label: string;
  sessions: PreviousSession[];
}

function groupByMonth(sessions: PreviousSession[]): Group[] {
  const map = new Map<string, Group>();
  for (const s of sessions) {
    const key = getMonthKey(s.weekStart);
    if (!map.has(key)) {
      map.set(key, { monthKey: key, label: getMonthLabel(s.weekStart), sessions: [] });
    }
    map.get(key)!.sessions.push(s);
  }
  return Array.from(map.values());
}

function RecipeAvatars({ images, names, size = 44 }: { images: (string | null)[]; names: string[]; size?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: "row" }}>
      {images.slice(0, 3).map((img, i) => (
        <View
          key={i}
          style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: "#FCDCC8",
            borderWidth: 2.5, borderColor: colors.bgCard,
            marginLeft: i > 0 ? -(size * 0.3) : 0,
            alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {img ? (
            <Image source={{ uri: img }} style={{ width: size, height: size }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: size * 0.38, fontWeight: "900", color: colors.accent }}>
              {(names[i] ?? "?").trim().charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}


function SessionCard({ session, colors }: { session: PreviousSession; colors: ReturnType<typeof useAppTheme>["colors"] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [costOpen, setCostOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => ({
        backgroundColor: colors.bgCard,
        borderRadius: 18,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        opacity: pressed ? 0.95 : 1,
      })}
    >
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <RecipeAvatars images={session.recipeImages} names={session.recipeNames} />
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            {expanded
              ? <Path d="M18 15l-6-6-6 6" />
              : <Path d="M6 9l6 6 6-6" />
            }
          </Svg>
        </View>
        <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 14, marginBottom: 4 }}>
          {formatSessionDate(session.weekStart)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSubtle, lineHeight: 18 }} numberOfLines={expanded ? undefined : 1}>
          {session.recipeIds.length} recette{session.recipeIds.length > 1 ? "s" : ""}
        </Text>
      </View>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.bgSurface }}>
          {session.recipeIds.map((id, i) => (
            <Pressable
              key={id}
              onPress={() => router.push({ pathname: "/batch-cooking/recipe-view", params: { id } } as never)}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingHorizontal: 18, paddingVertical: 12,
                backgroundColor: pressed ? colors.bgSurface : colors.bgCard,
                borderTopWidth: i > 0 ? 1 : 0,
                borderTopColor: colors.bgSurface,
              })}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: "#FCDCC8", overflow: "hidden",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {session.recipeImages[i] ? (
                  <Image source={{ uri: session.recipeImages[i]! }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: "900", color: colors.accent }}>
                    {(session.recipeNames[i] ?? "?").trim().charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.text }}>
                {session.recipeNames[i] ?? "Recette inconnue"}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setCostOpen((v) => !v)}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              paddingHorizontal: 18, paddingVertical: 13,
              backgroundColor: pressed ? colors.bgSurface : colors.accentBg,
              borderTopWidth: 1, borderTopColor: colors.bgSurface,
            })}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </Svg>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>Estimation du coût</Text>
            </View>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              {costOpen ? <Path d="M18 15l-6-6-6 6" /> : <Path d="M6 9l6 6 6-6" />}
            </Svg>
          </Pressable>
          {costOpen && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.bgSurface }}>
              <CostCard session={session} colors={colors} />
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function BatchCookingHistoryScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<PreviousSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPreviousSessions(50).then((s) => { setSessions(s); setLoading(false); });
  }, []);

  const groups = groupByMonth(sessions);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgCard,
            alignItems: "center", justifyContent: "center",
            shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: colors.text, letterSpacing: -0.3 }}>
          Précédents batch cooking
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : groups.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#FFF7F2", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 11h18M3 6h18M3 16h12M3 21h8" />
              <Circle cx={19} cy={19} r={3} />
            </Svg>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 8 }}>
            Aucune session passée
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSubtle, textAlign: "center", lineHeight: 20 }}>
            Tes prochaines sessions de batch cooking apparaîtront ici.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, paddingTop: 8 }}>
          {groups.map((group) => (
            <View key={group.monthKey} style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>
                {group.label}
              </Text>
              <View style={{ gap: 10 }}>
                {group.sessions.map((s) => (
                  <SessionCard key={s.id} session={s} colors={colors} />
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
