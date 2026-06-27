import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useChat } from '../../context/ChatContext';
import { useOrders } from '../../context/OrderContext';
import { useTransaction } from '../../context/TransactionContext';

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', title: 'Barang Berhasil Dijual', message: 'Kalkulator Casio FX-991EX Anda telah dibeli oleh Ahmad Subarjo.', time: '10:30', unread: true, icon: 'checkmark-circle', color: '#22C55E' },
  { id: 'n2', title: 'Barang Tersimpan', message: 'Siti Nurhaliza menyukai Buku Kalkulus Edisi 9 Anda.', time: 'Kemarin', unread: false, icon: 'heart', color: '#E11D48' },
  { id: 'n3', title: 'Pengingat Sewa', message: 'Waktu sewa Jas Almamater ITK Anda hampir habis besok.', time: 'Selasa', unread: false, icon: 'time', color: '#F59E0B' },
];

const ChatItem = ({ item, onPress }: any) => {
  const [isOnline, setIsOnline] = useState(item.online);

  React.useEffect(() => {
    // If it's a real user (Firebase UID is long)
    if (item.id && item.id.length > 10) {
      const unsub = onSnapshot(doc(db, 'users', item.id), (docSnap) => {
        if (docSnap.exists()) {
          setIsOnline(docSnap.data().isOnline === true);
        }
      });
      return () => unsub();
    }
  }, [item.id]);

  return (
    <TouchableOpacity style={styles.chatItem} onPress={onPress}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={[styles.chatTime, item.unreadCount > 0 && styles.chatTimeUnread]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.message}
          </Text>
          {item.unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : item.read ? (
            <Ionicons name="checkmark-done" size={16} color="#0056D2" style={styles.readIcon} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MailScreen() {
  const router = useRouter();
  const { chatList, markAsRead } = useChat();
  const { sellerOrders, acceptOrder, rejectOrder } = useOrders();
  const { refundBalance } = useTransaction();
  const [activeTab, setActiveTab] = useState('Chat');
  const [clearedNotifications, setClearedNotifications] = useState<string[]>([]);

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  // Compute pending orders from Firebase as notifications
  const orderNotifications = sellerOrders
    .filter(o => o.status === 'Proses')
    .map(o => ({
      id: `order-${o.id}`,
      type: 'order_incoming',
      title: `📦 Pesanan dari ${o.buyerName}`,
      message: `${o.quantity} pcs ${o.productTitle} — ${formatRp(o.totalPrice)}`,
      time: o.createdAt?.toDate?.()
        ? o.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Baru saja',
      unread: true,
      icon: 'bag-handle',
      color: '#0056D2',
      orderId: o.id,
      productImage: o.productImage,
    }));

  const allNotifications = [...orderNotifications, ...INITIAL_NOTIFICATIONS].filter(n => !clearedNotifications.includes(n.id));

  const renderItem = ({ item }: any) => (
    <ChatItem 
      item={item} 
      onPress={() => {
        markAsRead(item.id);
        router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name } });
      }}
    />
  );

  const renderNotification = ({ item }: any) => (
    <View style={[styles.chatItem, { flexDirection: 'column' }, item.unread && { backgroundColor: '#F8FAFC' }]}>
      <View style={{ flexDirection: 'row' }}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={28} color={item.color} />
          </View>
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, item.unread && { fontWeight: '900', color: '#0F172A' }]}>{item.title}</Text>
            <Text style={styles.chatTime}>{item.time}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.chatMessage} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
          {item.productImage && (
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 8, borderRadius: 8 }}>
              <Image source={{ uri: item.productImage }} style={{ width: 40, height: 40, borderRadius: 4, marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#475569', flex: 1 }} numberOfLines={1}>Produk yang dipesan</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.type === 'order_incoming' && (
        <View style={{ flexDirection: 'row', marginTop: 12, marginLeft: 75, gap: 10 }}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
            onPress={() => {
              Alert.alert(
                "Terima Pesanan",
                "Apakah Anda yakin ingin menerima pesanan ini? Saldo penjualan akan langsung masuk ke akun Anda.",
                [
                  { text: "Batal", style: "cancel" },
                  { 
                    text: "Terima", 
                    onPress: async () => {
                      try {
                        await acceptOrder(item.orderId);
                        // Find order data to get price for balance
                        const order = sellerOrders.find(o => o.id === item.orderId);
                        if (order) {
                          refundBalance(order.totalPrice, `Penjualan: ${order.productTitle}`);
                        }
                        Alert.alert("Berhasil ✅", "Pesanan telah diterima. Saldo penjualan masuk ke akun Anda.");
                      } catch (e) {
                        Alert.alert("Error", "Gagal menerima pesanan.");
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.actionButtonText}>Terima (ACC)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EF4444' }]}
            onPress={() => {
              Alert.alert(
                "Tolak Pesanan",
                "Apakah Anda yakin ingin menolak pesanan ini? Stock produk akan dikembalikan.",
                [
                  { text: "Batal", style: "cancel" },
                  { 
                    text: "Tolak", 
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await rejectOrder(item.orderId);
                        Alert.alert("Pesanan Ditolak", "Pesanan telah ditolak dan stock produk dikembalikan.");
                      } catch (e) {
                        Alert.alert("Error", "Gagal menolak pesanan.");
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Tolak</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="storefront-outline" size={24} color="#0056D2" />
          <Text style={styles.headerTitle}>Marketplace ITK</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="search-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Chat' && styles.activeTabButton]}
            onPress={() => setActiveTab('Chat')}
          >
            <Text style={[styles.tabText, activeTab === 'Chat' && styles.activeTabText]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'Notifikasi' && styles.activeTabButton]}
            onPress={() => setActiveTab('Notifikasi')}
          >
            <Text style={[styles.tabText, activeTab === 'Notifikasi' && styles.activeTabText]}>Notifikasi</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat / Notifications List */}
      {activeTab === 'Chat' ? (
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Belum ada percakapan.</Text>
            </View>
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          {allNotifications.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setClearedNotifications(allNotifications.map(n => n.id))}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Bersihkan Notifikasi</Text>
            </TouchableOpacity>
          )}
          <FlatList
            data={allNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
                <Text style={styles.emptyText}>Tidak ada notifikasi saat ini.</Text>
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0A2540',
    marginLeft: 10,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#0056D2',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E2E8F0',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  chatTime: {
    fontSize: 12,
    color: '#718096',
  },
  chatTimeUnread: {
    color: '#0056D2',
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatMessage: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
    paddingRight: 10,
  },
  unreadBadge: {
    backgroundColor: '#0056D2',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  readIcon: {
    marginLeft: 5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 16,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
