import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { BottomSheet, Button, Card, PressableFeedback, Separator } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { addUserStore } from "../../application/useCases/addUserStore";
import { createStoreManual } from "../../application/useCases/createStore";
import { createHousehold } from "../../application/useCases/createHousehold";
import { leaveHousehold } from "../../application/useCases/leaveHousehold";
import { getHousehold } from "../../application/useCases/getHousehold";
import type { Household } from "../../application/useCases/getHousehold";
import { getProfile } from "../../application/useCases/getProfile";
import type { UserProfile } from "../../application/useCases/getProfile";
import { joinHousehold } from "../../application/useCases/joinHousehold";
import { removeUserStore } from "../../application/useCases/removeUserStore";
import { saveDietaryPreferences } from "../../application/useCases/saveDietaryPreferences";
import { searchStores } from "../../application/useCases/searchStores";
import type { StoreResult } from "../../application/useCases/searchStores";
import { signOut } from "../../application/useCases/signOut";
import { updateDisplayName } from "../../application/useCases/updateDisplayName";
import { updateHouseholdSize } from "../../application/useCases/updateHouseholdSize";
import { getUserStores } from "../../../shopping/application/useCases/getUserStores";
import type { UserStore } from "../../../shopping/application/useCases/getUserStores";

const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Végétarien" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Sans gluten" },
  { key: "lactose_free", label: "Sans lait" },
  { key: "halal", label: "Halal" },
  { key: "kosher", label: "Casher" },
  { key: "no_pork", label: "Sans porc" },
  { key: "no_seafood", label: "Sans fruits de mer" },
];

function InitialsAvatar({ name, email, avatarUrl, size = 80 }: { name: string; email: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  const initials = name.trim()
    ? name.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (email[0]?.toUpperCase() ?? "?");
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: "#E8571C", alignItems: "center", justifyContent: "center",
      shadowColor: "#E8571C", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: "900", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
      <View>
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917", marginTop: 2 }}>{value || "Non renseigné"}</Text>
      </View>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Polyline points="9 18 15 12 9 6" />
      </Svg>
    </Pressable>
  );
}

function NavRow({ icon, label, description, onPress, destructive = false }: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
      opacity: pressed ? 0.8 : 1,
    })}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: destructive ? "#FEE2E2" : "#F5F3EF", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: destructive ? "#DC2626" : "#1C1917" }}>{label}</Text>
        {description && <Text style={{ fontSize: 11, color: "#78716C", marginTop: 1 }}>{description}</Text>}
      </View>
      {!destructive && (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E60" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      )}
    </Pressable>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [userStores, setUserStores] = useState<UserStore[]>([]);
  const [loading, setLoading] = useState(true);

  const [editSheet, setEditSheet] = useState<"name" | "size" | "dietary" | "household" | "stores" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [sizeInput, setSizeInput] = useState(2);
  const [dietaryInput, setDietaryInput] = useState<string[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const [storeQuery, setStoreQuery] = useState("");
  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [storeSearching, setStoreSearching] = useState(false);
  const storeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createStoreSheet, setCreateStoreSheet] = useState(false);
  const [createBrand, setCreateBrand] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  const [createStoreError, setCreateStoreError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function reload() {
    const [p, h, s] = await Promise.all([getProfile(), getHousehold(), getUserStores()]);
    setProfile(p);
    setHousehold(h);
    setUserStores(s);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  function openNameSheet() {
    setNameInput(profile?.fullName ?? "");
    setEditSheet("name");
  }

  function openSizeSheet() {
    setSizeInput(profile?.householdSize ?? 2);
    setEditSheet("size");
  }

  function openDietarySheet() {
    setDietaryInput(profile?.dietaryPreferences ?? []);
    setEditSheet("dietary");
  }

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSaving(true);
    await updateDisplayName(nameInput);
    await reload();
    setSaving(false);
    setEditSheet(null);
  }

  async function handleSaveSize() {
    setSaving(true);
    await updateHouseholdSize(sizeInput);
    await reload();
    setSaving(false);
    setEditSheet(null);
  }

  async function handleSaveDietary() {
    setSaving(true);
    await saveDietaryPreferences(dietaryInput);
    await reload();
    setSaving(false);
    setEditSheet(null);
  }

  function toggleDietary(key: string) {
    setDietaryInput((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function handleStoreQueryChange(q: string) {
    setStoreQuery(q);
    if (storeDebounce.current) clearTimeout(storeDebounce.current);
    if (!q.trim()) { setStoreResults([]); return; }
    storeDebounce.current = setTimeout(async () => {
      setStoreSearching(true);
      const results = await searchStores(q);
      setStoreResults(results);
      setStoreSearching(false);
    }, 300);
  }

  async function handleAddStore(store: StoreResult) {
    await addUserStore(store.id);
    setStoreResults([]);
    setStoreQuery("");
    const s = await getUserStores();
    setUserStores(s);
  }

  async function handleCreateStore() {
    if (!createBrand.trim() || !createCity.trim()) return;
    setCreatingStore(true);
    setCreateStoreError(null);
    const result = await createStoreManual(createBrand.trim(), createCity.trim(), createAddress.trim() || undefined);
    if ("error" in result) {
      setCreateStoreError(result.error);
      setCreatingStore(false);
      return;
    }
    await addUserStore(result.id);
    const s = await getUserStores();
    setUserStores(s);
    setCreatingStore(false);
    setCreateStoreSheet(false);
    setCreateBrand(""); setCreateCity(""); setCreateAddress("");
  }

  async function handleLeaveHousehold() {
    setLeaving(true);
    await leaveHousehold();
    setLeaving(false);
    setConfirmLeave(false);
    await reload();
  }

  async function handleRemoveStore(storeId: string) {
    await removeUserStore(storeId);
    const s = await getUserStores();
    setUserStores(s);
  }

  async function handleCreateHousehold() {
    setSaving(true);
    setCreateError(null);
    const result = await createHousehold();
    if ("error" in result) {
      setCreateError(result.error);
    } else {
      setHousehold(result);
    }
    setSaving(false);
  }

  async function handleJoinHousehold() {
    if (!joinCodeInput.trim()) return;
    setSaving(true);
    setJoinError(null);
    const result = await joinHousehold(joinCodeInput);
    if ("error" in result) {
      setJoinError(result.error);
    } else {
      setHousehold(result);
      setEditSheet(null);
      setJoinCodeInput("");
    }
    setSaving(false);
  }

  async function handleShareInviteCode() {
    if (!household) return;
    await Share.share({
      message: `Rejoins mon foyer sur Deazl avec le code : ${household.inviteCode}`,
    });
  }

  async function doSignOut() {
    setConfirmSignOut(false);
    await signOut();
    router.replace("/(auth)/login" as never);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#E8571C" size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9F6" }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={{ alignItems: "center", paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 }}>
          <InitialsAvatar name={profile?.fullName ?? ""} email={profile?.email ?? ""} avatarUrl={profile?.avatarUrl} />
          {profile?.fullName ? (
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917", marginTop: 16, letterSpacing: -0.3 }}>
              {profile.fullName}
            </Text>
          ) : null}
          <Text style={{ fontSize: 13, color: "#78716C", marginTop: profile?.fullName ? 2 : 16 }}>
            {profile?.email}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Card>
            <SettingRow label="Nom affiché" value={profile?.fullName ?? ""} onPress={openNameSheet} />
            <Separator />
            <SettingRow
              label="Taille du foyer"
              value={`${profile?.householdSize ?? 2} personne${(profile?.householdSize ?? 2) > 1 ? "s" : ""}`}
              onPress={openSizeSheet}
            />
            <Separator />
            <Pressable onPress={openDietarySheet} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8 }}>Régime alimentaire</Text>
                {(profile?.dietaryPreferences ?? []).length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {(profile?.dietaryPreferences ?? []).map((k) => (
                      <View key={k} style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#E8571C1a" }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: "#E8571C" }}>
                          {DIETARY_OPTIONS.find((o) => o.key === k)?.label ?? k}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917", marginTop: 2 }}>Aucune restriction</Text>
                )}
              </View>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </Pressable>
          </Card>

          <Card>
            {household ? (
              <>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Mon foyer</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ borderRadius: 10, backgroundColor: "#F5F3EF", paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: "900", color: "#1C1917", letterSpacing: 2 }}>{household.inviteCode}</Text>
                    </View>
                    <Pressable onPress={handleShareInviteCode} style={{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, backgroundColor: "#E8571C1a", paddingHorizontal: 12, paddingVertical: 6 }}>
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Circle cx={18} cy={5} r={3} />
                        <Circle cx={6} cy={12} r={3} />
                        <Circle cx={18} cy={19} r={3} />
                        <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} />
                        <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} />
                      </Svg>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#E8571C" }}>Inviter</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <Text style={{ fontSize: 11, color: "#A8A29E" }}>
                      {household.members.length} membre{household.members.length > 1 ? "s" : ""}
                    </Text>
                    <Pressable onPress={() => setConfirmLeave(true)} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: "#FEE2E2" }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#DC2626" }}>Quitter</Text>
                    </Pressable>
                  </View>
                </View>
                <Separator />
                {household.members.map((m, i) => (
                  <View key={m.userId}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: "#E8571C" }}>
                          {(m.displayName ?? m.userId)[0].toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917" }}>{m.displayName ?? "Membre"}</Text>
                    </View>
                    {i < household.members.length - 1 && <Separator />}
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Foyer</Text>
                  <Text style={{ fontSize: 13, color: "#78716C" }}>Partagez vos courses et recettes avec votre foyer.</Text>
                </View>
                {createError && (
                  <View style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 10, backgroundColor: "#FEE2E2", paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600" }}>{createError}</Text>
                  </View>
                )}
                <Separator />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>}
                  label="Créer un foyer"
                  description="Générer un code d'invitation"
                  onPress={handleCreateHousehold}
                />
                <Separator />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx={8.5} cy={7} r={4} /><Line x1={20} y1={8} x2={20} y2={14} /><Line x1={23} y1={11} x2={17} y2={11} /></Svg>}
                  label="Rejoindre un foyer"
                  description="Entrer un code d'invitation"
                  onPress={() => setEditSheet("household")}
                />
              </>
            )}
          </Card>

          <Card>
            <Pressable onPress={() => setEditSheet("stores")} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: userStores.length > 0 ? 8 : 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#A8A29E", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Mes magasins</Text>
                {userStores.length === 0 ? (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#1C1917" }}>Aucun magasin</Text>
                ) : null}
              </View>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </Pressable>
            {userStores.length > 0 && (
              <>
                {userStores.map((s, i) => (
                  <View key={s.id}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <Line x1={3} y1={6} x2={21} y2={6} />
                          <Path d="M16 10a4 4 0 0 1-8 0" />
                        </Svg>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917" }}>{s.brand ? `${s.brand} ${s.name}` : s.name}</Text>
                        <Text style={{ fontSize: 11, color: "#78716C" }}>{s.city}</Text>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveStore(s.id)}
                        hitSlop={12}
                        style={{ padding: 4 }}
                      >
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Line x1={18} y1={6} x2={6} y2={18} />
                          <Line x1={6} y1={6} x2={18} y2={18} />
                        </Svg>
                      </Pressable>
                    </View>
                    {i < userStores.length - 1 && <Separator />}
                  </View>
                ))}
                <View style={{ paddingBottom: 6 }} />
              </>
            )}
          </Card>

          <Card>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 20V10" /><Path d="M12 20V4" /><Path d="M6 20v-6" /></Svg>}
              label="Statistiques"
              description="Vos habitudes et budget alimentaire"
              onPress={() => router.push("/analytics" as never)}
            />
          </Card>

          <Card>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} /></Svg>}
              label="Déconnexion"
              onPress={() => setConfirmSignOut(true)}
              destructive
            />
          </Card>
        </View>
      </ScrollView>

      <BottomSheet isOpen={editSheet === "name"} onOpenChange={(v) => !v && setEditSheet(null)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["35%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Nom affiché</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ gap: 12 }}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Votre prénom ou pseudo"
                placeholderTextColor="#A8A29E"
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
                style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
              />
              <Button variant="primary" className="w-full rounded-2xl" onPress={handleSaveName} isDisabled={saving || !nameInput.trim()}>
                <Button.Label>{saving ? "Enregistrement…" : "Enregistrer"}</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={editSheet === "size"} onOpenChange={(v) => !v && setEditSheet(null)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["35%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Taille du foyer</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ gap: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
                <Pressable
                  onPress={() => setSizeInput((s) => Math.max(1, s - 1))}
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#F5F3EF", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={5} y1={12} x2={19} y2={12} />
                  </Svg>
                </Pressable>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 48, fontWeight: "900", color: "#1C1917", lineHeight: 56 }}>{sizeInput}</Text>
                  <Text style={{ fontSize: 13, color: "#78716C" }}>personne{sizeInput > 1 ? "s" : ""}</Text>
                </View>
                <Pressable
                  onPress={() => setSizeInput((s) => s + 1)}
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center" }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={12} y1={5} x2={12} y2={19} />
                    <Line x1={5} y1={12} x2={19} y2={12} />
                  </Svg>
                </Pressable>
              </View>
              <Button variant="primary" className="w-full rounded-2xl" onPress={handleSaveSize} isDisabled={saving}>
                <Button.Label>{saving ? "Enregistrement…" : "Enregistrer"}</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={editSheet === "dietary"} onOpenChange={(v) => !v && setEditSheet(null)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["65%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Régime alimentaire</Text>
              <BottomSheet.Close />
            </View>
            <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
              {DIETARY_OPTIONS.map((opt) => {
                const active = dietaryInput.includes(opt.key);
                return (
                  <PressableFeedback
                    key={opt.key}
                    onPress={() => toggleDietary(opt.key)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                      backgroundColor: active ? "#FFF7ED" : "#F5F3EF",
                      borderWidth: active ? 1.5 : 0, borderColor: active ? "#E8571C40" : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? "#E8571C" : "#1C1917" }}>
                      {opt.label}
                    </Text>
                    {active && (
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6 9 17l-5-5" />
                      </Svg>
                    )}
                  </PressableFeedback>
                );
              })}
              <Button variant="primary" className="w-full rounded-2xl mt-4" onPress={handleSaveDietary} isDisabled={saving}>
                <Button.Label>{saving ? "Enregistrement…" : "Enregistrer"}</Button.Label>
              </Button>
            </BottomSheetScrollView>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={editSheet === "household"} onOpenChange={(v) => !v && setEditSheet(null)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["40%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Rejoindre un foyer</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ gap: 12 }}>
              <TextInput
                value={joinCodeInput}
                onChangeText={(v) => { setJoinCodeInput(v.toUpperCase()); setJoinError(null); }}
                placeholder="Code d'invitation (ex: A3B4C5)"
                placeholderTextColor="#A8A29E"
                autoCapitalize="characters"
                style={{
                  borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14,
                  fontSize: 18, fontWeight: "700", color: "#1C1917", letterSpacing: 3, textAlign: "center",
                  borderWidth: joinError ? 1.5 : 0, borderColor: "#DC2626",
                }}
              />
              {joinError && <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600", textAlign: "center" }}>{joinError}</Text>}
              <Button variant="primary" className="w-full rounded-2xl" onPress={handleJoinHousehold} isDisabled={saving || !joinCodeInput.trim()}>
                <Button.Label>{saving ? "Rejoindre…" : "Rejoindre"}</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={editSheet === "stores"} onOpenChange={(v) => { if (!v) { setEditSheet(null); setStoreQuery(""); setStoreResults([]); } }}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["75%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Mes magasins</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                value={storeQuery}
                onChangeText={handleStoreQueryChange}
                placeholder="Rechercher un magasin…"
                placeholderTextColor="#A8A29E"
                style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917", marginBottom: 12 }}
              />
              {storeSearching && <ActivityIndicator color="#E8571C" style={{ marginBottom: 12 }} />}
              {storeQuery.trim().length > 0 && !storeSearching && storeResults.length === 0 && (
                <Pressable onPress={() => { setCreateBrand(storeQuery.trim()); setCreateStoreSheet(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, backgroundColor: "#FFF7ED", padding: 12, marginBottom: 12 }}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Line x1={12} y1={5} x2={12} y2={19} />
                    <Line x1={5} y1={12} x2={19} y2={12} />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#E8571C" }}>Créer « {storeQuery.trim()} »</Text>
                </Pressable>
              )}
              {storeResults.length > 0 && (
                <View style={{ borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E7E5E4", overflow: "hidden", marginBottom: 16 }}>
                  {storeResults.map((s, i) => (
                    <View key={s.id}>
                      <Pressable
                        onPress={() => handleAddStore(s)}
                        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917" }}>{s.brand ? `${s.brand} ${s.name}` : s.name}</Text>
                          <Text style={{ fontSize: 11, color: "#78716C" }}>{s.city}{s.address ? ` · ${s.address}` : ""}</Text>
                        </View>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Line x1={12} y1={5} x2={12} y2={19} />
                          <Line x1={5} y1={12} x2={19} y2={12} />
                        </Svg>
                      </Pressable>
                      {i < storeResults.length - 1 && <Separator />}
                    </View>
                  ))}
                </View>
              )}
              <BottomSheetScrollView contentContainerStyle={{ paddingBottom: 32, gap: 8 }}>
                {userStores.length === 0 && !storeQuery && (
                  <Text style={{ fontSize: 13, color: "#A8A29E", textAlign: "center", marginTop: 12 }}>Aucun magasin sélectionné</Text>
                )}
                {userStores.map((s) => (
                  <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 14, paddingVertical: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917" }}>{s.brand ? `${s.brand} ${s.name}` : s.name}</Text>
                      <Text style={{ fontSize: 11, color: "#78716C" }}>{s.city}</Text>
                    </View>
                    <Pressable onPress={() => handleRemoveStore(s.id)} hitSlop={12} style={{ padding: 4 }}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Line x1={18} y1={6} x2={6} y2={18} />
                        <Line x1={6} y1={6} x2={18} y2={18} />
                      </Svg>
                    </Pressable>
                  </View>
                ))}
              </BottomSheetScrollView>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={createStoreSheet} onOpenChange={(v) => { if (!v) { setCreateStoreSheet(false); setCreateStoreError(null); } }}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["55%"]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Créer un magasin</Text>
              <BottomSheet.Close />
            </View>
            <View style={{ gap: 10 }}>
              <TextInput value={createBrand} onChangeText={setCreateBrand} placeholder="Enseigne (ex: Carrefour, Lidl…)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
              <TextInput value={createCity} onChangeText={setCreateCity} placeholder="Ville *" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
              <TextInput value={createAddress} onChangeText={setCreateAddress} placeholder="Adresse (optionnel)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
              {createStoreError && <Text style={{ fontSize: 12, color: "#DC2626" }}>{createStoreError}</Text>}
              <Button variant="primary" className="w-full rounded-2xl mt-2" onPress={handleCreateStore} isDisabled={creatingStore || !createBrand.trim() || !createCity.trim()}>
                <Button.Label>{creatingStore ? "Création…" : "Créer et ajouter"}</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={confirmLeave} onOpenChange={(v) => !v && setConfirmLeave(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["32%"]}>
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Quitter le foyer ?</Text>
              <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>Vous perdrez l'accès aux listes partagées.</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Button variant="ghost" onPress={handleLeaveHousehold} isDisabled={leaving} className="w-full rounded-2xl">
                <Button.Label style={{ color: "#DC2626" }}>{leaving ? "Départ…" : "Quitter le foyer"}</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => setConfirmLeave(false)} className="w-full rounded-2xl">
                <Button.Label>Annuler</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      <BottomSheet isOpen={confirmSignOut} onOpenChange={(v) => !v && setConfirmSignOut(false)}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content snapPoints={["30%"]}>
            <View style={{ alignItems: "center", paddingVertical: 16, gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Déconnexion</Text>
              <Text style={{ fontSize: 13, color: "#78716C" }}>Es-tu sûr de vouloir te déconnecter ?</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Button variant="ghost" onPress={doSignOut} className="w-full rounded-2xl">
                <Button.Label style={{ color: "#DC2626" }}>Se déconnecter</Button.Label>
              </Button>
              <Button variant="secondary" onPress={() => setConfirmSignOut(false)} className="w-full rounded-2xl">
                <Button.Label>Annuler</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </SafeAreaView>
  );
}
