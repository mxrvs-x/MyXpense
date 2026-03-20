import { useTheme } from "@/types/theme";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function TransactionList({
  data,
  onPressItem,
}: {
  data: any[];
  onPressItem: (item: any) => void;
}) {
  const theme = useTheme();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  if (data.length === 0) {
    return (
      <View style={{ alignItems: "center", padding: 20 }}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>
          No expenses for this day
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onPressItem(item)}
          activeOpacity={0.8}
          style={{
            backgroundColor: theme.colors.surface,
            padding: 14,
            borderRadius: 16,
            marginBottom: 10,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontWeight: "600",
                  color: theme.colors.onSurface,
                }}
              >
                {item.name || "Expense"}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.onSurfaceVariant,
                  marginTop: 2,
                }}
              >
                {item.category} •{" "}
                {new Date(item.date_spent).toLocaleDateString()}
              </Text>
            </View>

            <Text
              style={{
                fontWeight: "bold",
                color: theme.colors.error,
              }}
            >
              {formatCurrency(Number(item.amount))}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
