import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            {user?.photoBase64 ? (
              <Image source={{ uri: user.photoBase64 }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="#007AFF" />
            )}
          </View>
          <View style={styles.textInfo}>
            <Text style={styles.name}>{user?.name ?? "Tamu"}</Text>
            <Text style={styles.nim}>NIM: {user?.nim ?? "-"}</Text>
            <Text style={styles.prodi}>
              {user?.prodi ?? "-"}{" "}
              {user?.angkatan ? `(Angkatan ${user.angkatan})` : ""}
            </Text>
          </View>
        </View>
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
    paddingTop: 80,
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
    fontSize: 24,
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
    fontWeight: "500",
    color: "#333333",
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
