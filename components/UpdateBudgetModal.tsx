import { useTheme } from "@/types/theme";
import { useState } from "react";
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
  const [budget, setBudget] = useState(String(currentBudget || ""));
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!budget) return;

    setLoading(true);

    const { error } = await supabase
      .from("cycles")
      .update({ budget: Number(budget) })
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
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              color: theme.colors.onSurface,
            }}
          >
            Update Budget
          </Text>

          <TextInput
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            placeholder="Enter new budget"
            style={{
              borderWidth: 1,
              borderColor: theme.colors.outline,
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: theme.colors.onSurface,
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.colors.surfaceVariant,
                alignItems: "center",
              }}
            >
              <Text style={{ color: theme.colors.onSurface }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: theme.colors.primary,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                {loading ? "Updating..." : "Update"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
