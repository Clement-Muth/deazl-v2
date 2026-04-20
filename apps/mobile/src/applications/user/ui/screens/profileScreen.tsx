import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { BottomModal, BottomModalScrollView } from "../../../shopping/ui/components/bottomModal";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Image, Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { Button, Dialog } from "heroui-native";
import { addUserStore } from "../../application/useCases/addUserStore";
import { getBatchCookingMargin, setBatchCookingMargin, DEFAULT_MARGIN } from "../../../recipe/application/useCases/batchCookingMarginStore";
import { addUserStoreFromOSM } from "../../application/useCases/addUserStoreFromOSM";
import type { OSMStore } from "../../application/useCases/searchStoresOSM";
import { searchStoresOSMByText, searchStoresOSMNearby } from "../../application/useCases/searchStoresOSM";
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
import { getBadgeStats, type BadgeStats } from "../../application/useCases/getBadgeStats";
import { BADGE_DEFINITIONS, BADGE_GROUPS, getBadgesByGroup } from "../../domain/badges";
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
import { useAppTheme, type ThemePreference } from "../../../../shared/theme";

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
  const { colors } = useAppTheme();
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
      backgroundColor: colors.accent, alignItems: "center", justifyContent: "center",
      shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    }}>
      <Text style={{ fontSize: size * 0.35, fontWeight: "900", color: "#fff" }}>{initials}</Text>
    </View>
  );
}

function SettingRow({ label, value, description, onPress }: { label: string; value: string; description?: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
      })}
    >
      <View>
        <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 2 }}>{value || "Non renseigné"}</Text>
        {description && <Text style={{ fontSize: 11, color: colors.textSubtle, marginTop: 2 }}>{description}</Text>}
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
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 12,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
      })}
    >
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: destructive ? colors.dangerBg : colors.bgSurface, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: destructive ? colors.danger : colors.text }}>{label}</Text>
        {description && <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{description}</Text>}
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
  const { colors, preference, setPreference } = useAppTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [unlockedBadgeKeys, setUnlockedBadgeKeys] = useState<string[]>([]);
  const [badgeStats, setBadgeStats] = useState<BadgeStats | null>(null);
  const [selectedBadgeGroup, setSelectedBadgeGroup] = useState<string | null>(null);
  const [userStores, setUserStores] = useState<UserStore[]>([]);
  const [loading, setLoading] = useState(true);

  const [editSheet, setEditSheet] = useState<"name" | "size" | "dietary" | "household" | "stores" | "password" | "email" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [sizeInput, setSizeInput] = useState(2);
  const [dietaryInput, setDietaryInput] = useState<string[]>([]);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const joinQrScannedRef = useRef(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [createError, setCreateError] = useState<string | null>(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [storeQuery, setStoreQuery] = useState("");
  const [storeResults, setStoreResults] = useState<StoreResult[]>([]);
  const [osmResults, setOsmResults] = useState<OSMStore[]>([]);
  const [storeSearching, setStoreSearching] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [addingStoreId, setAddingStoreId] = useState<string | null>(null);
  const [storeError, setStoreError] = useState<string | null>(null);
  const storeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createStoreSheet, setCreateStoreSheet] = useState(false);
  const [createBrand, setCreateBrand] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  const [createStoreError, setCreateStoreError] = useState<string | null>(null);
  const [removeDialogStore, setRemoveDialogStore] = useState<{ id: string; displayName: string } | null>(null);
  const [margin, setMarginState] = useState(DEFAULT_MARGIN);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function reload() {
    const [p, h, s, bs, m] = await Promise.all([getProfile(), getHousehold(), getUserStores(), getBadgeStats(), getBatchCookingMargin()]);
    setProfile(p);
    setHousehold(h);
    setUnlockedBadgeKeys(bs.unlockedKeys);
    setBadgeStats(bs);
    setUserStores(s);
    setMarginState(m);
  }

  async function handleMarginChange(delta: number) {
    const next = Math.min(0.5, Math.max(0, Math.round((margin + delta) * 20) / 20));
    setMarginState(next);
    await setBatchCookingMargin(next);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") reload();
    });
    return () => sub.remove();
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
    setOsmResults([]);
    if (storeDebounce.current) clearTimeout(storeDebounce.current);
    if (!q.trim()) { setStoreResults([]); return; }
    storeDebounce.current = setTimeout(async () => {
      setStoreSearching(true);
      const [internal, osm] = await Promise.all([searchStores(q), searchStoresOSMByText(q)]);
      setStoreResults(internal);
      setOsmResults(osm);
      setStoreSearching(false);
    }, 400);
  }

  async function handleNearbyStores() {
    setGeolocating(true);
    setStoreQuery("");
    setStoreResults([]);
    setOsmResults([]);
    setStoreError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setStoreError("Autorise la localisation dans les réglages pour utiliser cette fonctionnalité");
        return;
      }
      const cached = await Location.getLastKnownPositionAsync();
      const loc = cached ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const { results, error } = await searchStoresOSMNearby(loc.coords.latitude, loc.coords.longitude);
      if (error) setStoreError(error);
      setOsmResults(results);
    } catch {
      setStoreError("Impossible de récupérer ta position");
    } finally {
      setGeolocating(false);
    }
  }

  async function handleAddStore(store: StoreResult) {
    setAddingStoreId(store.id);
    await addUserStore(store.id);
    const s = await getUserStores();
    setUserStores(s);
    setAddingStoreId(null);
  }

  async function handleAddOSMStore(store: OSMStore) {
    setAddingStoreId(store.osmId);
    await addUserStoreFromOSM(store);
    const s = await getUserStores();
    setUserStores(s);
    setAddingStoreId(null);
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

  async function handleQrScan(data: string) {
    if (joinQrScannedRef.current) return;
    joinQrScannedRef.current = true;
    const match = data.match(/deazl:\/\/join\/([A-Z0-9]+)/i);
    const code = match ? match[1].toUpperCase() : data.trim().toUpperCase();
    setShowQrScanner(false);
    setJoinCodeInput(code);
    setJoinError(null);
    setSaving(true);
    const result = await joinHousehold(code);
    setSaving(false);
    if ("error" in result) {
      setJoinError(result.error);
      joinQrScannedRef.current = false;
    } else {
      await reload();
      setEditSheet(null);
    }
  }

  async function openQrScanner() {
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) return;
    }
    joinQrScannedRef.current = false;
    setShowQrScanner(true);
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
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setUploadingAvatar(true);
    const { url } = await uploadAvatar(result.assets[0].base64);
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
      setProfile((prev) => prev ? { ...prev, pendingEmail: newEmail } : prev);
      setEditSheet(null);
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
    await signOut();
    router.replace("/(auth)/login" as never);
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        <View style={{ alignItems: "center", paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 }}>
          <Pressable onPress={handlePickAvatar} style={{ position: "relative" }}>
            <InitialsAvatar name={profile?.fullName ?? ""} email={profile?.email ?? ""} avatarUrl={profile?.avatarUrl} />
            <View style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: 13,
              backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.bg,
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
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.text, marginTop: 16, letterSpacing: -0.3 }}>
            {profile?.fullName || "Nom non renseigné"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
            {profile?.email}
          </Text>
          {unlockedBadgeKeys.length > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: colors.bgSurface, borderRadius: 99 }}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </Svg>
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted }}>
                {unlockedBadgeKeys.length} badge{unlockedBadgeKeys.length > 1 ? "s" : ""} débloqué{unlockedBadgeKeys.length > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* ── Mes badges ── */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 14, letterSpacing: -0.3 }}>
            Mes badges
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
            {BADGE_GROUPS.map((group) => {
              const levels = getBadgesByGroup(group.group);
              const unlockedLevels = levels.filter((b) => unlockedBadgeKeys.includes(b.key));
              const isUnlocked = unlockedLevels.length > 0;
              const topUnlocked = unlockedLevels[unlockedLevels.length - 1];
              const badge = topUnlocked ?? levels[0];
              return (
                <Pressable
                  key={group.group}
                  onPress={() => setSelectedBadgeGroup(group.group)}
                  style={({ pressed }) => ({
                    width: 96, height: 112,
                    borderRadius: 18,
                    backgroundColor: isUnlocked ? badge.color + "18" : colors.bgSurface,
                    borderWidth: 1.5,
                    borderColor: isUnlocked ? badge.color + "40" : colors.border,
                    alignItems: "center", justifyContent: "center", padding: 10, gap: 8,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: isUnlocked ? badge.color + "25" : colors.border,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {isUnlocked ? (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </Svg>
                    ) : (
                      <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0" /><Path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" /><Path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8" /><Path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                      </Svg>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, fontWeight: "800", color: isUnlocked ? badge.color : colors.textSubtle, textAlign: "center", lineHeight: 14 }} numberOfLines={2}>
                    {group.name}
                  </Text>
                  <Text style={{ fontSize: 8, fontWeight: "600", color: isUnlocked ? badge.color + "cc" : colors.textSubtle, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.5 }} numberOfLines={1}>
                    {isUnlocked ? `Niv. ${unlockedLevels.length}` : "Verrouillé"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {(() => {
            if (!badgeStats) return null;
            const statMap: Record<string, { current: number; total: number }> = {
              batch_cooker_1: { current: badgeStats.totalSessions, total: 1 },
              batch_cooker_2: { current: badgeStats.totalSessions, total: 5 },
              batch_cooker_3: { current: badgeStats.totalSessions, total: 10 },
              monthly_goal_1: { current: badgeStats.sessionsThisMonth, total: badgeStats.monthlyGoal },
              full_week_1: { current: badgeStats.fullWeeksCount, total: 1 },
              full_week_2: { current: badgeStats.fullWeeksCount, total: 4 },
              full_week_3: { current: badgeStats.fullWeeksCount, total: 10 },
              streak_1: { current: badgeStats.currentStreak, total: 7 },
              streak_2: { current: badgeStats.currentStreak, total: 30 },
              streak_3: { current: badgeStats.currentStreak, total: 100 },
              shopper_1: { current: badgeStats.shoppingListsCompleted, total: 1 },
              shopper_2: { current: badgeStats.shoppingListsCompleted, total: 5 },
              shopper_3: { current: badgeStats.shoppingListsCompleted, total: 20 },
            };
            const nudge = BADGE_DEFINITIONS
              .filter((b) => !unlockedBadgeKeys.includes(b.key))
              .map((b) => {
                const s = statMap[b.key];
                if (!s || s.current === 0) return null;
                return { badge: b, current: s.current, total: s.total, pct: s.current / s.total };
              })
              .filter((n): n is NonNullable<typeof n> => n !== null && n.pct > 0.6 && n.pct < 1)
              .sort((a, b) => b.pct - a.pct)[0];
            if (!nudge) return null;
            return (
              <Pressable
                onPress={() => setSelectedBadgeGroup(nudge.badge.group)}
                style={({ pressed }) => ({
                  marginTop: 12, borderRadius: 16,
                  backgroundColor: nudge.badge.color + "12",
                  borderWidth: 1.5, borderColor: nudge.badge.color + "30",
                  padding: 14, opacity: pressed ? 0.75 : 1,
                })}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={nudge.badge.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                    <Path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2" />
                  </Svg>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: nudge.badge.color, flex: 1 }}>
                    Presque là — {nudge.badge.name}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: nudge.badge.color }}>
                    {nudge.current}/{nudge.total}
                  </Text>
                </View>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: nudge.badge.color + "20" }}>
                  <View style={{ height: 6, borderRadius: 99, backgroundColor: nudge.badge.color, width: `${Math.min(nudge.pct * 100, 100)}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: nudge.badge.color + "99", marginTop: 6 }}>
                  {nudge.badge.criteriaLabel}
                </Text>
              </Pressable>
            );
          })()}
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            <SettingRow label="Nom affiché" value={profile?.fullName ?? ""} onPress={openNameSheet} />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <SettingRow
              label="Portions par repas"
              value={`${profile?.householdSize ?? 2} personne${(profile?.householdSize ?? 2) > 1 ? "s" : ""}`}
              description="Adapte les quantités dans tes recettes"
              onPress={openSizeSheet}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <SettingRow
              label="Mot de passe"
              value="••••••••"
              onPress={() => { setCurrentPasswordInput(""); setPasswordInput(""); setConfirmPasswordInput(""); setPasswordError(null); setPasswordSuccess(false); setEditSheet("password"); }}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <SettingRow
              label="Adresse email"
              value={profile?.email ?? ""}
              onPress={() => { setEmailInput(""); setEmailError(null); setEditSheet("email"); }}
            />
            {profile?.pendingEmail && (
              <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFFBEB", gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Circle cx={12} cy={12} r={10} />
                    <Line x1={12} y1={8} x2={12} y2={12} />
                    <Line x1={12} y1={16} x2={12.01} y2={16} />
                  </Svg>
                  <Text style={{ flex: 1, fontSize: 12, color: "#D97706", fontWeight: "500" }}>
                    En attente de confirmation : {profile.pendingEmail}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Pressable
                    disabled={resending || resent}
                    onPress={async () => {
                      setResending(true);
                      setResendError(null);
                      const result = await changeEmail(profile.pendingEmail!);
                      setResending(false);
                      if (result.error) {
                        setResendError(result.error);
                      } else {
                        setResent(true);
                        setTimeout(() => setResent(false), 3000);
                      }
                    }}
                    style={({ pressed }) => ({ alignSelf: "flex-start", opacity: pressed || resending || resent ? 0.6 : 1 })}
                  >
                    {resending ? (
                      <ActivityIndicator size="small" color="#D97706" />
                    ) : (
                      <Text style={{ fontSize: 12, color: "#D97706", fontWeight: "600", textDecorationLine: resent ? "none" : "underline" }}>
                        {resent ? "Email renvoyé ✓" : "Renvoyer l'email"}
                      </Text>
                    )}
                  </Pressable>
                </View>
                {resendError && (
                  <Text style={{ fontSize: 11, color: colors.danger }}>{resendError}</Text>
                )}
              </View>
            )}
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <Pressable
              onPress={openDietarySheet}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                paddingHorizontal: 16, paddingVertical: 14,
                backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
              })}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>Régime alimentaire</Text>
                {(profile?.dietaryPreferences ?? []).length > 0 ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {(profile?.dietaryPreferences ?? []).map((k) => (
                      <View key={k} style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#E8571C1a" }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>
                          {DIETARY_OPTIONS.find((o) => o.key === k)?.label ?? k}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginTop: 2 }}>Aucune restriction</Text>
                )}
              </View>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </Pressable>
          </View>

          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            {household ? (
              <>
                <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>Mon foyer</Text>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle }}>
                    {household.members.length} membre{household.members.length > 1 ? "s" : ""}
                  </Text>
                </View>
                {household.members.slice(0, 4).map((m, i) => {
                  const isMe = m.userId === profile?.id;
                  const isCreator = m.userId === household.createdBy;
                  return (
                    <View key={m.userId}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 11 }}>
                        <InitialsAvatar
                          name={m.displayName ?? ""}
                          email={m.userId}
                          avatarUrl={m.avatarUrl}
                          size={38}
                        />
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 }}>{m.displayName ?? "Membre"}</Text>
                        <View style={{ flexDirection: "row", gap: 5 }}>
                          {isCreator && (
                            <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#E8571C1a" }}>
                              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent }}>créateur</Text>
                            </View>
                          )}
                          {isMe && (
                            <View style={{ borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: colors.bgSurface }}>
                              <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSubtle }}>moi</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {i < Math.min(household.members.length, 4) - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface }} />}
                    </View>
                  );
                })}
                {household.members.length > 4 && (
                  <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
                    <Text style={{ fontSize: 13, color: colors.textSubtle, fontWeight: "500" }}>
                      +{household.members.length - 4} autre{household.members.length - 4 > 1 ? "s" : ""} membre{household.members.length - 4 > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Circle cx={18} cy={5} r={3} /><Circle cx={6} cy={12} r={3} /><Circle cx={18} cy={19} r={3} /><Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} /><Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} /></Svg>}
                  label="Inviter quelqu'un"
                  description="Partager le code d'invitation"
                  onPress={() => setShowInviteModal(true)}
                />
                <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
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
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Foyer</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>Partage ta liste de courses et ton planning avec d'autres utilisateurs Deazl.</Text>
                </View>
                {createError && (
                  <View style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 10, backgroundColor: colors.dangerBg, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.danger, fontWeight: "600" }}>{createError}</Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
                <Pressable
                  onPress={saving ? undefined : handleCreateHousehold}
                  style={({ pressed }) => ({
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingHorizontal: 16, paddingVertical: 14,
                    backgroundColor: pressed ? colors.accentBg : colors.accentBg,
                  })}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#E8571C1a", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {saving
                      ? <ActivityIndicator size="small" color="#E8571C" />
                      : <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" /></Svg>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>{saving ? "Création…" : "Créer un foyer"}</Text>
                    <Text style={{ fontSize: 11, color: "#E8571C99", marginTop: 1 }}>Générer un code d'invitation</Text>
                  </View>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C60" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Polyline points="9 18 15 12 9 6" />
                  </Svg>
                </Pressable>
                <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
                <NavRow
                  icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle cx={8.5} cy={7} r={4} /><Line x1={20} y1={8} x2={20} y2={14} /><Line x1={23} y1={11} x2={17} y2={11} /></Svg>}
                  label="Rejoindre un foyer"
                  description="Entrer un code d'invitation"
                  onPress={() => setEditSheet("household")}
                />
              </>
            )}
          </View>

          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            <Pressable
              onPress={() => setEditSheet("stores")}
              style={({ pressed }) => ({
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingHorizontal: 16, paddingTop: 14, paddingBottom: userStores.length > 0 ? 10 : 14,
                backgroundColor: pressed ? colors.bgSubtle : colors.bgCard,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: userStores.length > 0 ? 0 : 4 }}>Mes magasins</Text>
                {userStores.length === 0 && <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSubtle, marginTop: 2 }}>Aucun magasin sélectionné</Text>}
              </View>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Polyline points="9 18 15 12 9 6" />
              </Svg>
            </Pressable>
            {userStores.length > 0 && (
              <>
                {userStores.map((s, i) => (
                  <View key={s.id}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <Line x1={3} y1={6} x2={21} y2={6} />
                          <Path d="M16 10a4 4 0 0 1-8 0" />
                        </Svg>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} — ${s.name}` : s.name}</Text>
                        {s.city ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>{s.city}</Text> : null}
                      </View>
                    </View>
                    {i < userStores.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface }} />}
                  </View>
                ))}
                <View style={{ paddingBottom: 4 }} />
              </>
            )}
          </View>

          <View style={{ marginBottom: 0 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, paddingHorizontal: 16, marginBottom: 10 }}>
              Apparence
            </Text>
            <View style={{ borderRadius: 20, backgroundColor: colors.bgCard, overflow: "hidden", marginHorizontal: 0, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
              <View style={{ flexDirection: "row", padding: 8, gap: 4 }}>
                {([
                  { value: "auto" as ThemePreference, label: "Auto", icon: "🌗" },
                  { value: "light" as ThemePreference, label: "Clair", icon: "☀️" },
                  { value: "dark" as ThemePreference, label: "Sombre", icon: "🌙" },
                ] as const).map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPreference(opt.value)}
                    style={{
                      flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center", gap: 4,
                      backgroundColor: preference === opt.value ? colors.accent : "transparent",
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: preference === opt.value ? "#fff" : colors.textMuted }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginBottom: 0 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textMuted + "99", textTransform: "uppercase", letterSpacing: 2, paddingHorizontal: 16, marginBottom: 10 }}>
              Batch cooking
            </Text>
            <View style={{ borderRadius: 20, backgroundColor: colors.bgCard, overflow: "hidden", shadowColor: colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
                <View>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8 }}>Marge de revente</Text>
                  <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>Appliquée au coût des ingrédients</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Pressable onPress={() => handleMarginChange(-0.05)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: colors.textMuted }}>−</Text>
                  </Pressable>
                  <View style={{ minWidth: 52, alignItems: "center" }}>
                    <Text style={{ fontSize: 17, fontWeight: "900", color: colors.accent }}>{Math.round(margin * 100)}%</Text>
                  </View>
                  <Pressable onPress={() => handleMarginChange(0.05)} style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 18, fontWeight: "600", color: colors.accent }}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><Polyline points="3.27 6.96 12 12.01 20.73 6.96" /><Line x1={12} y1={22.08} x2={12} y2={12} /></Svg>}
              label="Mon stock"
              description="Gérer tes produits et dates de péremption"
              onPress={() => router.push("/(tabs)/pantry" as never)}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M18 20V10" /><Path d="M12 20V4" /><Path d="M6 20v-6" /></Svg>}
              label="Statistiques"
              description="Tes habitudes et budget alimentaire"
              onPress={() => router.push("/analytics" as never)}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><Path d="M7 7h.01" /></Svg>}
              label="Mes prix"
              description="Produits et prix que vous avez reportés"
              onPress={() => router.push("/my-prices" as never)}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x={4} y={2} width={16} height={20} rx={2} /><Line x1={8} y1={8} x2={16} y2={8} /><Line x1={8} y1={12} x2={16} y2={12} /><Line x1={8} y1={16} x2={12} y2={16} /></Svg>}
              label="Tickets de caisse"
              description="Historique de vos sessions de courses"
              onPress={() => router.push("/shopping/receipts" as never)}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} /></Svg>}
              label="Se déconnecter"
              onPress={doSignOut}
            />
          </View>

          <View style={{ borderRadius: 14, backgroundColor: colors.bgCard, overflow: "hidden" }}>
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1={16} y1={13} x2={8} y2={13} /><Line x1={16} y1={17} x2={8} y2={17} /><Polyline points="10 9 9 9 8 9" /></Svg>}
              label="Conditions d'utilisation"
              onPress={() => Linking.openURL("https://deazl.fr/conditions")}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface }} />
            <NavRow
              icon={<Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Svg>}
              label="Politique de confidentialité"
              onPress={() => Linking.openURL("https://deazl.fr/confidentialite")}
            />
          </View>

          <Text style={{ fontSize: 11, color: colors.textSubtle, textAlign: "center", marginTop: 4 }}>
            Deazl v{Constants.expoConfig?.version ?? "—"}
          </Text>

          <Pressable
            onPress={() => { setDeleteError(null); setConfirmDelete(true); }}
            style={({ pressed }) => ({ alignSelf: "center", marginTop: 16, marginBottom: 4, opacity: pressed ? 0.5 : 1 })}
          >
            <Text style={{ fontSize: 12, color: colors.textSubtle, textDecorationLine: "underline" }}>Supprimer mon compte</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* ── Badge detail sheet ── */}
      <BottomModal isOpen={selectedBadgeGroup !== null} onClose={() => setSelectedBadgeGroup(null)} height="auto">
        {(() => {
          if (!selectedBadgeGroup) return null;
          const groupMeta = BADGE_GROUPS.find((g) => g.group === selectedBadgeGroup);
          const levels = getBadgesByGroup(selectedBadgeGroup);
          return (
            <View style={{ paddingBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 4 }}>
                {groupMeta?.name}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 24, lineHeight: 18 }}>
                {groupMeta?.description}
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {levels.map((badge) => {
                  const isUnlocked = unlockedBadgeKeys.includes(badge.key);
                  return (
                    <View
                      key={badge.key}
                      style={{
                        flex: 1, borderRadius: 18, padding: 16,
                        backgroundColor: isUnlocked ? badge.color + "15" : colors.bgSurface,
                        borderWidth: 1.5,
                        borderColor: isUnlocked ? badge.color + "40" : colors.border,
                        alignItems: "center", gap: 10,
                      }}
                    >
                      <View style={{
                        width: 52, height: 52, borderRadius: 26,
                        backgroundColor: isUnlocked ? badge.color + "25" : colors.border,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {isUnlocked ? (
                          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </Svg>
                        ) : (
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSubtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </Svg>
                        )}
                      </View>
                      <Text style={{ fontSize: 10, fontWeight: "700", color: isUnlocked ? badge.color : colors.textSubtle, textTransform: "uppercase", letterSpacing: 1 }}>
                        Niveau {badge.level}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: "800", color: isUnlocked ? colors.text : colors.textSubtle, textAlign: "center", lineHeight: 18 }}>
                        {badge.levelLabel}
                      </Text>
                      <Text style={{ fontSize: 11, color: isUnlocked ? colors.textMuted : colors.textSubtle, textAlign: "center", lineHeight: 16 }}>
                        {badge.criteriaLabel}
                      </Text>
                      {isUnlocked && (
                        <View style={{ alignItems: "center", gap: 4 }}>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: badge.color + "20", borderRadius: 100 }}>
                            <Text style={{ fontSize: 10, fontWeight: "700", color: badge.color }}>Obtenu ✓</Text>
                          </View>
                          {badgeStats?.unlockedDates[badge.key] && (
                            <Text style={{ fontSize: 9, color: colors.textSubtle, textAlign: "center" }}>
                              {new Date(badgeStats.unlockedDates[badge.key]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}
      </BottomModal>

      <BottomModal isOpen={editSheet === "name"} onClose={() => setEditSheet(null)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Nom affiché</Text>
        <View style={{ gap: 12 }}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Votre prénom ou pseudo"
            placeholderTextColor="#A8A29E"
            returnKeyType="done"
            onSubmitEditing={handleSaveName}
            style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }}
          />
          <Pressable
            onPress={handleSaveName}
            disabled={saving || !nameInput.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving || !nameInput.trim() ? colors.bgSurface : colors.accent, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !nameInput.trim() ? colors.textSubtle : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "size"} onClose={() => setEditSheet(null)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Portions par repas</Text>
        <View style={{ gap: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24 }}>
            <Pressable
              onPress={() => setSizeInput((s) => Math.max(1, s - 1))}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center" }}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={5} y1={12} x2={19} y2={12} />
              </Svg>
            </Pressable>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 48, fontWeight: "900", color: colors.text, lineHeight: 56 }}>{sizeInput}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>personne{sizeInput > 1 ? "s" : ""}</Text>
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
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving ? colors.bgSurface : colors.accent, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving ? colors.textSubtle : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "dietary"} onClose={() => setEditSheet(null)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Régime alimentaire</Text>
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
                  backgroundColor: pressed ? colors.border : active ? colors.accentBg : colors.bgSurface,
                  borderWidth: active ? 1.5 : 0, borderColor: active ? "#E8571C40" : "transparent",
                })}
              >
                <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? colors.accent : colors.text }}>
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
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving ? colors.bgSurface : colors.accent, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1, marginTop: 4 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving ? colors.textSubtle : "#fff" }}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
          </Pressable>
        </BottomModalScrollView>
      </BottomModal>

      <BottomModal isOpen={editSheet === "household"} onClose={() => setEditSheet(null)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Rejoindre un foyer</Text>
        <View style={{ gap: 12 }}>
          <TextInput
            value={joinCodeInput}
            onChangeText={(v) => { setJoinCodeInput(v.toUpperCase()); setJoinError(null); }}
            placeholder="Code d'invitation (ex: A3B4C5)"
            placeholderTextColor="#A8A29E"
            autoCapitalize="characters"
            style={{
              borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14,
              fontSize: 18, fontWeight: "700", color: colors.text, letterSpacing: 3, textAlign: "center",
              borderWidth: joinError ? 1.5 : 0, borderColor: colors.danger,
            }}
          />
          <Pressable
            onPress={openQrScanner}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              borderRadius: 14, paddingVertical: 14, opacity: pressed ? 0.7 : 1,
              borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgSurface,
            })}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <Rect x={7} y={7} width={10} height={10} rx={1} />
            </Svg>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textMuted }}>Scanner un QR code</Text>
          </Pressable>
          {joinError && <Text style={{ fontSize: 12, color: colors.danger, fontWeight: "600", textAlign: "center" }}>{joinError}</Text>}
          <Pressable
            onPress={handleJoinHousehold}
            disabled={saving || !joinCodeInput.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: saving || !joinCodeInput.trim() ? colors.bgSurface : colors.accent, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !joinCodeInput.trim() ? colors.textSubtle : "#fff" }}>{saving ? "Rejoindre…" : "Rejoindre"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <Modal visible={showQrScanner} animationType="slide" onRequestClose={() => setShowQrScanner(false)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(e) => handleQrScan(e.data)}
          />
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <View style={{ width: 220, height: 220, borderRadius: 20, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)" }} />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginTop: 20 }}>
              Pointe vers le QR code du foyer
            </Text>
          </View>
          <Pressable
            onPress={() => setShowQrScanner(false)}
            style={{ position: "absolute", top: 60, right: 20, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 99, width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <Line x1={18} y1={6} x2={6} y2={18} />
              <Line x1={6} y1={6} x2={18} y2={18} />
            </Svg>
          </Pressable>
        </View>
      </Modal>

      <BottomModal
        isOpen={editSheet === "stores"}
        onClose={() => { setEditSheet(null); setStoreQuery(""); setStoreResults([]); setOsmResults([]); setStoreError(null); }}
        height="auto"
        portalHostName="stores-sheet-dialog"
      >
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 12 }}>Mes magasins</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 }}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={11} cy={11} r={8} />
            <Line x1={21} y1={21} x2={16.65} y2={16.65} />
          </Svg>
          <TextInput
            value={storeQuery}
            onChangeText={handleStoreQueryChange}
            placeholder="Rechercher un magasin…"
            placeholderTextColor="#A8A29E"
            autoFocus
            returnKeyType="search"
            style={{ flex: 1, fontSize: 14, color: colors.text, padding: 0 }}
          />
          {storeQuery.length > 0 && (
            <Pressable onPress={() => { setStoreQuery(""); setStoreResults([]); setOsmResults([]); }} hitSlop={8}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={18} y1={6} x2={6} y2={18} />
                <Line x1={6} y1={6} x2={18} y2={18} />
              </Svg>
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={handleNearbyStores}
          disabled={geolocating}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
            borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 14,
            backgroundColor: geolocating ? colors.bgSurface : "#E8571C1a",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          {geolocating
            ? <ActivityIndicator size="small" color="#E8571C" />
            : <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={3} />
                <Path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
              </Svg>
          }
          <Text style={{ fontSize: 13, fontWeight: "600", color: geolocating ? colors.textSubtle : colors.accent }}>
            {geolocating ? "Localisation…" : "Autour de moi"}
          </Text>
        </Pressable>

        <BottomModalScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          {storeError && (
            <View style={{ borderRadius: 12, backgroundColor: "#FEF3C7", paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <Line x1={12} y1={9} x2={12} y2={13} />
                <Line x1={12} y1={17} x2={12.01} y2={17} />
              </Svg>
              <Text style={{ fontSize: 12, color: "#92400E", flex: 1 }}>{storeError}</Text>
            </View>
          )}
          {storeSearching && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ActivityIndicator size="small" color="#E8571C" />
              <Text style={{ fontSize: 12, color: colors.textSubtle }}>Recherche en cours…</Text>
            </View>
          )}

          {(storeResults.length > 0 || osmResults.length > 0) && (
            <View style={{ borderRadius: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginBottom: 14 }}>
              {storeResults.map((s, i) => {
                const alreadyAdded = userStores.some((us) => us.id === s.id);
                const isAdding = addingStoreId === s.id;
                return (
                  <View key={s.id}>
                    <Pressable
                      onPress={alreadyAdded ? undefined : () => handleAddStore(s)}
                      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, opacity: pressed && !alreadyAdded ? 0.7 : 1 })}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <Line x1={3} y1={6} x2={21} y2={6} />
                          <Path d="M16 10a4 4 0 0 1-8 0" />
                        </Svg>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} — ${s.name}` : s.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.city}{s.address ? ` · ${s.address}` : ""}</Text>
                      </View>
                      {isAdding
                        ? <ActivityIndicator size="small" color="#E8571C" />
                        : alreadyAdded
                          ? <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6 9 17l-5-5" /></Svg>
                          : <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} /></Svg>
                      }
                    </Pressable>
                    {(i < storeResults.length - 1 || osmResults.length > 0) && <View style={{ height: 1, backgroundColor: colors.bgSurface }} />}
                  </View>
                );
              })}
              {osmResults.map((s, i) => {
                const alreadyAdded = userStores.some((us) => us.name === s.name && us.city === s.city);
                const isAdding = addingStoreId === s.osmId;
                return (
                  <View key={s.osmId}>
                    <Pressable
                      onPress={alreadyAdded ? undefined : () => handleAddOSMStore(s)}
                      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13, opacity: pressed && !alreadyAdded ? 0.7 : 1 })}
                    >
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bgSurface, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#78716C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <Line x1={3} y1={6} x2={21} y2={6} />
                          <Path d="M16 10a4 4 0 0 1-8 0" />
                        </Svg>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} — ${s.name}` : s.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {s.city}{s.address ? ` · ${s.address}` : ""}
                          {s.distanceM != null ? ` · ${s.distanceM < 1000 ? `${s.distanceM} m` : `${(s.distanceM / 1000).toFixed(1)} km`}` : ""}
                        </Text>
                      </View>
                      {isAdding
                        ? <ActivityIndicator size="small" color="#E8571C" />
                        : alreadyAdded
                          ? <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6 9 17l-5-5" /></Svg>
                          : <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Line x1={12} y1={5} x2={12} y2={19} /><Line x1={5} y1={12} x2={19} y2={12} /></Svg>
                      }
                    </Pressable>
                    {i < osmResults.length - 1 && <View style={{ height: 1, backgroundColor: colors.bgSurface }} />}
                  </View>
                );
              })}
            </View>
          )}

          {storeQuery.trim().length > 0 && !storeSearching && storeResults.length === 0 && osmResults.length === 0 && (
            <Pressable
              onPress={() => { setCreateBrand(storeQuery.trim()); setCreateStoreSheet(true); }}
              style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, backgroundColor: colors.accentBg, padding: 12, marginBottom: 14, opacity: pressed ? 0.8 : 1 })}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#E8571C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Line x1={12} y1={5} x2={12} y2={19} />
                <Line x1={5} y1={12} x2={19} y2={12} />
              </Svg>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#E8571C" }}>Créer « {storeQuery.trim()} » manuellement</Text>
            </Pressable>
          )}

          {userStores.length > 0 && (
            <>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                {userStores.length} magasin{userStores.length > 1 ? "s" : ""} sélectionné{userStores.length > 1 ? "s" : ""}
              </Text>
              {userStores.map((s) => (
                <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{s.brand ? `${s.brand} — ${s.name}` : s.name}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>{s.city}</Text>
                  </View>
                  <Pressable
                    onPress={() => setRemoveDialogStore({ id: s.id, displayName: s.brand ? `${s.brand} — ${s.name}` : s.name })}
                    hitSlop={12}
                    style={{ padding: 4 }}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Line x1={18} y1={6} x2={6} y2={18} />
                      <Line x1={6} y1={6} x2={18} y2={18} />
                    </Svg>
                  </Pressable>
                </View>
              ))}
            </>
          )}

          {userStores.length === 0 && !storeQuery && osmResults.length === 0 && (
            <Text style={{ fontSize: 13, color: colors.textSubtle, textAlign: "center", marginTop: 4 }}>
              Recherche un magasin ou utilise la géolocalisation
            </Text>
          )}
        </BottomModalScrollView>
        <Dialog isOpen={removeDialogStore !== null} onOpenChange={(open) => { if (!open) setRemoveDialogStore(null); }}>
          <Dialog.Portal hostName="stores-sheet-dialog">
            <Dialog.Overlay />
            <Dialog.Content>
              <Dialog.Title>Retirer ce magasin</Dialog.Title>
              <Dialog.Description>
                Retirer {removeDialogStore?.displayName} de tes magasins ?
              </Dialog.Description>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <Button variant="secondary" style={{ flex: 1 }} onPress={() => setRemoveDialogStore(null)}>
                  <Button.Label>Annuler</Button.Label>
                </Button>
                <Button variant="danger" style={{ flex: 1 }} onPress={() => { handleRemoveStore(removeDialogStore!.id); setRemoveDialogStore(null); }}>
                  <Button.Label>Retirer</Button.Label>
                </Button>
              </View>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      </BottomModal>

      <BottomModal isOpen={createStoreSheet} onClose={() => { setCreateStoreSheet(false); setCreateStoreError(null); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Créer un magasin</Text>
        <View style={{ gap: 10 }}>
          <TextInput value={createBrand} onChangeText={setCreateBrand} placeholder="Enseigne (ex: Carrefour, Lidl…)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: colors.text }} />
          <TextInput value={createCity} onChangeText={setCreateCity} placeholder="Ville *" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: colors.text }} />
          <TextInput value={createAddress} onChangeText={setCreateAddress} placeholder="Adresse (optionnel)" placeholderTextColor="#A8A29E" style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: colors.text }} />
          {createStoreError && <Text style={{ fontSize: 12, color: colors.danger }}>{createStoreError}</Text>}
          <Pressable
            onPress={handleCreateStore}
            disabled={creatingStore || !createBrand.trim() || !createCity.trim()}
            style={({ pressed }) => ({ borderRadius: 16, backgroundColor: creatingStore || !createBrand.trim() || !createCity.trim() ? colors.bgSurface : colors.accent, paddingVertical: 16, alignItems: "center", opacity: pressed ? 0.8 : 1, marginTop: 2 })}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: creatingStore || !createBrand.trim() || !createCity.trim() ? colors.textSubtle : "#fff" }}>{creatingStore ? "Création…" : "Créer et ajouter"}</Text>
          </Pressable>
        </View>
      </BottomModal>

      <BottomModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 4 }}>Inviter quelqu'un</Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>Fais scanner ce QR code ou partage le code.</Text>
        <View style={{ borderRadius: 16, backgroundColor: colors.bgSurface, paddingVertical: 24, alignItems: "center", gap: 16, marginBottom: 12 }}>
          {household?.inviteCode && (
            <QRCode
              value={`deazl://join/${household.inviteCode}`}
              size={160}
              color={colors.text}
              backgroundColor={colors.bgSurface}
            />
          )}
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: colors.textSubtle, letterSpacing: 1.5, textTransform: "uppercase" }}>Code d'invitation</Text>
            <Text style={{ fontSize: 34, fontWeight: "900", color: colors.text, letterSpacing: 8 }}>{household?.inviteCode}</Text>
          </View>
        </View>
        <Pressable
          onPress={async () => { await handleShareInviteCode(); }}
          style={({ pressed }) => ({
            borderRadius: 16, backgroundColor: pressed ? colors.accentPress : colors.accent,
            paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
          })}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={18} cy={5} r={3} />
            <Circle cx={6} cy={12} r={3} />
            <Circle cx={18} cy={19} r={3} />
            <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} />
            <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} />
          </Svg>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Envoyer une invitation</Text>
        </Pressable>
      </BottomModal>

      <Dialog isOpen={confirmLeave} onOpenChange={(open) => { if (!open) setConfirmLeave(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Quitter le foyer ?</Dialog.Title>
            <Dialog.Description>
              Tu perdras l'accès aux listes de courses et au planning partagés.
            </Dialog.Description>
            {profile?.id === household?.createdBy && (
              <View style={{ borderRadius: 12, backgroundColor: "#FEF3C7", paddingHorizontal: 14, paddingVertical: 10, marginTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400E", marginBottom: 2 }}>Tu es le créateur du foyer</Text>
                <Text style={{ fontSize: 12, color: "#B45309", lineHeight: 17 }}>En partant, le foyer sera supprimé pour tous les membres.</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setConfirmLeave(false)}>
                <Button.Label>Annuler</Button.Label>
              </Button>
              <Button variant="danger" style={{ flex: 1 }} isDisabled={leaving} onPress={handleLeaveHousehold}>
                <Button.Label>{leaving ? "Départ…" : "Quitter"}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <BottomModal isOpen={editSheet === "email"} onClose={() => { setEditSheet(null); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Changer l'email</Text>
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
                borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text,
                borderWidth: emailError ? 1.5 : 0, borderColor: colors.danger,
              }}
            />
            {emailError && <Text style={{ fontSize: 12, color: colors.danger, fontWeight: "600" }}>{emailError}</Text>}
            <Pressable
              onPress={handleChangeEmail}
              disabled={saving || !emailInput.trim()}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center",
                backgroundColor: saving || !emailInput.trim() ? colors.bgSurface : pressed ? colors.accentPress : colors.accent,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !emailInput.trim() ? colors.textSubtle : "#fff" }}>
                {saving ? "Envoi…" : "Envoyer la confirmation"}
              </Text>
            </Pressable>
          </View>
      </BottomModal>

      <BottomModal isOpen={editSheet === "password"} onClose={() => { setEditSheet(null); setPasswordSuccess(false); }} height="auto">
        <Text style={{ fontSize: 16, fontWeight: "900", color: colors.text, marginBottom: 16 }}>Changer le mot de passe</Text>
        {passwordSuccess ? (
          <View style={{ alignItems: "center", gap: 8, paddingVertical: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.greenBg, alignItems: "center", justifyContent: "center" }}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6 9 17l-5-5" />
              </Svg>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Mot de passe modifié</Text>
            <Pressable
              onPress={() => { setEditSheet(null); setPasswordSuccess(false); }}
              style={({ pressed }) => ({ marginTop: 8, borderRadius: 16, backgroundColor: pressed ? colors.accentPress : colors.accent, paddingVertical: 14, paddingHorizontal: 32 })}
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
                borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text,
                borderWidth: passwordError === "Mot de passe actuel incorrect." ? 1.5 : 0, borderColor: colors.danger,
              }}
            />
            <View style={{ height: 1, backgroundColor: colors.bgSurface, marginHorizontal: -20 }} />
            <TextInput
              value={passwordInput}
              onChangeText={(v) => { setPasswordInput(v); setPasswordError(null); }}
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#A8A29E"
              secureTextEntry
              style={{ borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text }}
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
                borderRadius: 14, backgroundColor: colors.bgSurface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text,
                borderWidth: passwordError && passwordError !== "Mot de passe actuel incorrect." ? 1.5 : 0, borderColor: colors.danger,
              }}
            />
            {passwordError && <Text style={{ fontSize: 12, color: colors.danger, fontWeight: "600" }}>{passwordError}</Text>}
            <Pressable
              onPress={handleChangePassword}
              disabled={saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim()}
              style={({ pressed }) => ({
                borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 2,
                backgroundColor: saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim() ? colors.bgSurface : pressed ? colors.accentPress : colors.accent,
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: saving || !currentPasswordInput || !passwordInput.trim() || !confirmPasswordInput.trim() ? colors.textSubtle : "#fff" }}>
                {saving ? "Vérification…" : "Modifier le mot de passe"}
              </Text>
            </Pressable>
          </View>
        )}
      </BottomModal>

      <Dialog isOpen={confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(false); }}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Supprimer mon compte</Dialog.Title>
            <Dialog.Description>
              Cette action est irréversible. Toutes tes données seront définitivement supprimées.
            </Dialog.Description>
            {deleteError && (
              <View style={{ borderRadius: 10, backgroundColor: colors.dangerBg, paddingHorizontal: 12, paddingVertical: 8, marginTop: 12 }}>
                <Text style={{ fontSize: 12, color: colors.danger, fontWeight: "600" }}>{deleteError}</Text>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={() => setConfirmDelete(false)}>
                <Button.Label>Annuler</Button.Label>
              </Button>
              <Button variant="danger" style={{ flex: 1 }} isDisabled={deleting} onPress={handleDeleteAccount}>
                <Button.Label>{deleting ? "Suppression…" : "Supprimer"}</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

    </SafeAreaView>
  );
}
