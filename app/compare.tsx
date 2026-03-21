import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import { ensureCurrentCycle } from "../lib/cycle";
import { supabase } from "../lib/supabase";

export default function CompareCycles() {
  const theme = useTheme();

  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [previousCycle, setPreviousCycle] = useState<any>(null);

  const [currentTotal, setCurrentTotal] = useState(0);
  const [previousTotal, setPreviousTotal] = useState(0);

  // 🔥 AI STATE
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const fetchTotal = async (cycleId: string, setter: any) => {
    const { data } = await supabase
      .from("expenses")
      .select("amount")
      .eq("cycle_id", cycleId);

    const total = (data || []).reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    setter(total);
  };

  const loadData = async () => {
    const current = await ensureCurrentCycle();
    setCurrentCycle(current);

    if (current?.id) {
      await fetchTotal(current.id, setCurrentTotal);
    }

    const now = new Date();

    const { data } = await supabase
      .from("cycles")
      .select("*")
      .lt("end_date", now.toISOString())
      .order("end_date", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setPreviousCycle(data[0]);
      await fetchTotal(data[0].id, setPreviousTotal);
    }
  };

  // 🔥 AI FUNCTION (NO FALLBACK)
  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true);
      setAiError(false);

      const prompt = `
You are a smart financial assistant inside a mobile expense tracking app.

Analyze the user's spending data and provide personalized insights.

DATA:
Current Cycle:
- Total Spent: ₱${currentTotal}
- Budget: ₱${currentCycle?.budget}
- Remaining: ₱${currentCycle?.budget - currentTotal}

Previous Cycle:
- Total Spent: ₱${previousTotal}
- Budget: ₱${previousCycle?.budget}
- Remaining: ₱${previousCycle?.budget - previousTotal}

INSTRUCTIONS:
- Give exactly 3 to 5 insights
- Each insight must be 1 sentence only
- Be specific (mention numbers or comparisons)
- Focus on spending behavior (overspending, saving, trends)
- Include at least 1 actionable advice
- Use a friendly, modern tone

FORMAT:
Return ONLY bullet points like this:
• Insight 1
• Insight 2
• Insight 3
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

      if (!data.response) {
        throw new Error("No AI response");
      }

      const insights = data.response
        .split("\n")
        .map((line: string) => line.replace(/^•\s*/, "").trim())
        .filter((line: string) => line.length > 0);

      setAiInsights(insights);
    } catch (err) {
      console.log("AI error:", err);
      setAiError(true);
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentCycle && previousCycle) {
      fetchAIInsights();
    }
  }, [currentCycle, previousCycle]);

  if (!currentCycle || !previousCycle) {
    return (
      <SafeAreaView>
        <Text style={{ padding: 20 }}>Loading comparison...</Text>
      </SafeAreaView>
    );
  }

  const currentRemaining = currentCycle.budget - currentTotal;
  const previousRemaining = previousCycle.budget - previousTotal;
  const difference = currentTotal - previousTotal;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          Compare Cycles
        </Text>

        <LinearGradient
          colors={theme.custom.gradient}
          style={{
            borderRadius: 20,
            padding: 20,
            marginTop: 20,
          }}
        >
          {/* CURRENT */}
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>Current Cycle</Text>
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Spent: {formatCurrency(currentTotal)}
          </Text>
          <Text style={{ color: "white" }}>
            Remaining: {formatCurrency(currentRemaining)}
          </Text>

          {/* PREVIOUS */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              Previous Cycle
            </Text>
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Spent: {formatCurrency(previousTotal)}
            </Text>
            <Text style={{ color: "white" }}>
              Remaining: {formatCurrency(previousRemaining)}
            </Text>
          </View>

          {/* DIFFERENCE */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>Difference</Text>
            <Text
              style={{
                color: difference > 0 ? "#f87171" : "#4ade80",
                fontWeight: "bold",
              }}
            >
              {formatCurrency(difference)}
            </Text>
          </View>

          {/* 🔥 AI INSIGHTS ONLY */}
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
              AI Insights
            </Text>

            {loadingAI ? (
              <Text style={{ color: "white" }}>
                🤖 Analyzing your spending...
              </Text>
            ) : aiError ? (
              <Text style={{ color: "#f87171" }}>
                Failed to generate insights. Please try again.
              </Text>
            ) : (
              aiInsights.map((insight, index) => (
                <Text
                  key={index}
                  style={{
                    color: "white",
                    fontWeight: "600",
                    marginBottom: 4,
                  }}
                >
                  • {insight}
                </Text>
              ))
            )}
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
