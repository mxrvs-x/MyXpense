import "react-native-url-polyfill/auto";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/(main)/(tabs)/dashboard");
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ paddingHorizontal: 16, flex: 1 }}>
        {/* 👋 HEADER WITH LOGO */}
        <View
          style={{
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <Image
            source={require("../../assets/images/MyXpense.png")}
            style={{
              width: 120,
              height: 120,
              marginBottom: 12,
              resizeMode: "contain",
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

        {/* 💳 LOGIN CARD */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{
            borderRadius: 24,
            padding: 20,
            marginTop: 24,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>
            Login to your account
          </Text>

          {/* EMAIL */}
          <TextInput
            placeholder="Email"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            style={{
              marginTop: 16,
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: 12,
              borderRadius: 12,
              color: "#fff",
            }}
          />

          {/* PASSWORD */}
          <TextInput
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              marginTop: 12,
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: 12,
              borderRadius: 12,
              color: "#fff",
            }}
          />

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={{
              marginTop: 20,
              backgroundColor: "#fff",
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ fontWeight: "bold", color: "#000" }}>Login</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
