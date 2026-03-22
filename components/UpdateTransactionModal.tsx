import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction: any;
  onSave: (updated: any) => void;
}

export default function UpdateTransactionModal({
  visible,
  onClose,
  transaction,
  onSave,
}: Props) {
  const theme = useTheme();

  const textColor = theme.colors.onSurface;
  const placeholderColor = theme.colors.onSurfaceVariant;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [category, setCategory] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  const [wallets, setWallets] = useState<any[]>([]);

  const [showCategory, setShowCategory] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const catItems = [
    "Food",
    "Groceries",
    "Bills",
    "Transport",
    "Shopping",
    "Health & Fitness",
    "Gaming",
    "Miscellaneous",
  ];

  const closeAllDropdowns = () => {
    setShowCategory(false);
    setShowWallet(false);
  };

  // ✅ LOAD TRANSACTION
  useEffect(() => {
    if (transaction) {
      setName(transaction.name || "");
      setAmount(String(transaction.amount || ""));
      setNotes(transaction.notes || "");
      setCategory(transaction.category || null);
      setWalletId(transaction.wallet_id || null);
    }
  }, [transaction]);

  // ✅ FETCH WALLETS
  useEffect(() => {
    if (visible) fetchWallets();
  }, [visible]);

  const fetchWallets = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id);

    setWallets(data || []);
  };

  if (!transaction) return null;

  // ✅ DECIMAL INPUT
  const handleAmountChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    if (parts[1]?.length > 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }

    setAmount(cleaned);
  };

  // ✅ SAVE
  const handleSave = async () => {
    if (isSaving) return; // 🚫 prevent double click

    setIsSaving(true);

    try {
      if (!name || !amount || !category || !walletId) return;

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) return;

      const { error } = await supabase
        .from("expenses")
        .update({
          name,
          amount: Number(parsedAmount.toFixed(2)),
          category,
          notes: notes || null,
          wallet_id: walletId,
        })
        .eq("id", transaction.id);

      if (error) {
        console.log(error.message);
        return;
      }

      onSave({
        ...transaction,
        name,
        amount: parsedAmount,
        category,
        notes,
        wallet_id: walletId,
      });

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ DROPDOWN (same as Add)
  const renderDropdown = (
    label: string,
    value: string | null,
    show: boolean,
    setShow: (v: boolean) => void,
    items: any[],
    onSelect: (val: any) => void,
    isWallet = false,
  ) => (
    <>
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss();
          closeAllDropdowns();
          setShow(!show);
        }}
        style={{
          marginTop: 10,
          backgroundColor: theme.colors.background,
          padding: 12,
          borderRadius: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: value ? textColor : placeholderColor }}>
          {value
            ? isWallet
              ? wallets.find((w) => w.id === value)?.name
              : value
            : label}
        </Text>

        <MaterialIcons
          name={show ? "keyboard-arrow-up" : "keyboard-arrow-down"}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {show && (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 10,
            marginTop: 5,
            maxHeight: 200,
            borderWidth: 1,
            borderColor: theme.colors.outline,
          }}
        >
          <ScrollView nestedScrollEnabled>
            {items.map((item: any) => (
              <TouchableOpacity
                key={item.id || item}
                onPress={() => {
                  onSelect(item.id || item);
                  closeAllDropdowns();
                }}
                style={{ padding: 12 }}
              >
                <Text style={{ color: textColor }}>
                  {isWallet ? item.name : item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            closeAllDropdowns();
          }}
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
              maxHeight: "90%",
              backgroundColor: theme.colors.surface,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <ScrollView>
              <Text
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  marginBottom: 12,
                  textAlign: "center",
                  color: theme.colors.onSurface,
                }}
              >
                Update Expense
              </Text>

              <TextInput
                placeholder="Name"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={setName}
                style={inputStyle(theme, textColor)}
              />

              <TextInput
                placeholder="Amount"
                placeholderTextColor={placeholderColor}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="decimal-pad"
                style={inputStyle(theme, textColor)}
              />

              <TextInput
                placeholder="Notes (optional)"
                placeholderTextColor={placeholderColor}
                value={notes}
                onChangeText={setNotes}
                multiline
                style={[inputStyle(theme, textColor), { height: 80 }]}
              />

              {renderDropdown(
                "Category",
                category,
                showCategory,
                setShowCategory,
                catItems,
                setCategory,
              )}

              {renderDropdown(
                "Select Wallet",
                walletId,
                showWallet,
                setShowWallet,
                wallets,
                setWalletId,
                true,
              )}

              <TouchableOpacity
                onPress={handleSave}
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
            </ScrollView>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const inputStyle = (theme: any, textColor: string) => ({
  marginTop: 10,
  backgroundColor: theme.colors.background,
  padding: 12,
  borderRadius: 10,
  color: textColor,
});
