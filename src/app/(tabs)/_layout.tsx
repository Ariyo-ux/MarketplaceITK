import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useLocationTracking } from "../../hooks/useLocationTracking";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  useLocationTracking(); // Mulai tracking lokasi secara background ketika tab ini diload
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#1877F2",
        tabBarInactiveTintColor: "#999999",
        headerShown: false,
        tabBarStyle: { 
          height: Platform.OS === 'android' ? 65 + insets.bottom : 85, 
          paddingBottom: Platform.OS === 'android' ? Math.max(15, insets.bottom) : 25, 
          paddingTop: 5 
        },
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
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "map" : "map-outline"}
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
          title: "Chating",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction"
        options={{
          href: null,
          title: "Transaksi",
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
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
          title: "Edit Profil",
        }}
      />
    </Tabs>
  );
}
