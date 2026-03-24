import UpdateModal from "@/components/UpdateAppModal"; // 👈 add this
import { RefreshProvider } from "@/context/RefreshContext";
import { Stack } from "expo-router";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // 🔥 STATE
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);

  // 🔥 CHECK FOR OTA UPDATE
  useEffect(() => {
    async function checkUpdates() {
      try {
        if (__DEV__) {
          console.log("DEV MODE - skipping OTA");
          return;
        }

        console.log("Checking for update...");

        const update = await Updates.checkForUpdateAsync();

        console.log("Update available:", update.isAvailable);
        console.log("Channel:", Updates.channel);
        console.log("Runtime:", Updates.runtimeVersion);

        if (update.isAvailable) {
          setShowUpdateModal(true); // 👈 trigger modal
        } else {
          console.log("No update found");
        }
      } catch (e) {
        console.log("Update error:", e);
      }
    }

    checkUpdates();
  }, []);

  // 🔥 HANDLE UPDATE
  const handleUpdate = async () => {
    try {
      setLoadingUpdate(true);

      console.log("Fetching update...");
      await Updates.fetchUpdateAsync();

      console.log("Reloading app...");
      await Updates.reloadAsync();
    } catch (e) {
      console.log("Update failed:", e);
      setLoadingUpdate(false);
    }
  };

  // 🎨 THEME
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

            {/* 🔥 CUSTOM UPDATE MODAL */}
            <UpdateModal
              visible={showUpdateModal}
              onClose={() => setShowUpdateModal(false)}
              onUpdate={handleUpdate}
              loading={loadingUpdate}
            />
          </SafeAreaView>
        </RefreshProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
