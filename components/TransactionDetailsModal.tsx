import { useTheme } from "@/types/theme";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction: any;
}

export default function TransactionDetailsModal({
  visible,
  onClose,
  transaction,
}: Props) {
  const theme = useTheme();

  if (!transaction) return null;

  // ✅ FORMATTERS
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  // ✅ CATEGORY LABELS
  const catItems = [
    { label: "Food", value: "Food" },
    { label: "Groceries", value: "Groceries" },
    { label: "Bills", value: "Bills" },
    { label: "Transport", value: "Transport" },
    { label: "Shopping", value: "Shopping" },
    { label: "Health & Fitness", value: "Health & Fitness" },
    { label: "Gaming", value: "Gaming" },
    { label: "Miscellaneous", value: "Miscellaneous" },
  ];

  // ✅ HELPER
  const getLabel = (
    items: { label: string; value: string }[],
    value: string | null,
  ) => {
    if (!value) return "—";
    const found = items.find((item) => item.value === value);
    return found ? found.label : value;
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
              marginBottom: 16,
              color: theme.colors.onSurface,
            }}
          >
            Transaction Details
          </Text>

          {/* Name */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Name</Text>
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 10,
              color: theme.colors.onSurface,
            }}
          >
            {transaction.name || "Expense"}
          </Text>

          {/* Amount */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Amount</Text>
          <Text
            style={{
              fontWeight: "bold",
              marginBottom: 10,
              color: theme.colors.error,
            }}
          >
            {formatCurrency(Number(transaction.amount))}
          </Text>

          {/* Category */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Category</Text>
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            {getLabel(catItems, transaction.category)}
          </Text>

          {/* ✅ WALLET (NEW) */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Wallet</Text>
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            {transaction.wallet?.name || "—"}
          </Text>

          {/* Notes */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Notes</Text>
          <Text style={{ marginBottom: 20, color: theme.colors.onSurface }}>
            {transaction.notes || "—"}
          </Text>

          {/* Date */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Date</Text>
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            {formatDate(transaction.date_spent)}
          </Text>

          {/* Close */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
