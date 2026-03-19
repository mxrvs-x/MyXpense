import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // ❌ No session → go login
      if (!session) {
        router.replace("/(auth)/login");
        return;
      }

      // 🔐 Check biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        router.replace("/(main)/(tabs)/dashboard" as any);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock DevBudget",
      });

      if (result.success) {
        router.replace("/(main)/(tabs)/dashboard" as any);
      } else {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      }
    };

    init();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}
