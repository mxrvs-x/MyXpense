import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

export default function Settings() {
  const handleLogout = async () => {
    await supabase.auth.signOut();

    // Optional: full reset (uncomment if needed)
    await AsyncStorage.clear();

    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: "red",
            padding: 15,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            Logout (Reset Session)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
