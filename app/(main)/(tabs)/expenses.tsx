import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
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

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    return selected > today;
  };

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

  // ✅ Memoized generator
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

  // 📡 Fetch
  const fetchExpensesByDate = useCallback(
    async (date: string, cycle_id: string) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

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
        .gte("date_spent", start.toISOString())
        .lte("date_spent", end.toISOString())
        .order("date_spent", { ascending: false });

      if (error) {
        console.log(error);
        setExpenses([]);
        return;
      }

      setExpenses(data || []);
    },
    [],
  );

  const onRefresh = async () => {
    if (!cycle?.id || !selectedDate) return;

    setRefreshing(true);

    await fetchExpensesByDate(selectedDate, cycle.id); // ✅ correct

    setRefreshing(false);
  };

  // 🚀 Init
  const init = useCallback(async () => {
    const currentCycle = await ensureCurrentCycle();
    if (!currentCycle) return;

    setCycle(currentCycle);

    const dates = generateCycleDates(
      currentCycle.start_date,
      currentCycle.end_date,
    );
    setCycleDates(dates);

    const todayStr = formatDateISO(new Date());

    const defaultDate = dates.includes(todayStr) ? todayStr : dates[0];

    setSelectedDate(defaultDate);

    fetchExpensesByDate(defaultDate, currentCycle.id);

    // 🔥 Auto scroll to today
    setTimeout(() => {
      const index = dates.findIndex((d) => d === defaultDate);
      if (index !== -1 && scrollRef.current) {
        scrollRef.current.scrollTo({
          x: index * 60,
          animated: true,
        });
      }
    }, 100);
  }, [generateCycleDates, fetchExpensesByDate]);

  useEffect(() => {
    init();
  }, [init]);

  // 🔁 Refresh trigger (GLOBAL)
  useEffect(() => {
    if (cycle?.id && selectedDate) {
      fetchExpensesByDate(selectedDate, cycle.id);
    }
  }, [refreshKey, cycle?.id, selectedDate, fetchExpensesByDate]);

  function handleSelectDate(date: string) {
    if (isFutureDate(new Date(date))) return; // ❌ block future

    setSelectedDate(date);

    if (cycle?.id) {
      fetchExpensesByDate(date, cycle.id);
    }
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
      edges={["left", "right", "bottom"]} // ✅ EXCLUDE TOP
    >
      {/* 🔒 FIXED HEADER */}
      <View style={{ paddingHorizontal: 16 }}>
        {cycle && (
          <LinearGradient
            colors={theme.custom.gradient}
            style={{ borderRadius: 24, padding: 20 }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 28,
                fontWeight: "bold",
                marginTop: 4,
              }}
            >
              ₱{total.toFixed(2)}
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                marginTop: 4,
                fontSize: 14,
              }}
            >
              {formatPrettyDate(selectedDate)}
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 12,
                marginTop: 8,
              }}
            >
              Current Cycle
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
              }}
            >
              {formatShort(cycle.start_date)} – {formatShort(cycle.end_date)}
            </Text>
          </LinearGradient>
        )}

        {/* 📅 Calendar */}
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
                disabled={isFuture} // 🔥 disable click
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
                  opacity: isFuture ? 0.4 : 1, // 🔥 fade future dates
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
            color: theme.colors.onBackground, // ✅ FIX
          }}
        >
          Today's transactions
        </Text>
        {/* 📋 TRANSACTIONS */}
        <View style={{ flex: 1 }}>
          <TransactionList
            data={expenses}
            onPressItem={(item) => {
              setSelectedTransaction(item);
              setShowModal(true);
            }}
          />
        </View>

        {/* 🪟 MODAL */}
        <TransactionDetailsModal
          visible={showModal}
          onClose={() => setShowModal(false)}
          transaction={selectedTransaction}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
