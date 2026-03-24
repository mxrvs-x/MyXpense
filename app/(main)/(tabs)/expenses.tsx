import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/types/theme";
import TransactionDetailsModal from "../../../components/TransactionDetailsModal";
import TransactionList from "../../../components/TransactionList";

import { useRefresh } from "@/context/RefreshContext";
import { useLocalSearchParams } from "expo-router";
import { ensureCurrentCycle } from "../../../lib/cycle";
import { supabase } from "../../../lib/supabase";

export default function Expenses() {
  const theme = useTheme();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [cycleDates, setCycleDates] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { refreshKey } = useRefresh();

  const { cycle_id } = useLocalSearchParams<{ cycle_id?: string }>();
  const isArchived = !!cycle_id;
  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState("");

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    return selected > today;
  };

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, [loading]);

  // 📅 Helpers
  function formatDateISO(date: Date) {
    return date.toISOString().split("T")[0];
  }

  function formatPrettyDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  }

  function getDay(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
    });
  }

  // ✅ Generate cycle dates
  const generateCycleDates = useCallback((start: string, end: string) => {
    const dates: string[] = [];
    const current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
      dates.push(formatDateISO(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, []);

  // 🔥 ✅ FIXED FETCH (NO MORE TIMEZONE BUG)
  const fetchExpensesByDate = useCallback(
    async (date: string, cycle_id: string) => {
      try {
        // ✅ start of selected day (local)
        const start = `${date}T00:00:00`;

        // ✅ next day (exclusive end)
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = formatDateISO(nextDay);

        const { data, error } = await supabase
          .from("expenses")
          .select(
            `
            *,
            wallet:wallet_id (
              id,
              name
            )
          `,
          )
          .eq("cycle_id", cycle_id)
          .gte("date_spent", start)
          .lt("date_spent", `${nextDateStr}T00:00:00`) // 🔥 KEY FIX
          .order("date_spent", { ascending: false });

        if (error) {
          console.log(error);
          setExpenses([]);
          return;
        }

        setExpenses(data || []);
      } catch (err) {
        console.log("Fetch error:", err);
        setExpenses([]);
      }
    },
    [],
  );

  const onRefresh = async () => {
    if (!cycle?.id || !selectedDate) return;

    setRefreshing(true);
    await fetchExpensesByDate(selectedDate, cycle.id);
    setRefreshing(false);
  };

  const init = useCallback(async () => {
    try {
      let selectedCycle = null;

      if (cycle_id) {
        const { data } = await supabase
          .from("cycles")
          .select("*")
          .eq("id", cycle_id)
          .single();

        selectedCycle = data;
      } else {
        selectedCycle = await ensureCurrentCycle();
      }

      if (!selectedCycle) return;

      setCycle(selectedCycle);

      const dates = generateCycleDates(
        selectedCycle.start_date,
        selectedCycle.end_date,
      );
      setCycleDates(dates);

      const todayStr = formatDateISO(new Date());

      const defaultDate = cycle_id
        ? dates[0]
        : dates.includes(todayStr)
          ? todayStr
          : dates[0];

      setSelectedDate(defaultDate);

      await fetchExpensesByDate(defaultDate, selectedCycle.id);
    } catch (err) {
      console.log(err);
    } finally {
      // ✅ IMPORTANT
      setLoading(false);
    }
  }, [cycle_id, generateCycleDates, fetchExpensesByDate]);

  useEffect(() => {
    init();
  }, [init]);

  // 🔁 Global refresh trigger
  useEffect(() => {
    if (cycle?.id && selectedDate) {
      fetchExpensesByDate(selectedDate, cycle.id);
    }
  }, [refreshKey, cycle?.id, selectedDate, fetchExpensesByDate]);

  function handleSelectDate(date: string) {
    if (isFutureDate(new Date(date))) return;

    setSelectedDate(date);

    if (cycle?.id) {
      fetchExpensesByDate(date, cycle.id);
    }
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading expenses{dots}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["left", "right", "bottom"]}
    >
      {/* HEADER */}
      <View style={{ paddingHorizontal: 16 }}>
        {cycle && (
          <LinearGradient
            colors={theme.custom.gradient}
            style={{ borderRadius: 24, padding: 20 }}
          >
            <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
              ₱{total.toFixed(2)}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
              {formatPrettyDate(selectedDate)}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              {cycle_id ? "Archived Cycle" : "Current Cycle"}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              {formatShort(cycle.start_date)} – {formatShort(cycle.end_date)}
            </Text>
          </LinearGradient>
        )}

        {/* CALENDAR */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
        >
          {cycleDates.map((date) => {
            const isSelected = date === selectedDate;
            const isFuture = isFutureDate(new Date(date));

            return (
              <TouchableOpacity
                key={date}
                disabled={isFuture}
                onPress={() => handleSelectDate(date)}
                style={{
                  alignItems: "center",
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginRight: 8,
                  borderRadius: 12,
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.surface,
                  opacity: isFuture ? 0.4 : 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: isSelected ? "#fff" : theme.colors.onSurfaceVariant,
                  }}
                >
                  {getDay(date)}
                </Text>

                <Text
                  style={{
                    fontWeight: "bold",
                    color: isSelected ? "#fff" : theme.colors.onSurface,
                  }}
                >
                  {new Date(date).getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text
          style={{
            marginTop: 20,
            fontWeight: "bold",
            marginHorizontal: 20,
            color: theme.colors.onBackground,
          }}
        >
          Today's Transactions
        </Text>

        <View style={{ flex: 1 }}>
          <TransactionList
            data={expenses}
            isArchived={isArchived} // 🔥 IMPORTANT
            onPressItem={(item) => {
              setSelectedTransaction(item);
              setShowModal(true);
            }}
          />
        </View>

        <TransactionDetailsModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          transaction={selectedTransaction}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
