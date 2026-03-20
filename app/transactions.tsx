import { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

import TransactionDetailsModal from "@/components/TransactionDetailsModal";
import TransactionList from "@/components/TransactionList";
import { ensureCurrentCycle } from "@/lib/cycle";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/types/theme";

export default function TransactionsScreen() {
  const theme = useTheme();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAllTransactions = async () => {
    const cycle = await ensureCurrentCycle();
    if (!cycle) return;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("cycle_id", cycle.id)
      .order("date_spent", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setTransactions(data || []);
  };

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* HEADER */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          All Transactions
        </Text>
      </View>

      {/* ✅ NO ScrollView here */}
      <TransactionList
        data={transactions}
        onPressItem={(item) => {
          setSelectedTransaction(item);
          setShowModal(true);
        }}
      />

      {/* MODAL */}
      <TransactionDetailsModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        transaction={selectedTransaction}
      />
    </View>
  );
}
