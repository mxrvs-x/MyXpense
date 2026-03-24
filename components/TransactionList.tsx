import UpdateTransactionModal from "@/components/UpdateTransactionModal";
import { useRefresh } from "@/context/RefreshContext";
import { useTheme } from "@/types/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { supabase } from "../lib/supabase";

export default function TransactionList({
  data,
  onPressItem,
  isArchived = false, // 🔥 NEW
}: {
  data: any[];
  onPressItem: (item: any) => void;
  isArchived?: boolean;
}) {
  const theme = useTheme();

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { triggerRefresh } = useRefresh();

  const currentSwipeable = useRef<any>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value || 0);
  };

  // ❌ BLOCK DELETE if archived
  const handleDelete = async (item: any) => {
    if (isArchived) return;

    currentSwipeable.current?.close();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", item.id);

    if (error) {
      console.log(error.message);
      return;
    }

    triggerRefresh();
  };

  // ❌ BLOCK UPDATE if archived
  const handleUpdate = (item: any) => {
    if (isArchived) return;

    currentSwipeable.current?.close();
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderRightActions = (item: any) => (
    <TouchableOpacity
      onPress={() => handleUpdate(item)}
      style={{
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        borderRadius: 16,
        height: "100%",
      }}
    >
      <MaterialIcons name="edit" size={26} color="#fff" />
    </TouchableOpacity>
  );

  const renderLeftActions = (item: any) => (
    <TouchableOpacity
      onPress={() => handleDelete(item)}
      style={{
        backgroundColor: theme.colors.error,
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        borderRadius: 16,
        height: "100%",
      }}
    >
      <MaterialIcons name="delete" size={26} color="#fff" />
    </TouchableOpacity>
  );

  if (data.length === 0) {
    return (
      <Text
        style={{
          textAlign: "center",
          padding: 20,
          color: theme.colors.onSurfaceVariant,
        }}
      >
        No expenses for this day
      </Text>
    );
  }

  return (
    <>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => {
          let swipeRef: any = null;

          const content = (
            <TouchableOpacity
              onPress={() => onPressItem(item)}
              activeOpacity={0.8}
              style={{
                backgroundColor: theme.colors.surface,
                padding: 14,
                borderRadius: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "600",
                    color: theme.colors.onSurface,
                  }}
                  numberOfLines={1}
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
                  {item.category} • {item.wallet?.name || "No Wallet"} •{" "}
                  {new Date(item.date_spent).toLocaleDateString()}
                </Text>
              </View>

              <Text
                style={{
                  fontWeight: "bold",
                  color: theme.colors.error,
                  marginLeft: 10,
                }}
              >
                {formatCurrency(Number(item.amount))}
              </Text>
            </TouchableOpacity>
          );

          return (
            <View style={{ marginBottom: 10 }}>
              {/* 🔥 DISABLE SWIPE WHEN ARCHIVED */}
              {!isArchived ? (
                <Swipeable
                  ref={(ref) => {
                    swipeRef = ref;
                  }}
                  onSwipeableWillOpen={() => {
                    if (
                      currentSwipeable.current &&
                      currentSwipeable.current !== swipeRef
                    ) {
                      currentSwipeable.current.close();
                    }
                    currentSwipeable.current = swipeRef;
                  }}
                  renderLeftActions={() => renderLeftActions(item)}
                  renderRightActions={() => renderRightActions(item)}
                >
                  {content}
                </Swipeable>
              ) : (
                content
              )}
            </View>
          );
        }}
      />

      {/* 🔥 DISABLE UPDATE MODAL IF ARCHIVED */}
      {!isArchived && (
        <UpdateTransactionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          transaction={selectedItem}
          onSave={() => {
            currentSwipeable.current?.close();
            triggerRefresh();
            setModalVisible(false);
          }}
        />
      )}
    </>
  );
}
