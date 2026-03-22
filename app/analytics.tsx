import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { useTheme } from "@/types/theme";
import { ensureCurrentCycle } from "../lib/cycle";
import { supabase } from "../lib/supabase";

export default function AnalyticsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);

  const [currentCategoryData, setCurrentCategoryData] = useState<any[]>([]);
  const [previousCategoryData, setPreviousCategoryData] = useState<any[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const safeNumber = (val: any) => {
    const num = Number(val);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const fetchTotal = async (cycleId: string, setter: any) => {
    const { data } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cycle_id", cycleId);

    const total = (data || []).reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0,
    );

    setter(total);
  };

  const formatCategory = (data: any[]) => {
    const grouped: Record<string, number> = {};

    (data || []).forEach((item) => {
      const category = item.category || "Others";
      const value = safeNumber(item.amount);

      if (value <= 0) return;

      if (!grouped[category]) grouped[category] = 0;
      grouped[category] += value;
    });

    const colors = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"];

    return Object.keys(grouped).map((key, index) => ({
      value: grouped[key],
      text: key,
      color: colors[index % colors.length],
    }));
  };

  const fetchCategoryData = async (cycleId: string, setter: any) => {
    const { data } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("cycle_id", cycleId);

    setter(formatCategory(data || []));
  };

  const loadData = async () => {
    const current = await ensureCurrentCycle();

    if (current?.id) {
      await fetchTotal(current.id, setCurrentTotal);
      await fetchCategoryData(current.id, setCurrentCategoryData);
    }

    const now = new Date();

    const { data } = await supabase
      .from("cycles")
      .select("*")
      .lt("end_date", now.toISOString())
      .order("end_date", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const prev = data[0];

      await fetchTotal(prev.id, setPreviousTotal);
      await fetchCategoryData(prev.id, setPreviousCategoryData);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxVal = Math.max(currentTotal, previousTotal, 1000);
  const sections = Math.max(1, Math.ceil(maxVal / 1000));

  const max = Math.max(currentTotal, previousTotal);
  const roundedMax = Math.ceil(max / 1000) * 1000;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          Analytics
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/compare")}
          style={{ marginTop: 12 }}
        >
          <Text
            style={{
              color: theme.colors.primary,
              fontWeight: "600",
              textDecorationLine: "underline",
            }}
          >
            Compare Cycles →
          </Text>
        </TouchableOpacity>

        {/* 🔥 BAR CHART */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{ borderRadius: 20, padding: 16, marginTop: 20 }}
        >
          <Text style={{ color: "white", marginBottom: 10 }}>
            Spending Comparison
          </Text>

          <BarChart
            data={[
              { value: currentTotal, label: "Current", frontColor: "#4ade80" },
              {
                value: previousTotal,
                label: "Previous",
                frontColor: "#60a5fa",
              },
            ]}
            height={220}
            barWidth={40}
            spacing={40}
            yAxisThickness={1}
            xAxisThickness={1}
            rulesColor="rgba(255,255,255,0.2)"
            noOfSections={roundedMax / 1000}
            maxValue={roundedMax}
            yAxisTextStyle={{ color: "white", fontSize: 10 }}
            xAxisLabelTextStyle={{ color: "white", fontSize: 12 }}
          />
        </LinearGradient>

        {/* 🔥 PIE CHARTS */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{ borderRadius: 20, padding: 16, marginTop: 20 }}
        >
          <Text style={{ color: "white", marginBottom: 10 }}>
            Category Breakdown
          </Text>

          {/* CURRENT */}
          {currentCategoryData.length > 0 && (
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text style={{ color: "white", marginBottom: 8 }}>
                Current Cycle
              </Text>

              <PieChart
                data={currentCategoryData}
                donut
                radius={90}
                innerRadius={55}
                showText={false}
              />

              {/* ✅ LEGEND */}
              <View style={{ marginTop: 12, width: "100%" }}>
                {currentCategoryData.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: item.color,
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ color: "white", fontSize: 12 }}>
                      {item.text} - {formatCurrency(item.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* PREVIOUS */}
          {previousCategoryData.length > 0 && (
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "white", marginBottom: 8 }}>
                Previous Cycle
              </Text>

              <PieChart
                data={previousCategoryData}
                donut
                radius={90}
                innerRadius={55}
                showText={false}
              />

              {/* ✅ LEGEND */}
              <View style={{ marginTop: 12, width: "100%" }}>
                {previousCategoryData.map((item, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: item.color,
                        marginRight: 8,
                      }}
                    />
                    <Text style={{ color: "white", fontSize: 12 }}>
                      {item.text} - {formatCurrency(item.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}
