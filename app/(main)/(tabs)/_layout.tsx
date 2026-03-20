import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Tabs } from "expo-router";
import { useTheme } from "react-native-paper";

import { useRefresh } from "@/context/RefreshContext";
import AddExpenseModal from "../../../components/AddExpenseModal";
import { ensureCurrentCycle } from "../../../lib/cycle";

export default function TabsLayout() {
  const theme = useTheme();

  const [showModal, setShowModal] = useState(false);
  const [cycleId, setCycleId] = useState<string | null>(null);

  const { triggerRefresh } = useRefresh();

  // 🔥 Load current cycle (needed for adding expense)
  useEffect(() => {
    const load = async () => {
      const cycle = await ensureCurrentCycle();
      if (cycle) setCycleId(cycle.id);
    };
    load();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {/* 🔥 TABS */}
      <Tabs
        screenOptions={{
          headerShown: true,

          // HEADER
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
            color: theme.colors.onBackground,
          },

          headerLeftContainerStyle: {
            paddingLeft: 16,
          },
          headerRightContainerStyle: {
            paddingRight: 16,
          },

          headerLeft: () => (
            <FontAwesome
              name="user"
              size={26}
              color={theme.colors.onBackground}
            />
          ),

          headerRight: () => (
            <Entypo name="bell" size={22} color={theme.colors.onBackground} />
          ),

          // TAB BAR
          tabBarStyle: {
            position: "absolute",
            backgroundColor: theme.colors.surface,
            borderTopWidth: 0, // remove flat line

            height: 70,
            paddingBottom: 10,
            paddingTop: 8,

            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,

            elevation: 10,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 10,
          },

          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: 2,
          },

          tabBarIconStyle: {
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="dashboard" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="expenses"
          options={{
            title: "Expenses",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="money-off" size={size} color={color} />
            ),
          }}
        />

        {/* add spacing effect */}
        <Tabs.Screen
          name="dummy"
          options={{
            tabBarLabel: () => null,
            tabBarIcon: () => <View style={{ width: 40 }} />, // spacer
          }}
        />

        <Tabs.Screen
          name="bills"
          options={{
            title: "Bills",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="payments" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color, size }) => (
              <Entypo name="menu" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* ➕ FLOATING ADD BUTTON */}
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
        style={{
          position: "absolute",
          bottom: 25,
          alignSelf: "center",

          backgroundColor: theme.colors.primary,
          width: 64,
          height: 64,
          borderRadius: 32,

          justifyContent: "center",
          alignItems: "center",

          // 🔥 border creates cutout illusion
          borderWidth: 6,
          borderColor: theme.colors.surface,

          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <MaterialIcons name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* 🧾 ADD EXPENSE MODAL */}
      <AddExpenseModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        cycleId={cycleId}
        onSaved={() => {
          setShowModal(false);
          triggerRefresh(); // ✅ GLOBAL
        }}
      />
    </View>
  );
}
