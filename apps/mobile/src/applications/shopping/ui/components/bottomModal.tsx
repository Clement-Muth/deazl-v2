import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Modal, Platform, Pressable, View } from "react-native";
import { useAppTheme } from "../../../../shared/theme";
import { PortalHost } from "heroui-native/portal";
import { Gesture, GestureDetector, GestureHandlerRootView, ScrollView as GHScrollView } from "react-native-gesture-handler";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface BottomModalContextValue {
  panGestureRef: React.RefObject<any>;
  scrollOffset: { value: number };
}

const BottomModalContext = createContext<BottomModalContextValue | null>(null);

export function BottomModalScrollView({
  children,
  onScroll: externalOnScroll,
  scrollEventThrottle = 16,
  showsVerticalScrollIndicator = false,
  ...rest
}: React.ComponentProps<typeof GHScrollView>) {
  const ctx = useContext(BottomModalContext);
  return (
    <GHScrollView
      {...rest}
      simultaneousHandlers={ctx?.panGestureRef}
      onScroll={(e) => {
        if (ctx?.scrollOffset) {
          ctx.scrollOffset.value = e.nativeEvent.contentOffset.y;
        }
        externalOnScroll?.(e);
      }}
      scrollEventThrottle={scrollEventThrottle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </GHScrollView>
  );
}

interface BottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  height?: string | number;
  children: React.ReactNode;
  portalHostName?: string;
}

export function BottomModal({ isOpen, onClose, height = "55%", children, portalHostName }: BottomModalProps) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const keyboardOffset = useSharedValue(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const startTranslationY = useSharedValue(0);
  const scrollOffset = useSharedValue(0);
  const wasScrolled = useSharedValue(false);
  const panGestureRef = useRef<any>(null);

  const isAuto = height === "auto";

  const fixedModalHeight =
    typeof height === "string" && height.endsWith("%")
      ? (parseFloat(height) / 100) * SCREEN_HEIGHT
      : typeof height === "number"
        ? height
        : SCREEN_HEIGHT * 0.55;

  const gestureModalHeight = useSharedValue(fixedModalHeight);

  useEffect(() => {
    if (!isAuto) gestureModalHeight.value = fixedModalHeight;
  }, [height]);

  useEffect(() => {
    if (isOpen) {
      clearTimeout(closeTimer.current);
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      scrollOffset.value = 0;
      keyboardOffset.value = 0;
      setVisible(true);
    } else {
      Keyboard.dismiss();
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 280, easing: Easing.in(Easing.quad) });
      backdropOpacity.value = withTiming(0, { duration: 260 });
      closeTimer.current = setTimeout(() => setVisible(false), 290);
    }
    return () => clearTimeout(closeTimer.current);
  }, [isOpen]);

  useEffect(() => {
    if (visible && isOpen) {
      requestAnimationFrame(() => {
        translateY.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 });
        backdropOpacity.value = withTiming(0.5, { duration: 380, easing: Easing.out(Easing.quad) });
      });
    }
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = Keyboard.addListener(showEvent, (e) => {
      keyboardOffset.value = withTiming(e.endCoordinates.height, {
        duration: Platform.OS === "ios" ? e.duration : 250,
      });
    });
    const onHide = Keyboard.addListener(hideEvent, (e) => {
      keyboardOffset.value = withTiming(0, {
        duration: Platform.OS === "ios" ? e.duration : 250,
      });
    });

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, []);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    bottom: keyboardOffset.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const panGesture = Gesture.Pan()
    .withRef(panGestureRef)
    .onStart((e) => {
      startTranslationY.value = e.translationY;
      wasScrolled.value = false;
    })
    .onUpdate((e) => {
      if (scrollOffset.value > 2) {
        wasScrolled.value = true;
        return;
      }
      if (wasScrolled.value) {
        wasScrolled.value = false;
        startTranslationY.value = e.translationY;
      }
      const effectiveY = Math.max(0, e.translationY - startTranslationY.value);
      translateY.value = effectiveY;
      backdropOpacity.value = Math.max(0, 0.5 * (1 - effectiveY / (gestureModalHeight.value * 0.5)));
    })
    .onEnd((e) => {
      if (scrollOffset.value > 2) {
        translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        backdropOpacity.value = withTiming(0.5, { duration: 200 });
        return;
      }
      const effectiveY = e.translationY - startTranslationY.value;
      if (effectiveY > 150 || e.velocityY > 800) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 240, easing: Easing.in(Easing.quad) });
        backdropOpacity.value = withTiming(0, { duration: 240 });
        runOnJS(onClose)();
      } else {
        translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
        backdropOpacity.value = withTiming(0.5, { duration: 200 });
      }
    });

  if (!visible) return null;

  return (
    <BottomModalContext.Provider value={{ panGestureRef, scrollOffset }}>
      <Modal transparent visible statusBarTranslucent>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Animated.View
              style={[{ position: "absolute", inset: 0, backgroundColor: "#000" }, overlayStyle]}
              pointerEvents="none"
            />
            <Pressable style={{ flex: 1 }} onPress={onClose} />
            <Animated.View
              onLayout={isAuto ? (e) => { gestureModalHeight.value = e.nativeEvent.layout.height; } : undefined}
              style={[
                {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  backgroundColor: colors.bgCard,
                  borderTopLeftRadius: 40,
                  borderTopRightRadius: 40,
                  paddingHorizontal: 20,
                  paddingTop: 8,
                  paddingBottom: insets.bottom + 16,
                  ...(isAuto
                    ? { maxHeight: SCREEN_HEIGHT * 0.92 }
                    : { height: fixedModalHeight }),
                },
                sheetStyle,
              ]}
            >
              <GestureDetector gesture={panGesture}>
                <View style={isAuto ? undefined : { flex: 1 }}>
                  <View style={{ alignSelf: "stretch", alignItems: "center", paddingVertical: 10, marginHorizontal: -20 }}>
                    <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.handle }} />
                  </View>
                  <View style={isAuto ? undefined : { flex: 1 }}>
                    {children}
                  </View>
                </View>
              </GestureDetector>
            </Animated.View>
            {portalHostName && <PortalHost name={portalHostName} />}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </BottomModalContext.Provider>
  );
}
