import { useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function SalaryModal({
  visible,
  onClose,
  cycleId,
  onSaved,
}: any) {
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!salary) return;

    setLoading(true);

    const { error } = await supabase
      .from("cycles")
      .update({ salary: Number(salary) })
      .eq("id", cycleId);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    onSaved(); // refresh dashboard
    onClose(); // close modal
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
            backgroundColor: "#1e293b",
            padding: 20,
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, marginBottom: 10 }}>
            Set Salary
          </Text>

          <TextInput
            placeholder="Enter salary"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            value={salary}
            onChangeText={setSalary}
            style={{
              backgroundColor: "#334155",
              color: "#fff",
              padding: 12,
              borderRadius: 10,
              marginBottom: 15,
            }}
          />

          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: "#22c55e",
              padding: 12,
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", textAlign: "center" }}>Save</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: "#94a3b8", textAlign: "center" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
