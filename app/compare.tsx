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

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(false);

  const [dots, setDots] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (loadingAI) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 400);
    }

    return () => clearInterval(interval);
  }, [loadingAI]);

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

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true);
      setAiError(false);

      const prompt = `
You are a smart financial assistant inside a mobile expense tracking app.

Analyze the user's spending data and provide personalized insights.

IMPORTANT:
- Use ONLY the numbers provided
- DO NOT assume anything
- Focus on COMPARING current vs previous spending
- Base all insights on the difference between them

GOAL:
Generate EXACTLY 6 lines:
- First 3 = insights comparing current vs previous spending
- Next 3 = simple tips based on the comparison

STRICT RULES:
- Use VERY SIMPLE words
- Easy to understand
- Max 8 words per line
- No full sentences
- No complex terms
- No explanations
- No emojis
- One line per item

DATA:
Current spent: ₱${currentTotal}
Current remaining: ₱${currentCycle?.budget - currentTotal}

Previous spent: ₱${previousTotal}
Previous remaining: ₱${previousCycle?.budget - previousTotal}

Difference: ₱${currentTotal - previousTotal}

OUTPUT FORMAT:
Insight
Insight
Insight
Tip
Tip
Tip
`;

      let aiText = "";

      // ✅ 1. TRY GEMINI FIRST
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
      } catch (geminiErr) {
        console.log("Gemini failed, switching to Groq...");

        // ✅ 2. FALLBACK TO GROQ
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

      // ✅ SAME PARSING (unchanged)
      const insights = aiText
        .split("\n")
        .map((line: string) => line.replace(/^[-•\d.\s]+/, "").trim())
        .filter((line: string) => line.length > 0)
        .slice(0, 6);

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

  const hasCurrent = !!currentCycle;
  const hasPrevious = !!previousCycle;

  const currentRemaining = hasCurrent ? currentCycle.budget - currentTotal : 0;

  const previousRemaining = hasPrevious
    ? previousCycle.budget - previousTotal
    : 0;

  const difference =
    hasCurrent && hasPrevious ? currentTotal - previousTotal : 0;

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
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>Current Cycle</Text>

          <Text style={{ color: "white", fontWeight: "bold" }}>
            {hasCurrent
              ? `Spent: ${formatCurrency(currentTotal)}`
              : "No current cycle found"}
          </Text>

          <Text style={{ color: "white" }}>
            {hasCurrent
              ? `Remaining: ${formatCurrency(currentRemaining)}`
              : "Create a cycle to start tracking"}
          </Text>

          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>
              Previous Cycle
            </Text>

            <Text style={{ color: "white", fontWeight: "bold" }}>
              {hasPrevious
                ? `Spent: ${formatCurrency(previousTotal)}`
                : "No previous cycle found"}
            </Text>

            <Text style={{ color: "white" }}>
              {hasPrevious
                ? `Remaining: ${formatCurrency(previousRemaining)}`
                : "Complete a cycle to compare"}
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.7)" }}>Difference</Text>

            <Text
              style={{
                color:
                  hasCurrent && hasPrevious
                    ? difference > 0
                      ? "#f87171"
                      : "#4ade80"
                    : "white",
                fontWeight: "bold",
              }}
            >
              {hasCurrent && hasPrevious
                ? formatCurrency(difference)
                : "Not available"}
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                marginBottom: 6,
              }}
            >
              AI Insights
            </Text>

            {!hasCurrent || !hasPrevious ? (
              <Text style={{ color: "white" }}>
                Insights available after at least one completed cycle.
              </Text>
            ) : loadingAI ? (
              <Text style={{ color: "white" }}>
                AI Analyzing your spending{dots}
              </Text>
            ) : aiError ? (
              <Text style={{ color: "#f87171" }}>
                Failed to generate insights.
              </Text>
            ) : (
              aiInsights.map((insight, index) => {
                const isTip = index >= 3;

                return (
                  <View key={index}>
                    {index === 0 && (
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 8,
                        }}
                      >
                        Insights
                      </Text>
                    )}

                    {index === 3 && (
                      <Text
                        style={{
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 8,
                        }}
                      >
                        Tips
                      </Text>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isTip ? "#facc15" : "#4ade80",
                          marginRight: 6,
                          fontWeight: "bold",
                        }}
                      >
                        {isTip ? "💡" : "•"}
                      </Text>

                      <Text
                        style={{
                          color: "white",
                          fontWeight: isTip ? "600" : "500",
                          flex: 1,
                        }}
                      >
                        {insight}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}
