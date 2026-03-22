import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { supabase } from "../../../lib/supabase";

export default function Menu() {
  const theme = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ paddingHorizontal: 16 }}>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.onSurfaceVariant,
            marginBottom: 10,
          }}
        >
          Financial Tools
        </Text>
        {/* CARD SECTION */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{
            borderRadius: 24,
            padding: 20,
          }}
        >
          {/* ARCHIVES */}
          <TouchableOpacity
            onPress={() => router.push("/archives")}
            style={{ marginTop: 16 }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              📦 Cycle Archives
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.6)" }}>
              View past cycles and expenses
            </Text>
          </TouchableOpacity>

          {/* COMPARE (future ready) */}
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.push("/analytics")}
          >
            <Text
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
              }}
            >
              📊 Cycle Analytics
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.6)" }}>
              Analyze past vs current spending
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ACTION SECTION */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
              marginBottom: 10,
            }}
          >
            Account
          </Text>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                color: theme.colors.error,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
