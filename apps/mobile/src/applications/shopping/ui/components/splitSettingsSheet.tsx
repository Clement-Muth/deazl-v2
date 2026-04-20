import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../../../../shared/theme";
import type { SplitMember, SplitSettings } from "../../application/useCases/getSplitSettings";
import { BottomModal, BottomModalScrollView } from "./bottomModal";

export function Toggle({ value, onChange, color }: { value: boolean; onChange: () => void; color: string }) {
  return (
    <Pressable
      onPress={onChange}
      style={{ width: 50, height: 30, borderRadius: 999, backgroundColor: value ? color : "#D1CCC5", justifyContent: "center", padding: 3 }}
    >
      <View style={{
        width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff",
        alignSelf: value ? "flex-end" : "flex-start",
        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
      }} />
    </Pressable>
  );
}

export function SplitEditSheet({
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
  const { colors } = useAppTheme();
  const [draft, setDraft] = useState(settings);

  useEffect(() => { if (isOpen) setDraft(settings); }, [isOpen]);

  function updateMember(idx: number, patch: Partial<SplitMember>) {
    setDraft((prev) => ({
      ...prev,
      members: prev.members.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  }

  return (
    <BottomModal isOpen={isOpen} onClose={() => { onSave(draft); onOpenChange(false); }} height="auto">
      <BottomModalScrollView contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        <Text style={{ fontSize: 17, fontWeight: "900", color: colors.text, paddingBottom: 4 }}>Configuration de session</Text>

        {/* Split des dépenses */}
        <View style={{ backgroundColor: "#F9F8F6", borderRadius: 16, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Split des dépenses</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {draft.enabled ? "Actif · Totaux répartis entre les membres." : "Inactif · Un seul total commun affiché."}
              </Text>
            </View>
            <Toggle value={draft.enabled} onChange={() => setDraft((p) => ({ ...p, enabled: !p.enabled }))} color="#1A1A1A" />
          </View>
          {draft.enabled && (
            <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
              {draft.members.map((m, i) => (
                <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: `${m.color}20` }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: m.color }} />
                  <TextInput
                    value={m.name}
                    onChangeText={(v) => updateMember(i, { name: v })}
                    style={{ fontSize: 12, fontWeight: "700", color: m.color, flex: 1 }}
                    maxLength={12}
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Suivi Carte Restaurant */}
        <View style={{ backgroundColor: "#F9F8F6", borderRadius: 16, overflow: "hidden" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>Suivi Carte Restaurant</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {draft.carteRestoEnabled ? "Actif · Plafonds CR suivis par personne." : "Inactif · Aucune distinction CR / HC."}
              </Text>
            </View>
            <Toggle value={draft.carteRestoEnabled} onChange={() => setDraft((p) => ({ ...p, carteRestoEnabled: !p.carteRestoEnabled }))} color="#E8571C" />
          </View>

          {draft.carteRestoEnabled && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {draft.members.map((m, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: "#F0EDE8", borderRadius: 12, padding: 12, gap: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: m.color }} />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted }}>{m.name}</Text>
                    </View>
                    <View style={{ flexDirection: "row", backgroundColor: "rgba(26,26,26,0.07)", borderRadius: 8, padding: 2 }}>
                      {(["CR", "HC"] as const).map((mode) => (
                        <Pressable
                          key={mode}
                          onPress={() => updateMember(i, { crMode: mode })}
                          style={({ pressed }) => ({
                            flex: 1, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center",
                            backgroundColor: m.crMode === mode ? "#fff" : pressed ? "rgba(26,26,26,0.05)" : "transparent",
                            shadowColor: m.crMode === mode ? "#000" : "transparent",
                            shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: m.crMode === mode ? 1 : 0,
                          })}
                        >
                          <Text style={{
                            fontSize: 11, fontWeight: "800", letterSpacing: 0.4,
                            color: m.crMode === mode ? (mode === "CR" ? "#2E7D5B" : "#D14B7A") : colors.textMuted,
                          }}>{mode}</Text>
                        </Pressable>
                      ))}
                    </View>
                    {m.crMode === "CR" ? (
                      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
                        <TextInput
                          value={String(m.budgetCap)}
                          onChangeText={(v) => {
                            const n = parseInt(v.replace(/\D/g, ""), 10);
                            if (!isNaN(n)) updateMember(i, { budgetCap: Math.max(1, Math.min(999, n)) });
                          }}
                          keyboardType="numeric"
                          selectTextOnFocus
                          style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -0.5, minWidth: 40 }}
                        />
                        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.textMuted }}>€</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, lineHeight: 16 }}>
                        Pas de carte resto — tout en HC
                      </Text>
                    )}
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#D6EDE1" }}>
                  <View style={{ width: 16, height: 14, borderRadius: 3, backgroundColor: "#4ADE80", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 7, fontWeight: "900", color: "#0D3F1E", letterSpacing: 0.4 }}>CR</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#2E7D5B" }}>Carte Restaurant</Text>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F7DDE5" }}>
                  <View style={{ width: 16, height: 14, borderRadius: 3, backgroundColor: "#F9A8D4", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 7, fontWeight: "900", color: "#5A1636", letterSpacing: 0.4 }}>HC</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#D14B7A" }}>Hors Carte</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => { onSave(draft); onOpenChange(false); }}
          style={({ pressed }) => ({
            height: 52, borderRadius: 14, backgroundColor: pressed ? "#333" : "#1A1A1A",
            alignItems: "center", justifyContent: "center", marginTop: 4,
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: -0.3 }}>Confirmer</Text>
        </Pressable>
      </BottomModalScrollView>
    </BottomModal>
  );
}
