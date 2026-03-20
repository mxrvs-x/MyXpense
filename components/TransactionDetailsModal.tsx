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

  // ✅ OPTIONS (Label Mapping)
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

  const typeItems = [
    { label: "Cash", value: "cash" },
    { label: "Cashless", value: "cashless" },
  ];

  const methodItems = [
    { label: "GCash", value: "gcash" },
    { label: "Bank Transfer", value: "bank_transfer" },
    { label: "Debit Card", value: "debit_card" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Maribank", value: "maribank" },
  ];

  // ✅ HELPER: convert value → label
  const getLabel = (
    items: { label: string; value: string }[],
    value: string | null,
  ) => {
    if (!value) return "N/A";
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

          {/* Payment Type */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Payment Type
          </Text>
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            {getLabel(typeItems, transaction.payment_type)}
          </Text>

          {/* Payment Method */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Payment Method
          </Text>
          <Text style={{ marginBottom: 10, color: theme.colors.onSurface }}>
            {getLabel(methodItems, transaction.payment_method)}
          </Text>

          {/* Date */}
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Date</Text>
          <Text style={{ marginBottom: 20, color: theme.colors.onSurface }}>
            {formatDate(transaction.date_spent)}
          </Text>

          {/* Close Button */}
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
