import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SalaryModal from "../../../components/SalaryModal";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import { styles } from "../../../styles/dashboard.styles";

export default function Dashboard() {
  const [total, setTotal] = useState(0);

  const [cycle, setCycle] = useState<any>(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);

  // 🔥 Fetch expenses
  const fetchExpenses = async (cycleId: string) => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    const expenseData = data || [];

    // Total
    const totalSpent = expenseData.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    setTotal(totalSpent);

    // Category grouping
    const grouped: any = {};
    expenseData.forEach((item) => {
      if (!grouped[item.category]) grouped[item.category] = 0;
      grouped[item.category] += Number(item.amount);
    });
  };

  // 🔥 Load cycle + expenses
  const loadData = useCallback(async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);
    fetchExpenses(currentCycle.id);
  }, []);

  // ✅ First load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🔄 Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  // 📅 Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  };

  const INCOME = cycle?.salary || 0;
  const REMAINING = INCOME - total;

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        {/* 📅 Current Cycle */}
        {cycle && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Cycle</Text>

            <Text style={styles.item}>
              {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}
            </Text>

            <Text style={styles.item}>Salary: ₱ {cycle.salary}</Text>
          </View>
        )}

        {/* ❗ Prompt if no salary */}
        {cycle && cycle.salary === 0 && (
          <TouchableOpacity
            style={[styles.card, { borderColor: "orange", borderWidth: 1 }]}
            onPress={() => setShowSalaryModal(true)}
          >
            <Text style={{ color: "orange" }}>
              ⚠️ Set your salary for this cycle
            </Text>
          </TouchableOpacity>
        )}

        {/* 🔥 Remaining */}
        <View style={styles.cardPrimary}>
          <Text style={styles.cardTitle}>Remaining Balance</Text>
          <Text style={styles.amount}>₱ {REMAINING}</Text>
        </View>

        {/* 💰 Summary */}
        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spent</Text>
            <Text style={styles.amountSmall}>₱ {total}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Salary</Text>
            <Text style={styles.amountSmall}>₱ {INCOME}</Text>
          </View>
        </View>
        <SalaryModal
          visible={showSalaryModal}
          onClose={() => setShowSalaryModal(false)}
          cycleId={cycle?.id}
          onSaved={loadData}
        />
      </SafeAreaView>
    </ScrollView>
  );
}
