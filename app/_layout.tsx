import { RefreshProvider } from "@/context/RefreshContext";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert, LogBox, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  requestNotificationPermission,
  scheduleDailyReminder,
} from "../src/utils/notifications";

// 🔕 OPTIONAL: silence Expo Go warning
LogBox.ignoreLogs(["expo-notifications: Android Push notifications"]);

// 🔔 Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const setupNotifications = async () => {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.HIGH,
      });

      const granted = await requestNotificationPermission();

      if (granted) {
        await scheduleDailyReminder();
      }
    };

    setupNotifications();
  }, []);

  // 🔥 OTA UPDATE CHECK (SMART VERSION)
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // ❌ skip in dev (important)
        if (__DEV__) return;

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          Alert.alert(
            "Update Available 🚀",
            "A new version of MyXpense is ready.",
            [
              {
                text: "Update",
                onPress: async () => {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                },
              },
            ],
          );
        }
      } catch (e) {
        console.log("Update check error:", e);
      }
    };

    checkForUpdates();
  }, []);

  const theme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: "#34d399",
          background: "#021712",
          surface: "#052e2b",
          secondary: "#22c55e",
          error: "#d46060",
          outline: "#064e3b",
          onSurface: "#d1fae5",
        },
        custom: {
          gradient: ["#022c22", "#065f46"],
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: "#059669",
          background: "#ecfdf5",
          surface: "#ffffff",
          secondary: "#22c55e",
          error: "#fc7070",
          outline: "#a7f3d0",
          onSurface: "#022c22",
        },
        custom: {
          gradient: ["#65bd9a", "#23c793"],
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <RefreshProvider>
          <SafeAreaView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
          >
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaView>
        </RefreshProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
