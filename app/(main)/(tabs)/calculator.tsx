import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";

export default function ExpenseCalculator() {
  const theme = useTheme();

  const [cycle, setCycle] = useState<any>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [expenses, setExpenses] = useState<string[]>([""]);

  const [calculated, setCalculated] = useState(false);
  const [totalInput, setTotalInput] = useState(0);
  const [calculatedRemaining, setCalculatedRemaining] = useState(0);

  const insets = useSafeAreaInsets();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const loadData = async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);

    const { data } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cycle_id", currentCycle.id);

    const total = (data || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    setTotalSpent(total);
  };

  useEffect(() => {
    loadData();
  }, []);

  const INCOME = Number(cycle?.budget || 0);
  const REMAINING = INCOME - totalSpent;

  const updateExpense = (value: string, index: number) => {
    const updated = [...expenses];
    updated[index] = value;
    setExpenses(updated);
  };

  const addField = () => {
    setExpenses([...expenses, ""]);
  };

  const removeField = (index: number) => {
    const updated = expenses.filter((_, i) => i !== index);
    setExpenses(updated.length ? updated : [""]);
  };

  const handleCalculate = () => {
    const total = expenses.reduce((sum, val) => {
      const num = Number(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    setTotalInput(total);
    setCalculatedRemaining(REMAINING - total);
    setCalculated(true);
  };

  const handleReset = () => {
    setExpenses([""]);
    setCalculated(false);
    setTotalInput(0);
    setCalculatedRemaining(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* 🔒 HEADER */}
        <View style={{ paddingHorizontal: 16 }}>
          <LinearGradient
            colors={theme.custom.gradient}
            style={{
              borderRadius: 24,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              Current Remaining
            </Text>

            <Text
              style={{
                color: "white",
                fontSize: 32,
                fontWeight: "bold",
                marginTop: 8,
              }}
            >
              {formatCurrency(REMAINING)}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
              Spent: {formatCurrency(totalSpent)}
            </Text>
          </LinearGradient>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 0,
            paddingBottom: insets.bottom + 80,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 16,
            }}
          >
            {!calculated ? (
              <>
                {/* INPUT MODE */}
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 10,
                  }}
                >
                  Add planned expenses
                </Text>

                {expenses.map((value, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <TextInput
                      keyboardType="numeric"
                      value={value}
                      onChangeText={(text) => updateExpense(text, index)}
                      placeholder={`Item ${index + 1}`}
                      placeholderTextColor={theme.colors.outline}
                      style={{
                        flex: 1,
                        backgroundColor: theme.colors.background,
                        borderRadius: 12,
                        padding: 12,
                        color: theme.colors.onBackground,
                      }}
                    />

                    {expenses.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeField(index)}
                        style={{ marginLeft: 8, padding: 10 }}
                      >
                        <Text style={{ color: theme.colors.error }}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity onPress={addField}>
                  <Text
                    style={{
                      color: theme.colors.primary,
                      fontWeight: "600",
                      marginTop: 8,
                    }}
                  >
                    + Add another item
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCalculate}
                  style={{
                    marginTop: 20,
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Calculate
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* RESULT MODE */}
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Total Planned Expense
                </Text>

                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  {formatCurrency(totalInput)}
                </Text>

                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginTop: 10,
                  }}
                >
                  Remaining After Spending
                </Text>

                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color:
                      calculatedRemaining < 0
                        ? theme.colors.error
                        : theme.colors.primary,
                  }}
                >
                  {formatCurrency(calculatedRemaining)}
                </Text>

                {calculatedRemaining < 0 && (
                  <Text style={{ color: theme.colors.error, marginTop: 4 }}>
                    ⚠️ Over budget
                  </Text>
                )}

                {/* 🔁 RESET BUTTON */}
                <TouchableOpacity
                  onPress={handleReset}
                  style={{
                    marginTop: 20,
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Calculate Again
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
