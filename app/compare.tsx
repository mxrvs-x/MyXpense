import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { ensureCurrentCycle } from "../lib/cycle";
import { supabase } from "../lib/supabase";

export default function CompareCycles() {
  const theme = useTheme();

  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [previousCycle, setPreviousCycle] = useState<any>(null);

  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const fetchTotal = async (cycleId: string, setter: any) => {
    const { data } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cycle_id", cycleId);

    const total = (data || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    setter(total);
  };

  const loadData = async () => {
    // 🔹 CURRENT
    const current = await ensureCurrentCycle();
    setCurrentCycle(current);

    if (current?.id) {
      fetchTotal(current.id, setCurrentTotal);
    }

    // 🔹 PREVIOUS (latest past cycle)
    const now = new Date();

    const { data } = await supabase
      .from("cycles")
      .select("*")
      .lt("end_date", now.toISOString())
      .order("end_date", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPreviousCycle(data[0]);
      fetchTotal(data[0].id, setPreviousTotal);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔥 ANALYTICS
  const getInsights = () => {
    if (!currentCycle || !previousCycle) return [];

    const diff = currentTotal - previousTotal;
    const percent = previousTotal > 0 ? (diff / previousTotal) * 100 : 0;

    const insights = [];

    if (diff > 0) {
      insights.push(`⚠️ You spent ${percent.toFixed(1)}% more than last cycle`);
    } else if (diff < 0) {
      insights.push(
        `✅ You reduced spending by ${Math.abs(percent).toFixed(1)}%`,
      );
    } else {
      insights.push("No change in spending");
    }

    // Budget comparison
    if (currentTotal > currentCycle?.budget) {
      insights.push("🚨 You are over budget this cycle");
    }

    if (currentTotal < previousTotal) {
      insights.push("💰 You're saving more this cycle");
    }

    return insights;
  };

  if (!currentCycle || !previousCycle) {
    return (
      <SafeAreaView>
        <Text style={{ padding: 20 }}>Loading comparison...</Text>
      </SafeAreaView>
    );
  }

  const currentRemaining = currentCycle.budget - currentTotal;
  const previousRemaining = previousCycle.budget - previousTotal;

  const difference = currentTotal - previousTotal;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ padding: 16 }}>
        {/* HEADER */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          Compare Cycles
        </Text>

        {/* CARD */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{
            borderRadius: 20,
            padding: 20,
            marginTop: 20,
          }}
        >
          {/* CURRENT */}
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>Current Cycle</Text>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Spent: {formatCurrency(currentTotal)}
          </Text>
          <Text style={{ color: "white" }}>
            Remaining: {formatCurrency(currentRemaining)}
          </Text>

          {/* PREVIOUS */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              Previous Cycle
            </Text>
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Spent: {formatCurrency(previousTotal)}
            </Text>
            <Text style={{ color: "white" }}>
              Remaining: {formatCurrency(previousRemaining)}
            </Text>
          </View>

          {/* DIFFERENCE */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>Difference</Text>
            <Text
              style={{
                color: difference > 0 ? "#f87171" : "#4ade80",
                fontWeight: "bold",
              }}
            >
              {formatCurrency(difference)}
            </Text>
          </View>

          {/* INSIGHTS */}
          <View style={{ marginTop: 16 }}>
            {getInsights().map((insight, index) => (
              <Text
                key={index}
                style={{
                  color: "white",
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {insight}
              </Text>
            ))}
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
