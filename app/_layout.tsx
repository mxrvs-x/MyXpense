import { RefreshProvider } from "@/context/RefreshContext";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,

          // 🟢 DARK EMERALD FINANCE THEME
          primary: "#34d399", // emerald accent
          background: "#021712", // deep emerald-black
          surface: "#052e2b", // card/tab surface // dark green card base
          secondary: "#22c55e", // success green
          error: "#d46060",

          outline: "#064e3b",
          onSurface: "#d1fae5",
        },

        custom: {
          gradient: ["#022c22", "#065f46"], // 💰 main card gradient
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,

          // 🌿 LIGHT EMERALD FINANCE THEME
          primary: "#059669", // emerald-600
          background: "#ecfdf5", // very light emerald tint
          surface: "#ffffff", // clean cards
          secondary: "#22c55e",
          error: "#fc7070",

          outline: "#a7f3d0",
          onSurface: "#022c22",
        },

        custom: {
          gradient: ["#65bd9a", "#23c793"], // 🌿 light emerald gradient
        },
      };

  return (
    <PaperProvider theme={theme}>
      <RefreshProvider>
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaView>
      </RefreshProvider>
    </PaperProvider>
  );
}
