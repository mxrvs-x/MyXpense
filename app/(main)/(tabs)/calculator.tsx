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
  const [wallets, setWallets] = useState<any[]>([]); // ✅ NEW
  const [expenses, setExpenses] = useState<string[]>([""]);

  const [calculated, setCalculated] = useState(false);
  const [totalInput, setTotalInput] = useState(0);
  const [calculatedRemaining, setCalculatedRemaining] = useState(0);

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

  const fetchWallets = async () => {
    const { data } = await supabase.from("wallets").select("balance");

    setWallets(data || []);
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

    await fetchWallets(); // ✅ IMPORTANT
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (loadingAI) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 400);
    }

    return () => clearInterval(interval);
  }, [loadingAI]);

  // ✅ FIXED CALCULATION
  const INCOME = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

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

  const fetchAIInsights = async (plannedTotal: number, remaining: number) => {
    try {
      setLoadingAI(true);
      setAiError(false);

      const prompt = `
You are a smart financial assistant inside a mobile expense tracking app.

Analyze the user's planned spending data and provide personalized insights.

IMPORTANT:
- Use ONLY the numbers provided
- DO NOT assume anything
- DO NOT use past spending
- Focus ONLY on planned expenses
- Treat "remaining after plan" as final outcome

GOAL:
Generate EXACTLY 6 lines:
- First 3 = insights about planned spending
- Next 3 = simple tips based on the plan

STRICT RULES:
- Use VERY SIMPLE words
- Easy to understand for anyone
- Max 8 words per line
- No full sentences
- No complex terms
- No explanations
- No emojis
- One line per item

DATA:
Planned spending: ₱${plannedTotal}
Remaining after plan: ₱${remaining}

OUTPUT FORMAT:
Insight
Insight
Insight
Tip
Tip
Tip
`;

      let aiText = "";

      try {
        const geminiRes = await fetch(
          "https://ckntamtouzpuevbmpgav.supabase.co/functions/v1/gemini-ai",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          },
        );

        const geminiData = await geminiRes.json();

        if (geminiData?.response) {
          aiText = geminiData.response;
        } else {
          throw new Error("Gemini failed");
        }
      } catch {
        const groqRes = await fetch(
          "https://ckntamtouzpuevbmpgav.supabase.co/functions/v1/groq-ai",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          },
        );

        const groqData = await groqRes.json();

        if (!groqData?.response) {
          throw new Error("Groq fallback failed");
        }

        aiText = groqData.response;
      }

      const cleaned = aiText
        .split("\n")
        .map((line: string) => line.replace(/^[-•\d.\s]+/, "").trim())
        .filter((line: string) => line.length > 0);

      const insights = cleaned.slice(0, 3);
      const tips = cleaned.slice(3, 6);

      while (insights.length < 3) insights.push("No insight generated");
      while (tips.length < 3) tips.push("No tip generated");

      setAiInsights([...insights, ...tips]);
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
                      placeholderTextColor={theme.colors.onSurface}
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

                <View style={{ marginTop: 20 }}>
                  {loadingAI ? (
                    <Text>AI Analyzing your planned expense {dots}</Text>
                  ) : aiError ? (
                    <Text style={{ color: theme.colors.error }}>
                      Failed to load insights
                    </Text>
                  ) : (
                    <>
                      <Text style={{ marginTop: 10, fontWeight: "600" }}>
                        Insights
                      </Text>
                      {aiInsights.slice(0, 3).map((item, i) => (
                        <Text key={`insight-${i}`} style={{ marginBottom: 4 }}>
                          • {item}
                        </Text>
                      ))}

                      <Text style={{ marginTop: 10, fontWeight: "600" }}>
                        Tips
                      </Text>
                      {aiInsights.slice(3, 6).map((item, i) => (
                        <Text key={`tip-${i}`} style={{ marginBottom: 4 }}>
                          • {item}
                        </Text>
                      ))}
                    </>
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
