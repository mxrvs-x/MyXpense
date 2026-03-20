import { useState } from "react";
import {
    Keyboard,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useTheme } from "react-native-paper";
import { supabase } from "../lib/supabase";

export default function AddExpenseModal({
  visible,
  onClose,
  cycleId,
  onSaved,
}: any) {
  const theme = useTheme();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  // CATEGORY
  const [catOpen, setCatOpen] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  // PAYMENT TYPE
  const [typeOpen, setTypeOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<string | null>(null);

  // PAYMENT METHOD
  const [methodOpen, setMethodOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const [catItems, setCatItems] = useState([
    { label: "Food", value: "Food" },
    { label: "Bills", value: "Bills" },
    { label: "Transport", value: "Transport" },
    { label: "Shopping", value: "Shopping" },
    { label: "Health & Fitness", value: "Health & Fitness" },
    { label: "Gaming", value: "Gaming" },
    { label: "Miscellaneous", value: "Miscellaneous" },
  ]);

  const [typeItems, setTypeItems] = useState([
    { label: "Cash", value: "cash" },
    { label: "Cashless", value: "cashless" },
  ]);

  const [methodItems, setMethodItems] = useState([
    { label: "GCash", value: "gcash" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Debit Card", value: "debit_card" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Maribank", value: "maribank" },
  ]);

  // 🔥 CENTRALIZED OPEN HANDLER (ONLY ONE OPEN)
  const handleOpen = (type: "cat" | "type" | "method") => {
    Keyboard.dismiss();

    setCatOpen(type === "cat");
    setTypeOpen(type === "type");
    setMethodOpen(type === "method");
  };

  // 🔥 DECIMAL INPUT
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

  const handleSave = async () => {
    if (!name || !amount || !category || !paymentType) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("expenses").insert({
      name,
      amount: parseFloat(parsedAmount.toFixed(2)),
      category,
      payment_type: paymentType,
      payment_method: paymentType === "cash" ? null : paymentMethod,
      cycle_id: cycleId,
      date_spent: new Date().toISOString(),
      user_id: user?.id,
    });

    if (error) {
      console.log(error.message);
      return;
    }

    // RESET
    setName("");
    setAmount("");
    setCategory(null);
    setPaymentType(null);
    setPaymentMethod(null);

    onClose();
    onSaved?.();
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
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Add Expense
          </Text>

          {/* NAME */}
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.background,
              padding: 12,
              borderRadius: 10,
            }}
          />

          {/* AMOUNT */}
          <TextInput
            placeholder="Amount"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.background,
              padding: 12,
              borderRadius: 10,
            }}
          />

          {/* CATEGORY */}
          <View style={{ marginTop: 10 }}>
            <DropDownPicker
              open={catOpen}
              onOpen={() => handleOpen("cat")}
              value={category}
              items={catItems}
              setOpen={setCatOpen}
              setValue={setCategory}
              setItems={setCatItems}
              placeholder="Category"
              listMode="SCROLLVIEW"
              style={{
                borderRadius: 10,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.background,
              }}
              dropDownContainerStyle={{
                borderRadius: 10,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              }}
            />
          </View>

          {/* PAYMENT TYPE */}
          <View style={{ marginTop: 10, zIndex: 2000 }}>
            <DropDownPicker
              open={typeOpen}
              onOpen={() => handleOpen("type")}
              value={paymentType}
              items={typeItems}
              setOpen={setTypeOpen}
              setValue={setPaymentType}
              setItems={setTypeItems}
              placeholder="Payment Type"
              listMode="SCROLLVIEW"
              style={{
                borderRadius: 10,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.background,
              }}
              dropDownContainerStyle={{
                borderRadius: 10,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              }}
            />
          </View>

          {/* PAYMENT METHOD */}
          {paymentType === "cashless" && (
            <View style={{ marginTop: 10, zIndex: 1000 }}>
              <DropDownPicker
                open={methodOpen}
                onOpen={() => handleOpen("method")}
                value={paymentMethod}
                items={methodItems}
                setOpen={setMethodOpen}
                setValue={setPaymentMethod}
                setItems={setMethodItems}
                placeholder="Payment Method"
                listMode="SCROLLVIEW"
                style={{
                  borderRadius: 10,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.background,
                }}
                dropDownContainerStyle={{
                  borderRadius: 10,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                }}
              />
            </View>
          )}

          {/* SAVE */}
          <TouchableOpacity
            onPress={handleSave}
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.primary,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
            <Text style={{ textAlign: "center" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
