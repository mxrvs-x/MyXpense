import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useRef, useState } from "react";
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
import TransactionDetailsModal from "../components/TransactionDetailsModal";
import TransactionList from "../components/TransactionList";

import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";

export default function ArchivedExpenses() {
  const theme = useTheme();

  const { cycle_id } = useLocalSearchParams<{ cycle_id: string }>();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [cycleDates, setCycleDates] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cycle, setCycle] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [dots, setDots] = useState("");

  const isFutureDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    return selected > today;
  };

  // loading animation dots (same behavior)
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
      }, 500);

      return () => clearInterval(interval);
    }, []),
  );

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

  const fetchExpensesByDate = useCallback(
    async (date: string, cycle_id: string) => {
      try {
        const start = `${date}T00:00:00`;

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
          .lt("date_spent", `${nextDateStr}T00:00:00`)
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

  // ✅ INIT FOR ARCHIVE ONLY
  const init = useCallback(async () => {
    try {
      if (!cycle_id) return;

      const { data } = await supabase
        .from("cycles")
        .select("*")
        .eq("id", cycle_id)
        .single();

      if (!data) return;

      setCycle(data);

      const dates = generateCycleDates(data.start_date, data.end_date);
      setCycleDates(dates);

      // always start at first date for archive
      const defaultDate = dates[0];

      setSelectedDate(defaultDate);

      await fetchExpensesByDate(defaultDate, data.id);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [cycle_id]);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [init]),
  );

  function handleSelectDate(date: string) {
    if (isFutureDate(new Date(date))) return;

    setSelectedDate(date);

    if (cycle?.id) {
      fetchExpensesByDate(date, cycle.id);
    }
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  // ✅ ALWAYS ARCHIVED
  const isArchived = true;

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

            {/* ✅ ALWAYS ARCHIVED */}
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
              Archived Cycle
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
              {formatShort(cycle.start_date)} – {formatShort(cycle.end_date)}
            </Text>
          </LinearGradient>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 16 }}
        >
          {cycleDates.map((date) => {
            const isSelected = date === selectedDate;

            return (
              <TouchableOpacity
                key={date}
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
            color: theme.colors.onBackground,
          }}
        >
          Transactions
        </Text>

        <View style={{ flex: 1 }}>
          <TransactionList
            data={expenses}
            isArchived={true}
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
