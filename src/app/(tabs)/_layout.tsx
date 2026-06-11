import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1877F2",
        tabBarInactiveTintColor: "#999999",
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: "Sell Item",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mail"
        options={{
          title: "Mail",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "mail" : "mail-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          title: "Transaction",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Halaman sekunder yang disembunyikan dari tab bar */}
      <Tabs.Screen
        name="my-products"
        options={{
          href: null,
          title: "Produk Saya",
        }}
      />
      <Tabs.Screen
        name="saved-products"
        options={{
          href: null,
          title: "Barang Disimpan",
        }}
      />
      <Tabs.Screen
        name="account-settings"
        options={{
          href: null,
          title: "Pengaturan Akun",
        }}
      />
    </Tabs>
  );
}
