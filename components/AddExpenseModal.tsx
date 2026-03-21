import { useTheme } from "@/types/theme";
import { useEffect, useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

interface Props {
  visible: boolean;
  onClose: () => void;
  cycleId: string;
  currentBudget: number;
  onUpdated: () => void;
}

export default function UpdateBudgetModal({
  visible,
  onClose,
  cycleId,
  currentBudget,
  onUpdated,
}: Props) {
  const theme = useTheme();

  const textColor = theme.colors.onSurface;
  const placeholderColor = theme.colors.onSurfaceVariant;

  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 Sync value when modal opens
  useEffect(() => {
    if (visible) {
      setBudget(currentBudget ? String(currentBudget) : "");
    }
  }, [visible, currentBudget]);

  // 🔥 Decimal input (same as AddExpense)
  const handleBudgetChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    if (parts[1]?.length > 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }

    setBudget(cleaned);
  };

  const handleUpdate = async () => {
    if (!budget) return;

    const parsed = parseFloat(budget);
    if (isNaN(parsed)) return;

    setLoading(true);

    const { error } = await supabase
      .from("cycles")
      .update({ budget: Number(parsed.toFixed(2)) })
      .eq("id", cycleId);

    setLoading(false);

    if (error) {
      console.log(error.message);
      return;
    }

    onUpdated();
    onClose();
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
          {/* TITLE */}
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              textAlign: "center",
              color: textColor,
            }}
          >
            Update Budget
          </Text>

          {/* INPUT */}
          <TextInput
            placeholder="Enter new budget"
            placeholderTextColor={placeholderColor}
            value={budget}
            onChangeText={handleBudgetChange}
            keyboardType="decimal-pad"
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.background,
              padding: 12,
              borderRadius: 10,
              color: textColor,
            }}
          />

          {/* UPDATE BUTTON */}
          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading}
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.primary,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {loading ? "Updating..." : "Update"}
            </Text>
          </TouchableOpacity>

          {/* CANCEL */}
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
