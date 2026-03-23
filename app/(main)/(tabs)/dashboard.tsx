import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";

import { BarChart, PieChart } from "react-native-gifted-charts";

import { useRefresh } from "@/context/RefreshContext";
import { useTheme } from "@/types/theme";
import TransactionDetailsModal from "../../../components/TransactionDetailsModal";
import TransactionList from "../../../components/TransactionList";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";

import UpdateWalletModal from "../../../components/UpdateWalletModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.75;
const SPACING = 12;

type ChartItem = {
  value: number;
  label: string;
  date: string;
};

export default function Dashboard() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<"overview" | "breakdown">(
    "overview",
  );

  const [total, setTotal] = useState(0);
  const [cycle, setCycle] = useState<any>(null);

  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);

  const [walletSpending, setWalletSpending] = useState<Record<string, number>>(
    {},
  );

  const [wallets, setWallets] = useState<any[]>([]);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { refreshKey } = useRefresh();

  const [categoryData, setCategoryData] = useState<any[]>([]);

  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const safeNumber = (val: any) => {
    const num = Number(val);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const fetchWallets = async () => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*") // must include cycle_id
      .order("created_at", { ascending: true });

    setWallets(data || []);
  };

  const chartDataRaw = Object.values(
    (allExpenses || []).reduce<Record<string, ChartItem>>((acc, item) => {
      const date = new Date(item.date_spent);
      const key = date.toISOString().split("T")[0];

      if (!acc[key]) {
        acc[key] = {
          value: 0,
          label: date.getDate().toString(),
          date: key,
        };
      }

      acc[key].value += safeNumber(item.amount);
      return acc;
    }, {}),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // ✅ IMPORTANT: force at least 2 bars (gifted-charts bug workaround)
  const chartData =
    chartDataRaw.length === 1
      ? [
          { value: 0, label: "" }, // invisible spacer
          chartDataRaw[0],
        ]
      : chartDataRaw;

  const fetchExpenses = async (cycleId: string) => {
    // ✅ include wallet relation here
    const { data: allData } = await supabase
      .from("expenses")
      .select(
        `
      id,
      amount,
      date_spent,
      wallet_id,
      wallet:wallet_id (
        id,
        name
      )
    `,
      )
      .eq("cycle_id", cycleId);

    const totalSpent = (allData || []).reduce(
      (sum, item) => sum + safeNumber(item.amount),
      0,
    );

    setTotal(totalSpent);

    const spendingMap: Record<string, number> = {};

    (allData || []).forEach((item) => {
      const walletId = item.wallet_id;
      const amount = safeNumber(item.amount);

      if (!spendingMap[walletId]) spendingMap[walletId] = 0;
      spendingMap[walletId] += amount;
    });

    setWalletSpending(spendingMap);

    // ✅ ALSO FIX THIS (this is what TransactionList uses)
    const { data: recentData } = await supabase
      .from("expenses")
      .select(
        `
      *,
      wallet:wallet_id (
        id,
        name
      )
    `,
      )
      .eq("cycle_id", cycleId)
      .order("date_spent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    setRecentExpenses(recentData || []);
    setAllExpenses(allData || []);
  };

  const fetchCategoryData = async (cycleId: string) => {
    const { data } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("cycle_id", cycleId);

    const grouped: Record<string, number> = {};

    (data || []).forEach((item) => {
      const category = item.category || "Others";
      const value = safeNumber(item.amount);

      if (value <= 0) return;

      if (!grouped[category]) grouped[category] = 0;
      grouped[category] += value;
    });

    const colors = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"];

    const formatted = Object.keys(grouped).map((key, index) => ({
      value: grouped[key],
      label: key,
      color: colors[index % colors.length],
    }));

    setCategoryData(formatted);
  };

  const loadData = useCallback(async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);

    await fetchWallets();
    await fetchExpenses(currentCycle.id);
    await fetchCategoryData(currentCycle.id);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const maxValue = Math.max(...chartData.map((i) => i.value), 100);

  // ✅ SMART STEP
  let step;

  if (maxValue <= 1000) {
    step = Math.ceil(maxValue / 4 / 100) * 100; // by 100
  } else if (maxValue <= 5000) {
    step = Math.ceil(maxValue / 4 / 500) * 500; // by 500
  } else {
    step = Math.ceil(maxValue / 4 / 1000) * 1000; // by 1k
  }

  // ✅ FINAL MAX
  const roundedMax = step * 4;

  // ✅ LABELS
  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const val = i * step;

    if (val >= 1000) return `${val / 1000}k`;
    return `${val}`;
  });

  const INCOME = wallets.reduce((sum, w) => sum + safeNumber(w.balance), 0);
  const REMAINING = INCOME - total;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{
        paddingBottom: 80, // 🔥 prevents overlap with tab bar
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        {/* Tabs */}
        <LinearGradient
          colors={theme.custom.gradient}
          style={{
            flexDirection: "row",
            marginTop: 16,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {["overview", "breakdown"].map((tab) => {
            const isActive = activeTab === tab;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? theme.colors.background
                    : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {tab === "overview" ? "Overview" : "Breakdown"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </LinearGradient>

        {activeTab === "overview" && (
          <>
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 14 }}>Hello,</Text>
              <Text style={{ fontSize: 22, fontWeight: "bold" }}>
                Marviquint!
              </Text>
            </View>

            {/* 🔥 WALLET CAROUSEL */}
            <FlatList
              data={[{ type: "total" }, ...wallets]}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) =>
                item.id ? item.id.toString() : `total-${index}`
              }
              snapToInterval={CARD_WIDTH + SPACING}
              decelerationRate="fast"
              style={{ marginTop: 16 }}
              contentContainerStyle={{ paddingRight: 16 }}
              // ... everything unchanged above

              renderItem={({ item }) => {
                if (item.type === "total") {
                  return (
                    <LinearGradient
                      colors={theme.custom.gradient}
                      style={{
                        borderRadius: 24,
                        padding: 20,
                        width: CARD_WIDTH,
                        marginRight: SPACING,
                      }}
                    >
                      <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                        Total Budget
                      </Text>

                      <Text
                        style={{
                          color: "white",
                          fontSize: 28,
                          fontWeight: "bold",
                          marginTop: 8,
                        }}
                      >
                        {formatCurrency(INCOME)}
                      </Text>

                      {/* ✅ NEW ROW LAYOUT */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 16,
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: 12,
                            }}
                          >
                            Remaining
                          </Text>
                          <Text style={{ color: "white", fontWeight: "bold" }}>
                            {formatCurrency(REMAINING)}
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: 12,
                            }}
                          >
                            Spent
                          </Text>
                          <Text style={{ color: "white", fontWeight: "bold" }}>
                            {formatCurrency(total)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  );
                }

                const spent = walletSpending[item.id] || 0;
                const balance = safeNumber(item.balance);
                const remaining = balance - spent;

                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedWallet(item);
                      setShowWalletModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={theme.custom.gradient}
                      style={{
                        borderRadius: 24,
                        padding: 20,
                        width: CARD_WIDTH,
                        marginRight: SPACING,
                      }}
                    >
                      <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                        {item.type?.toUpperCase()}
                      </Text>

                      <Text
                        style={{
                          color: "white",
                          fontSize: 20,
                          fontWeight: "bold",
                          marginTop: 6,
                        }}
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={{ color: "white", marginTop: 10, fontSize: 20 }}
                      >
                        {formatCurrency(remaining)}
                      </Text>

                      {/* ✅ NEW ROW LAYOUT */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 16,
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: 12,
                            }}
                          >
                            Remaining
                          </Text>
                          <Text style={{ color: "white", fontWeight: "bold" }}>
                            {formatCurrency(remaining)}
                          </Text>
                        </View>

                        <View style={{ alignItems: "flex-end" }}>
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.7)",
                              fontSize: 12,
                            }}
                          >
                            Spent
                          </Text>
                          <Text style={{ color: "white", fontWeight: "bold" }}>
                            {formatCurrency(spent)}
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }}
            />

            <Text style={{ marginTop: 20, fontWeight: "bold" }}>
              Recent Transactions
            </Text>

            <TransactionList
              data={recentExpenses}
              enableSwipe={false}
              onPressItem={(item) => {
                setSelectedTransaction(item);
                setShowTransactionModal(true);
              }}
            />
          </>
        )}

        {activeTab === "breakdown" && (
          <View style={{ marginTop: 20, marginBottom: 20 }}>
            {/* PIE CHART */}
            <LinearGradient
              colors={theme.custom.gradient}
              style={{
                borderRadius: 20,
                padding: 20,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", marginBottom: 10 }}>
                Category Breakdown
              </Text>

              {categoryData.length > 0 && (
                <PieChart
                  data={categoryData}
                  donut
                  radius={110}
                  innerRadius={65}
                  // ✅ CRITICAL (visibility)
                  showText
                  textColor="white"
                  textSize={12}
                  focusOnPress
                />
              )}

              {/* ✅ LEGEND (THIS FIXES “NOT DISPLAYING”) */}
              <View style={{ marginTop: 12, width: "100%" }}>
                {categoryData.map((item, index) => (
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
                      {item.label} - {formatCurrency(item.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* BAR CHART */}
            <LinearGradient
              colors={theme.custom.gradient}
              style={{
                borderRadius: 20,
                padding: 20,
              }}
            >
              <Text style={{ color: "white", marginBottom: 10 }}>
                Spending Trend
              </Text>

              <BarChart
                data={chartData}
                height={220}
                barWidth={24}
                spacing={30}
                roundedTop
                maxValue={roundedMax}
                noOfSections={4}
                yAxisLabelTexts={yAxisLabels}
                frontColor="#4ade80"
                yAxisTextStyle={{ color: "white", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "white", fontSize: 12 }}
                isAnimated
              />
            </LinearGradient>
          </View>
        )}
      </View>

      <TransactionDetailsModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />

      <UpdateWalletModal
        visible={showWalletModal}
        wallet={selectedWallet}
        cycleId={cycle?.id} // ✅ ADD THIS
        onClose={() => setShowWalletModal(false)}
        onUpdated={loadData}
      />
    </ScrollView>
  );
}
