import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { supabase } from "../lib/supabase";

export default function Index() {
  const theme = useTheme();
  const [checking, setChecking] = useState(true);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/(auth)/login");
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        router.replace("/(main)/(tabs)/dashboard");
        return;
      }

      setCanUseBiometrics(true);
      setChecking(false);
    };

    init();
  }, []);

  const handleBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock MyXpense",
    });

    if (result.success) {
      router.replace("/(main)/(tabs)/dashboard");
    } else {
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    }
  };

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{
        paddingHorizontal: 16,
        flex: 1,
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      {/* 🔷 HEADER */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Image
          source={require("../assets/images/MyXpense.png")}
          style={{
            width: 120,
            height: 120,
            resizeMode: "contain",
            marginBottom: 12,
          }}
        />

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          MyXpense
        </Text>
      </View>

      <LinearGradient
        colors={theme.custom.gradient}
        style={{
          borderRadius: 24,
          padding: 20,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.7)" }}>
          Login to your account
        </Text>
        <TouchableOpacity
          onPress={handleBiometric}
          style={{
            marginTop: 20,
            backgroundColor: "#fff",
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#000" }}>Login</Text>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}
