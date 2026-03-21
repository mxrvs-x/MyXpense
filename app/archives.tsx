import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { supabase } from "../lib/supabase";

export default function Archives() {
  const theme = useTheme();
  const [cycles, setCycles] = useState<any[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  };

  const fetchCycles = async () => {
    const today = new Date().toISOString(); // current date

    const { data } = await supabase
      .from("cycles")
      .select("*")
      .lt("end_date", today) // 🔥 ONLY past cycles
      .order("end_date", { ascending: false });

    if (!data) return;

    const cyclesWithTotals = await Promise.all(
      data.map(async (cycle) => {
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount")
          .eq("cycle_id", cycle.id);

        const total = (expenses || []).reduce(
          (sum, e) => sum + Number(e.amount),
          0,
        );

        return { ...cycle, total };
      }),
    );

    setCycles(cyclesWithTotals);
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ paddingHorizontal: 16 }}>
        {/* HEADER */}
        <View style={{ marginTop: 10, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Archives
          </Text>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: theme.colors.onBackground,
            }}
          >
            Past Cycles
          </Text>
        </View>
      </View>

      {/* LIST */}

      {cycles.length === 0 && (
        <Text
          style={{
            textAlign: "center",
            marginTop: 40,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          No archived cycles yet
        </Text>
      )}

      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const remaining = item.budget - item.total;

          return (
            <TouchableOpacity
              style={{ marginBottom: 16 }}
              onPress={() => {
                // future: navigate to cycle details
              }}
            >
              <LinearGradient
                colors={theme.custom.gradient}
                style={{
                  borderRadius: 20,
                  padding: 16,
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                  {formatDate(item.start_date)} – {formatDate(item.end_date)}
                </Text>

                <Text
                  style={{
                    color: "white",
                    fontSize: 20,
                    fontWeight: "bold",
                    marginTop: 8,
                  }}
                >
                  {formatCurrency(item.budget)}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      Spent
                    </Text>
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>

                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                      Remaining
                    </Text>
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                      {formatCurrency(remaining)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
