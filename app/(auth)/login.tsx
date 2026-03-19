import "react-native-url-polyfill/auto";

import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { styles } from "../../styles/login.styles";

export default function Login() {
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

  const handleBiometric = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      alert("Please login first using email/password");
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      alert("Biometric not available");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock DevBudget",
    });

    if (result.success) {
      router.replace("/(main)/(tabs)/dashboard");
    } else {
      alert("Authentication Failed!");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>
          Login to continue managing your budget
        </Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3b82f6" }]}
          onPress={handleBiometric}
        >
          <Text style={styles.buttonText}>🔐 Use Biometrics</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
