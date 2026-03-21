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

  // ✅ AI states
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [dots, setDots] = useState("");

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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loadingAI) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 400);
    }

    return () => clearInterval(interval);
  }, [loadingAI]);

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

  // 🔥 GEMINI AI FUNCTION
  const fetchAIInsights = async (plannedTotal: number, remaining: number) => {
    try {
      setLoadingAI(true);
      setAiError(false);

      const prompt = `
You are a financial assistant inside a mobile app.

Provide EXACTLY 4 short insights about the user's planned expenses.

RULES:
- Max 10 words per line
- Bullet format
- Practical and actionable
- No emojis

DATA:
Budget: ₱${INCOME}
Already spent: ₱${totalSpent}
Planned spending: ₱${plannedTotal}
Remaining after plan: ₱${remaining}

FORMAT:
• Insight
• Insight
• Tip
• Tip
`;

      const res = await fetch(
        "https://ckntamtouzpuevbmpgav.supabase.co/functions/v1/gemini-ai",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        },
      );

      const data = await res.json();

      if (!data.response) throw new Error("No AI response");

      const insights = data.response
        .split("\n")
        .map((line: string) => line.replace(/^[-•\d.\s]+/, "").trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 4);

      setAiInsights(insights);
    } catch (err) {
      console.log(err);
      setAiError(true);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCalculate = async () => {
    const total = expenses.reduce((sum, val) => {
      const num = Number(val);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const remaining = REMAINING - total;

    setTotalInput(total);
    setCalculatedRemaining(remaining);
    setCalculated(true);

    // 🔥 trigger AI
    await fetchAIInsights(total, remaining);
  };

  const handleReset = () => {
    setExpenses([""]);
    setCalculated(false);
    setTotalInput(0);
    setCalculatedRemaining(0);
    setAiInsights([]);
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
                      placeholder={`Amount ${index + 1}`}
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
                    + Add another amount
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

                {/* 🔥 AI INSIGHTS */}
                <View style={{ marginTop: 20 }}>
                  <Text style={{ marginBottom: 6 }}>AI Insights</Text>

                  {loadingAI ? (
                    <Text>AI Analyzing your planned expense {dots}</Text>
                  ) : aiError ? (
                    <Text style={{ color: theme.colors.error }}>
                      Failed to load insights
                    </Text>
                  ) : (
                    aiInsights.map((item, i) => (
                      <Text key={i} style={{ marginBottom: 4 }}>
                        • {item}
                      </Text>
                    ))
                  )}
                </View>

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
