import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useTransaction } from "../../context/TransactionContext";
import { useOrders } from "../../context/OrderContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { balance, transactions } = useTransaction();
  const { buyerOrders } = useOrders();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    if (Platform.OS === "web") {
      const confirmLogout = window.confirm(
        "Konfirmasi Keluar\n\nApakah Anda yakin ingin keluar dari akun ini?",
      );
      if (confirmLogout) {
        await logout();
      }
    } else {
      Alert.alert(
        "Konfirmasi Keluar",
        "Apakah Anda yakin ingin keluar dari akun ini?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Ya, Keluar",
            style: "destructive",
            onPress: async () => {
              await logout();
            },
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 20, 60) }]}>
        <View style={styles.profileInfo}>

          <View style={styles.avatarContainer}>
            {user?.photoBase64 ? (
              <Image
                source={{ uri: user.photoBase64 }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={40} color="#007AFF" />
            )}
          </View>
          <View style={[styles.textInfo, { flex: 1 }]}>
            <Text 
              style={styles.name} 
              numberOfLines={2} 
              adjustsFontSizeToFit 
              minimumFontScale={0.7}
            >
              {user?.name ?? "Tamu"}
            </Text>
            <Text style={styles.nim} numberOfLines={1}>NIM: {user?.nim ?? "-"}</Text>
            <Text style={styles.prodi} numberOfLines={2}>
              {user?.prodi ?? "-"}{" "}
              {user?.angkatan ? `(Angkatan ${user.angkatan})` : ""}
            </Text>
          </View>
        </View>
      </View>

      {/* Wallet Section */}
      <View style={styles.walletContainer}>
        <TouchableOpacity style={styles.walletItem} onPress={() => router.push('/saldo' as any)} activeOpacity={0.7}>
          <View style={[styles.walletIcon, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="wallet" size={24} color="#0284C7" />
          </View>
          <Text style={styles.walletLabel}>Saldo</Text>
          <Text style={styles.walletValue}>
            Rp {balance.toLocaleString('id-ID')}
          </Text>
        </TouchableOpacity>
        <View style={styles.walletDivider} />
        <TouchableOpacity style={styles.walletItem} onPress={() => router.push('/tagihan' as any)} activeOpacity={0.7}>
          <View style={[styles.walletIcon, { backgroundColor: '#FFE4E6' }]}>
            <Ionicons name="receipt" size={24} color="#E11D48" />
          </View>
          <Text style={styles.walletLabel}>Tagihan</Text>
          <Text style={styles.walletValue}>
            {(() => {
              const pendingLocal = transactions.filter((t: any) => t.type === 'Beli' && t.status === 'Proses');
              const pendingFirebase = buyerOrders.filter((o: any) => o.status === 'Proses');
              const total = pendingLocal.reduce((sum: number, t: any) => sum + t.priceNum, 0) 
                          + pendingFirebase.reduce((sum: number, o: any) => sum + o.totalPrice, 0);
              return total > 0 ? 'Rp ' + total.toLocaleString('id-ID') : 'Rp 0';
            })()}
          </Text>
        </TouchableOpacity>
        <View style={styles.walletDivider} />
        <TouchableOpacity style={styles.walletItem} onPress={() => router.push('/pembayaran' as any)} activeOpacity={0.7}>
          <View style={[styles.walletIcon, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="card" size={24} color="#16A34A" />
          </View>
          <Text style={styles.walletLabel}>Pembayaran</Text>
          <Text style={styles.walletValue}>
            {(() => {
              const done = transactions.filter((t: any) => t.type === 'Beli' && t.status === 'Selesai');
              const total = done.reduce((sum: number, t: any) => sum + t.priceNum, 0);
              return total > 0 ? 'Rp ' + total.toLocaleString('id-ID') : 'Rp 0';
            })()}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/my-products")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="list-outline" size={20} color="#1976D2" />
            </View>
            <Text style={styles.menuText}>Produk Saya</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/saved-products")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="heart-outline" size={20} color="#388E3C" />
            </View>
            <Text style={styles.menuText}>Barang Disimpan</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/transaction")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="receipt-outline" size={20} color="#8E24AA" />
            </View>
            <Text style={styles.menuText}>Transaksi</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/account-settings")}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="settings-outline" size={20} color="#F57C00" />
            </View>
            <Text style={styles.menuText}>Pengaturan Akun</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
              </View>
              <Text style={[styles.menuText, { color: "#D32F2F" }]}>
                Keluar
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.menuItem, styles.loginItem]}
            onPress={() => router.push("/login")}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="log-in-outline" size={20} color="#007AFF" />
              </View>
              <Text style={[styles.menuText, { color: "#007AFF" }]}>
                Masuk / Daftar
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#007AFF",
    padding: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  textInfo: {
    marginLeft: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  nim: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  prodi: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  menuContainer: {
    padding: 20,
    marginTop: -20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
  },
  walletContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: -20, // Menumpang sedikit di atas header jika diinginkan, atau hapus margin ini
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: "space-around",
    alignItems: "center",
  },
  walletItem: {
    alignItems: "center",
    flex: 1,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
  },
  walletValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F172A",
  },
  walletDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F1F5F9",
  },
  logoutItem: {
    marginTop: 20,
  },
  loginItem: {
    marginTop: 20,
    borderColor: "#007AFF",
    borderWidth: 1,
  },
});
