import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { useAppTheme } from "../../shared/theme";
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

const SCREEN_WIDTH = Dimensions.get("window").width;
const H_PADDING = 16;
const INNER_PAD = 4;
const NUM_SLOTS = 5;
const SLOT_W = (SCREEN_WIDTH - H_PADDING * 2 - INNER_PAD * 2) / NUM_SLOTS;
const PILL_H = 54;

const STATE_TO_VISUAL = [0, 1, 3, 4, 4, 4];

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function RecipeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <Path d="M7 2v20" />
      <Path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </Svg>
  );
}

function ShoppingBagIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <Line x1={3} y1={6} x2={21} y2={6} />
      <Path d="M16 10a4 4 0 0 1-8 0" />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function ScanCenterIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <Line x1={7} y1={12} x2={17} y2={12} />
    </Svg>
  );
}

function TabItem({
  index,
  activeIndex,
  isFocused,
  label,
  icon,
  onPress,
}: {
  index: number;
  activeIndex: SharedValue<number>;
  isFocused: boolean;
  label: string;
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: interpolate(Math.abs(activeIndex.value - index), [0, 1], [-7, 0], "clamp") },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(activeIndex.value - index), [0, 0.8], [1, 0], "clamp"),
    transform: [{ translateY: interpolate(Math.abs(activeIndex.value - index), [0, 1], [0, 4], "clamp") }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.86, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      style={{ width: SLOT_W, height: PILL_H, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View style={iconStyle}>
        {icon(isFocused ? "#fff" : "#A8A29E")}
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        style={[{ position: "absolute", bottom: 7, fontSize: 10, fontWeight: "700", color: "#fff", width: SLOT_W, textAlign: "center" }, labelStyle]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

function ScanButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={{ width: SLOT_W, height: PILL_H, alignItems: "center", justifyContent: "center" }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.88, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        accessibilityRole="button"
        accessibilityLabel="Scanner un produit"
      >
        <Animated.View
          style={[
            {
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: "#E8571C",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#E8571C",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            },
            animStyle,
          ]}
        >
          <ScanCenterIcon color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const router = useRouter();
  const activeIndex = useSharedValue(STATE_TO_VISUAL[state.index] ?? 0);

  useEffect(() => {
    const visual = STATE_TO_VISUAL[state.index] ?? 0;
    activeIndex.value = withSpring(visual, { damping: 22, stiffness: 250, mass: 0.65 });
  }, [state.index]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: activeIndex.value * SLOT_W }],
  }));

  const visibleRoutes = state.routes.filter((r) => r.name !== "pantry");
  const routesBeforeScan = visibleRoutes.slice(0, 2);
  const routesAfterScan = visibleRoutes.slice(2);

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Math.max(insets.bottom, 16),
        paddingHorizontal: H_PADDING,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.bgCard,
          borderRadius: 9999,
          paddingHorizontal: INNER_PAD,
          paddingVertical: 5,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.09,
          shadowRadius: 20,
          elevation: 14,
        }}
      >
        <Animated.View
          style={[
            {
              position: "absolute",
              left: INNER_PAD,
              width: SLOT_W,
              height: PILL_H,
              borderRadius: 999,
              backgroundColor: colors.accent,
            },
            pillStyle,
          ]}
        />

        {routesBeforeScan.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);
          const visualIndex = state.routes.indexOf(route);
          return (
            <TabItem
              key={route.key}
              index={visualIndex}
              activeIndex={activeIndex}
              isFocused={isFocused}
              label={options.title ?? route.name}
              icon={(color) => options.tabBarIcon?.({ focused: isFocused, color, size: 22 }) ?? null}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name as never);
              }}
            />
          );
        })}

        <ScanButton onPress={() => router.push("/scan")} />

        {routesAfterScan.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === state.routes.indexOf(route);
          const stateIndex = state.routes.indexOf(route);
          const visualIndex = STATE_TO_VISUAL[stateIndex] ?? stateIndex;
          return (
            <TabItem
              key={route.key}
              index={visualIndex}
              activeIndex={activeIndex}
              isFocused={isFocused}
              label={options.title ?? route.name}
              icon={(color) => options.tabBarIcon?.({ focused: isFocused, color, size: 22 }) ?? null}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name as never);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recettes",
          tabBarIcon: ({ color }) => <RecipeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: "Courses",
          tabBarIcon: ({ color }) => <ShoppingBagIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: "Stock",
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
