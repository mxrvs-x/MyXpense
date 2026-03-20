import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import { useRefresh } from "@/context/RefreshContext";
import { useTheme } from "@/types/theme";
import AddBudgetModal from "../../../components/AddBudgetModal";
import TransactionDetailsModal from "../../../components/TransactionDetailsModal";
import TransactionList from "../../../components/TransactionList";
import UpdateBudgetModal from "../../../components/UpdateBudgetModal";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";

export default function Dashboard() {
  const theme = useTheme();

  const [total, setTotal] = useState(0);
  const [cycle, setCycle] = useState<any>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const { refreshKey } = useRefresh();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  const fetchExpenses = async (cycleId: string) => {
    const { data: allData } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cycle_id", cycleId);

    const totalSpent = (allData || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    setTotal(totalSpent);

    const { data: recentData } = await supabase
      .from("expenses")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("date_spent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(3);

    setRecentExpenses(recentData || []);
  };

  const loadData = useCallback(async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);
  }, []);

  useEffect(() => {
    if (cycle?.id) {
      fetchExpenses(cycle.id);
    }
  }, [refreshKey, cycle?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    if (!cycle?.id) return;

    const channel = supabase
      .channel("expenses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: `cycle_id=eq.${cycle.id}`,
        },
        () => {
          fetchExpenses(cycle.id);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cycle]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  };

  const INCOME = Number(cycle?.budget || 0);
  const REMAINING = INCOME - total;
  const progress = INCOME > 0 ? total / INCOME : 0;

  const isOverBudget = total > INCOME;
  const isNearLimit = progress > 0.8 && progress <= 1;

  const statusText = isOverBudget
    ? "Over budget"
    : isNearLimit
      ? "Close to limit"
      : "On track";

  const statusColor = isOverBudget
    ? theme.colors.error
    : isNearLimit
      ? "#facc15"
      : theme.colors.outline;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* 🔒 FIXED HEADER */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* 👋 GREETING */}
        <View style={{ marginTop: 10 }}>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.onSurfaceVariant,
            }}
          >
            Hello,
          </Text>

          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
              color: theme.colors.onBackground,
            }}
          >
            Marviquint!
          </Text>
        </View>

        {/* 💳 CARD */}
        {cycle && (
          <LinearGradient
            colors={theme.custom.gradient}
            style={{
              borderRadius: 24,
              padding: 20,
              marginTop: 16,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>Total Budget</Text>

            <Text
              onPress={() => setShowUpdateModal(true)}
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              {formatCurrency(INCOME)}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                  Remaining
                </Text>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {formatCurrency(REMAINING)}
                </Text>
              </View>

              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>Spent</Text>
                <Text style={{ color: "white", fontWeight: "bold" }}>
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>

            {/* PROGRESS */}
            <View style={{ marginTop: 16 }}>
              <View
                style={{
                  height: 22,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  overflow: "hidden",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    width: `${Math.min(progress * 100, 100)}%`,
                    backgroundColor: statusColor,
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                  }}
                />

                <Text
                  style={{
                    textAlign: "center",
                    color: "white",
                    fontSize: 12,
                    fontWeight: "700",
                  }}
                >
                  {Math.round(progress * 100)}% - {statusText}
                </Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* 🧾 HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: theme.colors.onBackground,
            }}
          >
            RecentTransactions
          </Text>

          <Text
            style={{
              color: theme.colors.primary,
              fontWeight: "600",
            }}
            onPress={() => router.push("/expenses")}
          >
            View All
          </Text>
        </View>
      </View>

      {/* 📋 SCROLLABLE LIST ONLY */}
      <View style={{ flex: 1 }}>
        <TransactionList
          data={recentExpenses.slice(0, 2)}
          onPressItem={(item) => {
            setSelectedTransaction(item);
            setShowTransactionModal(true);
          }}
        />
      </View>

      {/* MODALS */}
      <AddBudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        cycleId={cycle?.id}
        onSaved={loadData}
      />

      <UpdateBudgetModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        cycleId={cycle?.id}
        currentBudget={INCOME}
        onUpdated={loadData}
      />

      <TransactionDetailsModal
        visible={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        transaction={selectedTransaction}
      />
    </View>
  );
}
