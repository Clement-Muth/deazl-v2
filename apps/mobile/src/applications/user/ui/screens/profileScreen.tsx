import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";
import { addUserStore } from "../../application/useCases/addUserStore";
import { changeEmail } from "../../application/useCases/changeEmail";
import { changePassword } from "../../application/useCases/changePassword";
import { createStoreManual } from "../../application/useCases/createStore";
import { createHousehold } from "../../application/useCases/createHousehold";
import { deleteAccount } from "../../application/useCases/deleteAccount";
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
import { uploadAvatar } from "../../application/useCases/uploadAvatar";
import { supabase } from "../../../../lib/supabase";
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed ? "#FAFAF8" : "#fff",
      })}
    >
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed ? "#FAFAF8" : "#fff",
      })}
    >
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

  const [editSheet, setEditSheet] = useState<"name" | "size" | "dietary" | "household" | "stores" | "password" | "email" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [sizeInput, setSizeInput] = useState(2);
  const [dietaryInput, setDietaryInput] = useState<string[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    const { url } = await uploadAvatar(result.assets[0].uri);
    if (url) setProfile((prev) => prev ? { ...prev, avatarUrl: url } : prev);
    setUploadingAvatar(false);
  }

  async function handleChangeEmail() {
    if (!emailInput.trim()) return;
    setSaving(true);
    setEmailError(null);
    const newEmail = emailInput.trim();
    const result = await changeEmail(newEmail);
    setSaving(false);
    if (result.error) {
      setEmailError(result.error);
    } else {
      setEmailSent(true);
      setProfile((prev) => prev ? { ...prev, pendingEmail: newEmail } : prev);
    }
  }

  async function handleChangePassword() {
    if (!currentPasswordInput) {
      setPasswordError("Saisis ton mot de passe actuel.");
      return;
    }
    if (passwordInput.length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSaving(true);
    setPasswordError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile?.email ?? "",
      password: currentPasswordInput,
    });
    if (authError) {
      setPasswordError("Mot de passe actuel incorrect.");
      setSaving(false);
      return;
    }
    const result = await changePassword(passwordInput);
    setSaving(false);
    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess(true);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      router.replace("/(auth)/login" as never);
    }
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
          <Pressable onPress={handlePickAvatar} style={{ position: "relative" }}>
            <InitialsAvatar name={profile?.fullName ?? ""} email={profile?.email ?? ""} avatarUrl={profile?.avatarUrl} />
            <View style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: "#E8571C", borderWidth: 2, borderColor: "#FAF9F6",
              alignItems: "center", justifyContent: "center",
            }}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <Polyline points="17 8 12 3 7 8" />
                    <Line x1={12} y1={3} x2={12} y2={15} />
                  </Svg>
              }
            </View>
          </Pressable>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#1C1917", marginTop: 16, letterSpacing: -0.3 }}>
            {profile?.fullName || "Nom non renseigné"}
          </Text>
          <Text style={{ fontSize: 13, color: "#78716C", marginTop: 2 }}>
            {profile?.email}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            <SettingRow label="Nom affiché" value={profile?.fullName ?? ""} onPress={openNameSheet} />
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <SettingRow
              label="Nombre de personnes"
              value={`${profile?.householdSize ?? 2} personne${(profile?.householdSize ?? 2) > 1 ? "s" : ""}`}
              onPress={openSizeSheet}
            />
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <SettingRow
              label="Mot de passe"
              value="••••••••"
              onPress={() => { setCurrentPasswordInput(""); setPasswordInput(""); setConfirmPasswordInput(""); setPasswordError(null); setPasswordSuccess(false); setEditSheet("password"); }}
            />
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <SettingRow
              label="Adresse email"
              value={profile?.email ?? ""}
              onPress={() => { setEmailInput(""); setEmailError(null); setEmailSent(false); setEditSheet("email"); }}
            />
            {profile?.pendingEmail && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFFBEB" }}>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Circle cx={12} cy={12} r={10} />
                  <Line x1={12} y1={8} x2={12} y2={12} />
                  <Line x1={12} y1={16} x2={12.01} y2={16} />
                </Svg>
                <Text style={{ flex: 1, fontSize: 12, color: "#D97706", fontWeight: "500" }}>
                  En attente de confirmation : {profile.pendingEmail}
                </Text>
              </View>
            )}
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <Pressable
              onPress={openDietarySheet}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 16, paddingVertical: 14,
                backgroundColor: pressed ? "#FAFAF8" : "#fff",
              })}
            >
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
          </View>

          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            {household ? (
              <>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
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
                  <Text style={{ fontSize: 11, color: "#A8A29E", marginTop: 6 }}>
                    {household.members.length} membre{household.members.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
                {household.members.map((m, i) => {
                  const isMe = m.userId === profile?.id;
                  return (
                    <View key={m.userId}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 13, fontWeight: "900", color: "#E8571C" }}>
                            {(m.displayName ?? m.userId)[0].toUpperCase()}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1C1917", flex: 1 }}>{m.displayName ?? "Membre"}</Text>
                        {isMe && (
                          <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#F5F3EF" }}>
                            <Text style={{ fontSize: 11, fontWeight: "600", color: "#A8A29E" }}>moi</Text>
                          </View>
                        )}
                      </View>
                      {i < household.members.length - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />}
                    </View>
                  );
                })}
                <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} /></Svg>}
                  label="Quitter le foyer"
                  onPress={() => setConfirmLeave(true)}
                  destructive
                />
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
                <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
                <NavRow
                  icon={saving
                    ? <ActivityIndicator size="small" color="#E8571C" />
                    : <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>}
                  label={saving ? "Création…" : "Créer un foyer"}
                  description="Générer un code d'invitation"
                  onPress={saving ? () => {} : handleCreateHousehold}
                />
                <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx={8.5} cy={7} r={4} /><Line x1={20} y1={8} x2={20} y2={14} /><Line x1={23} y1={11} x2={17} y2={11} /></Svg>}
                  label="Rejoindre un foyer"
                  description="Entrer un code d'invitation"
                  onPress={() => setEditSheet("household")}
                />
              </>
            )}
          </View>

          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            <Pressable
              onPress={() => setEditSheet("stores")}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 16, paddingTop: 14, paddingBottom: userStores.length > 0 ? 8 : 14,
                backgroundColor: pressed ? "#FAFAF8" : "#fff",
              })}
            >
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
                      <Pressable onPress={() => handleRemoveStore(s.id)} hitSlop={12} style={{ padding: 4 }}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Line x1={18} y1={6} x2={6} y2={18} />
                          <Line x1={6} y1={6} x2={18} y2={18} />
                        </Svg>
                      </Pressable>
                    </View>
                    {i < userStores.length - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />}
                  </View>
                ))}
                <View style={{ paddingBottom: 6 }} />
              </>
            )}
          </View>

          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 20V10" /><Path d="M12 20V4" /><Path d="M6 20v-6" /></Svg>}
              label="Statistiques"
              description="Vos habitudes et budget alimentaire"
              onPress={() => router.push("/analytics" as never)}
            />
          </View>

          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} /></Svg>}
              label="Déconnexion"
              onPress={() => setConfirmSignOut(true)}
              destructive
            />
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><Path d="M10 11v6M14 11v6" /><Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Svg>}
              label="Supprimer mon compte"
              onPress={() => { setDeleteError(null); setConfirmDelete(true); }}
              destructive
            />
          </View>

          <View style={{ borderRadius: 14, backgroundColor: "#fff", overflow: "hidden" }}>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1={16} y1={13} x2={8} y2={13} /><Line x1={16} y1={17} x2={8} y2={17} /><Polyline points="10 9 9 9 8 9" /></Svg>}
              label="Conditions d'utilisation"
              onPress={() => Linking.openURL("https://deazl.fr/conditions")}
            />
            <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>}
              label="Politique de confidentialité"
              onPress={() => Linking.openURL("https://deazl.fr/confidentialite")}
            />
          </View>

          <Text style={{ fontSize: 11, color: "#C4B8AF", textAlign: "center", marginTop: 4 }}>
            Deazl v{Constants.expoConfig?.version ?? "—"}
          </Text>
        </View>
      </ScrollView>

      <BottomModal isOpen={editSheet === "name"} onClose={() => setEditSheet(null)} height="35%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Nom affiché</Text>
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
          <Pressable
            onPress={handleSaveName}
            disabled={saving || !nameInput.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving || !nameInput.trim() ? "#F5F3EF" : "#E8571C", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !nameInput.trim() ? "#A8A29E" : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "size"} onClose={() => setEditSheet(null)} height="35%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Taille du foyer</Text>
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
          <Pressable
            onPress={handleSaveSize}
            disabled={saving}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving ? "#F5F3EF" : "#E8571C", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving ? "#A8A29E" : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "dietary"} onClose={() => setEditSheet(null)} height="65%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Régime alimentaire</Text>
        <BottomModalScrollView contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
          {DIETARY_OPTIONS.map((opt) => {
            const active = dietaryInput.includes(opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => toggleDietary(opt.key)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
                  backgroundColor: pressed ? "#F0EDE8" : active ? "#FFF7ED" : "#F5F3EF",
                  borderWidth: active ? 1.5 : 0, borderColor: active ? "#E8571C40" : "transparent",
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? "#E8571C" : "#1C1917" }}>
                  {opt.label}
                </Text>
                {active && (
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6 9 17l-5-5" />
                  </Svg>
                )}
              </Pressable>
            );
          })}
          <Pressable
            onPress={handleSaveDietary}
            disabled={saving}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving ? "#F5F3EF" : "#E8571C", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1, marginTop: 4 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving ? "#A8A29E" : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </BottomModalScrollView>
      </BottomModal>

      <BottomModal isOpen={editSheet === "household"} onClose={() => setEditSheet(null)} height="40%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Rejoindre un foyer</Text>
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
          <Pressable
            onPress={handleJoinHousehold}
            disabled={saving || !joinCodeInput.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving || !joinCodeInput.trim() ? "#F5F3EF" : "#E8571C", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !joinCodeInput.trim() ? "#A8A29E" : "#fff" }}>{saving ? "Rejoindre…" : "Rejoindre"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "stores"} onClose={() => { setEditSheet(null); setStoreQuery(""); setStoreResults([]); }} height="75%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Mes magasins</Text>
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
                {i < storeResults.length - 1 && <View style={{ height: 1, backgroundColor: "#F5F3EF" }} />}
              </View>
            ))}
          </View>
        )}
        <BottomModalScrollView contentContainerStyle={{ paddingBottom: 32, gap: 8 }}>
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
        </BottomModalScrollView>
      </BottomModal>

      <BottomModal isOpen={createStoreSheet} onClose={() => { setCreateStoreSheet(false); setCreateStoreError(null); }} height="55%">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Créer un magasin</Text>
        <View style={{ gap: 10 }}>
          <TextInput value={createBrand} onChangeText={setCreateBrand} placeholder="Enseigne (ex: Carrefour, Lidl…)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
          <TextInput value={createCity} onChangeText={setCreateCity} placeholder="Ville *" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
          <TextInput value={createAddress} onChangeText={setCreateAddress} placeholder="Adresse (optionnel)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#1C1917" }} />
          {createStoreError && <Text style={{ fontSize: 12, color: "#DC2626" }}>{createStoreError}</Text>}
          <Pressable
            onPress={handleCreateStore}
            disabled={creatingStore || !createBrand.trim() || !createCity.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: creatingStore || !createBrand.trim() || !createCity.trim() ? "#F5F3EF" : "#E8571C", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1, marginTop: 2 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: creatingStore || !createBrand.trim() || !createCity.trim() ? "#A8A29E" : "#fff" }}>{creatingStore ? "Création…" : "Créer et ajouter"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={confirmLeave} onClose={() => setConfirmLeave(false)} height="32%">
        <View style={{ alignItems: "center", marginBottom: 20, gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Quitter le foyer ?</Text>
          <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>Vous perdrez l'accès aux listes partagées.</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={handleLeaveHousehold}
            disabled={leaving}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#FEE2E2", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>{leaving ? "Départ…" : "Quitter le foyer"}</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmLeave(false)}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#F5F3EF", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1917" }}>Annuler</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "email"} onClose={() => { setEditSheet(null); setEmailSent(false); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Changer l'email</Text>
        {emailSent ? (
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6 9 17l-5-5" />
              </Svg>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }}>Email de confirmation envoyé</Text>
            <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>
              Clique sur le lien dans l'email envoyé à {emailInput} pour valider le changement.
            </Text>
            <Pressable
              onPress={() => { setEditSheet(null); setEmailSent(false); }}
              style={({ pressed }) => ({ marginTop: 8, borderRadius: 16, backgroundColor: pressed ? "#D14A18" : "#E8571C", paddingVertical: 14, paddingHorizontal: 32, alignItems: "center" })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Fermer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TextInput
              value={emailInput}
              onChangeText={(v) => { setEmailInput(v); setEmailError(null); }}
              placeholder="Nouvel email"
              placeholderTextColor="#A8A29E"
              keyboardType="email-address"
              autoCapitalize="none"
              onSubmitEditing={handleChangeEmail}
              returnKeyType="done"
              style={{
                borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917",
                borderWidth: emailError ? 1.5 : 0, borderColor: "#DC2626",
              }}
            />
            {emailError && <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600" }}>{emailError}</Text>}
            <Pressable
              onPress={handleChangeEmail}
              disabled={saving || !emailInput.trim()}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center",
                backgroundColor: saving || !emailInput.trim() ? "#F5F3EF" : pressed ? "#D14A18" : "#E8571C",
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !emailInput.trim() ? "#A8A29E" : "#fff" }}>
                {saving ? "Envoi…" : "Envoyer la confirmation"}
              </Text>
            </Pressable>
          </View>
        )}
      </BottomModal>

      <BottomModal isOpen={editSheet === "password"} onClose={() => { setEditSheet(null); setPasswordSuccess(false); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917", marginBottom: 16 }}>Changer le mot de passe</Text>
        {passwordSuccess ? (
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6 9 17l-5-5" />
              </Svg>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#1C1917" }}>Mot de passe modifié</Text>
            <Pressable
              onPress={() => { setEditSheet(null); setPasswordSuccess(false); }}
              style={({ pressed }) => ({ marginTop: 8, borderRadius: 16, backgroundColor: pressed ? "#D14A18" : "#E8571C", paddingVertical: 14, paddingHorizontal: 32 })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Fermer</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            <TextInput
              value={currentPasswordInput}
              onChangeText={(v) => { setCurrentPasswordInput(v); setPasswordError(null); }}
              placeholder="Mot de passe actuel"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              style={{
                borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917",
                borderWidth: passwordError === "Mot de passe actuel incorrect." ? 1.5 : 0, borderColor: "#DC2626",
              }}
            />
            <View style={{ height: 1, backgroundColor: "#F5F3EF", marginHorizontal: -20 }} />
            <TextInput
              value={passwordInput}
              onChangeText={(v) => { setPasswordInput(v); setPasswordError(null); }}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              style={{ borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917" }}
            />
            <TextInput
              value={confirmPasswordInput}
              onChangeText={(v) => { setConfirmPasswordInput(v); setPasswordError(null); }}
              placeholder="Confirmer le nouveau mot de passe"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              onSubmitEditing={handleChangePassword}
              returnKeyType="done"
              style={{
                borderRadius: 14, backgroundColor: "#F5F3EF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#1C1917",
                borderWidth: passwordError && passwordError !== "Mot de passe actuel incorrect." ? 1.5 : 0, borderColor: "#DC2626",
              }}
            />
            {passwordError && <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600" }}>{passwordError}</Text>}
            <Pressable
              onPress={handleChangePassword}
              disabled={saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim()}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 2,
                backgroundColor: saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim() ? "#F5F3EF" : pressed ? "#D14A18" : "#E8571C",
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim() ? "#A8A29E" : "#fff" }}>
                {saving ? "Vérification…" : "Modifier le mot de passe"}
              </Text>
            </Pressable>
          </View>
        )}
      </BottomModal>

      <BottomModal isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} height="auto">
        <View style={{ alignItems: "center", marginBottom: 20, gap: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Supprimer mon compte</Text>
          <Text style={{ fontSize: 13, color: "#78716C", textAlign: "center" }}>
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
          </Text>
        </View>
        {deleteError && (
          <View style={{ borderRadius: 10, backgroundColor: "#FEE2E2", paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, color: "#DC2626", fontWeight: "600" }}>{deleteError}</Text>
          </View>
        )}
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={handleDeleteAccount}
            disabled={deleting}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#FEE2E2", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>
              {deleting ? "Suppression…" : "Supprimer définitivement"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmDelete(false)}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#F5F3EF", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1917" }}>Annuler</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={confirmSignOut} onClose={() => setConfirmSignOut(false)} height="30%">
        <View style={{ alignItems: "center", marginBottom: 20, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#1C1917" }}>Déconnexion</Text>
          <Text style={{ fontSize: 13, color: "#78716C" }}>Es-tu sûr de vouloir te déconnecter ?</Text>
        </View>
        <View style={{ gap: 8 }}>
          <Pressable
            onPress={doSignOut}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#FEE2E2", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>Se déconnecter</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmSignOut(false)}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: "#F5F3EF", paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1C1917" }}>Annuler</Text>
          </Pressable>
        </View>
      </BottomModal>
    </SafeAreaView>
  );
}
