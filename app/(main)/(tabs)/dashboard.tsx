import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import { styles } from "../../../styles/dashboard.styles";

export default function Dashboard() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState<any>({});
  const [cycle, setCycle] = useState<any>(null);

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
    setExpenses(expenseData);

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

    setCategoryTotals(grouped);
  };

  // 🔥 Load cycle + expenses
  const loadData = async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);
    fetchExpenses(currentCycle.id);
  };

  // ✅ First load
  useEffect(() => {
    loadData();
  }, []);

  // 🔄 Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
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
            onPress={() => router.push("/(main)/set-income" as any)}
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
            <Text style={styles.cardTitle}>Expenses</Text>
            <Text style={styles.amountSmall}>₱ {total}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Income</Text>
            <Text style={styles.amountSmall}>₱ {INCOME}</Text>
          </View>
        </View>

        {/* 📊 Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category Breakdown</Text>

          {Object.keys(categoryTotals).length === 0 && (
            <Text style={styles.item}>No expenses yet</Text>
          )}

          {Object.entries(categoryTotals).map(([category, amount]: any) => (
            <View
              key={category}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.item}>{category}</Text>
              <Text style={styles.item}>₱ {amount}</Text>
            </View>
          ))}
        </View>

        {/* 🧾 Recent */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Expenses</Text>

          {expenses.length === 0 && (
            <Text style={styles.item}>No expenses yet</Text>
          )}

          {expenses.slice(0, 5).map((item) => (
            <View
              key={item.id}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={styles.item}>{item.name}</Text>
              <Text style={styles.item}>₱ {item.amount}</Text>
            </View>
          ))}
        </View>

        {/* ➕ Add Expense */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(main)/add-expense" as any)}
        >
          <Text style={styles.addText}>+ Add Expense</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </ScrollView>
  );
}
