import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";
import { supabase } from "../lib/supabase";

export default function AddBudgetModal({
  visible,
  onClose,
  cycleId,
  onSaved,
}: any) {
  const theme = useTheme();

  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔥 SAME DECIMAL HANDLER AS EXPENSE
  const handleSalaryChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, "");

    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }

    if (parts[1]?.length > 2) {
      cleaned = parts[0] + "." + parts[1].slice(0, 2);
    }

    setSalary(cleaned);
  };

  const handleSave = async () => {
    if (!salary) return;

    const parsed = parseFloat(salary);
    if (isNaN(parsed)) return;

    setLoading(true);

    const { error } = await supabase
      .from("cycles")
      .update({
        salary: parseFloat(parsed.toFixed(2)), // ✅ enforce decimals
      })
      .eq("id", cycleId);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSalary(""); // reset
    onSaved?.();
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
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 18,
              marginBottom: 12,
              textAlign: "center",
              color: theme.colors.onSurface,
            }}
          >
            Set Salary
          </Text>

          {/* SALARY INPUT */}
          <TextInput
            placeholder="Enter salary"
            value={salary}
            onChangeText={handleSalaryChange}
            keyboardType="decimal-pad"
            style={{
              marginTop: 10,
              backgroundColor: theme.colors.background,
              padding: 12,
              borderRadius: 10,
              color: theme.colors.onSurface,
            }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />

          {/* SAVE */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{
              marginTop: 16,
              backgroundColor: theme.colors.primary,
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
            )}
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
