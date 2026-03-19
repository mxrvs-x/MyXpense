import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";
import { styles } from "../../../styles/expense.styles";

export default function Expenses() {
  const [cycle, setCycle] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredExpenses =
    selectedCategory === "All"
      ? expenses
      : expenses.filter(
          (item) =>
            item.category === selectedCategory ||
            (selectedCategory === "Bills" && item.category === "Bills"),
        );

  const categories = [
    "Food",
    "Bills",
    "Transport",
    "Shopping",
    "Health",
    "Entertainment",
    "Others",
  ];

  // 🔥 Load cycle + expenses
  const loadData = useCallback(async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("cycle_id", currentCycle.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setExpenses(data || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ➕ Add Expense
  const addExpense = async () => {
    if (!name || !amount || !category) {
      alert("Please fill all fields");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) {
      alert("User not authenticated");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("expenses").insert([
      {
        name,
        amount: Number(amount),
        category,
        cycle_id: cycle.id,
        user_id: user.id,
        date_spent: today, // 🔥 NEW FIELD
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setAmount("");
    setCategory("");

    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Add Expense</Text>

        <TextInput
          placeholder="Name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
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

        <View
          style={{
            backgroundColor: "#334155",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            dropdownIconColor="#fff"
            style={{ color: "#fff" }}
          >
            <Picker.Item label="Select category..." value="" />

            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={addExpense}>
          <Text style={styles.buttonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Filter by Category</Text>

        <View
          style={{
            backgroundColor: "#334155",
            borderRadius: 8,
          }}
        >
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            dropdownIconColor="#fff"
            style={{ color: "#fff" }}
          >
            <Picker.Item label="All" value="All" />

            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.title}>Recent Expenses</Text>}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                {item.category && (
                  <Text style={styles.category}>{item.category}</Text>
                )}
              </View>

              <Text style={styles.amount}>₱ {item.amount}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
