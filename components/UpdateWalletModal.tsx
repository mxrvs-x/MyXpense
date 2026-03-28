import { useTheme } from "@/types/theme";
import { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  wallet: any;
  cycleId: string; // ✅ REQUIRED
  onUpdated: () => void | Promise<void>;
}

export default function UpdateWalletModal({
  visible,
  onClose,
  wallet,
  cycleId, // ✅ ADD THIS
  onUpdated,
}: Props) {
  const theme = useTheme();

  const textColor = theme.colors.onSurface;
  const placeholderColor = theme.colors.onSurfaceVariant;

  const [balance, setBalance] = useState("");
  const [loading, setLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && wallet) {
      setBalance(
        wallet.currentBalance !== undefined && wallet.currentBalance !== null
          ? String(wallet.currentBalance)
          : "",
      );
    }
  }, [visible, wallet]);

  const handleBalanceChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    if (parts[1]?.length > 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }

    setBalance(cleaned);
  };

  const handleUpdate = async () => {
    if (isSaving) return; // 🚫 prevent double click

    setIsSaving(true);

    try {
      if (!balance) return;
      if (!cycleId) {
        console.log("Missing cycleId");
        return;
      }

      const parsed = parseFloat(balance);
      if (isNaN(parsed)) return;

      setLoading(true);

      // ✅ 1. Get current spent for THIS wallet
      const { data: expensesData, error: expenseError } = await supabase
        .from("expenses")
        .select("amount")
        .eq("wallet_id", wallet.id);

      if (expenseError) {
        console.log(expenseError.message);
        setLoading(false);
        return;
      }

      const spent = (expensesData || []).reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      // ✅ 2. Convert remaining → total balance
      const newBalance = parsed + spent;

      // ✅ 3. Update wallet (FIXED)
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: Number(newBalance.toFixed(2)) })
        .eq("id", wallet.id);

      if (walletError) {
        console.log(walletError.message);
        setLoading(false);
        return;
      }

      // ✅ 4. Get ALL wallets (unchanged)
      const { data: wallets, error: fetchError } = await supabase
        .from("wallets")
        .select("id, balance");

      if (fetchError) {
        console.log(fetchError.message);
        setLoading(false);
        return;
      }

      // ✅ 5. Recompute total budget (FIXED)
      const totalBudget = (wallets || []).reduce((sum, w) => {
        if (w.id === wallet.id) {
          return sum + Number(newBalance); // 🔥 use newBalance, not parsed
        }
        return sum + Number(w.balance || 0);
      }, 0);

      // ✅ 6. Update cycle (unchanged)
      const { error: cycleError } = await supabase
        .from("cycles")
        .update({ budget: Number(totalBudget.toFixed(2)) })
        .eq("id", cycleId);

      setLoading(false);

      if (cycleError) {
        console.log(cycleError.message);
        return;
      }

      onUpdated();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.4)",
          padding: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: textColor,
            }}
          >
            Update Wallet Balance
          </Text>

          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              marginBottom: 18,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {wallet?.name}
          </Text>

          <TextInput
            placeholder="Enter new balance"
            placeholderTextColor={placeholderColor}
            value={balance}
            onChangeText={handleBalanceChange}
            keyboardType="decimal-pad"
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.background,
              padding: 12,
              borderRadius: 10,
              color: textColor,
            }}
          />

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isSaving}
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.primary,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {isSaving ? "Updating..." : "Update"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
            <Text
              style={{
                textAlign: "center",
                color: theme.colors.onSurfaceVariant,
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
