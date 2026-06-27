import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTransaction } from '../../context/TransactionContext';
import { useOrders, Order } from '../../context/OrderContext';

export default function TransactionScreen() {
  const router = useRouter();
  const { transactions } = useTransaction();
  const { buyerOrders, sellerOrders } = useOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Selesai': return '#4CAF50';
      case 'Proses': return '#FF9800';
      case 'Dibatalkan': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Selesai': return '#E8F5E9';
      case 'Proses': return '#FFF3E0';
      case 'Dibatalkan': return '#FFEBEE';
      default: return '#F5F5F5';
    }
  };

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  // Convert Firebase orders to Transaction format for display
  const mapOrderToTransaction = (o: Order, type: 'Beli' | 'Jual'): import('../../context/TransactionContext').Transaction => {
    return {
      id: o.id, // Using Firebase ID
      type,
      status: o.status,
      title: o.productTitle,
      date: o.createdAt?.toDate?.() 
        ? o.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Baru saja',
      price: formatRp(o.totalPrice),
      priceNum: o.totalPrice,
      image: o.productImage,
      otherUser: type === 'Beli' ? o.sellerName : o.buyerName,
      productId: o.productId,
      quantity: o.quantity,
    };
  };

  const buyerTrx = buyerOrders.map(o => mapOrderToTransaction(o, 'Beli'));
  const sellerTrx = sellerOrders.map(o => mapOrderToTransaction(o, 'Jual'));

  // Keep local transactions that don't overlap (e.g. Sewa)
  const localTrx = transactions.filter(t => t.type !== 'Beli' && t.type !== 'Jual');

  const combinedTransactions = [...buyerTrx, ...sellerTrx, ...localTrx].sort((a, b) => {
    // Basic string date sort for now (since local transactions use string dates)
    // Firebase orders are already pre-sorted in context, but this ensures local/firebase mix well
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const renderTransactionItem = ({ item }: { item: import('../../context/TransactionContext').Transaction }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: '/transaction-detail',
        params: {
          id: item.id,
          title: item.title,
          price: item.price,
          image: item.image,
          type: item.type,
          status: item.status,
          otherUser: item.otherUser,
          date: item.date,
          productId: item.productId,
          isFirebase: (item.type === 'Beli' || item.type === 'Jual') ? 'true' : 'false'
        }
      })}
    >
      {/* Header Card */}
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Ionicons 
            name={item.type === 'Beli' ? 'bag-check' : item.type === 'Jual' ? 'pricetag' : 'calendar'} 
            size={16} 
            color="#1877F2" 
          />
          <Text style={styles.typeText}>{item.type}</Text>
          <Text style={styles.dateText}> • {item.date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
        </View>
      </View>

      {/* Body Card */}
      <View style={styles.cardBody}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.otherUser}>
            {item.type === 'Jual' ? 'Pembeli' : 'Penjual'}: {item.otherUser}
          </Text>
        </View>
      </View>

      {/* Footer Card */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>Total Harga</Text>
          <Text style={styles.priceText}>{item.price}</Text>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            router.push({
              pathname: '/transaction-detail',
              params: {
                id: item.id,
                title: item.title,
                price: item.price,
                status: item.status,
                image: item.image,
                type: item.type,
                otherUser: item.otherUser,
                date: item.date
              }
            });
          }}
        >
          <Text style={styles.actionButtonText}>Lihat Detail</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={combinedTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyText}>Belum ada transaksi.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#888888',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  productInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  otherUser: {
    fontSize: 13,
    color: '#666666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  actionButton: {
    backgroundColor: '#1877F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#0056D2',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  }
});
