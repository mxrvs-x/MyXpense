import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DateTimePicker from "@react-native-community/datetimepicker";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import { styles } from "../../../styles/bills.styles";

export default function Bills() {
  const [bills, setBills] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);

  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // 🔥 Load Data
  const loadData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const currentCycle = await ensureCurrentCycle();
    setCycle(currentCycle);

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (error) {
      console.log(error.message);
      return;
    }

    setBills(data || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ➕ Add Bill
  const addBill = async () => {
    if (!provider || !amount) {
      alert("Fill all fields");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    const { error } = await supabase.from("bills").insert([
      {
        provider,
        amount: Number(amount),
        due_date: date.toISOString().split("T")[0],
        user_id: user.id,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setProvider("");
    setAmount("");
    setDate(new Date());

    loadData();
  };

  // 💸 Confirm Payment
  const confirmPay = (bill: any) => {
    Alert.alert("Mark as Paid", `Pay ₱${bill.amount} for ${bill.provider}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Pay", onPress: () => markAsPaid(bill) },
    ]);
  };

  const markAsPaid = async (bill: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      alert("User not authenticated");
      return;
    }

    if (!cycle) {
      alert("No active cycle");
      return;
    }

    // ❌ prevent double payment
    if (bill.is_paid) {
      alert("This bill is already paid");
      return;
    }

    // ✅ 1. Insert into expenses
    const { error: expenseError } = await supabase.from("expenses").insert([
      {
        name: bill.provider,
        amount: bill.amount,
        category: "Bills",
        cycle_id: cycle.id,
        user_id: user.id,
        date_spent: new Date().toISOString().split("T")[0],
      },
    ]);

    if (expenseError) {
      alert("Failed to mark as paid: " + expenseError.message);
      return;
    }

    // ✅ 2. Mark bill as paid (instead of deleting)
    const { error: updateError } = await supabase
      .from("bills")
      .update({ is_paid: true })
      .eq("id", bill.id);

    if (updateError) {
      alert("Expense saved but failed to update bill");
      return;
    }

    // ✅ 3. Refresh
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ➕ Add Bill */}
      <View style={styles.card}>
        <Text style={styles.title}>Add Bill</Text>

        <TextInput
          placeholder="Provider"
          placeholderTextColor="#94a3b8"
          value={provider}
          onChangeText={setProvider}
          style={styles.input}
        />

        <TextInput
          placeholder="Amount"
          placeholderTextColor="#94a3b8"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />

        {/* 📅 Date Picker */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ color: "#fff" }}>{date.toDateString()}</Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={addBill}>
          <Text style={styles.buttonText}>+ Add Bill</Text>
        </TouchableOpacity>
      </View>

      {/* 📋 Bills List */}
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No bills yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.row}>
              <View>
                <Text style={styles.provider}>{item.provider}</Text>
                <Text style={styles.dueDate}>
                  Due: {new Date(item.due_date).toDateString()}
                </Text>
              </View>

              <Text style={styles.amount}>₱ {item.amount}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.paidButton,
                { backgroundColor: item.is_paid ? "#64748b" : "#22c55e" },
              ]}
              disabled={item.is_paid}
              onPress={() => confirmPay(item)}
            >
              <Text style={styles.paidText}>
                {item.is_paid ? "Paid" : "Mark as Paid"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
