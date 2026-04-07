import { useTheme } from "@/types/theme";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  wallet: any;
  onUpdated: () => void | Promise<void>;
}

export default function UpdateWalletModal({
  visible,
  onClose,
  wallet,
  onUpdated,
}: Props) {
  const theme = useTheme();

  const textColor = theme.colors.onSurface;
  const placeholderColor = theme.colors.onSurfaceVariant;

  const [activeTab, setActiveTab] = useState<"update" | "transfer">("update");

  const [balance, setBalance] = useState("");
  const [wallets, setWallets] = useState<any[]>([]);

  const [fromWallet, setFromWallet] = useState<any>(null);
  const [toWallet, setToWallet] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && wallet) {
      setBalance(String(wallet.balance || ""));
      setFromWallet(wallet);
      fetchWallets();
    }
  }, [visible, wallet]);

  const fetchWallets = async () => {
    const { data } = await supabase.from("wallets").select("*");
    setWallets(data || []);
  };

  const handleBalanceChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
    if (parts[1]?.length > 2) cleaned = parts[0] + "." + parts[1].slice(0, 2);
    setBalance(cleaned);
  };

  const handleTransferChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
    if (parts[1]?.length > 2) cleaned = parts[0] + "." + parts[1].slice(0, 2);
    setTransferAmount(cleaned);
  };

  // ✅ UPDATE BALANCE
  const handleUpdate = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const parsed = parseFloat(balance);
      if (isNaN(parsed)) return;

      const { error } = await supabase
        .from("wallets")
        .update({ balance: Number(parsed.toFixed(2)) })
        .eq("id", wallet.id);

      if (error) {
        console.log(error.message);
        return;
      }

      onUpdated();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ TRANSFER MONEY
  const handleTransfer = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      if (!fromWallet || !toWallet || !transferAmount) return;

      const amount = parseFloat(transferAmount);
      if (isNaN(amount) || amount <= 0) return;

      if (fromWallet.id === toWallet.id) {
        alert("Cannot transfer to the same wallet");
        return;
      }

      if (Number(fromWallet.balance) < amount) {
        alert("Not enough balance");
        return;
      }

      const newFromBalance = Number(fromWallet.balance) - amount;
      const newToBalance = Number(toWallet.balance) + amount;

      // 🔥 Update BOTH wallets
      const { error: fromError } = await supabase
        .from("wallets")
        .update({ balance: Number(newFromBalance.toFixed(2)) })
        .eq("id", fromWallet.id);

      if (fromError) {
        console.log(fromError.message);
        return;
      }

      const { error: toError } = await supabase
        .from("wallets")
        .update({ balance: Number(newToBalance.toFixed(2)) })
        .eq("id", toWallet.id);

      if (toError) {
        console.log(toError.message);
        return;
      }

      onUpdated();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const renderWalletSelector = (
    label: string,
    selected: any,
    setSelected: any,
  ) => (
    <View style={{ marginTop: 10 }}>
      <Text style={{ color: placeholderColor }}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 8 }}
      >
        {wallets.map((w) => (
          <TouchableOpacity
            key={w.id}
            onPress={() => setSelected(w)}
            style={{
              padding: 10,
              marginRight: 8,
              borderRadius: 10,
              backgroundColor:
                selected?.id === w.id
                  ? theme.colors.primary
                  : theme.colors.background,
            }}
          >
            <Text
              style={{
                color: selected?.id === w.id ? "#fff" : theme.colors.onSurface,
              }}
            >
              {w.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

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
          {/* 🔥 Tabs */}
          <View style={{ flexDirection: "row", marginBottom: 16 }}>
            {["update", "transfer"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as any)}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor:
                    activeTab === tab
                      ? theme.colors.primary
                      : theme.colors.background,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: activeTab === tab ? "#fff" : theme.colors.onSurface,
                  }}
                >
                  {tab === "update" ? "Update" : "Transfer"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ================= UPDATE TAB ================= */}
          {activeTab === "update" && (
            <>
              <Text style={{ color: textColor, marginBottom: 10 }}>
                {wallet?.name}
              </Text>

              <TextInput
                placeholder="Enter new balance"
                placeholderTextColor={placeholderColor}
                value={balance}
                onChangeText={handleBalanceChange}
                keyboardType="decimal-pad"
                style={{
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
            </>
          )}

          {/* ================= TRANSFER TAB ================= */}
          {activeTab === "transfer" && (
            <>
              {renderWalletSelector("From Wallet", fromWallet, setFromWallet)}
              {renderWalletSelector("To Wallet", toWallet, setToWallet)}

              <TextInput
                placeholder="Amount"
                placeholderTextColor={placeholderColor}
                value={transferAmount}
                onChangeText={handleTransferChange}
                keyboardType="decimal-pad"
                style={{
                  marginTop: 12,
                  backgroundColor: theme.colors.background,
                  padding: 12,
                  borderRadius: 10,
                  color: textColor,
                }}
              />

              <TouchableOpacity
                onPress={handleTransfer}
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
                  {isSaving ? "Transferring..." : "Transfer"}
                </Text>
              </TouchableOpacity>
            </>
          )}

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
