import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#007AFF' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Beranda',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          title: 'Jual',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      {/* Screen sekunder — diakses dari halaman Profil, bukan dari tab bar */}
      <Tabs.Screen
        name="my-products"
        options={{
          title: 'Produk Saya',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="saved-products"
        options={{
          title: 'Barang Disimpan',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="account-settings"
        options={{
          title: 'Pengaturan Akun',
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
